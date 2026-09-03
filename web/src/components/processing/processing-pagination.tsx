'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type Props = {
  meta: Meta;
  onPageChange: (page: number) => void;
  className?: string;
};

export function ProcessingPagination({ meta, onPageChange, className }: Props) {
  const { page, totalPages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white/90 px-4 py-2.5 text-sm dark:border-stone-700/50 dark:bg-stone-900/90',
        className,
      )}
    >
      <span className="text-stone-500">
        عرض <span className="font-bold text-stone-800 dark:text-stone-100">{from}–{to}</span> من{' '}
        <span className="font-bold text-stone-800 dark:text-stone-100">{total}</span>
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="min-w-[5rem] px-2 text-center font-bold tabular-nums">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
