import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-[var(--app-text-muted)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-input-bg,var(--app-surface))]',
          'px-[var(--space-input-x)] py-[var(--space-input-y)] text-sm text-[var(--app-text)] shadow-sm transition-all duration-200',
          'placeholder:text-[var(--app-text-dim)]',
          'hover:border-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border-strong))]',
          'focus:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--app-accent)_25%,transparent)] focus:shadow-[var(--app-shadow-md)]',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/25',
          className,
        )}
        {...props}
      />
      {hint && !error ? <p className="text-xs text-[var(--app-text-dim)]">{hint}</p> : null}
      {error && <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';
