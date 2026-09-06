'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  OIL_SOURCES,
  OIL_TYPES,
  oilMeta,
  oilSourceMeta,
  type OilSourceValue,
  type OilTypeValue,
} from '@/lib/sales-nav';
import { formatNumber, formatDateTimeDz, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type Count = {
  id: string;
  oilSource: string;
  oilType: string;
  theoreticalBefore: string | number;
  physicalQty: string | number;
  difference: string | number;
  differenceType?: string;
  lossQty: string | number;
  surplusQty?: string | number;
  note?: string | null;
  createdAt: string;
  user?: { username: string; firstName?: string | null };
};

type StockRow = { oilSource: OilSourceValue; oilType: OilTypeValue; theoreticalQty: number };

export default function SalesInventoryPage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const canWrite = useAuthStore((s) => s.hasPermission('OIL_SALES_INVENTORY_CREATE'));
  const [oilSource, setOilSource] = useState<OilSourceValue>('STORED');
  const [oilType, setOilType] = useState<OilTypeValue>('GREEN');
  const [physical, setPhysical] = useState('');
  const [note, setNote] = useState('');

  const stockQ = useQuery({
    queryKey: ['oil-sales-stock'],
    queryFn: async () => (await api.get<StockRow[]>('/oil-sales/stock')).data,
  });
  const listQ = useQuery({
    queryKey: ['oil-sales-inventory'],
    queryFn: async () => (await api.get<Count[]>('/oil-sales/inventory')).data,
  });

  const theoretical =
    stockQ.data?.find((s) => s.oilSource === oilSource && s.oilType === oilType)?.theoreticalQty ??
    0;
  const phys = Number(physical);
  const validPhys = Number.isFinite(phys) && phys >= 0 && physical.trim() !== '';
  const difference = validPhys ? phys - theoretical : null;
  const lossPreview = difference != null ? Math.max(0, theoretical - phys) : null;
  const surplusPreview = difference != null ? Math.max(0, phys - theoretical) : null;

  const mut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/inventory', {
          oilSource,
          oilType,
          physicalQty: Number(physical),
          expectedTheoreticalQty: theoretical,
          note: note.trim() || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success('تم تأكيد الجرد — كمية الباقي أصبحت المخزون الحالي');
      setPhysical('');
      setNote('');
      void qc.invalidateQueries({ queryKey: ['oil-sales-inventory'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-stock'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-movements'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الجرد'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validPhys) {
      toast.error('أدخل كمية الباقي');
      return;
    }
    mut.mutate();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">جرد الباقي</h1>
        <p className="text-sm text-[var(--app-text-dim)]">
          بعد التأكيد تصبح كمية الباقي هي المخزون الحالي لجميع العمليات القادمة
        </p>
      </div>

      {canWrite && !readOnly ? (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5"
        >
          <div className="flex flex-wrap gap-2">
            {OIL_SOURCES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setOilSource(s.value)}
                className="rounded-xl border px-3 py-2 text-sm font-bold"
                style={{
                  borderColor: oilSource === s.value ? s.color : undefined,
                  background: oilSource === s.value ? s.soft : undefined,
                  color: s.color,
                }}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {OIL_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setOilType(t.value)}
                className="rounded-xl border px-3 py-2 text-sm font-bold"
                style={{
                  borderColor: oilType === t.value ? t.color : undefined,
                  background: oilType === t.value ? t.soft : undefined,
                  color: t.color,
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="كمية الباقي (لتر)"
              inputMode="decimal"
              value={physical}
              onChange={(e) => setPhysical(e.target.value)}
              required
            />
            <Input label="ملاحظة" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {validPhys ? (
            <div className="space-y-1.5 rounded-xl border border-amber-700/30 bg-amber-50/60 p-4 text-sm dark:bg-amber-950/20">
              <Row label="المخزون قبل الجرد" value={`${formatNumber(theoretical, 1)} لتر`} />
              <Row label="كمية الباقي" value={`${formatNumber(phys, 1)} لتر`} />
              <Row
                label="الفرق"
                value={`${difference! >= 0 ? '+' : ''}${formatNumber(difference!, 1)} لتر`}
              />
              {lossPreview != null && lossPreview > 0 ? (
                <Row label="الضائع" value={`${formatNumber(lossPreview, 1)} لتر`} danger />
              ) : null}
              {surplusPreview != null && surplusPreview > 0 ? (
                <Row label="الفائض" value={`${formatNumber(surplusPreview, 1)} لتر`} />
              ) : null}
              <div className="mt-2 border-t border-amber-800/20 pt-2">
                <Row
                  label="المخزون الجديد بعد التأكيد"
                  value={`${formatNumber(phys, 1)} لتر`}
                  bold
                />
              </div>
              <p className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                بتأكيد الجرد ستصبح كمية الباقي ({formatNumber(phys, 1)} لتر) هي المخزون الحالي
                لهذا المصدر والنوع فقط.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--app-text-dim)]">
              {oilSourceMeta(oilSource).label} / {oilMeta(oilType).label} — المخزون الحالي:{' '}
              <strong className="tabular-nums">{formatNumber(theoretical, 1)} لتر</strong>
            </p>
          )}

          <Button type="submit" loading={mut.isPending} className="bg-amber-700 hover:bg-amber-800">
            تأكيد الجرد وتعيين المخزون الجديد
          </Button>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[var(--app-bg-muted)]">
            <tr>
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">المصدر</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-right">قبل الجرد</th>
              <th className="px-3 py-2 text-right">الباقي / جديد</th>
              <th className="px-3 py-2 text-right">فرق</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-right">المستخدم</th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((c) => {
              const src = oilSourceMeta(c.oilSource);
              const m = oilMeta(c.oilType);
              const diffType =
                c.differenceType ||
                (Number(c.lossQty) > 0
                  ? 'LOSS'
                  : Number(c.difference) > 0
                    ? 'SURPLUS'
                    : 'BALANCED');
              return (
                <tr key={c.id} className="border-t border-[var(--app-border)]">
                  <td className="px-3 py-2 text-xs">{formatDateTimeDz(c.createdAt)}</td>
                  <td className="px-3 py-2 text-xs">{src.label}</td>
                  <td className="px-3 py-2">
                    {m.emoji} {m.label}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatNumber(Number(c.theoreticalBefore), 1)}
                  </td>
                  <td className="px-3 py-2 font-bold tabular-nums">
                    {formatNumber(Number(c.physicalQty), 1)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatNumber(Number(c.difference), 1)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 font-bold',
                      diffType === 'LOSS' && 'text-red-700',
                      diffType === 'SURPLUS' && 'text-emerald-700',
                    )}
                  >
                    {diffType === 'LOSS'
                      ? `فرق ${formatNumber(Number(c.lossQty), 1)}`
                      : diffType === 'SURPLUS'
                        ? `فائض ${formatNumber(Number(c.surplusQty ?? c.difference), 1)}`
                        : 'متوازن'}
                  </td>
                  <td className="px-3 py-2">{c.user?.firstName || c.user?.username || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  danger,
}: {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={cn('flex justify-between gap-3', bold && 'font-black', danger && 'text-red-700')}>
      <span className="text-[var(--app-text-muted)]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
