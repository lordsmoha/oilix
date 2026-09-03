'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { playNotificationSound } from '@/lib/notification-sound';
import { useAuthStore } from '@/lib/auth-store';

type Notification = { id: string; read: boolean };

type NotificationsResponse = {
  items: Notification[];
  unreadCount: number;
};

/** Détecte les nouvelles notifications via polling (fallback hors WebSocket). */
export function NotificationSoundListener() {
  const token = useAuthStore((s) => s.token);
  const initialized = useRef(false);
  const seenIds = useRef(new Set<string>());

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<NotificationsResponse>('/notifications', { params: { limit: 40 } }))
        .data,
    enabled: !!token,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!data?.items) return;

    if (!initialized.current) {
      data.items.forEach((n) => seenIds.current.add(n.id));
      initialized.current = true;
      return;
    }

    for (const n of data.items) {
      if (!n.read && !seenIds.current.has(n.id)) {
        seenIds.current.add(n.id);
        playNotificationSound(n.id);
      }
    }
  }, [data?.items]);

  return null;
}
