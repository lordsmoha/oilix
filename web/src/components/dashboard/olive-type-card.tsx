'use client';

import Link from 'next/link';
import { ArrowLeft, Table2, UserPlus, CheckCircle2, Hash } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const THEMES: Record<
  string,
  {
    slug: string;
    emoji: string;
    gradient: string;
    headerGradient: string;
    glow: string;
    border: string;
    ring: string;
    badge: string;
    iconBg: string;
    statMilled: string;
    statPending: string;
    statSubs: string;
    accent: string;
    btnPrimary: string;
  }
> = {
  GREEN: {
    slug: 'green',
    emoji: '🫒',
    gradient: 'from-emerald-600 to-teal-500',
    headerGradient: 'from-emerald-800/90 via-emerald-700/80 to-teal-600/70',
    glow: 'bg-emerald-400',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
    ring: 'stroke-emerald-500',
    badge: 'bg-emerald-500 text-white',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-700',
    statMilled: 'bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:ring-emerald-900',
    statPending: 'bg-amber-50 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:ring-amber-900',
    statSubs: 'bg-stone-50 ring-1 ring-stone-100 dark:bg-stone-800/50 dark:ring-stone-700',
    accent: 'text-emerald-600 dark:text-emerald-400',
    btnPrimary: 'bg-gradient-to-l from-emerald-600 to-teal-500 text-white shadow-emerald-600/25',
  },
  ZBOUCH: {
    slug: 'zbouch',
    emoji: '🌿',
    gradient: 'from-blue-600 to-indigo-500',
    headerGradient: 'from-blue-800/90 via-blue-700/80 to-indigo-600/70',
    glow: 'bg-blue-400',
    border: 'border-blue-200/80 dark:border-blue-800/60',
    ring: 'stroke-blue-500',
    badge: 'bg-blue-500 text-white',
    iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-700',
    statMilled: 'bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:ring-blue-900',
    statPending: 'bg-sky-50 ring-1 ring-sky-100 dark:bg-sky-950/30 dark:ring-sky-900',
    statSubs: 'bg-stone-50 ring-1 ring-stone-100 dark:bg-stone-800/50 dark:ring-stone-700',
    accent: 'text-blue-600 dark:text-blue-400',
    btnPrimary: 'bg-gradient-to-l from-blue-600 to-indigo-500 text-white shadow-blue-600/25',
  },
  RIPE: {
    slug: 'ripe',
    emoji: '🍇',
    gradient: 'from-rose-600 to-orange-500',
    headerGradient: 'from-rose-800/90 via-rose-700/80 to-orange-600/70',
    glow: 'bg-rose-400',
    border: 'border-rose-200/80 dark:border-rose-800/60',
    ring: 'stroke-rose-500',
    badge: 'bg-rose-500 text-white',
    iconBg: 'bg-gradient-to-br from-rose-400 to-red-700',
    statMilled: 'bg-rose-50 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:ring-rose-900',
    statPending: 'bg-orange-50 ring-1 ring-orange-100 dark:bg-orange-950/30 dark:ring-orange-900',
    statSubs: 'bg-stone-50 ring-1 ring-stone-100 dark:bg-stone-800/50 dark:ring-stone-700',
    accent: 'text-rose-600 dark:text-rose-400',
    btnPrimary: 'bg-gradient-to-l from-rose-600 to-orange-500 text-white shadow-rose-600/25',
  },
};

type Props = {
  oliveType: string;
  label: string;
  lastReference: number;
  lastMilledReference: number;
  nextReference: number;
  milled: number;
  unmilled: number;
  subscriptions: number;
  index: number;
};

export function OliveTypeCard({
  label,
  lastReference,
  lastMilledReference,
  nextReference,
  milled,
  unmilled,
  subscriptions,
  index,
  oliveType,
}: Props) {
  const theme = THEMES[oliveType] ?? THEMES.GREEN;
  const progress =
    subscriptions > 0 ? Math.round((milled / subscriptions) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDash = (progress / 100) * circumference;

  return (
    <article
      className={cn(
        'dashboard-card-enter group relative overflow-hidden rounded-3xl border bg-white/90 shadow-xl backdrop-blur-xl transition-all duration-300',
        'hover:-translate-y-2 hover:shadow-2xl dark:bg-stone-900/90',
        theme.border,
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div
        className={cn(
          'pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-50',
          theme.glow,
        )}
      />

      <div
        className={cn(
          'relative border-b px-5 py-4 bg-gradient-to-l',
          theme.headerGradient,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-sm">{theme.emoji}</span>
            <div>
              <h2 className="text-lg font-black text-white">{label}</h2>
              <p className="text-xs text-white/75">إحصائيات الموسم الجاري</p>
            </div>
          </div>
          <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-black', theme.badge)}>
            {progress}% مرحي
          </span>
        </div>
      </div>

      <div className="relative p-5 sm:p-6">
        <div className="mb-6 flex items-center justify-center gap-6">
          <div className="relative h-28 w-28 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                className="stroke-stone-200 dark:stroke-stone-700"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                className={cn('transition-all duration-700', theme.ring)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - strokeDash}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] font-medium text-stone-500">استقبال</span>
              <span className={cn('font-mono text-2xl font-black tabular-nums', theme.accent)}>
                {lastReference > 0 ? formatNumber(lastReference, 0) : '—'}
              </span>
            </div>
          </div>
          <div className="min-w-0 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <Hash className="h-4 w-4 shrink-0 opacity-60" />
              <span>
                التالي:{' '}
                <strong className={cn('font-mono tabular-nums', theme.accent)}>
                  {formatNumber(nextReference, 0)}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 opacity-60" />
              <span>
                آخر مرحي:{' '}
                <strong className={cn('font-mono tabular-nums', theme.accent)}>
                  {lastMilledReference > 0 ? formatNumber(lastMilledReference, 0) : '—'}
                </strong>
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {subscriptions > 0
                ? `${formatNumber(subscriptions, 0)} زبون مسجّل`
                : 'لا يوجد زبائن بعد'}
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          <StatBox label="مرحي" value={milled} className={theme.statMilled} />
          <StatBox label="غير مرحي" value={unmilled} className={theme.statPending} />
          <StatBox label="استقبال" value={subscriptions} className={theme.statSubs} />
        </div>

        <div className="grid gap-2">
          <Link href={`/olive/${theme.slug}`}>
            <Button
              variant="outline"
              className="h-12 w-full justify-between gap-2 rounded-xl border-stone-200/80 bg-white/80 text-sm font-bold dark:border-stone-700 dark:bg-stone-900/50"
            >
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                استقبال / إضافة
              </span>
              <ArrowLeft className="h-4 w-4 opacity-40" />
            </Button>
          </Link>
          <Link href={`/olive/${theme.slug}/processing`}>
            <Button className={cn('h-12 w-full justify-between gap-2 rounded-xl text-sm font-bold', theme.btnPrimary)}>
              <span className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                جدول المعالجة
              </span>
              <ArrowLeft className="h-4 w-4 opacity-80" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatBox({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn('rounded-xl px-2 py-3 text-center', className)}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums text-stone-900 dark:text-white">
        {formatNumber(value, 0)}
      </p>
    </div>
  );
}
