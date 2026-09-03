'use client';

import { X } from 'lucide-react';
import { computePressingAmount } from '@/lib/order-row-status';
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FormState = {
  oilQuantityL: string;
  aidAmount: string;
  region: string;
  zayat: string;
  yieldPercent: string;
  notes: string;
};

type Props = {
  open: boolean;
  referenceNumber: number;
  clientName: string;
  isEdit: boolean;
  form: FormState;
  totalWeightKg: number;
  pricePerQuintal: number;
  loading: boolean;
  readOnly?: boolean;
  accentGradient: string;
  onClose: () => void;
  onChange: (form: FormState) => void;
  onSave: () => void;
};

export function ProcessingEditModal({
  open,
  referenceNumber,
  clientName,
  isEdit,
  form,
  totalWeightKg,
  pricePerQuintal,
  loading,
  readOnly = false,
  accentGradient,
  onClose,
  onChange,
  onSave,
}: Props) {
  if (!open) return null;

  const amount = computePressingAmount(pricePerQuintal, totalWeightKg);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:bg-stone-900"
        role="dialog"
      >
        <div className={`bg-gradient-to-l px-6 py-5 text-white ${accentGradient}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm opacity-90">{isEdit ? 'تعديل العصر' : 'تسجيل العصر'}</p>
              <h2 className="text-xl font-bold">
                #{referenceNumber} — {clientName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/20 p-2 transition hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <fieldset disabled={readOnly} className="grid gap-4 p-6 sm:grid-cols-2 disabled:opacity-60">
          <Input
            label="كمية الزيت (لتر)"
            type="number"
            step="0.01"
            value={form.oilQuantityL}
            onChange={(e) => onChange({ ...form, oilQuantityL: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              المبلغ (دج) — تلقائي
            </label>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-sm font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {formatNumber(amount)}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {formatNumber(pricePerQuintal)} دج/ق · {formatNumber(totalWeightKg / 100, 2)} ق (
              {formatNumber(totalWeightKg)} كغ)
            </p>
          </div>
          <Input
            label="المساعدة (دج)"
            type="number"
            value={form.aidAmount}
            onChange={(e) => onChange({ ...form, aidAmount: e.target.value })}
          />
          <Input
            label="الريات %"
            type="number"
            value={form.yieldPercent}
            onChange={(e) => onChange({ ...form, yieldPercent: e.target.value })}
          />
          <Input
            label="المنطقة"
            value={form.region}
            onChange={(e) => onChange({ ...form, region: e.target.value })}
          />
          <Input
            label="الزيات"
            value={form.zayat}
            onChange={(e) => onChange({ ...form, zayat: e.target.value })}
          />
          <Input
            label="ملاحظات"
            className="sm:col-span-2"
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
          />
        </fieldset>

        <div className="flex gap-3 border-t border-stone-100 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/50">
          {!readOnly ? (
          <Button className={`flex-1 text-white ${accentGradient}`} loading={loading} onClick={onSave}>
            حفظ
          </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}
