'use client';

import { SelectionIndicator } from '@/components/ui/selection-indicator';
import { computePressingAmount, orderRowClassName } from '@/lib/order-row-status';
import { cn, formatDate, formatNumber, formatTimeDz } from '@/lib/utils';
import type { ProcessingTheme } from './processing-theme';
import { StatusBadge } from './status-badge';

export type ProcessingRow = {
  id: string;
  clientId: string;
  clientNumber: number;
  entryCount: number;
  firstName?: string;
  lastName?: string;
  pressingId: string | null;
  entryDate: string;
  referenceNumber: number;
  clientName: string;
  phone?: string;
  bagCount: number;
  totalWeightKg: number;
  adhlefCount?: number;
  capacity?: number | null;
  amount: number;
  aidAmount: number;
  netAmount: number;
  yieldPercent?: number | null;
  region?: string | null;
  zayat?: string | null;
  oilQuantityL?: number | null;
  treatmentDate?: string | null;
  treatmentTime?: string | null;
  oilCollected: boolean;
  paid: boolean;
  pickupDate?: string | null;
  notes?: string | null;
  notes2?: string | null;
  isCancelled: boolean;
  hasCancelled?: boolean;
  isNonReferential: boolean;
};

type Props = {
  rows: ProcessingRow[];
  theme: ProcessingTheme;
  pricePerQuintal?: number;
  selectedClientId: string | null;
  highlightClientId?: string | null;
  loading: boolean;
  onSelect: (row: ProcessingRow) => void;
  onWeighingsDetail?: (row: ProcessingRow) => void;
};

/**
 * Exact processing columns (RTL DOM order = right → left on screen):
 * تاريخ الدخول، الرقم، الإسم واللقب، الهاتف، الأكياس، الوزن، الشلف، السعة،
 * المبلغ، المساعدة، الصافي، الزيات، المنطقة، ك الزيت، المعدل، تاريخ الزيت،
 * اخذه، سالك، تاريخ الأخذ، الوقت، ملاحظات، ملاحظات2
 */
const COLUMNS = [
  { key: 'entryDate', label: 'تاريخ الدخول', w: 'w-28' },
  { key: 'ref', label: 'الرقم', w: 'w-16' },
  { key: 'name', label: 'الإسم واللقب', w: 'min-w-[9rem] w-36' },
  { key: 'phone', label: 'الهاتف', w: 'w-28' },
  { key: 'bags', label: 'الأكياس', w: 'w-14' },
  { key: 'weight', label: 'الوزن', w: 'w-16' },
  { key: 'adhlef', label: 'الشلف', w: 'w-12' },
  { key: 'capacity', label: 'السعة', w: 'w-14' },
  { key: 'amount', label: 'المبلغ', w: 'w-20' },
  { key: 'aid', label: 'المساعدة', w: 'w-18' },
  { key: 'net', label: 'الصافي', w: 'w-20' },
  { key: 'zayat', label: 'الزيات', w: 'w-20' },
  { key: 'region', label: 'المنطقة', w: 'w-20' },
  { key: 'oil', label: 'ك الزيت', w: 'w-16' },
  { key: 'yield', label: 'المعدل', w: 'w-14' },
  { key: 'oilDate', label: 'تاريخ الزيت', w: 'w-28' },
  { key: 'taken', label: 'اخذه', w: 'w-14' },
  { key: 'paid', label: 'سالك', w: 'w-14' },
  { key: 'pickup', label: 'تاريخ الأخذ', w: 'w-28' },
  { key: 'time', label: 'الوقت', w: 'w-20' },
  { key: 'notes', label: 'ملاحظات', w: 'w-32' },
  { key: 'notes2', label: 'ملاحظات2', w: 'w-32' },
] as const;

const COL_COUNT = COLUMNS.length;

function formatRowTime(row: ProcessingRow): string {
  if (row.treatmentTime?.trim()) return row.treatmentTime.trim().slice(0, 8);
  if (row.treatmentDate) {
    try {
      return formatTimeDz(row.treatmentDate);
    } catch {
      return '—';
    }
  }
  return '—';
}

