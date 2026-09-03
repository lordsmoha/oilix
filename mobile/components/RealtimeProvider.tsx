import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import {
  applyRealtimeSyncMobile,
  FALLBACK_POLL_MS,
  getRealtimeOrigin,
} from '@/lib/realtime-sync';
import type { RealtimeStatus, RealtimeSyncPayload } from '@/lib/realtime-types';

type Ctx = { status: RealtimeStatus; syncing: boolean };

const RealtimeContext = createContext<Ctx>({
  status: 'disconnected',
  syncing: false,
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

const MAX_SEEN = 400;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const token = useAuth((s) => s.token);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [syncing, setSyncing] = useState(false);
  const seenEvents = useRef(new Set<string>());
  const socketRef = useRef<Socket | null>(null);

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
    if (!token) {
      setStatus('disconnected');
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    setStatus('connecting');
    const socket = io(`${getRealtimeOrigin()}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.io.on('reconnect_attempt', () => setStatus('connecting'));
    socket.on('sync', (payload: RealtimeSyncPayload) => processEvent(payload));

    return () => {
      socket.disconnect();
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
    <RealtimeContext.Provider value={{ status, syncing }}>
      {children}
    </RealtimeContext.Provider>
  );
}
