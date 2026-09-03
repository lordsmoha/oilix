import type { QueryClient } from '@tanstack/react-query';
import { resolveRealtimeOrigin } from '@/lib/api-url';
import type { RealtimeSyncPayload } from './realtime-types';

export function getRealtimeOrigin() {
  return resolveRealtimeOrigin();
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
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
export const NOTIFICATION_FALLBACK_MS = 20_000;
