import type { QueryClient } from '@tanstack/react-query';
import { API_URL } from './api-config';
import type { RealtimeSyncPayload } from './realtime-types';

const API_PORT = '3001';

function withScheme(raw: string): string {
  const value = raw.trim().replace(/\/$/, '');
  if (!value) return `http://192.168.1.249:${API_PORT}`;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return `http://${value}`;
  return value;
}

/**
 * Socket.IO origins to try (Nest serves /realtime on :3001).
 * Prefer direct API port — phones often hit Nginx :80 which may lack /socket.io.
 */
export function resolveRealtimeOriginCandidates(): string[] {
  const explicit = process.env.EXPO_PUBLIC_REALTIME_URL?.trim();
  if (explicit) {
    return [withScheme(explicit).replace(/\/realtime\/?$/, '')];
  }

  const out: string[] = [];
  const add = (value: string) => {
    const v = value.replace(/\/$/, '');
    if (v && !out.includes(v)) out.push(v);
  };

  try {
    const base = new URL(withScheme(API_URL));
    // 1) Direct Nest port (primary)
    add(`${base.protocol}//${base.hostname}:${API_PORT}`);
    // 2) Same origin as API (Nginx or already :3001)
    add(base.origin);
  } catch {
    add(`http://192.168.1.249:${API_PORT}`);
  }

  return out.length ? out : [`http://192.168.1.249:${API_PORT}`];
}

export function getRealtimeOrigin() {
  return resolveRealtimeOriginCandidates()[0];
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
    case 'notification':
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      break;
    default:
      break;
  }
}

export const FALLBACK_POLL_MS = 15_000;
