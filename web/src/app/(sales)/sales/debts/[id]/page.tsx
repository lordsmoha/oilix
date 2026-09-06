'use client';

import Link from 'next/link';
import { FormEvent, use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatNumber, formatMoney, formatDateTimeDz } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type Detail = {
  customer: { id: string; name: string; phone?: string | null; address?: string | null };
  summary: {
    totalPurchases: number;
    totalPaidOnSales: number;
    debt: number;
    unpaidSalesCount: number;
  };
  outstandingSales: Array<{
    id: string;
    receiptNumber: number;
    finalAmount: string | number;
    amountPaid: string | number;
    remainingAmount: string | number;
    paymentStatus: string;
    saleDate: string;
  }>;
  payments: Array<{
    id: string;
    receiptNumber: number;
    amount: string | number;
    createdAt: string;
    cashRegisterName?: string | null;
    user?: { username: string; firstName?: string | null };
  }>;
  ledger: Array<{
    id: string;
    type: string;
    debit: string | number;
    credit: string | number;
    balanceAfter: string | number;
    reference?: string | null;
    createdAt: string;
  }>;
};

export default function DebtorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const canPay = useAuthStore((s) => s.hasPermission('OIL_SALES_DEBTS_RECORD_PAYMENT'));
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saleId, setSaleId] = useState('');

  const q = useQuery({
    queryKey: ['oil-debt-customer', id],
    queryFn: async () => (await api.get<Detail>(`/oil-sales/debts/customers/${id}`)).data,
  });

  const payMut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/debts/payments', {
          customerId: id,
          amount: Number(amount),
          saleId: saleId || undefined,
          notes: notes.trim() || undefined,
        })
      ).data as { id: string; remainingDebt: number; previousDebt: number; receiptNumber: number },
    onSuccess: (r) => {
      toast.success(
        `تم التسديد — المتبقي ${formatMoney(r.remainingDebt)} د.ج (كان ${formatMoney(r.previousDebt)})`,
      );
      setAmount('');
      setNotes('');
      setSaleId('');
      void qc.invalidateQueries({ queryKey: ['oil-debt-customer', id] });
      void qc.invalidateQueries({ queryKey: ['oil-debts'] });
      void qc.invalidateQueries({ queryKey: ['oil-debts-summary'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-list'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
      if (r.id) window.open(`/oil-debt-payment/${r.id}?print=1`, '_blank', 'noopener');
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر التسديد'),
  });

  if (q.isLoading) return <p className="text-sm text-[var(--app-text-dim)]">جاري التحميل...</p>;
  if (!q.data) {
    return (
      <div className="p-8 text-center">
        <p className="font-bold">الزبون غير موجود</p>
        <Link href="/sales/debts" className="mt-2 inline-block underline">
          العودة
        </Link>
      </div>
    );
  }

  const d = q.data;

  function onPay(e: FormEvent) {
    e.preventDefault();
    payMut.mutate();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link href="/sales/debts" className="text-sm text-amber-800 underline">
          الديون
        </Link>
        <h1 className="text-2xl font-black">{d.customer.name}</h1>
        <p className="text-sm text-[var(--app-text-dim)]">
          {[d.customer.phone, d.customer.address].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="الدين الحالي" value={`${formatMoney(d.summary.debt)} د.ج`} warn />
        <Stat label="إجمالي المشتريات" value={`${formatMoney(d.summary.totalPurchases)} د.ج`} />
        <Stat label="المدفوع على الفواتير" value={`${formatMoney(d.summary.totalPaidOnSales)} د.ج`} />
        <Stat label="فواتير غير مسددة" value={String(d.summary.unpaidSalesCount)} />
      </div>

      {canPay && !readOnly && d.summary.debt > 0 ? (
        <form
          onSubmit={onPay}
          className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
        >
          <h2 className="font-black">تسجيل تسديد</h2>
          <p className="text-xs text-[var(--app-text-dim)]">
            التوزيع الافتراضي: أقدم دين أولاً (FIFO). يمكن تخصيص فاتورة اختيارياً.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="المبلغ"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                فاتورة محددة (اختياري)
              </span>
              <select
                className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2.5"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
              >
                <option value="">توزيع تلقائي (FIFO)</option>
                {d.outstandingSales.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.receiptNumber} — متبقي {formatMoney(Number(s.remainingAmount))}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Input label="ملاحظة" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount(String(d.summary.debt))}
            >
              تسديد كامل الدين
            </Button>
            <Button type="submit" loading={payMut.isPending} className="bg-amber-700 hover:bg-amber-800">
              تأكيد التسديد
            </Button>
          </div>
        </form>
      ) : null}

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">الفواتير غير المسددة</h2>
        <ul className="divide-y divide-[var(--app-border)] text-sm">
          {d.outstandingSales.map((s) => (
            <li key={s.id} className="flex justify-between gap-2 py-2">
              <div>
                <Link href={`/sales/history/${s.id}`} className="font-bold underline">
                  وصل #{s.receiptNumber}
                </Link>
                <p className="text-xs text-[var(--app-text-dim)]">{formatDateTimeDz(s.saleDate)}</p>
              </div>
              <div className="text-left text-xs">
                <p>صافي {formatMoney(Number(s.finalAmount))}</p>
                <p>مدفوع {formatMoney(Number(s.amountPaid))}</p>
                <p className="font-black text-amber-800">
                  متبقي {formatMoney(Number(s.remainingAmount))}
                </p>
              </div>
            </li>
          ))}
          {d.outstandingSales.length === 0 ? (
            <li className="py-3 text-[var(--app-text-dim)]">لا فواتير مفتوحة</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">دفتر الزبون</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-[var(--app-text-dim)]">
              <tr>
                <th className="px-2 py-1 text-right">التاريخ</th>
                <th className="px-2 py-1 text-right">العملية</th>
                <th className="px-2 py-1 text-right">مدين</th>
                <th className="px-2 py-1 text-right">دائن</th>
                <th className="px-2 py-1 text-right">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {d.ledger.map((e) => (
                <tr key={e.id} className="border-t border-[var(--app-border)]">
                  <td className="px-2 py-1 text-xs">{formatDateTimeDz(e.createdAt)}</td>
                  <td className="px-2 py-1 text-xs">
                    {ledgerLabel(e.type)} {e.reference || ''}
                  </td>
                  <td className="px-2 py-1 tabular-nums">{formatMoney(Number(e.debit))}</td>
                  <td className="px-2 py-1 tabular-nums">{formatMoney(Number(e.credit))}</td>
                  <td className="px-2 py-1 font-bold tabular-nums">
                    {formatMoney(Number(e.balanceAfter))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--app-border)] p-3">
      <p className="text-xs text-[var(--app-text-dim)]">{label}</p>
      <p className={`mt-1 font-black tabular-nums ${warn ? 'text-amber-800' : ''}`}>{value}</p>
    </div>
  );
}

function ledgerLabel(t: string) {
  const map: Record<string, string> = {
    SALE_DEBT: 'بيع',
    PAYMENT: 'تسديد',
    REFUND: 'استرجاع',
    SALE_CANCELLATION: 'إلغاء بيع',
    DEBT_ADJUSTMENT: 'تسوية',
  };
  return map[t] || t;
}
