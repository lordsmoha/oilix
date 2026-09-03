'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatDateTimeDz } from '@/lib/locale-dz';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationSoundToggle } from '@/components/notifications/notification-sound-toggle';

type NotificationPayload = {
  clientName?: string;
  oliveTypeAr?: string;
  module?: string;
  action?: string;
  actorName?: string;
  source?: string;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  payload?: NotificationPayload | null;
};

type NotificationsResponse = {
  items: Notification[];
  unreadCount: number;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<NotificationsResponse>('/notifications', { params: { limit: 40 } }))
        .data,
    enabled: !!token,
    staleTime: 5_000,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative h-9 w-9 p-0"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="إغلاق"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl dark:border-stone-700 dark:bg-stone-900 sm:w-96">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3 dark:border-stone-800">
              <span className="text-sm font-bold text-[var(--app-text)]">الإشعارات</span>
              {unread > 0 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                  onClick={() => markAllRead.mutate()}
                >
                  تعليم الكل كمقروء
                </button>
              ) : null}
            </div>
            <div className="border-b border-[var(--app-border)] px-3 py-2 dark:border-stone-800">
              <NotificationSoundToggle />
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {!data?.items.length ? (
                <li className="px-4 py-6 text-center text-sm text-[var(--app-text-dim)]">لا توجد إشعارات</li>
              ) : (
                data.items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full px-4 py-3 text-right text-sm transition hover:bg-[var(--app-bg-muted)] dark:hover:bg-stone-800/60',
                        !n.read && 'bg-[var(--app-primary-soft)] dark:bg-emerald-950/30',
                      )}
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id);
                      }}
                    >
                      <p className="font-bold text-[var(--app-text)]">{n.title}</p>
                      {n.payload?.clientName ? (
                        <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                          {n.payload.clientName}
                          {n.payload.oliveTypeAr ? ` · ${n.payload.oliveTypeAr}` : ''}
                        </p>
                      ) : null}
                      <p className="mt-1 leading-relaxed text-[var(--app-text-muted)]">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--app-text-dim)]">
                        {n.payload?.module && n.payload?.action
                          ? `${n.payload.module} — ${n.payload.action}`
                          : null}
                        {n.payload?.actorName ? ` · ${n.payload.actorName}` : ''}
                        <span className="mx-1">·</span>
                        <span dir="ltr">{formatDateTimeDz(n.createdAt)}</span>
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