export function ProcessingTable({
  rows,
  theme,
  pricePerQuintal = 0,
  selectedClientId,
  highlightClientId,
  loading,
  onSelect,
}: Props) {
  return (
    <div
      className={cn(
        'processing-table-wrap overflow-hidden rounded-2xl border shadow-inner',
        theme.border,
        'bg-[var(--app-surface)]/95',
      )}
    >
      <div className="max-h-[min(75dvh,48rem)] overflow-x-auto overflow-y-auto overscroll-contain scroll-smooth">
        <table className="w-full min-w-[1680px] border-collapse text-[13px]">
          <thead>
            <tr
              className={cn(
                'sticky top-0 z-20 border-b border-emerald-800/15 bg-gradient-to-l from-emerald-100/95 via-emerald-50/95 to-teal-50/90',
                'backdrop-blur-md dark:from-emerald-950/90 dark:via-stone-900/95 dark:to-stone-900/95 dark:border-emerald-800/40',
              )}
            >
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-2.5 py-3 text-right text-xs font-black tracking-wide text-stone-800 dark:text-stone-100',
                    col.w,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="py-24 text-center text-stone-400">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-600" />
                  جاري التحميل...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="py-24 text-center text-stone-400">
                  لا توجد سجلات
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const isSelected = selectedClientId === row.clientId;
                const isSearchMatch =
                  !!highlightClientId && highlightClientId === row.clientId;
                const displayAmount =
                  row.amount > 0
                    ? row.amount
                    : pricePerQuintal > 0
                      ? computePressingAmount(pricePerQuintal, row.totalWeightKg)
                      : null;
                const displayNet =
                  displayAmount != null
                    ? displayAmount - (row.aidAmount || 0)
                    : row.netAmount || null;

                return (
                  <tr
                    key={row.clientId}
                    id={`table-row-${row.clientId}`}
                    onClick={() => onSelect(row)}
                    className={cn(
                      'cursor-pointer border-b border-stone-200/60 transition-colors dark:border-stone-800/80',
                      orderRowClassName({
                        isCancelled: row.isCancelled || row.hasCancelled,
                        oilCollected: row.oilCollected,
                        isSelected,
                        isSearchMatch,
                        selectedClass: cn(theme.rowSelected, 'shadow-sm'),
                        alternateIndex: i,
                      }),
                    )}
                  >
                    <td className="whitespace-nowrap px-2.5 py-2 text-stone-600">
                      <span className="inline-flex items-center gap-1.5">
                        <SelectionIndicator selected={isSelected} />
                        {formatDate(row.entryDate)}
                      </span>
                    </td>
                    <td className={cn('px-2.5 py-2 font-mono text-base font-black tabular-nums', theme.accent)}>
                      {row.clientNumber || row.referenceNumber || '—'}
                      {row.entryCount > 1 && (
                        <span className="mt-0.5 block text-[10px] font-medium text-stone-500">
                          {row.entryCount} وزن
                        </span>
                      )}
                    </td>
                    <td
                      className={cn(
                        'max-w-[9rem] truncate px-2.5 py-2 font-semibold text-stone-800 dark:text-stone-100',
                        row.isCancelled && 'text-red-900/80 line-through dark:text-red-200',
                      )}
                      title={row.clientName}
                    >
                      {row.clientName || '—'}
                      {row.isNonReferential && (
                        <span className="mr-1 text-[10px] text-amber-600">*</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2 tabular-nums text-stone-500" dir="ltr">
                      {row.phone ?? '—'}
                    </td>
                    <td className="px-2.5 py-2 text-center tabular-nums">{row.bagCount}</td>
                    <td className="px-2.5 py-2 tabular-nums">{formatNumber(row.totalWeightKg)}</td>
                    <td className="px-2.5 py-2 text-center tabular-nums">{row.adhlefCount ?? '—'}</td>
                    <td className="px-2.5 py-2 tabular-nums">
                      {row.capacity != null ? formatNumber(row.capacity) : '—'}
                    </td>
                    <td className="px-2.5 py-2 tabular-nums font-medium">
                      {displayAmount == null ? (
                        '—'
                      ) : (
                        <span className={row.amount <= 0 ? 'text-stone-500 italic' : undefined}>
                          {formatNumber(displayAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-2 tabular-nums text-amber-700 dark:text-amber-400">
                      {row.aidAmount ? formatNumber(row.aidAmount) : '—'}
                    </td>
                    <td className="px-2.5 py-2 tabular-nums font-bold">
                      {displayNet ? formatNumber(displayNet) : '—'}
                    </td>
                    <td className="max-w-[5rem] truncate px-2.5 py-2 text-stone-600" title={row.zayat ?? undefined}>
                      {row.zayat ?? '—'}
                    </td>
                    <td className="max-w-[5rem] truncate px-2.5 py-2 text-stone-600" title={row.region ?? undefined}>
                      {row.region ?? '—'}
                    </td>
                    <td
                      className={cn(
                        'px-2.5 py-2 tabular-nums font-semibold',
                        row.oilQuantityL != null && row.oilQuantityL < 1 && 'text-red-600',
                      )}
                    >
                      {row.oilQuantityL != null ? formatNumber(row.oilQuantityL) : '—'}
                    </td>
                    <td className="px-2.5 py-2 tabular-nums">
                      {row.yieldPercent != null ? `${formatNumber(row.yieldPercent, 1)}%` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-stone-500">
                      {row.treatmentDate ? formatDate(row.treatmentDate) : '—'}
                    </td>
                    <td className="px-2.5 py-2 text-center">
                      <StatusBadge active={row.oilCollected} label="اخذه" variant="success" />
                    </td>
                    <td className="px-2.5 py-2 text-center">
                      <StatusBadge active={row.paid} label="سالك" variant="info" />
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-stone-500">
                      {row.pickupDate ? formatDate(row.pickupDate) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums text-stone-500" dir="ltr">
                      {formatRowTime(row)}
                    </td>
                    <td className="max-w-[8rem] truncate px-2.5 py-2 text-stone-500" title={row.notes ?? undefined}>
                      {row.notes ?? '—'}
                    </td>
                    <td className="max-w-[8rem] truncate px-2.5 py-2 text-stone-500" title={row.notes2 ?? undefined}>
                      {row.notes2 ?? '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
