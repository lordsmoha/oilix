'use client';

import type { LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { ProcessingTheme } from './processing-theme';

export function ProcessingStatCard({
  theme,
  icon: Icon,
  label,
  value,
  unit,
}: {
  theme: ProcessingTheme;
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div
      className={cn(
        'module-stat-enter flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm',
        theme.statCard,
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          theme.statIcon,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
        <p className={cn('truncate text-lg font-black tabular-nums', theme.accent)}>
          {typeof value === 'number' ? formatNumber(value) : value}
          {unit ? (
            <span className="mr-1 text-sm font-semibold text-stone-500">{unit}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
