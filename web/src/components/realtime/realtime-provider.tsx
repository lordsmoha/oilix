'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { announceNotification } from '@/lib/notification-announce';
import { resolveRealtimeOriginCandidates } from '@/lib/api-url';
import { useSeasonStore } from '@/lib/season-store';
import {
  applyRealtimeSync,
  FALLBACK_POLL_MS,
  NOTIFICATION_FALLBACK_MS,
  NOTIFICATION_CONNECTED_POLL_MS,
} from '@/lib/realtime-sync';
import type {
  RealtimeConflictPayload,
  RealtimeStatus,
  RealtimeSyncPayload,
} from '@/lib/realtime-types';

type RealtimeContextValue = {
  status: RealtimeStatus;
  syncing: boolean;
  lastError: string | null;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'disconnected',
  syncing: false,
  lastError: null,
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

const MAX_SEEN_EVENTS = 400;

function createSocket(
  origin: string,
  token: string,
  seasonId: string | null | undefined,
): Socket {
  return io(`${origin}/realtime`, {
    auth: { token },
    query: seasonId ? { seasonId } : {},
    // Polling first is more reliable through broken WS proxies; then upgrade.
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: true,
    reconnection: false, // we rotate origins ourselves
    timeout: 6_000,
    forceNew: true,
  });
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const viewSeasonId = useSeasonStore((s) => s.viewSeasonId);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const seenEvents = useRef(new Set<string>());
  const socketRef = useRef<Socket | null>(null);
  const syncingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originIndex = useRef(0);
  const disposed = useRef(false);

  const markSyncing = useCallback(() => {
    setSyncing(true);
    if (syncingTimer.current) clearTimeout(syncingTimer.current);
    syncingTimer.current = setTimeout(() => setSyncing(false), 800);
  }, []);

  const processEvent = useCallback(
    (payload: RealtimeSyncPayload) => {
      if (seenEvents.current.has(payload.eventId)) return;
      seenEvents.current.add(payload.eventId);
      if (seenEvents.current.size > MAX_SEEN_EVENTS) {
        const arr = [...seenEvents.current];
        seenEvents.current = new Set(arr.slice(-200));
      }

      if (payload.entity === 'notification' && payload.notification) {
        announceNotification(payload.notification);
      }

      markSyncing();
      applyRealtimeSync(queryClient, payload);
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
    if (!candidates.length) {
      setStatus('disconnected');
      setLastError('لا يوجد عنوان للمزامنة الفورية');
      return;
    }

    originIndex.current = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const bindSocket = (socket: Socket, origin: string) => {
      socketRef.current = socket;

      socket.on('connect', () => {
        if (disposed.current) return;
        setStatus('connected');
        setLastError(null);
        if (viewSeasonId) socket.emit('join-season', viewSeasonId);
        if (process.env.NODE_ENV !== 'production') {
          console.info('[realtime] connected', origin);
        }
      });

      socket.on('disconnect', (reason) => {
        if (disposed.current) return;
        setStatus('disconnected');
        // Try next origin / reconnect shortly
        scheduleNext(`disconnect: ${reason}`);
      });

      socket.on('connect_error', (err) => {
        if (disposed.current) return;
        setStatus('disconnected');
        setLastError(err.message);
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[realtime] connect_error', origin, err.message);
        }
        socket.disconnect();
        scheduleNext(err.message);
      });

      socket.on('sync', (payload: RealtimeSyncPayload) => {
        processEvent(payload);
      });

      socket.on('conflict', (payload: RealtimeConflictPayload) => {
        toast.warning('تعارض في التعديل', {
          description: payload.message,
          duration: 10_000,
        });
        applyRealtimeSync(queryClient, {
          eventId: payload.eventId,
          timestamp: payload.timestamp,
          entity: payload.entity,
          entityId: payload.entityId,
          action: 'CONFLICT',
          module: 'system',
        });
      });
    };

    const connectAt = (index: number) => {
      if (disposed.current) return;
      const origin = candidates[index % candidates.length];
      originIndex.current = index % candidates.length;

      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;

      setStatus('connecting');
      const socket = createSocket(origin, token, viewSeasonId);
      bindSocket(socket, origin);
    };

    const scheduleNext = (reason: string) => {
      if (disposed.current) return;
      if (retryTimer) clearTimeout(retryTimer);
      const next = originIndex.current + 1;
      // Rotate through all candidates, then pause before full loop
      const delay = next % candidates.length === 0 ? 4_000 : 700;
      retryTimer = setTimeout(() => {
        if (disposed.current) return;
        setLastError(reason);
        connectAt(next);
      }, delay);
    };

    connectAt(0);

    return () => {
      disposed.current = true;
      if (retryTimer) clearTimeout(retryTimer);
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token, viewSeasonId, processEvent, queryClient]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !viewSeasonId) return;
    socket.emit('join-season', viewSeasonId);
  }, [viewSeasonId, status]);

  useEffect(() => {
    if (!token) return;

    const notifMs =
      status === 'connected' ? NOTIFICATION_CONNECTED_POLL_MS : NOTIFICATION_FALLBACK_MS;

    const notifPoll = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, notifMs);

    if (status === 'connected') {
      return () => clearInterval(notifPoll);
    }

    const poll = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['olive-client-board'] });
      void queryClient.invalidateQueries({ queryKey: ['processing-board'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, FALLBACK_POLL_MS);

    return () => {
      clearInterval(poll);
      clearInterval(notifPoll);
    };
  }, [status, token, queryClient]);

  return (
    <RealtimeContext.Provider value={{ status, syncing, lastError }}>
      {children}
    </RealtimeContext.Provider>
  );
}
