import { cn } from '@/lib/utils';

/** Classes pour colorer les lignes selon l'état de la commande */
export const ORDER_ROW = {
  taken: 'order-row-taken',
  cancelled: 'order-row-cancelled',
} as const;

export function orderRowClassName(opts: {
  isCancelled?: boolean;
  oilCollected?: boolean;
  isSelected?: boolean;
  isSearchMatch?: boolean;
  selectedClass?: string;
  alternateIndex?: number;
}): string {
  const searchHighlight =
    opts.isSearchMatch &&
    cn(
      'ring-2 ring-inset ring-amber-400/90 bg-amber-50/90 dark:bg-amber-950/35',
      opts.isSelected && 'ring-amber-500',
    );

  if (opts.isCancelled) {
    return cn(
      ORDER_ROW.cancelled,
      opts.isSelected && opts.selectedClass,
      searchHighlight,
      'hover:brightness-[0.97]',
    );
  }
  if (opts.oilCollected) {
    return cn(
      ORDER_ROW.taken,
      opts.isSelected && opts.selectedClass,
      searchHighlight,
      'hover:brightness-[0.97]',
    );
  }
  if (opts.isSelected && opts.selectedClass) {
    return cn(opts.selectedClass, searchHighlight);
  }
  if (searchHighlight) return searchHighlight;
  if (opts.alternateIndex !== undefined) {
    return opts.alternateIndex % 2 === 0
      ? 'bg-white dark:bg-stone-900/40'
      : 'bg-stone-50/50 dark:bg-stone-900/20';
  }
  return 'bg-white dark:bg-stone-900/40';
}

export { amountFromWeightQuintal as computePressingAmount } from '@/lib/pricing';
