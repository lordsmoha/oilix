'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Compact icon-only control for headers */
  compact?: boolean;
};

export function LogoutButton({ className, compact = false }: Props) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  function onLogout() {
    logout();
    router.replace('/');
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={onLogout}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
          'border-[var(--app-border)] bg-[var(--app-surface)] text-red-600',
          'hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/40',
          className,
        )}
        aria-label="تسجيل الخروج"
        title="تسجيل الخروج"
      >
        <LogOut className="h-4 w-4" strokeWidth={2.25} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition',
        'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
        'dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70',
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      تسجيل الخروج
    </button>
  );
}
