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
import { playNotificationSound } from '@/lib/notification-sound';
import { useSeasonStore } from '@/lib/season-store';
import {
  applyRealtimeSync,
  FALLBACK_POLL_MS,
  getRealtimeOrigin,
  NOTIFICATION_FALLBACK_MS,
} from '@/lib/realtime-sync';
import type {
  RealtimeConflictPayload,
  RealtimeStatus,
  RealtimeSyncPayload,
} from '@/lib/realtime-types';

type RealtimeContextValue = {
  status: RealtimeStatus;
  syncing: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'disconnected',
  syncing: false,
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

const MAX_SEEN_EVENTS = 400;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const viewSeasonId = useSeasonStore((s) => s.viewSeasonId);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [syncing, setSyncing] = useState(false);
  const seenEvents = useRef(new Set<string>());
  const socketRef = useRef<Socket | null>(null);
  const syncingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      markSyncing();
      applyRealtimeSync(queryClient, payload);

      if (payload.entity === 'notification' && payload.notification && !payload.notification.read) {
        playNotificationSound(payload.notification.id);
        toast.info(payload.notification.title, {
          description: payload.notification.message,
          duration: 12_000,
        });
      }
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
      query: viewSeasonId ? { seasonId: viewSeasonId } : {},
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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, processEvent, queryClient]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !viewSeasonId) return;
    socket.emit('join-season', viewSeasonId);
  }, [viewSeasonId, status]);

  useEffect(() => {
    if (status === 'connected' || !token) return;

    const poll = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['olive-client-board'] });
      void queryClient.invalidateQueries({ queryKey: ['processing-board'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, FALLBACK_POLL_MS);

    const notifPoll = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, NOTIFICATION_FALLBACK_MS);

    return () => {
      clearInterval(poll);
      clearInterval(notifPoll);
    };
  }, [status, token, queryClient]);

  return (
    <RealtimeContext.Provider value={{ status, syncing }}>
      {children}
    </RealtimeContext.Provider>
  );
}
