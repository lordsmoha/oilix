'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Eye, History } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatDateDz } from '@/lib/locale-dz';
import { useSeasonStore, type SeasonListItem } from '@/lib/season-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function SeasonArchivePanel() {
  const qc = useQueryClient();
  const setViewSeason = useSeasonStore((s) => s.setViewSeason);
  const clearViewSeason = useSeasonStore((s) => s.clearViewSeason);
  const { readOnly, viewSeasonName } = useSeasonReadOnly();

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ['seasons'],
    queryFn: async () => (await api.get<SeasonListItem[]>('/seasons')).data,
  });

  function openArchive(s: SeasonListItem) {
    setViewSeason(s.id, s.name);
    toast.info(`عرض أرشيف: ${s.name}`, { description: 'وضع القراءة فقط' });
    qc.invalidateQueries();
  }

  return (
    <section className="module-panel-enter overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 shadow-lg backdrop-blur-xl dark:border-stone-700/60 dark:bg-stone-900/80">
      <div className="border-b border-stone-200/80 bg-gradient-to-l from-amber-50 to-orange-50/50 px-5 py-4 dark:border-stone-700 dark:from-amber-950/30 dark:to-stone-900/50">
        <h2 className="flex items-center gap-2 font-black text-stone-900 dark:text-white">
          <History className="h-5 w-5 text-amber-600" />
          أرشيف المواسم
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          استعراض مواسم سابقة للتحقق — بدون تعديل على البيانات
        </p>
      </div>
      <div className="space-y-3 p-5">
        {readOnly ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
              <Archive className="mb-0.5 inline h-4 w-4" /> تعرض الآن: <strong>{viewSeasonName}</strong>
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => { clearViewSeason(); qc.invalidateQueries(); }}>
              العودة للموسم الحالي
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-stone-500">جاري التحميل…</p>
        ) : (
          <ul className="space-y-2">
            {seasons.map((s) => (
              <li
                key={s.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3',
                  s.isActive
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                    : 'border-stone-200 bg-stone-50/50 dark:border-stone-700 dark:bg-stone-800/30',
                )}
              >
                <div>
                  <p className="font-bold text-stone-900 dark:text-white">
                    {s.name}
                    {s.isActive ? (
                      <span className="mr-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white">
                        حالي
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-stone-500">
                    {formatDateDz(s.startDate)}
                    {s.endDate ? ` — ${formatDateDz(s.endDate)}` : ''} · {s.clientCount} زبون ·{' '}
                    {s.entryCount} عملية
                  </p>
                </div>
                {s.isActive ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">الموسم النشط</span>
                ) : (
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => openArchive(s)}>
                    <Eye className="h-4 w-4" />
                    عرض للقراءة
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
