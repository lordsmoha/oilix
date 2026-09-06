'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatNumber, formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  wilaya?: string | null;
  commune?: string | null;
  address?: string | null;
  notes?: string | null;
  debt?: number;
  unpaidSalesCount?: number;
  _count?: { sales: number };
};

export default function SalesCustomersPage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const canCreate = useAuthStore((s) => s.hasPermission('OIL_SALES_CUSTOMERS_CREATE'));
  const canEdit = useAuthStore((s) => s.hasPermission('OIL_SALES_CUSTOMERS_EDIT'));
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    wilaya: '',
    commune: '',
    notes: '',
  });

  const listQ = useQuery({
    queryKey: ['oil-sales-customers', q],
    queryFn: async () =>
      (
        await api.get<{ items: Customer[] }>('/oil-sales/customers', {
          params: { q: q || undefined, limit: 100 },
        })
      ).data.items,
  });

  const detailQ = useQuery({
    queryKey: ['oil-sales-customer', selectedId],
    enabled: !!selectedId,
    queryFn: async () =>
      (
        await api.get<{
          customer: Customer;
          totals: {
            litres: number;
            net: number;
            count: number;
            assistance: number;
            paid?: number;
            debt?: number;
            unpaidSalesCount?: number;
          };
        }>(`/oil-sales/customers/${selectedId}`)
      ).data,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        wilaya: form.wilaya.trim() || undefined,
        commune: form.commune.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (selectedId) {
        return (await api.patch(`/oil-sales/customers/${selectedId}`, payload)).data;
      }
      return (await api.post('/oil-sales/customers', payload)).data;
    },
    onSuccess: (c: Customer) => {
      toast.success('تم الحفظ');
      setSelectedId(c.id);
      void qc.invalidateQueries({ queryKey: ['oil-sales-customers'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-customer', c.id] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الحفظ'),
  });

  function loadCustomer(c: Customer) {
    setSelectedId(c.id);
    setForm({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      wilaya: c.wilaya || '',
      commune: c.commune || '',
      notes: c.notes || '',
    });
  }

  function resetForm() {
    setSelectedId(null);
    setForm({ name: '', phone: '', address: '', wilaya: '', commune: '', notes: '' });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMut.mutate();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h1 className="text-2xl font-black">زبائن بيع الزيت</h1>
        <Input
          label="بحث"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="اسم أو هاتف…"
        />
        <ul className="max-h-[60vh] overflow-y-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          {(listQ.data ?? []).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => loadCustomer(c)}
                className="flex w-full items-center justify-between border-b border-[var(--app-border)] px-4 py-3 text-right hover:bg-[var(--app-bg-muted)]"
              >
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-[var(--app-text-dim)]">{c.phone || '—'}</p>
                  {(c.debt ?? 0) > 0 ? (
                    <p className="mt-0.5 text-xs font-bold text-amber-800">
                      دين {formatMoney(c.debt!)} د.ج
                    </p>
                  ) : null}
                </div>
                <div className="text-left">
                  {(c.debt ?? 0) > 0 ? (
                    <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      مدين
                    </span>
                  ) : null}
                  <p className="text-xs font-bold text-[var(--app-text-muted)]">
                    {c._count?.sales ?? 0} بيع
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        {((!selectedId && canCreate) || (selectedId && canEdit)) && !readOnly ? (
          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-black">{selectedId ? 'تعديل زبون' : 'زبون جديد'}</h2>
              {selectedId && canCreate ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  جديد
                </Button>
              ) : null}
            </div>
            <Input
              label="الاسم *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="الهاتف"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="العنوان"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="الولاية"
                value={form.wilaya}
                onChange={(e) => setForm((f) => ({ ...f, wilaya: e.target.value }))}
              />
              <Input
                label="البلدية"
                value={form.commune}
                onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))}
              />
            </div>
            <Input
              label="ملاحظات"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <Button type="submit" loading={saveMut.isPending} className="bg-amber-700 hover:bg-amber-800">
              حفظ
            </Button>
          </form>
        ) : null}

        {detailQ.data ? (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <h3 className="font-black">ملخص المشتريات</h3>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-[var(--app-text-dim)]">عدد البيوع</dt>
                <dd className="font-black">{detailQ.data.totals.count}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-dim)]">اللترات</dt>
                <dd className="font-black">{formatNumber(detailQ.data.totals.litres, 1)}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-dim)]">المساعدات</dt>
                <dd className="font-black">{formatMoney(detailQ.data.totals.assistance)} د.ج</dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-dim)]">الصافي</dt>
                <dd className="font-black">{formatMoney(detailQ.data.totals.net)} د.ج</dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-dim)]">المدفوع</dt>
                <dd className="font-black">
                  {formatMoney(detailQ.data.totals.paid ?? detailQ.data.totals.net)} د.ج
                </dd>
              </div>
              <div>
                <dt className="text-[var(--app-text-dim)]">الدين الحالي</dt>
                <dd
                  className={`font-black ${(detailQ.data.totals.debt ?? 0) > 0 ? 'text-amber-800' : ''}`}
                >
                  {formatMoney(detailQ.data.totals.debt ?? 0)} د.ج
                </dd>
              </div>
            </dl>
            {(detailQ.data.totals.debt ?? 0) > 0 ? (
              <a
                href={`/sales/debts/${detailQ.data.customer.id}`}
                className="mt-3 inline-block text-sm font-bold text-amber-800 underline"
              >
                فتح حساب الدين
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
