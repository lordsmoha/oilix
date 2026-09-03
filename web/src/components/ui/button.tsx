import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-l from-[var(--app-accent)] to-[var(--app-accent-dark)] text-white shadow-[var(--app-shadow-glow)] hover:brightness-110 hover:shadow-[var(--app-shadow-lg)] disabled:opacity-50',
  secondary:
    'bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-bg-muted)] border border-[var(--app-border)] shadow-sm hover:shadow-[var(--app-shadow-md)]',
  danger: 'bg-red-600 text-white shadow-md shadow-red-900/15 hover:bg-red-700',
  ghost: 'hover:bg-[var(--app-bg-muted)] text-[var(--app-text)]',
  outline:
    'border border-[var(--app-border-strong)] text-[var(--app-text)] bg-[var(--app-surface)] hover:bg-[var(--app-bg-muted)] hover:border-[var(--app-accent)]',
  gold:
    'bg-gradient-to-l from-amber-500 to-amber-600 text-white shadow-md shadow-amber-600/25 hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-[var(--app-radius)]',
  icon: 'h-9 w-9 p-0 rounded-xl',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--app-accent)_40%,transparent)] focus:ring-offset-2 focus:ring-offset-[var(--app-bg)]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
