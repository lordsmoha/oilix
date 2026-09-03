'use client';

import Link from 'next/link';
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
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type StockRow = {
  oilSource: OilSourceValue;
  oilType: OilTypeValue;
  totalAdded: number;
  totalSold: number;
  theoreticalQty: number;
  physicalQty: number | null;
  lossQty: number;
  lossPercent: number;
};

export default function SalesStockPage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const canWrite = useAuthStore((s) => s.hasPermission('OIL_SALES_STOCK_ADD'));
  const [oilSource, setOilSource] = useState<OilSourceValue>('STORED');
  const [oilType, setOilType] = useState<OilTypeValue>('GREEN');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  const stockQ = useQuery({
    queryKey: ['oil-sales-stock'],
    queryFn: async () => (await api.get<StockRow[]>('/oil-sales/stock')).data,
  });

  const addMut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/stock/add', {
          oilSource,
          oilType,
          quantityL: Number(qty),
          note: note.trim() || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success('تمت إضافة المخزون');
      setQty('');
      setNote('');
      void qc.invalidateQueries({ queryKey: ['oil-sales-stock'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-movements'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الإضافة'),
  });

  function onAdd(e: FormEvent) {
    e.preventDefault();
    addMut.mutate();
  }

  const rows = stockQ.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-black">مخزون الزيت</h1>
      <p className="text-sm text-[var(--app-text-dim)]">
        الوحدة: اللتر ·{' '}
        <Link href="/sales/movements" className="text-amber-800 underline">
          حركات المخزون
        </Link>
      </p>

      {OIL_SOURCES.map((source) => {
        const sourceRows = rows.filter((r) => r.oilSource === source.value);
        return (
          <div
            key={source.value}
            className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
            style={{ borderTopWidth: 4, borderTopColor: source.color }}
          >
            <h2 className="mb-3 text-lg font-black" style={{ color: source.color }}>
              {source.emoji} {source.label}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(sourceRows.length ? sourceRows : OIL_TYPES.map((t) => ({ oilSource: source.value, oilType: t.value } as StockRow))).map((s) => {
                const m = oilMeta(s.oilType);
                return (
                  <div
                    key={`${s.oilSource}-${s.oilType}`}
                    className="rounded-xl border border-[var(--app-border)] p-4"
                    style={{ borderTopWidth: 3, borderTopColor: m.color }}
                  >
                    <h3 className="mb-2 font-black" style={{ color: m.color }}>
                      {m.emoji} {m.label}
                    </h3>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <Item label="المضاف" v={s.totalAdded} />
                      <Item label="المباع" v={s.totalSold} />
                      <Item label="نظري" v={s.theoreticalQty} strong />
                      <Item label="فعلي" v={s.physicalQty} />
                      <Item label="خسارة" v={s.lossQty} />
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {canWrite && !readOnly ? (
        <form
          onSubmit={onAdd}
          className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5"
        >
          <h2 className="font-black">إضافة مخزون</h2>
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
          <p className="text-sm text-[var(--app-text-dim)]">
            {oilSourceMeta(oilSource).label} → {oilMeta(oilType).label}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="الكمية (لتر)"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
            <Input label="ملاحظة" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" loading={addMut.isPending} className="bg-amber-700 hover:bg-amber-800">
            تسجيل الإضافة
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function Item({
  label,
  v,
  strong,
}: {
  label: string;
  v?: number | null;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] text-[var(--app-text-dim)]">{label}</dt>
      <dd className={strong ? 'text-base font-black' : 'font-bold'}>
        {v == null ? '—' : formatNumber(v, 1)} لتر
      </dd>
    </div>
  );
}
