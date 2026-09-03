import { cn } from '@/lib/utils';

export function StatusBadge({
  active,
  label,
  variant = 'default',
}: {
  active: boolean;
  label: string;
  variant?: 'success' | 'info' | 'default';
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-bold',
        active
          ? variant === 'success'
            ? 'bg-emerald-500 text-white'
            : variant === 'info'
              ? 'bg-sky-500 text-white'
              : 'bg-stone-600 text-white'
          : 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400',
      )}
    >
      {active ? '✓' : '—'}
    </span>
  );
}
