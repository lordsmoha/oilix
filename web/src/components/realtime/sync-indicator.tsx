'use client';

import { cn } from '@/lib/utils';
import { useRealtime } from './realtime-provider';

const LABELS = {
  connected: 'متصل — مزامنة فورية',
  connecting: 'جاري الاتصال…',
  disconnected: 'غير متصل — مزامنة دورية',
} as const;

export function SyncIndicator({ className }: { className?: string }) {
  const { status, syncing, lastError } = useRealtime();

  const dotClass =
    status === 'connected'
      ? 'bg-emerald-500'
      : status === 'connecting'
        ? 'bg-amber-400 animate-pulse'
        : 'bg-red-500';

  const title =
    status === 'disconnected' && lastError
      ? `${LABELS.disconnected}\n${lastError}`
      : LABELS[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--app-text-muted)]',
        syncing && 'ring-1 ring-emerald-400/50',
        className,
      )}
      title={title}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClass)} />
      <span className="max-w-[8rem] truncate">
        {syncing ? 'مزامنة…' : LABELS[status]}
      </span>
    </div>
  );
}
