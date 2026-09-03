'use client';

import { Archive, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';
import { Button } from '@/components/ui/button';

export function SeasonViewBanner() {
  const qc = useQueryClient();
  const { readOnly, isLoading, viewSeasonName, activeSeasonName, clearViewSeason } =
    useSeasonReadOnly();

  if (isLoading || !readOnly) return null;

  function backToActive() {
    clearViewSeason();
    qc.invalidateQueries();
  }

  return (
    <div
      className="no-print border-b border-amber-300/80 bg-gradient-to-l from-amber-100 via-amber-50 to-orange-50 px-3 py-2.5 dark:border-amber-800 dark:from-amber-950 dark:via-amber-950/80 dark:to-stone-900"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200">
            <Archive className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-amber-950 dark:text-amber-100">
              وضع القراءة فقط — أرشيف موسم سابق
            </p>
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
              تعرض الآن: <strong>{viewSeasonName}</strong> · الموسم الحالي:{' '}
              <strong>{activeSeasonName}</strong> — لا يمكن الإضافة أو التعديل أو الحذف.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-2 bg-amber-600 font-bold text-white hover:bg-amber-700"
          onClick={backToActive}
        >
          <RotateCcw className="h-4 w-4" />
          العودة للموسم الحالي
        </Button>
      </div>
    </div>
  );
}
