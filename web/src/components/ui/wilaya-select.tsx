'use client';

import { ALGERIA_WILAYAS } from '@/lib/algeria/wilayas';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export function WilayaSelect({
  label = 'الولاية',
  value,
  onChange,
  className,
  allowEmpty = true,
  emptyLabel = '— اختر الولاية —',
}: Props) {
  return (
    <div className={cn('space-y-1', className)}>
      {label ? (
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </label>
      ) : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {ALGERIA_WILAYAS.map((w) => (
          <option key={w.code} value={w.nameAr}>
            {w.code} — {w.nameAr}
          </option>
        ))}
      </select>
    </div>
  );
}
