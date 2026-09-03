'use client';

import { Menu } from 'lucide-react';
import { formatDateShortDz, formatTimeDz } from '@/lib/locale-dz';
import { useAuthStore } from '@/lib/auth-store';
import { SeasonPicker } from '@/components/season/season-picker';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { SyncIndicator } from '@/components/realtime/sync-indicator';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { FullscreenToggle } from '@/components/layout/fullscreen-toggle';
import { LogoutButton } from '@/components/layout/logout-button';
import { ModuleSwitcher } from '@/components/layout/module-switcher';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  onMenuClick: () => void;
};

function userInitials(firstName?: string | null, username?: string | null) {
  const src = (firstName || username || '?').trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function TopHeader({ onMenuClick }: Props) {
  const user = useAuthStore((s) => s.user);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="app-header no-print z-30 shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-muted)] text-[var(--app-text)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-primary-soft)] lg:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--app-accent)] to-[var(--app-accent-dark)] text-xs font-black text-white shadow-[var(--app-shadow-glow)]">
            {userInitials(user?.firstName, user?.username)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--app-text)]">
              مرحباً، {user?.firstName || user?.username || 'مستخدم'}
            </p>
            <p className="truncate text-xs text-[var(--app-text-dim)]">{user?.roleAr ?? user?.role}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-2.5">
          <ModuleSwitcher compact className="hidden md:inline-flex" />
          <SeasonPicker className="hidden shrink-0 sm:block" />
          <SyncIndicator />
          <FullscreenToggle size="sm" />
          <ThemeToggle size="sm" />
          <NotificationBell />
          <LogoutButton compact />

          <div
            className={cn(
              'hidden shrink-0 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-left md:block',
              'shadow-sm transition hover:shadow-[var(--app-shadow-md)]',
            )}
            dir="ltr"
          >
            {now && (
              <>
                <div className="font-bold tabular-nums text-[var(--app-text)]">{formatTimeDz(now)}</div>
                <div className="text-[11px] text-[var(--app-text-dim)]">{formatDateShortDz(now)}</div>
              </>
            )}
          </div>

          <SeasonPicker className="shrink-0 sm:hidden" />
        </div>
      </div>
    </header>
  );
}
