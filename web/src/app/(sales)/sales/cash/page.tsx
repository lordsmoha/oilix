'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatNumber, formatDateTimeDz } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';

type Session = {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string | null;
  openingCash: number;
  cashSales: number;
  cashRefunds: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  physicalCash?: number | null;
  difference?: number | null;
  variance?: 'BALANCED' | 'SURPLUS' | 'SHORTAGE' | null;
  openingNote?: string | null;
  closingNote?: string | null;
  cashRegister: { code: string; name: string };
  device: { code: string | null; name: string };
  openedBy?: { firstName?: string | null; username: string };
};

type Current = {
  device: { code: string | null; name: string; status: string } | null;
  register: { id: string; code: string; name: string } | null;
  session: Session | null;
};

const VAR_AR = {
  BALANCED: 'متوازن',
  SURPLUS: 'فائض',
  SHORTAGE: 'عجز',
};

export default function CashRegisterPage() {
  const qc = useQueryClient();
  const canOpen = useAuthStore((s) => s.hasPermission('OIL_SALES_CASH_REGISTER_OPEN'));
  const canClose = useAuthStore((s) => s.hasPermission('OIL_SALES_CASH_REGISTER_CLOSE'));
  const canAll = useAuthStore((s) => s.hasPermission('OIL_SALES_CASH_REGISTER_VIEW_ALL'));
  const [opening, setOpening] = useState('0');
  const [openNote, setOpenNote] = useState('');
  const [physical, setPhysical] = useState('');
  const [closeNote, setCloseNote] = useState('');

  const currentQ = useQuery({
    queryKey: ['oil-sales-cash-current'],
    queryFn: async () => (await api.get<Current>('/oil-sales/cash/current')).data,
    refetchInterval: 15_000,
  });

  const sessionsQ = useQuery({
    queryKey: ['oil-sales-cash-sessions'],
    queryFn: async () => (await api.get<Session[]>('/oil-sales/cash/sessions')).data,
  });

  const openMut = useMutation({
    mutationFn: async () =>
      (await api.post('/oil-sales/cash/open', { openingCash: Number(opening), note: openNote || undefined })).data,
    onSuccess: () => {
      toast.success('تم فتح الصندوق');
      void qc.invalidateQueries({ queryKey: ['oil-sales-cash'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-cash-current'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-cash-sessions'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر فتح الصندوق'),
  });

  const closeMut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/cash/close', {
          physicalCash: Number(physical),
          note: closeNote || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success('تم إغلاق الصندوق');
      setPhysical('');
      void qc.invalidateQueries({ queryKey: ['oil-sales-cash'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-cash-current'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-cash-sessions'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر إغلاق الصندوق'),
  });

  const cur = currentQ.data;
  const session = cur?.session;

  function onOpen(e: FormEvent) {
    e.preventDefault();
    openMut.mutate();
  }
  function onClose(e: FormEvent) {
    e.preventDefault();
    closeMut.mutate();
  }

  const expectedPreview = session
    ? session.openingCash + session.cashSales + session.cashIn - session.cashRefunds - session.cashOut
    : 0;
  const diffPreview = physical !== '' ? Number(physical) - expectedPreview : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-bold text-amber-800 dark:text-amber-400">بيع الزيت</p>
        <h1 className="text-2xl font-black">الصندوق</h1>
        <p className="mt-1 text-sm text-[var(--app-text-dim)]">
          {cur?.register ? `${cur.register.code} · ${cur.register.name}` : 'لا صندوق مربوط بهذا الجهاز'}
          {cur?.device?.code ? ` · ${cur.device.code}` : ''}
        </p>
      </div>

      {session?.status === 'OPEN' ? (
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <h2 className="font-black">جلسة مفتوحة</h2>
          <p className="mt-1 text-xs text-[var(--app-text-dim)]">
            فتح {formatDateTimeDz(session.openedAt)} · {session.openedBy?.firstName || session.openedBy?.username}
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <Row label="افتتاح" value={session.openingCash} />
            <Row label="مبيعات نقدية" value={session.cashSales} />
            <Row label="مرتجعات" value={session.cashRefunds} />
            <Row label="دخل إضافي" value={session.cashIn} />
            <Row label="خرج" value={session.cashOut} />
            <Row label="المتوقع" value={expectedPreview} emphasize />
          </dl>
          {canClose ? (
            <form onSubmit={onClose} className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                label="الجرد الفعلي"
                type="number"
                min={0}
                step="0.01"
                value={physical}
                onChange={(e) => setPhysical(e.target.value)}
                required
              />
              <Input label="ملاحظة الإغلاق" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
              {diffPreview != null ? (
                <p className="sm:col-span-2 text-sm font-bold">
                  الفرق: {formatNumber(diffPreview, 0)} د.ج
                  {diffPreview === 0 ? ' (متوازن)' : diffPreview > 0 ? ' (فائض)' : ' (عجز)'}
                </p>
              ) : null}
              <Button type="submit" disabled={closeMut.isPending}>
                إغلاق الصندوق
              </Button>
            </form>
          ) : null}
        </section>
      ) : canOpen ? (
        <form
          onSubmit={onOpen}
          className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
        >
          <h2 className="font-black">فتح الصندوق</h2>
          <Input
            label="النقد الافتتاحي"
            type="number"
            min={0}
            step="0.01"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            required
          />
          <Input label="ملاحظة" value={openNote} onChange={(e) => setOpenNote(e.target.value)} />
          <Button type="submit" disabled={openMut.isPending}>
            فتح
          </Button>
        </form>
      ) : (
        <p className="text-sm text-[var(--app-text-dim)]">لا توجد جلسة مفتوحة.</p>
      )}

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">{canAll ? 'كل الجلسات' : 'جلسات هذا الصندوق'}</h2>
        <ul className="divide-y divide-[var(--app-border)] text-sm">
          {(sessionsQ.data ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                <span className="font-bold">{s.cashRegister.name}</span>
                {' · '}
                {s.device.code || s.device.name}
                {' · '}
                {s.status === 'OPEN' ? 'مفتوح' : 'مغلق'}
              </span>
              <span>
                مبيعات {formatNumber(s.cashSales, 0)} د.ج
                {s.difference != null
                  ? ` · فرق ${formatNumber(s.difference, 0)} ${s.variance ? VAR_AR[s.variance] : ''}`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--app-text-dim)]">{label}</dt>
      <dd className={emphasize ? 'font-black tabular-nums' : 'tabular-nums font-semibold'}>
        {formatNumber(value, 0)} د.ج
      </dd>
    </div>
  );
}
