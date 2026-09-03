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
import { formatNumber, formatDateTimeDz } from '@/lib/utils';
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
  lossQty: string | number;
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
  const lossPreview =
    Number.isFinite(phys) && phys >= 0 ? Math.max(0, theoretical - phys) : null;

  const mut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/inventory', {
          oilSource,
          oilType,
          physicalQty: Number(physical),
          note: note.trim() || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success('تم تسجيل الجرد');
      setPhysical('');
      setNote('');
      void qc.invalidateQueries({ queryKey: ['oil-sales-inventory'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-stock'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الجرد'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mut.mutate();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">الجرد الفعلي</h1>
        <p className="text-sm text-[var(--app-text-dim)]">
          الخسارة = المتبقى النظري − الكمية الفعلية
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
          <p className="text-sm">
            {oilSourceMeta(oilSource).label} / {oilMeta(oilType).label} — النظري الحالي:{' '}
            <strong className="tabular-nums">{formatNumber(theoretical, 1)} لتر</strong>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="الكمية الفعلية (لتر)"
              inputMode="decimal"
              value={physical}
              onChange={(e) => setPhysical(e.target.value)}
              required
            />
            <Input label="ملاحظة" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {lossPreview != null ? (
            <p className="text-sm font-bold text-red-700">
              الخسارة المتوقعة: {formatNumber(lossPreview, 1)} لتر
            </p>
          ) : null}
          <Button type="submit" loading={mut.isPending} className="bg-amber-700 hover:bg-amber-800">
            تسجيل الجرد
          </Button>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-[var(--app-bg-muted)]">
            <tr>
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">المصدر</th>
              <th className="px-3 py-2 text-right">النوع</th>
              <th className="px-3 py-2 text-right">نظري</th>
              <th className="px-3 py-2 text-right">فعلي</th>
              <th className="px-3 py-2 text-right">فرق</th>
              <th className="px-3 py-2 text-right">خسارة</th>
              <th className="px-3 py-2 text-right">المستخدم</th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((c) => {
              const src = oilSourceMeta(c.oilSource);
              const m = oilMeta(c.oilType);
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
                  <td className="px-3 py-2 tabular-nums">
                    {formatNumber(Number(c.physicalQty), 1)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(Number(c.difference), 1)}</td>
                  <td className="px-3 py-2 font-bold text-red-700 tabular-nums">
                    {formatNumber(Number(c.lossQty), 1)}
                  </td>
                  <td className="px-3 py-2">
                    {c.user?.firstName || c.user?.username || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
