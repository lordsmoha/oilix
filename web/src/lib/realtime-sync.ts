import type { QueryClient } from '@tanstack/react-query';
import { resolveRealtimeOrigin } from '@/lib/api-url';
import type { RealtimeSyncPayload } from './realtime-types';

export function getRealtimeOrigin() {
  return resolveRealtimeOrigin();
}

type NotificationsCache = {
  items: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    payload?: Record<string, unknown> | null;
  }>;
  unreadCount: number;
};

/** Instant bell update — do not wait for HTTP refetch. */
export function pushNotificationToCache(
  queryClient: QueryClient,
  payload: RealtimeSyncPayload,
) {
  const n = payload.notification;
  if (!n) return;

  queryClient.setQueryData<NotificationsCache>(['notifications'], (old) => {
    const item = {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
      payload: n.payload ?? null,
    };
    if (!old) {
      return { items: [item], unreadCount: n.read ? 0 : 1 };
    }
    if (old.items.some((x) => x.id === n.id)) return old;
    return {
      items: [item, ...old.items].slice(0, 40),
      unreadCount: old.unreadCount + (n.read ? 0 : 1),
    };
  });
}

export function applyRealtimeSync(
  queryClient: QueryClient,
  payload: RealtimeSyncPayload,
) {
  const { entity, oliveType, clientId } = payload;

  switch (entity) {
    case 'client':
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['clients-select'] });
      break;
    case 'olive_entry':
      if (oliveType) {
        void queryClient.invalidateQueries({
          queryKey: ['olive-entries', oliveType],
        });
        void queryClient.invalidateQueries({
          queryKey: ['olive-client-board', oliveType],
        });
        if (clientId) {
          void queryClient.invalidateQueries({
            queryKey: ['olive-weighings', oliveType, clientId],
          });
        }
      } else {
        void queryClient.invalidateQueries({ queryKey: ['olive-entries'] });
        void queryClient.invalidateQueries({ queryKey: ['olive-client-board'] });
      }
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      break;
    case 'processing':
    case 'pressing':
      void queryClient.invalidateQueries({ queryKey: ['processing-board'] });
      void queryClient.invalidateQueries({ queryKey: ['pressing-by-client'] });
      void queryClient.invalidateQueries({ queryKey: ['olive-untreated-clients'] });
      if (oliveType) {
        void queryClient.invalidateQueries({
          queryKey: ['olive-client-board', oliveType],
        });
      }
      break;
    case 'filtration':
      void queryClient.invalidateQueries({ queryKey: ['filtration'] });
      void queryClient.invalidateQueries({ queryKey: ['filtration-next'] });
      break;
    case 'notification':
      pushNotificationToCache(queryClient, payload);
      // Background reconcile — UI already updated from the socket payload.
      void queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: 'active',
      });
      break;
    case 'oil_sale':
    case 'oil_stock':
    case 'container_stock':
    case 'cash_session':
      void queryClient.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['oil-sales-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['oil-sales-list'] });
      void queryClient.invalidateQueries({ queryKey: ['oil-containers'] });
      void queryClient.invalidateQueries({ queryKey: ['oil-container-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['oil-sales-cash-current'] });
      void queryClient.invalidateQueries({ queryKey: ['oil-sales-cash-sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['oil-sales-reports'] });
      break;
    case 'device':
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      void queryClient.invalidateQueries({ queryKey: ['device-me'] });
      break;
    default:
      break;
  }
}

export const FALLBACK_POLL_MS = 30_000;
/** When WebSocket is down — poll notifications often. */
export const NOTIFICATION_FALLBACK_MS = 3_000;
/** Light safety net while WS reports connected. */
export const NOTIFICATION_CONNECTED_POLL_MS = 8_000;
