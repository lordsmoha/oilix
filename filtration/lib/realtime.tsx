import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Status = 'connected' | 'connecting' | 'disconnected';
type Ctx = { status: Status };

const Ctx = createContext<Ctx>({ status: 'disconnected' });
export function useRealtime() {
  return useContext(Ctx);
}

function origin() {
  return API_URL.replace(/\/api\/v1\/?$/, '');
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const token = useAuth((s) => s.token);
  const [status, setStatus] = useState<Status>('disconnected');

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['filtration'] });
  }, [qc]);

  useEffect(() => {
    if (!token) {
      setStatus('disconnected');
      return;
    }
    setStatus('connecting');
    const socket: Socket = io(`${origin()}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('sync', (payload: { entity?: string }) => {
      if (payload?.entity === 'filtration') invalidate();
    });
    const poll = setInterval(invalidate, 30_000);
    return () => {
      clearInterval(poll);
      socket.disconnect();
    };
  }, [token, invalidate]);

  return <Ctx.Provider value={{ status }}>{children}</Ctx.Provider>;
}
