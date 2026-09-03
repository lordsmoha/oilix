'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { OIL_SOURCES, OIL_TYPES, oilMeta, oilSourceMeta } from '@/lib/sales-nav';
import { formatNumber, formatDateTimeDz } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const TYPE_AR: Record<string, string> = {
  STOCK_ADDITION: 'إضافة مخزون',
  SALE: 'بيع',
  SALE_CANCELLATION: 'إلغاء بيع',
  INVENTORY_COUNT: 'جرد',
  ADJUSTMENT: 'تعديل',
  LOSS: 'خسارة',
  MANUAL_CORRECTION: 'تصحيح يدوي',
};

type Movement = {
  id: string;
  oilSource: string;
  oilType: string;
  type: string;
  quantityL: string | number;
  stockBefore: string | number;
  stockAfter: string | number;
  note?: string | null;
  createdAt: string;
  user?: { username: string; firstName?: string | null };
  sale?: { receiptNumber: number } | null;
};

export default function SalesMovementsPage() {
  const [oilSource, setOilSource] = useState('');
  const [oilType, setOilType] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const listQ = useQuery({
    queryKey: ['oil-sales-movements', oilSource, oilType, type, from, to],
    queryFn: async () =>
      (
        await api.get<{ items: Movement[] }>('/oil-sales/movements', {
          params: {
            oilSource: oilSource || undefined,
            oilType: oilType || undefined,
            type: type || undefined,
            from: from || undefined,
            to: to || undefined,
            limit: 100,
          },
        })
      ).data.items,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-black">حركات المخزون</h1>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[var(--app-text-muted)]">المصدر</span>
          <select
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5"
            value={oilSource}
            onChange={(e) => setOilSource(e.target.value)}
          >
            <option value="">الكل</option>
            {OIL_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[var(--app-text-muted)]">نوع الزيت</span>
          <select
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5"
            value={oilType}
            onChange={(e) => setOilType(e.target.value)}
          >
            <option value="">الكل</option>
            {OIL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[var(--app-text-muted)]">الحركة</span>
          <select
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">الكل</option>
            {Object.entries(TYPE_AR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <Input label="من" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="إلى" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[var(--app-bg-muted)]">
            <tr>
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">المصدر</th>
              <th className="px-3 py-2 text-right">نوع الزيت</th>
              <th className="px-3 py-2 text-right">الحركة</th>
              <th className="px-3 py-2 text-right">الكمية</th>
              <th className="px-3 py-2 text-right">قبل</th>
              <th className="px-3 py-2 text-right">بعد</th>
              <th className="px-3 py-2 text-right">مرجع</th>
              <th className="px-3 py-2 text-right">المستخدم</th>
              <th className="px-3 py-2 text-right">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((m) => {
              const src = oilSourceMeta(m.oilSource);
              const meta = oilMeta(m.oilType);
              return (
                <tr key={m.id} className="border-t border-[var(--app-border)]">
                  <td className="px-3 py-2 text-xs">{formatDateTimeDz(m.createdAt)}</td>
                  <td className="px-3 py-2 text-xs">{src.label}</td>
                  <td className="px-3 py-2">
                    {meta.emoji} {meta.label}
                  </td>
                  <td className="px-3 py-2 font-semibold">{TYPE_AR[m.type] || m.type}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(Number(m.quantityL), 1)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(Number(m.stockBefore), 1)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(Number(m.stockAfter), 1)}</td>
                  <td className="px-3 py-2">
                    {m.sale ? `#${m.sale.receiptNumber}` : '—'}
                  </td>
                  <td className="px-3 py-2">{m.user?.firstName || m.user?.username || '—'}</td>
                  <td className="px-3 py-2 text-xs text-[var(--app-text-dim)]">{m.note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
