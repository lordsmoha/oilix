'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatNumber, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';

type Container = {
  id: string;
  name: string;
  capacityL: string | number;
  isActive: boolean;
  unitPrice?: string | number | null;
  costPrice?: string | number | null;
  sku?: string | null;
  minStock: number;
  sortOrder: number;
  notes?: string | null;
  stock?: {
    available: number;
    theoreticalQty: number;
    totalAdded: number;
    totalSoldEmpty: number;
    totalConsumedInOil: number;
    totalDamaged: number;
    physicalQty: number | null;
    lossQty: number;
  };
};

const emptyForm = {
  name: '',
  capacityL: '',
  unitPrice: '',
  costPrice: '',
  minStock: '0',
  sortOrder: '0',
  notes: '',
  isActive: true,
};

export default function SalesContainersPage() {
  const qc = useQueryClient();
  const canCreate = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINERS_CREATE'));
  const canEdit = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINERS_EDIT'));
  const canDelete = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINERS_DELETE'));
  const [editId, setEditId] = useState<string | null>(null);
  const [editSku, setEditSku] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const listQ = useQuery({
    queryKey: ['oil-containers-all'],
    queryFn: async () => (await api.get<Container[]>('/oil-sales/containers', { params: { all: '1' } })).data,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        capacityL: Number(form.capacityL),
        unitPrice: form.unitPrice === '' ? undefined : Number(form.unitPrice),
        costPrice: form.costPrice === '' ? undefined : Number(form.costPrice),
        minStock: Number(form.minStock || 0),
        sortOrder: Number(form.sortOrder || 0),
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      };
      if (editId) return (await api.patch(`/oil-sales/containers/${editId}`, payload)).data;
      return (await api.post('/oil-sales/containers', payload)).data;
    },
    onSuccess: () => {
      toast.success('تم حفظ التعبئة');
      setEditId(null);
      setEditSku(null);
      setForm(emptyForm);
      void qc.invalidateQueries({ queryKey: ['oil-containers-all'] });
      void qc.invalidateQueries({ queryKey: ['oil-containers'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الحفظ'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/oil-sales/containers/${id}`)).data,
    onSuccess: () => {
      toast.success('تم تعطيل / حذف التعبئة');
      void qc.invalidateQueries({ queryKey: ['oil-containers-all'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'لا يمكن الحذف — عطّل التعبئة إن كانت مستخدمة'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMut.mutate();
  }

  const showForm = (!editId && canCreate) || (editId && canEdit);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-black">التعبئة / الضلف</h1>
        <p className="text-sm text-[var(--app-text-dim)]">Conditionnements · Contenants</p>
      </div>

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {editId ? (
            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-muted)] px-3 py-2 sm:col-span-2 lg:col-span-1">
              <p className="text-xs text-[var(--app-text-dim)]">المرجع / SKU</p>
              <p className="font-mono text-sm font-bold tabular-nums">{editSku || '—'}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--app-border)] px-3 py-2 sm:col-span-2 lg:col-span-1">
              <p className="text-xs text-[var(--app-text-dim)]">المرجع / SKU</p>
              <p className="text-sm font-bold text-[var(--app-text-dim)]">يُنشأ تلقائياً عند الحفظ</p>
            </div>
          )}
          <Input
            label="الاسم"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="السعة (لتر)"
            inputMode="decimal"
            value={form.capacityL}
            onChange={(e) => setForm((f) => ({ ...f, capacityL: e.target.value }))}
            required
          />
          <Input
            label="سعر البيع"
            inputMode="decimal"
            value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
          />
          <Input
            label="سعر التكلفة"
            inputMode="decimal"
            value={form.costPrice}
            onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
          />
          <Input
            label="الحد الأدنى للمخزون"
            inputMode="numeric"
            value={form.minStock}
            onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
          />
          <Input
            label="الترتيب"
            inputMode="numeric"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
          <Input
            label="ملاحظات"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              نشط
            </label>
            <Button type="submit" loading={saveMut.isPending} className="bg-amber-700 hover:bg-amber-800">
              {editId ? 'تحديث' : 'إضافة'}
            </Button>
            {editId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditId(null);
                  setEditSku(null);
                  setForm(emptyForm);
                }}
              >
                إلغاء
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--app-bg-muted)]">
            <tr>
              <th className="px-3 py-2.5 text-right font-bold">SKU</th>
              <th className="px-3 py-2.5 text-right font-bold">التعبئة</th>
              <th className="px-3 py-2.5 text-right font-bold">السعة</th>
              <th className="px-3 py-2.5 text-right font-bold">سعر البيع</th>
              <th className="px-3 py-2.5 text-right font-bold">التكلفة</th>
              <th className="px-3 py-2.5 text-right font-bold">المخزون</th>
              <th className="px-3 py-2.5 text-right font-bold">الحد الأدنى</th>
              <th className="px-3 py-2.5 text-right font-bold">الحالة</th>
              <th className="px-3 py-2.5 text-right font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((c) => (
              <tr key={c.id} className="border-t border-[var(--app-border)]">
                <td className="px-3 py-2 font-mono text-xs tabular-nums">{c.sku || '—'}</td>
                <td className="px-3 py-2 font-bold">{c.name}</td>
                <td className="px-3 py-2 tabular-nums">{formatNumber(Number(c.capacityL), 0)} لتر</td>
                <td className="px-3 py-2 tabular-nums">
                  {c.unitPrice == null ? '—' : `${formatNumber(Number(c.unitPrice), 0)} د.ج`}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {c.costPrice == null ? '—' : `${formatNumber(Number(c.costPrice), 0)} د.ج`}
                </td>
                <td className="px-3 py-2 tabular-nums font-black">{c.stock?.available ?? 0}</td>
                <td className="px-3 py-2 tabular-nums">{c.minStock}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-bold',
                      c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600',
                    )}
                  >
                    {c.isActive ? 'نشط' : 'معطّل'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(c.id);
                          setEditSku(c.sku ?? null);
                          setForm({
                            name: c.name,
                            capacityL: String(c.capacityL),
                            unitPrice: c.unitPrice == null ? '' : String(c.unitPrice),
                            costPrice: c.costPrice == null ? '' : String(c.costPrice),
                            minStock: String(c.minStock ?? 0),
                            sortOrder: String(c.sortOrder ?? 0),
                            notes: c.notes ?? '',
                            isActive: c.isActive,
                          });
                        }}
                      >
                        تعديل
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm('حذف أو تعطيل هذه التعبئة؟')) deleteMut.mutate(c.id);
                        }}
                      >
                        حذف
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
