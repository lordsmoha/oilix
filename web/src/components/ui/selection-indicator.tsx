'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SelectionIndicator({
  selected,
  className,
}: {
  selected: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full transition-all',
        selected
          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
          : 'border-2 border-stone-200 bg-stone-50 dark:border-stone-600 dark:bg-stone-800',
        className,
      )}
      aria-hidden
    >
      {selected ? <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> : null}
    </span>
  );
}
