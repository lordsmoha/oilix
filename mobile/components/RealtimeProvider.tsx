import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import {
  applyRealtimeSyncMobile,
  FALLBACK_POLL_MS,
  resolveRealtimeOriginCandidates,
} from '@/lib/realtime-sync';
import type { RealtimeStatus, RealtimeSyncPayload } from '@/lib/realtime-types';

type Ctx = {
  status: RealtimeStatus;
  syncing: boolean;
  lastError: string | null;
};

const RealtimeContext = createContext<Ctx>({
  status: 'disconnected',
  syncing: false,
  lastError: null,
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

const MAX_SEEN = 400;

function createSocket(origin: string, token: string): Socket {
  return io(`${origin}/realtime`, {
    auth: { token },
    // Polling first is more reliable on React Native / Expo Go.
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: true,
    reconnection: false,
    timeout: 6_000,
    forceNew: true,
  });
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const token = useAuth((s) => s.token);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const seenEvents = useRef(new Set<string>());
  const socketRef = useRef<Socket | null>(null);
  const originIndex = useRef(0);
  const disposed = useRef(false);

  const markSyncing = useCallback(() => {
    setSyncing(true);
    const t = setTimeout(() => setSyncing(false), 800);
    return () => clearTimeout(t);
  }, []);

  const processEvent = useCallback(
    (payload: RealtimeSyncPayload) => {
      if (seenEvents.current.has(payload.eventId)) return;
      seenEvents.current.add(payload.eventId);
      if (seenEvents.current.size > MAX_SEEN) {
        const arr = [...seenEvents.current];
        seenEvents.current = new Set(arr.slice(-200));
      }
      markSyncing();
      applyRealtimeSyncMobile(queryClient, payload);
    },
    [queryClient, markSyncing],
  );

  useEffect(() => {
    disposed.current = false;

    if (!token) {
      setStatus('disconnected');
      setLastError(null);
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const candidates = resolveRealtimeOriginCandidates();
    originIndex.current = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = (reason: string) => {
      if (disposed.current) return;
      if (retryTimer) clearTimeout(retryTimer);
      const next = originIndex.current + 1;
      const delay = next % candidates.length === 0 ? 4_000 : 800;
      retryTimer = setTimeout(() => {
        if (disposed.current) return;
        setLastError(reason);
        connectAt(next);
      }, delay);
    };

    const connectAt = (index: number) => {
      if (disposed.current) return;
      const origin = candidates[index % candidates.length];
      originIndex.current = index % candidates.length;

      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;

      setStatus('connecting');
      const socket = createSocket(origin, token);
      socketRef.current = socket;

      socket.on('connect', () => {
        if (disposed.current) return;
        setStatus('connected');
        setLastError(null);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.info('[realtime] connected', origin);
        }
      });

      socket.on('disconnect', (reason) => {
        if (disposed.current) return;
        setStatus('disconnected');
        scheduleNext(`disconnect: ${reason}`);
      });

      socket.on('connect_error', (err) => {
        if (disposed.current) return;
        setStatus('disconnected');
        setLastError(err.message);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[realtime] connect_error', origin, err.message);
        }
        socket.disconnect();
        scheduleNext(err.message);
      });

      socket.on('sync', (payload: RealtimeSyncPayload) => processEvent(payload));
    };

    connectAt(0);

    return () => {
      disposed.current = true;
      if (retryTimer) clearTimeout(retryTimer);
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token, processEvent]);

  useEffect(() => {
    if (status === 'connected' || !token) return;
    const poll = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['client-board'] });
      void queryClient.invalidateQueries({ queryKey: ['clients-select'] });
      void queryClient.invalidateQueries({ queryKey: ['weighings'] });
    }, FALLBACK_POLL_MS);
    return () => clearInterval(poll);
  }, [status, token, queryClient]);

  return (
    <RealtimeContext.Provider value={{ status, syncing, lastError }}>
      {children}
    </RealtimeContext.Provider>
  );
}
