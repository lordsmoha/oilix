'use client';

import { cn } from '@/lib/utils';

type Props = {
  gradient: string;
  glow?: string;
  patternClass?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function ModulePageHero({
  gradient,
  glow,
  patternClass,
  badge,
  icon,
  title,
  subtitle,
  actions,
  className,
}: Props) {
  return (
    <header
      className={cn(
        'module-hero-enter relative overflow-hidden rounded-[var(--app-radius-xl)] bg-gradient-to-l shadow-[var(--app-shadow-lg)]',
        gradient,
        glow,
        className,
      )}
    >
      {patternClass ? (
        <div className={cn('pointer-events-none absolute inset-0 opacity-50', patternClass)} aria-hidden />
      ) : null}
      <div className="pointer-events-none absolute -left-24 top-0 h-48 w-48 rounded-full bg-white/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-0 h-40 w-56 rounded-full bg-black/12 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5"
        aria-hidden
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex min-w-0 items-center gap-4">
          {icon ? (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--app-radius-lg)] border border-white/25 bg-white/15 text-3xl shadow-inner backdrop-blur-md">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            {badge}
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-white/85 sm:text-base">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
