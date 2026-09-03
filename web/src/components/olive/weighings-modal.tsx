'use client';

import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { openClientReceipt } from '@/lib/open-client-receipt';
import type { OliveTypeValue } from '@/lib/labels';
import { useQuery } from '@tanstack/react-query';
import { api, type Paginated } from '@/lib/api';
import { TABLE_FETCH_LIMIT } from '@/lib/constants';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type WeighingEntryRow = {
  id: string;
  referenceNumber: number;
  entryDate: string;
  entryTime?: string;
  bagCount: number;
  totalWeightKg: string;
  adhlefCount?: number | null;
  capacity?: string | null;
  user?: { username?: string; firstName?: string | null };
};

export type WeighingsModalClient = {
  clientId: string;
  clientNumber: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  notes?: string | null;
  totals: {
    totalWeightKg: number;
    bagCount: number;
    adhlefCount: number;
    capacity: number;
  };
};

type Props = {
  open: boolean;
  oliveType?: string;
  client: WeighingsModalClient | null;
  onClose: () => void;
};

export function WeighingsModal({ open, oliveType, client, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !client) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="relative flex max-h-[min(90dvh,40rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:bg-stone-900"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 bg-stone-50 px-5 py-4 dark:border-stone-800 dark:bg-stone-950/40">
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
              تفاصيل الأوزان
            </p>
            <h2 className="mt-1 truncate text-lg font-black text-stone-900 dark:text-white">
              {client.clientNumber} — {client.firstName} {client.lastName}
            </h2>
            <p className="mt-1 text-xs text-stone-500" dir="ltr">
              {client.phone ?? '—'}
            </p>
            {client.notes?.trim() ? (
              <p className="mt-2 line-clamp-2 text-xs text-stone-600 dark:text-stone-300">
                {client.notes}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                openClientReceipt(client.clientId, {
                  ...(oliveType ? { oliveType: oliveType as OliveTypeValue } : {}),
                })
              }
            >
              <Printer className="h-4 w-4" />
              وصل
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white p-2 text-stone-600 shadow-sm transition hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <WeighingsBody oliveType={oliveType} clientId={client.clientId} totals={client.totals} />
      </div>
    </div>
  );
}

function WeighingsBody({
  oliveType,
  clientId,
  totals,
}: {
  oliveType?: string;
  clientId: string;
  totals: WeighingsModalClient['totals'];
}) {
  useEffect(() => {
    void api
      .get('/olive-entries', {
        params: { clientId, limit: 1, logView: true, ...(oliveType ? { oliveType } : {}) },
      })
      .catch(() => undefined);
  }, [clientId, oliveType]);

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['olive-weighings', oliveType, clientId],
    queryFn: async () =>
      (
        await api.get<Paginated<WeighingEntryRow>>('/olive-entries', {
          params: {
            clientId,
            limit: TABLE_FETCH_LIMIT,
            ...(oliveType ? { oliveType } : {}),
          },
        })
      ).data,
    retry: 1,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
      <div className="mb-4 grid shrink-0 gap-2 rounded-2xl border border-stone-200/80 bg-white/70 p-3 text-sm dark:border-stone-700/60 dark:bg-stone-900/60 sm:grid-cols-4">
        <Stat label="الوزن الإجمالي (مُجمَّع)" value={`${formatNumber(totals.totalWeightKg)} كغ`} />
        <Stat label="الأكياس" value={String(totals.bagCount)} />
        <Stat label="الضلف" value={String(totals.adhlefCount)} />
        <Stat label="السعة" value={formatNumber(totals.capacity)} />
      </div>
      <p className="mb-3 shrink-0 text-xs text-stone-500">
        سجل كل إضافة وزن — الجدول الرئيسي يعرض المجاميع فقط
      </p>

      {isLoading ? (
        <div className="py-12 text-center text-stone-500">جاري التحميل...</div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          تعذر تحميل التفاصيل.
          <div className="mt-2">
            <Button variant="outline" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </div>
          {error instanceof Error && (
            <div className="mt-2 text-xs opacity-80">{error.message}</div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-stone-200/80 bg-white dark:border-stone-700/60 dark:bg-stone-900">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-stone-900/95">
              <tr className="border-b border-stone-100 text-stone-700 dark:border-stone-800 dark:text-stone-200">
                <th className="px-3 py-3 text-right">التاريخ</th>
                <th className="px-3 py-3 text-right">الوقت</th>
                <th className="px-3 py-3 text-right">المرجع</th>
                <th className="px-3 py-3 text-right">الوزن</th>
                <th className="px-3 py-3 text-right">الأكياس</th>
                <th className="px-3 py-3 text-right">الضلف</th>
                <th className="px-3 py-3 text-right">السعة</th>
                <th className="px-3 py-3 text-right">المستخدم</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((e, i) => (
                <tr
                  key={e.id}
                  className={cn(
                    'border-b border-stone-100/70 dark:border-stone-800/70',
                    i % 2 === 0
                      ? 'bg-white dark:bg-stone-900/20'
                      : 'bg-stone-50/60 dark:bg-stone-900/10',
                  )}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-stone-600 dark:text-stone-400">
                    {formatDate(e.entryDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-stone-500" dir="ltr">
                    {e.entryTime ?? '—'}
                  </td>
                  <td className="px-3 py-2 font-mono font-black tabular-nums text-stone-800 dark:text-stone-100">
                    {e.referenceNumber}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-bold">
                    {formatNumber(Number(e.totalWeightKg))}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{e.bagCount}</td>
                  <td className="px-3 py-2 tabular-nums">{e.adhlefCount ?? 0}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {e.capacity ? formatNumber(Number(e.capacity)) : '—'}
                  </td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400">
                    {e.user?.firstName || e.user?.username || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.items.length === 0 && (
            <p className="py-8 text-center text-stone-500">لا توجد أوزان</p>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200/70 bg-white/80 px-3 py-2 dark:border-stone-700/60 dark:bg-stone-950/30">
      <div className="text-xs font-medium text-stone-500">{label}</div>
      <div className="mt-1 font-black text-stone-900 dark:text-white">{value}</div>
    </div>
  );
}
