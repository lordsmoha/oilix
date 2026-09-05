'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Droplets,
  LayoutDashboard,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrencyDz } from '@/lib/locale-dz';
import { APP_MARKET, BUSINESS_NAME } from '@/lib/labels';
import { ModulePageHero } from '@/components/ui/module-page-hero';
import { OliveTypeCard } from '@/components/dashboard/olive-type-card';

type TypeStats = {
  oliveType: string;
  label: string;
  lastClientNumber: number;
  lastMilledReferenceNumber: number;
  nextClientNumber?: number;
  milledCount: number;
  unmilledCount: number;
  subscriptionsCount: number;
};

type DashboardData = {
  companyName: string;
  pricePerQuintal: number;
  season?: { name: string };
  revenue?: number;
  totalAid?: number;
  oliveTypes: TypeStats[];
};

const ORDER = ['GREEN', 'ZBOUCH', 'RIPE'] as const;

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardData>('/dashboard')).data,
  });

  if (isLoading) return <DashboardSkeleton />;

  const sorted =
    data?.oliveTypes.sort(
      (a, b) => ORDER.indexOf(a.oliveType as (typeof ORDER)[number]) - ORDER.indexOf(b.oliveType as (typeof ORDER)[number]),
    ) ?? [];

  return (
    <div className="dashboard-page relative min-h-full">
      <div className="dashboard-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="dashboard-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="dashboard-pattern pointer-events-none absolute inset-0 opacity-[0.4]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-3 py-5 md:px-6 md:py-8">
        <ModulePageHero
          gradient="from-emerald-900 via-emerald-700 to-teal-600"
          glow="shadow-emerald-700/30"
          patternClass="olive-add-hero-pattern"
          icon={<Droplets className="h-8 w-8 text-white" strokeWidth={1.5} />}
          badge={
            <span className="mb-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              <LayoutDashboard className="h-3.5 w-3.5" />
              لوحة التحكم
              <span className="opacity-50">·</span>
              <CalendarDays className="h-3.5 w-3.5" />
              {data?.season?.name ?? 'الموسم الحالي'}
              <span className="opacity-50">·</span>
              <span className="rounded-md bg-white/20 px-1.5 py-0.5">{APP_MARKET.currencySymbol}</span>
            </span>
          }
          title={data?.companyName ?? BUSINESS_NAME}
          subtitle="متابعة الاستقبال والتصفية والإيرادات"
          actions={
            <Link
              href="/settings"
              className="rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/25"
            >
              الإعدادات
            </Link>
          }
        />

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            تعذر تحميل الإحصائيات.{' '}
            <button type="button" className="font-bold underline" onClick={() => refetch()}>
              إعادة المحاولة
            </button>
          </div>
        ) : null}

        <section className="dashboard-cards-enter grid gap-5 lg:grid-cols-3 lg:gap-6">
          {sorted.map((t, i) => (
            <OliveTypeCard
              key={t.oliveType}
              oliveType={t.oliveType}
              label={t.label}
              lastReference={t.lastClientNumber}
              lastMilledReference={t.lastMilledReferenceNumber}
              nextReference={t.nextClientNumber ?? t.lastClientNumber + 1}
              milled={t.milledCount}
              unmilled={t.unmilledCount}
              subscriptions={t.subscriptionsCount}
              index={i}
            />
          ))}
        </section>

        <footer className="dashboard-pricing-enter">
          <div className="relative overflow-hidden rounded-3xl border border-amber-300/50 bg-gradient-to-l from-amber-500/95 via-amber-500 to-orange-500 p-[1px] shadow-xl shadow-amber-500/20">
            <div className="flex flex-col items-center justify-between gap-4 rounded-[1.4rem] bg-gradient-to-l from-amber-50 via-white to-amber-50/80 px-6 py-5 sm:flex-row dark:from-amber-950/90 dark:via-stone-900 dark:to-amber-950/80">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl shadow-inner">
                  🫒
                </span>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-800/70 dark:text-amber-200/70">
                    التعريفة الحالية
                  </p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    التعريفة المعتمدة للتصفية
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-left" dir="ltr">
                <p className="text-xs font-medium text-amber-900/60 dark:text-amber-100/60">
                  1 قنطار (100 كغ)
                </p>
                <p className="text-3xl font-black tabular-nums text-amber-950 dark:text-amber-50">
                  {formatCurrencyDz(data?.pricePerQuintal ?? 0, 0)}
                  <span className="mr-1 text-lg font-bold opacity-80">دج/ق</span>
                </p>
              </div>
              <Link
                href="/finance"
                className="shrink-0 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-700"
              >
                اليومية المالية
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-page relative min-h-full animate-pulse">
      <div className="dashboard-bg absolute inset-0" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-3 py-5 md:px-6 md:py-8">
        <div className="h-36 rounded-3xl bg-white/40 dark:bg-stone-800/40" />
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[440px] rounded-3xl bg-white/50 dark:bg-stone-800/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
