'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export type DeviceMe = {
  registered: boolean;
  device: {
    id: string;
    code: string | null;
    name: string;
    workspace: 'SALES' | 'MILL' | 'BOTH';
    status: 'PENDING' | 'ACTIVE' | 'DISABLED';
    location?: string | null;
    cashRegisterId?: string | null;
    cashRegister?: { id: string; code: string; name: string } | null;
    lastSeenAt?: string | null;
  } | null;
};

export function useDeviceMe() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['device-me'],
    queryFn: async () => (await api.get<DeviceMe>('/devices/me')).data,
    enabled: !!token,
    refetchInterval: 20_000,
  });
}
