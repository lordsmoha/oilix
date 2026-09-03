'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/theme-store';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  size?: 'sm' | 'md';
};

export function ThemeToggle({ className, size = 'md' }: Props) {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border transition-colors',
        'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-bg-muted)]',
        'dark:text-amber-200',
        size === 'sm' ? 'h-9 w-9' : 'h-10 w-10',
        className,
      )}
      aria-label={isDark ? 'العودة إلى الوضع الفاتح (الافتراضي)' : 'تفعيل الوضع الداكن (اختياري)'}
      title={isDark ? 'وضع فاتح' : 'وضع داكن (اختياري)'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
