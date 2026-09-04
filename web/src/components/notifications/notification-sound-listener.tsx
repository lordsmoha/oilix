'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  announceNotification,
  markNotificationsSeen,
} from '@/lib/notification-announce';
import { useAuthStore } from '@/lib/auth-store';

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
};

type NotificationsResponse = {
  items: Notification[];
  unreadCount: number;
};

/**
 * Detects new notifications via query refreshes (WS invalidate or poll).
 * Announces toast + sound for any unread id not already announced by WS.
 */
export function NotificationSoundListener() {
  const token = useAuthStore((s) => s.token);
  const initialized = useRef(false);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<NotificationsResponse>('/notifications', { params: { limit: 40 } }))
        .data,
    enabled: !!token,
    staleTime: 2_000,
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!data?.items) return;

    if (!initialized.current) {
      markNotificationsSeen(data.items.map((n) => n.id));
      initialized.current = true;
      return;
    }

    for (const n of data.items) {
      if (!n.read) announceNotification(n);
    }
  }, [data?.items]);

  return null;
}
