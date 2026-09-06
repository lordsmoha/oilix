'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { OIL_SOURCES, OIL_TYPES, oilMeta, oilSourceMeta } from '@/lib/sales-nav';
import { formatNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';

type Report = {
  summary: {
    count: number;
    litres: number;
    gross: number;
    assistanceFixed: number;
    assistancePercentAmount: number;
    assistancePerLitreTotal?: number;
    totalAssistance: number;
    net: number;
    oilRevenue?: number;
    containerRevenue?: number;
    amountPaid?: number;
    remainingDebt?: number;
    cashFromSales?: number;
    debtRepayments?: number;
    cashCollected?: number;
    newDebtCreated?: number;
  };
  cashVsRevenue?: {
    netSales: number;
    cashFromSales: number;
    newDebt: number;
    debtRepayments: number;
    cashCollected: number;
  };
  bySource?: Array<{
    oilSource: string;
    count: number;
    litres: number;
    gross: number;
    assistance: number;
    net: number;
  }>;
  byBucket?: Array<{
    oilSource: string;
    oilType: string;
    count: number;
    litres: number;
    gross: number;
    assistance: number;
    net: number;
    stock: {
      oilSource: string;
      oilType: string;
      totalAdded: number;
      totalSold: number;
      theoreticalQty: number;
      physicalQty: number | null;
      lossQty: number;
    } | null;
  }>;
  globalByType?: Array<{
    oilType: string;
    stored: number;
    farmer: number;
    total: number;
    count: number;
    litres: number;
    gross: number;
    assistance: number;
    net: number;
  }>;
  byType: Array<{
    oilType: string;
    count: number;
    litres: number;
    gross: number;
    assistance: number;
    net: number;
  }>;
  byUser: Array<{
    userId: string;
    count: number;
    litres: number;
    net: number;
    user: { username: string; firstName?: string | null } | null;
  }>;
  byRegister?: Array<{
    cashRegisterId: string | null;
    code: string | null;
    name: string | null;
    count: number;
    litres: number;
    net: number;
  }>;
  byDevice?: Array<{
    deviceId: string | null;
    code: string | null;
    name: string | null;
    count: number;
    litres: number;
    net: number;
  }>;
  stock: Array<{
    oilSource: string;
    oilType: string;
    totalAdded: number;
    totalSold: number;
    theoreticalQty: number;
    physicalQty: number | null;
    lossQty: number;
  }>;
  byContainer?: Array<{
    name: string | null;
    capacityL: number;
    count?: number;
    litres: number;
    usedForOil?: number;
    soldEmpty?: number;
    emptyRevenue?: number;
  }>;
  containerStock?: Array<{
    id: string;
    name: string;
    stock: {
      totalAdded: number;
      totalSoldEmpty: number;
      totalConsumedInOil: number;
      totalDamaged: number;
      theoreticalQty: number;
      physicalQty: number | null;
      lossQty: number;
    };
  }>;
  containerSales?: {
    unitsSoldEmpty: number;
    emptyRevenue: number;
    unitsConsumedInOil: number;
  };
  containerConsumption?: Array<{
    name: string | null;
    capacityL: number;
    usedForOil: number;
  }>;
};

export default function SalesReportsPage() {
  const canReports = useAuthStore((s) => s.hasPermission('OIL_SALES_REPORTS_VIEW'));
  const canPrint = useAuthStore((s) => s.hasPermission('OIL_SALES_PRINT_RECEIPT'));
  const canExport = useAuthStore((s) => s.hasPermission('OIL_SALES_REPORTS_EXPORT'));
  const canOpenDayReport = canReports || canPrint || canExport;

  const today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [oilSource, setOilSource] = useState('');
  const [oilType, setOilType] = useState('');

  const reportQ = useQuery({
    queryKey: ['oil-sales-reports', from, to, oilSource, oilType],
    queryFn: async () =>
      (
        await api.get<Report>('/oil-sales/reports', {
          params: {
            from: from || undefined,
            to: to || undefined,
            oilSource: oilSource || undefined,
            oilType: oilType || undefined,
          },
        })
      ).data,
  });

  const s = reportQ.data?.summary;

  function openDayReport(autoPrint = false) {
    const params = new URLSearchParams();
    params.set('from', from || today);
    params.set('to', to || from || today);
    params.set('date', from || today);
    if (autoPrint) params.set('print', '1');
    window.open(`/oil-day-report?${params.toString()}`, '_blank', 'noopener');
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-black">تقارير بيع الزيت</h1>
        {canOpenDayReport ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => openDayReport(false)}
            >
              <Printer className="h-4 w-4" />
              يومية بيع الزيت
            </Button>
            <Button
              type="button"
              className="gap-2 bg-amber-700 hover:bg-amber-800"
              onClick={() => openDayReport(true)}
            >
              طباعة اليومية
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="من" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="إلى" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="عدد البيوع" value={String(s?.count ?? '—')} />
        <Card label="اللترات" value={s ? formatNumber(s.litres, 1) : '—'} />
        <Card label="الإيراد الإجمالي" value={s ? formatNumber(s.gross, 0) : '—'} unit="د.ج" />
        <Card label="صافي الإيراد" value={s ? formatNumber(s.net, 0) : '—'} unit="د.ج" emphasize />
        <Card
          label="إيراد الزيت"
          value={s?.oilRevenue != null ? formatNumber(s.oilRevenue, 0) : '—'}
          unit="د.ج"
        />
        <Card
          label="إيراد الضلف الفارغة"
          value={s?.containerRevenue != null ? formatNumber(s.containerRevenue, 0) : '—'}
          unit="د.ج"
        />
      </div>

      {reportQ.data?.cashVsRevenue ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card
            label="صافي المبيعات"
            value={formatNumber(reportQ.data.cashVsRevenue.netSales, 0)}
            unit="د.ج"
          />
          <Card
            label="نقد من مبيعات الفترة"
            value={formatNumber(reportQ.data.cashVsRevenue.cashFromSales, 0)}
            unit="د.ج"
          />
          <Card
            label="دين جديد (متبقي الفواتير)"
            value={formatNumber(reportQ.data.cashVsRevenue.newDebt, 0)}
            unit="د.ج"
          />
          <Card
            label="تسديدات ديون"
            value={formatNumber(reportQ.data.cashVsRevenue.debtRepayments, 0)}
            unit="د.ج"
          />
          <Card
            label="إجمالي النقد المحصّل"
            value={formatNumber(reportQ.data.cashVsRevenue.cashCollected, 0)}
            unit="د.ج"
            emphasize
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card
          label="مساعدة اللتر"
          value={s ? formatNumber(s.assistancePerLitreTotal ?? 0, 0) : '—'}
          unit="د.ج"
        />
        <Card label="مساعدة ثابتة" value={s ? formatNumber(s.assistanceFixed, 0) : '—'} unit="د.ج" />
        <Card label="إجمالي المساعدات" value={s ? formatNumber(s.totalAssistance, 0) : '—'} unit="د.ج" />
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">حسب المصدر</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(reportQ.data?.bySource ?? []).map((r) => {
            const src = oilSourceMeta(r.oilSource);
            return (
              <div key={r.oilSource} className="rounded-xl border border-[var(--app-border)] p-3">
                <p className="font-black" style={{ color: src.color }}>
                  {src.emoji} {src.label}
                </p>
                <p className="mt-1 text-sm">
                  {r.count} بيع · {formatNumber(r.litres, 1)} لتر · صافي {formatNumber(r.net, 0)} د.ج
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">حسب المصدر + النوع</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-[var(--app-text-dim)]">
              <tr>
                <th className="px-2 py-1.5 text-right font-bold">المصدر</th>
                <th className="px-2 py-1.5 text-right font-bold">النوع</th>
                <th className="px-2 py-1.5 text-right font-bold">مباع</th>
                <th className="px-2 py-1.5 text-right font-bold">المعروض</th>
                <th className="px-2 py-1.5 text-right font-bold">الفرق</th>
                <th className="px-2 py-1.5 text-right font-bold">صافي الإيراد</th>
              </tr>
            </thead>
            <tbody>
              {(reportQ.data?.byBucket ?? []).map((b) => {
                const src = oilSourceMeta(b.oilSource);
                const m = oilMeta(b.oilType);
                return (
                  <tr key={`${b.oilSource}-${b.oilType}`} className="border-t border-[var(--app-border)]">
                    <td className="px-2 py-2">{src.label}</td>
                    <td className="px-2 py-2">{m.label}</td>
                    <td className="px-2 py-2 tabular-nums">{formatNumber(b.litres, 1)}</td>
                    <td className="px-2 py-2 tabular-nums">
                      {formatNumber(b.stock?.theoreticalQty ?? 0, 1)}
                    </td>
                    <td className="px-2 py-2 tabular-nums">{formatNumber(b.stock?.lossQty ?? 0, 1)}</td>
                    <td className="px-2 py-2 tabular-nums">{formatNumber(b.net, 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">إجماليات حسب نوع الزيت</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(reportQ.data?.globalByType ?? []).map((t) => {
            const m = oilMeta(t.oilType);
            return (
              <div key={t.oilType} className="rounded-xl border border-[var(--app-border)] p-3">
                <p className="font-black" style={{ color: m.color }}>
                  {m.emoji} {m.label}
                </p>
                <p className="mt-1 text-xs text-[var(--app-text-dim)]">
                  مخزن {formatNumber(t.stored, 1)} · فلاح {formatNumber(t.farmer, 1)} · إجمالي{' '}
                  {formatNumber(t.total, 1)} لتر
                </p>
                <p className="mt-1 text-sm">
                  {t.count} بيع · {formatNumber(t.litres, 1)} لتر · صافي {formatNumber(t.net, 0)} د.ج
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">حسب نوع الزيت (مبيعات الفترة)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(reportQ.data?.byType ?? []).map((t) => {
            const m = oilMeta(t.oilType);
            return (
              <div key={t.oilType} className="rounded-xl border border-[var(--app-border)] p-3">
                <p className="font-black" style={{ color: m.color }}>
                  {m.emoji} {m.label}
                </p>
                <p className="mt-1 text-sm">
                  {t.count} بيع · {formatNumber(t.litres, 1)} لتر · صافي {formatNumber(t.net, 0)} د.ج
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">حسب العامل</h2>
        <ul className="divide-y divide-[var(--app-border)] text-sm">
          {(reportQ.data?.byUser ?? []).map((u) => (
            <li key={u.userId} className="flex justify-between py-2">
              <span className="font-bold">{u.user?.firstName || u.user?.username || u.userId}</span>
              <span>
                {u.count} بيع · {formatNumber(u.litres, 1)} لتر · {formatNumber(u.net, 0)} د.ج
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">حسب الصندوق</h2>
        <ul className="divide-y divide-[var(--app-border)] text-sm">
          {(reportQ.data?.byRegister ?? []).map((r) => (
            <li key={r.cashRegisterId ?? 'legacy'} className="flex justify-between py-2">
              <span className="font-bold">{r.name || r.code || 'بدون جهاز (قديم)'}</span>
              <span>
                {r.count} بيع · {formatNumber(r.litres, 1)} لتر · {formatNumber(r.net, 0)} د.ج
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">حسب الجهاز</h2>
        <ul className="divide-y divide-[var(--app-border)] text-sm">
          {(reportQ.data?.byDevice ?? []).map((r) => (
            <li key={r.deviceId ?? 'legacy'} className="flex justify-between py-2">
              <span className="font-bold">{r.code || r.name || 'بدون جهاز (قديم)'}</span>
              <span>
                {r.count} بيع · {formatNumber(r.litres, 1)} لتر · {formatNumber(r.net, 0)} د.ج
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">حسب التعبئة</h2>
        {(reportQ.data?.byContainer ?? []).length === 0 ? (
          <p className="text-sm text-[var(--app-text-dim)]">لا مبيعات تعبئة في هذه الفترة</p>
        ) : (
          <ul className="divide-y divide-[var(--app-border)] text-sm">
            {(reportQ.data?.byContainer ?? []).map((c) => (
              <li key={`${c.name}-${c.capacityL}`} className="flex justify-between py-2">
                <span className="font-bold">{c.name || `${c.capacityL} لتر`}</span>
                <span>
                  تعبئة زيت {c.usedForOil ?? c.count ?? 0} · فارغ {c.soldEmpty ?? 0} ·{' '}
                  {formatNumber(c.litres, 1)} لتر
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">مبيعات واستهلاك الضلف</h2>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Card
            label="مستهلك في بيع الزيت"
            value={String(reportQ.data?.containerSales?.unitsConsumedInOil ?? '—')}
          />
          <Card
            label="مباع فارغاً"
            value={String(reportQ.data?.containerSales?.unitsSoldEmpty ?? '—')}
          />
          <Card
            label="إيراد الضلف الفارغة"
            value={
              reportQ.data?.containerSales
                ? formatNumber(reportQ.data.containerSales.emptyRevenue, 0)
                : '—'
            }
            unit="د.ج"
          />
        </div>
        <ul className="divide-y divide-[var(--app-border)] text-sm">
          {(reportQ.data?.containerConsumption ?? []).map((c) => (
            <li key={`${c.name}-cons`} className="flex justify-between py-2">
              <span className="font-bold">{c.name}</span>
              <span>{c.usedForOil} ضلف لتعبئة الزيت</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">مخزون الضلف</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {(reportQ.data?.containerStock ?? []).map((c) => (
            <div key={c.id} className="rounded-xl border p-3 text-sm">
              <p className="font-black">{c.name}</p>
              <p>
                مضاف {c.stock.totalAdded} · تعبئة {c.stock.totalConsumedInOil} · فارغ{' '}
                {c.stock.totalSoldEmpty}
              </p>
              <p>
                المعروض {c.stock.theoreticalQty} · الباقي {c.stock.physicalQty ?? '—'} · تلف{' '}
                {c.stock.totalDamaged} · الفرق {c.stock.lossQty}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">تقرير المخزون</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(reportQ.data?.stock ?? []).map((st) => {
            const src = oilSourceMeta(st.oilSource);
            const m = oilMeta(st.oilType);
            return (
              <div key={`${st.oilSource}-${st.oilType}`} className="rounded-xl border p-3 text-sm">
                <p className="text-xs text-[var(--app-text-dim)]">{src.label}</p>
                <p className="font-black" style={{ color: m.color }}>
                  {m.emoji} {m.label}
                </p>
                <p>
                  مضاف {formatNumber(st.totalAdded, 1)} · مباع {formatNumber(st.totalSold, 1)}
                </p>
                <p>
                  المعروض {formatNumber(st.theoreticalQty, 1)} · الباقي{' '}
                  {st.physicalQty == null ? '—' : formatNumber(st.physicalQty, 1)} · الفرق{' '}
                  {formatNumber(st.lossQty, 1)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  unit,
  emphasize,
}: {
  label: string;
  value: string;
  unit?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={
        emphasize
          ? 'rounded-2xl border border-amber-600/40 bg-amber-50/50 p-4 dark:bg-amber-950/20'
          : 'rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4'
      }
    >
      <p className="text-xs font-bold text-[var(--app-text-dim)]">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums">
        {value}
        {unit ? <span className="mr-1 text-sm">{unit}</span> : null}
      </p>
    </div>
  );
}
