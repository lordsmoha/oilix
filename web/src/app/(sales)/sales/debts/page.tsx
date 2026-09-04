'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatNumber, formatDateTimeDz } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type DebtorRow = {
  customer: { id: string; name: string; phone?: string | null };
  debt: number;
  unpaidSalesCount: number;
  oldestDebtDate?: string | null;
  lastSaleDate?: string | null;
  lastPaymentAt?: string | null;
};

type Summary = {
  totalDebt: number;
  debtorsCount: number;
  collectedToday: number;
  newDebtToday: number;
};

export default function DebtsPage() {
  const { readOnly } = useSeasonReadOnly();
  const canView = useAuthStore((s) => s.hasPermission('OIL_SALES_DEBTS_VIEW'));
  const canPay = useAuthStore((s) => s.hasPermission('OIL_SALES_DEBTS_RECORD_PAYMENT'));
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('debt_desc');

  const summaryQ = useQuery({
    queryKey: ['oil-debts-summary'],
    enabled: canView,
    queryFn: async () => (await api.get<Summary>('/oil-sales/debts/summary')).data,
  });

  const listQ = useQuery({
    queryKey: ['oil-debts', q, sort],
    enabled: canView,
    queryFn: async () =>
      (
        await api.get<DebtorRow[]>('/oil-sales/debts', {
          params: { q: q || undefined, sort },
        })
      ).data,
  });

  if (!canView) {
    return (
      <div className="rounded-2xl border border-[var(--app-border)] p-8 text-center">
        <p className="font-bold">ليس لديك صلاحية عرض الديون</p>
      </div>
    );
  }

  const s = summaryQ.data;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-black">الديون</h1>
        <p className="text-sm text-[var(--app-text-dim)]">الزبائن المدينون وتسديد الديون</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="إجمالي الديون" value={s ? formatNumber(s.totalDebt, 0) : '—'} unit="د.ج" />
        <Card label="عدد المدينين" value={s ? String(s.debtorsCount) : '—'} />
        <Card label="محصّل اليوم" value={s ? formatNumber(s.collectedToday, 0) : '—'} unit="د.ج" />
        <Card label="دين جديد اليوم" value={s ? formatNumber(s.newDebtToday, 0) : '—'} unit="د.ج" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="min-w-[200px] flex-1"
          label="بحث"
          placeholder="اسم أو هاتف…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[var(--app-text-muted)]">ترتيب</span>
          <select
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="debt_desc">الأعلى ديناً</option>
            <option value="oldest">الأقدم ديناً</option>
            <option value="recent">أحدث بيع</option>
            <option value="name">الاسم</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[var(--app-bg-muted)]">
            <tr>
              <th className="px-3 py-2 text-right">الزبون</th>
              <th className="px-3 py-2 text-right">الهاتف</th>
              <th className="px-3 py-2 text-right">الدين</th>
              <th className="px-3 py-2 text-right">فواتير</th>
              <th className="px-3 py-2 text-right">أقدم دين</th>
              <th className="px-3 py-2 text-right">آخر تسديد</th>
              <th className="px-3 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((r) => (
              <tr key={r.customer.id} className="border-t border-[var(--app-border)]">
                <td className="px-3 py-2 font-bold">{r.customer.name}</td>
                <td className="px-3 py-2 text-xs">{r.customer.phone || '—'}</td>
                <td className="px-3 py-2 font-black tabular-nums text-amber-800">
                  {formatNumber(r.debt, 0)} د.ج
                </td>
                <td className="px-3 py-2 tabular-nums">{r.unpaidSalesCount}</td>
                <td className="px-3 py-2 text-xs">
                  {r.oldestDebtDate ? formatDateTimeDz(r.oldestDebtDate) : '—'}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.lastPaymentAt ? formatDateTimeDz(r.lastPaymentAt) : '—'}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/sales/debts/${r.customer.id}`}
                    className="text-sm font-bold text-amber-800 underline"
                  >
                    التفاصيل{canPay && !readOnly ? ' / تسديد' : ''}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(listQ.data ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--app-text-dim)]">لا مدينين حالياً</p>
        ) : null}
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <p className="text-xs font-bold text-[var(--app-text-dim)]">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums">
        {value}
        {unit ? <span className="ms-1 text-sm font-bold">{unit}</span> : null}
      </p>
    </div>
  );
}
