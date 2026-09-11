import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'glass' | 'elevated';

const variants: Record<CardVariant, string> = {
  default:
    'rounded-[var(--app-radius-lg)] border border-[var(--app-glass-border)] bg-[var(--app-glass)] shadow-[var(--app-shadow-md)] backdrop-blur-xl [box-shadow:var(--app-shadow-md),inset_0_1px_0_var(--app-glass-highlight)]',
  glass:
    'rounded-[var(--app-radius-lg)] border border-[var(--app-glass-border)] bg-[var(--app-glass)] shadow-[var(--app-shadow-md)] backdrop-blur-2xl [box-shadow:var(--app-shadow-md),inset_0_1px_0_var(--app-glass-highlight)]',
  elevated:
    'rounded-[var(--app-radius-xl)] border border-[var(--app-glass-border)] bg-[var(--app-surface-elevated)] shadow-[var(--app-shadow-lg)] backdrop-blur-xl [box-shadow:var(--app-shadow-lg),inset_0_1px_0_var(--app-glass-highlight)]',
};

export function Card({
  children,
  className,
  title,
  action,
  bodyClassName,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  bodyClassName?: string;
  variant?: CardVariant;
}) {
  return (
    <div
      className={cn(
        'transition-shadow duration-300 hover:shadow-[var(--app-shadow-lg)] dark:hover:shadow-none',
        variants[variant],
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] px-[var(--space-card)] py-4">
          {title && <h2 className="text-lg font-bold text-[var(--app-text)]">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn('p-[var(--space-card)]', bodyClassName)}>{children}</div>
    </div>
  );
}
