'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  size?: 'sm' | 'md';
};

export function FullscreenToggle({ className, size = 'md' }: Props) {
  const { isFullscreen, supported, toggle } = useFullscreen();

  if (!supported) return null;

  async function handleClick() {
    const ok = await toggle();
    if (!ok) {
      toast.error('تعذر تغيير وضع ملء الشاشة');
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
        'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]',
        'hover:border-[var(--app-accent)] hover:bg-[var(--app-primary-soft)]',
        isFullscreen && 'border-[var(--app-accent)] bg-[var(--app-primary-soft)] text-[var(--app-accent)]',
        size === 'sm' ? 'h-9 w-9' : 'h-10 w-10',
        className,
      )}
      aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'تفعيل ملء الشاشة'}
      aria-pressed={isFullscreen}
      title={isFullscreen ? 'الخروج من ملء الشاشة (Esc)' : 'ملء الشاشة'}
    >
      {isFullscreen ? (
        <Minimize2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
      ) : (
        <Maximize2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
      )}
    </button>
  );
}
