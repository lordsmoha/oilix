'use client';

import type { LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { OlivePageTheme } from '@/lib/olive-page-theme';

export function OliveStatCard({
  theme,
  icon: Icon,
  label,
  value,
  unit,
  decimals = 0,
}: {
  theme: OlivePageTheme;
  icon: LucideIcon;
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        theme.statCard,
      )}
    >
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', theme.statIcon)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--app-text-muted)]">{label}</p>
        <p className={cn('mt-0.5 text-lg font-black tabular-nums', theme.accent)}>
          {formatNumber(value, decimals)}
          {unit ? <span className="mr-1 text-sm font-bold opacity-70">{unit}</span> : null}
        </p>
      </div>
    </div>
  );
}
