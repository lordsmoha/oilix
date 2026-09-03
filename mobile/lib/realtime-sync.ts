import type { QueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import type { RealtimeSyncPayload } from './realtime-types';

export function getRealtimeOrigin() {
  const api =
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra?.apiUrl as string) ??
    'http://localhost:3001/api/v1';
  return api.replace(/\/api\/v1\/?$/, '');
}

export function applyRealtimeSyncMobile(
  queryClient: QueryClient,
  payload: RealtimeSyncPayload,
) {
  const { entity, oliveType, clientId } = payload;

  switch (entity) {
    case 'client':
      void queryClient.invalidateQueries({ queryKey: ['clients-select'] });
      void queryClient.invalidateQueries({ queryKey: ['client-board'] });
      break;
    case 'olive_entry':
    case 'processing':
    case 'pressing':
      if (oliveType) {
        void queryClient.invalidateQueries({ queryKey: ['client-board', oliveType] });
        if (clientId) {
          void queryClient.invalidateQueries({
            queryKey: ['weighings', clientId, oliveType],
          });
        }
      } else {
        void queryClient.invalidateQueries({ queryKey: ['client-board'] });
      }
      break;
    default:
      break;
  }
}

export const FALLBACK_POLL_MS = 30_000;
