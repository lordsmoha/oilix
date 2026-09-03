import { cn } from '@/lib/utils';

type BadgeTone = 'default' | 'primary' | 'gold' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
  default: 'bg-[var(--app-bg-muted)] text-[var(--app-text-muted)]',
  primary: 'bg-[var(--app-primary-soft)] text-[var(--app-accent)]',
  gold: 'bg-[var(--app-gold-soft)] text-[var(--app-gold)]',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
};

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
