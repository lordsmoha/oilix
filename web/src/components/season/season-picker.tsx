'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, ChevronDown, Eye, History } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatDateDz } from '@/lib/locale-dz';
import { useSeasonStore, type SeasonListItem } from '@/lib/season-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function SeasonPicker({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const setViewSeason = useSeasonStore((s) => s.setViewSeason);
  const { readOnly, viewSeasonName, activeSeasonName } = useSeasonReadOnly();

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ['seasons'],
    queryFn: async () => (await api.get<SeasonListItem[]>('/seasons')).data,
  });

  function selectSeason(s: SeasonListItem) {
    if (s.isActive) {
      useSeasonStore.getState().clearViewSeason();
      toast.success('الموسم الحالي');
    } else {
      setViewSeason(s.id, s.name);
      void api.post(`/seasons/${s.id}/log-view`).catch(() => undefined);
      toast.info(`عرض أرشيف: ${s.name}`, {
        description: 'وضع القراءة فقط — لا تعديلات',
      });
    }
    setOpen(false);
    qc.invalidateQueries();
  }

  const label = readOnly ? viewSeasonName : activeSeasonName;

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'gap-2 border-stone-200 bg-white/90 font-bold dark:border-stone-700 dark:bg-stone-900/90',
          readOnly && 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100',
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {readOnly ? <History className="h-4 w-4" /> : <CalendarRange className="h-4 w-4" />}
        <span className="max-w-[8rem] truncate sm:max-w-[12rem]">{label}</span>
        <ChevronDown className={cn('h-4 w-4 opacity-60 transition', open && 'rotate-180')} />
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="إغلاق"
            onClick={() => setOpen(false)}
          />
          <ul
            className="absolute left-0 top-full z-50 mt-2 max-h-72 w-72 overflow-y-auto rounded-2xl border border-stone-200 bg-white py-2 shadow-xl dark:border-stone-700 dark:bg-stone-900"
            role="listbox"
          >
            {isLoading ? (
              <li className="px-4 py-3 text-sm text-stone-500">جاري التحميل…</li>
            ) : seasons.length === 0 ? (
              <li className="px-4 py-3 text-sm text-stone-500">لا توجد مواسم</li>
            ) : (
              seasons.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-4 py-2.5 text-right text-sm transition hover:bg-stone-50 dark:hover:bg-stone-800',
                      s.isActive && !readOnly && 'bg-emerald-50 dark:bg-emerald-950/30',
                      readOnly && !s.isActive && 'opacity-90',
                    )}
                    onClick={() => selectSeason(s)}
                  >
                    <span className="flex items-center justify-between gap-2 font-bold text-stone-900 dark:text-white">
                      {s.name}
                      {s.isActive ? (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white">
                          حالي
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500">
                          <Eye className="h-3 w-3" />
                          أرشيف
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-stone-500">
                      {formatDateDz(s.startDate)}
                      {s.endDate ? ` — ${formatDateDz(s.endDate)}` : ''} · {s.clientCount} زبون ·{' '}
                      {s.entryCount} عملية
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      ) : null}
    </div>
  );
}
