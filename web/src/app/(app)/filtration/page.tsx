'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Droplets, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModulePageHero } from '@/components/ui/module-page-hero';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type FiltrationRow = {
  id: string;
  oliveType: 'GREEN' | 'ZBOUCH' | 'RIPE' | string;
  referenceNumber: number;
  zayatName: string;
  region: string;
  quantityL: string | number;
  khallaf: string | number;
  notes?: string | null;
  createdAt: string;
  createdBy?: { username: string; firstName?: string | null };
  updatedBy?: { username: string; firstName?: string | null } | null;
};

const OLIVE_OPTS = [
  { value: 'GREEN', label: '🟢 زيتون أخضر' },
  { value: 'ZBOUCH', label: '🫒 الزبوش' },
  { value: 'RIPE', label: '⚫ زيتون طايب' },
] as const;

const empty = {
  oliveType: 'GREEN' as string,
  referenceNumber: '',
  zayatName: '',
  region: '',
  quantityL: '',
  khallaf: '0',
  notes: '',
};

export default function FiltrationPage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  const role = useAuthStore((s) => s.user?.role);
  const canWrite =
    !readOnly && (role === 'ADMIN' || permissions.includes('FILTRATION_WRITE'));

  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filterType, setFilterType] = useState('GREEN');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const listQ = useQuery({
    queryKey: ['filtration', filterType, q, region, from, to],
    queryFn: async () =>
      (
        await api.get<{ items: FiltrationRow[] }>('/filtration', {
          params: {
            oliveType: filterType,
            q: q || undefined,
            region: region || undefined,
            from: from || undefined,
            to: to || undefined,
            limit: 100,
          },
        })
      ).data.items,
  });

  const nextQ = useQuery({
    queryKey: ['filtration-next', form.oliveType],
    queryFn: async () =>
      (
        await api.get<{ next: number }>('/filtration/next-reference', {
          params: { oliveType: form.oliveType },
        })
      ).data.next,
  });

  const items = listQ.data ?? [];
  const totalL = useMemo(
    () => items.reduce((s, r) => s + Number(r.quantityL), 0),
    [items],
  );

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        oliveType: form.oliveType,
        referenceNumber: form.referenceNumber ? Number(form.referenceNumber) : undefined,
        zayatName: form.zayatName.trim(),
        region: form.region.trim(),
        quantityL: Number(form.quantityL),
        khallaf: Number(form.khallaf || 0),
        notes: form.notes.trim() || undefined,
      };
      if (editId) return (await api.patch(`/filtration/${editId}`, payload)).data;
      return (await api.post('/filtration', payload)).data;
    },
    onSuccess: async () => {
      toast.success(editId ? 'تم التعديل' : 'تم التسجيل');
      setEditId(null);
      setForm({ ...empty, oliveType: form.oliveType });
      await qc.invalidateQueries({ queryKey: ['filtration'] });
      await qc.invalidateQueries({ queryKey: ['filtration-next'] });
    },
    onError: (e: { response?: { data?: { message?: string | string[] } } }) => {
      const m = e.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(' · ') : m || 'تعذر الحفظ');
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/filtration/${id}`),
    onSuccess: async () => {
      toast.success('تم الحذف');
      await qc.invalidateQueries({ queryKey: ['filtration'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.zayatName.trim() || Number(form.quantityL) <= 0) {
      toast.error('الاسم والكمية مطلوبان');
      return;
    }
    saveMut.mutate();
  }

  function startEdit(row: FiltrationRow) {
    setEditId(row.id);
    setForm({
      oliveType: row.oliveType || 'GREEN',
      referenceNumber: String(row.referenceNumber),
      zayatName: row.zayatName,
      region: row.region ?? '',
      quantityL: String(row.quantityL),
      khallaf: String(row.khallaf ?? 0),
      notes: row.notes ?? '',
    });
  }

  function startNew() {
    setEditId(null);
    setForm({
      ...empty,
      oliveType: filterType,
      referenceNumber: nextQ.data ? String(nextQ.data) : '',
    });
  }

  return (
    <div className="module-page filtration-page space-y-6 p-[var(--space-page)] md:p-[var(--space-page-lg)]">
      <ModulePageHero
        gradient="from-[var(--app-accent)] to-[var(--app-accent-dark)]"
        title="تصفية الزيت"
        subtitle={`${items.length} عملية · ${formatNumber(totalL, 1)} لتر`}
        icon={<Droplets className="h-7 w-7" />}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={onSubmit}
          className="rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{editId ? 'تعديل عملية' : 'تسجيل جديد'}</h2>
            <Button type="button" variant="outline" size="sm" onClick={startNew}>
              <Plus className="h-4 w-4" />
              جديد
            </Button>
          </div>
          <div className="space-y-3">
            <Field label="نوع الزيتون">
              <select
                className="flex h-10 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm"
                value={form.oliveType}
                onChange={(e) => setForm((f) => ({ ...f, oliveType: e.target.value }))}
              >
                {OLIVE_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الرقم">
              <Input
                value={form.referenceNumber}
                onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                inputMode="numeric"
              />
            </Field>
            <Field label="اسم ولقب الزيات">
              <Input
                value={form.zayatName}
                onChange={(e) => setForm((f) => ({ ...f, zayatName: e.target.value }))}
                required
              />
            </Field>
            <Field label="المنطقة">
              <Input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
            </Field>
            <Field label="الكمية (لتر)">
              <Input
                value={form.quantityL}
                onChange={(e) => setForm((f) => ({ ...f, quantityL: e.target.value }))}
                inputMode="decimal"
                required
              />
            </Field>
            <Field label="الخلاف">
              <Input
                value={form.khallaf}
                onChange={(e) => setForm((f) => ({ ...f, khallaf: e.target.value }))}
                inputMode="decimal"
              />
            </Field>
            <Field label="ملاحظات">
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Field>
          </div>
          {canWrite ? (
            <Button type="submit" className="mt-5 w-full" disabled={saveMut.isPending}>
              {editId ? 'حفظ التعديل' : 'تسجيل'}
            </Button>
          ) : (
            <p className="mt-4 text-center text-sm text-[var(--app-text-dim)]">قراءة فقط</p>
          )}
        </form>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-muted)] p-1">
              {OLIVE_OPTS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setFilterType(o.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-bold transition',
                    filterType === o.value
                      ? 'bg-[var(--app-surface)] text-[var(--app-accent)] shadow-sm'
                      : 'text-[var(--app-text-dim)]',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-dim)]" />
              <Input
                className="pr-9"
                placeholder="بحث بالاسم أو الرقم…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Input
              className="w-36"
              placeholder="المنطقة"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <Input
              className="w-40"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              className="w-40"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--app-bg-muted)] text-[var(--app-text-dim)]">
                <tr>
                  <th className="px-3 py-3 text-right font-bold">#</th>
                  <th className="px-3 py-3 text-right font-bold">النوع</th>
                  <th className="px-3 py-3 text-right font-bold">الزيات</th>
                  <th className="px-3 py-3 text-right font-bold">المنطقة</th>
                  <th className="px-3 py-3 text-right font-bold">لتر</th>
                  <th className="px-3 py-3 text-right font-bold">خلاف</th>
                  <th className="px-3 py-3 text-right font-bold">المستخدم</th>
                  <th className="px-3 py-3 text-right font-bold">التاريخ</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-t border-[var(--app-border)]',
                      editId === row.id && 'bg-[color-mix(in_srgb,var(--app-accent)_8%,transparent)]',
                    )}
                  >
                    <td className="px-3 py-3 font-black">{row.referenceNumber}</td>
                    <td className="px-3 py-3">
                      {OLIVE_OPTS.find((o) => o.value === row.oliveType)?.label ?? row.oliveType}
                    </td>
                    <td className="px-3 py-3 font-semibold">{row.zayatName}</td>
                    <td className="px-3 py-3">{row.region || '—'}</td>
                    <td className="px-3 py-3">{formatNumber(Number(row.quantityL), 1)}</td>
                    <td className="px-3 py-3">{formatNumber(Number(row.khallaf), 1)}</td>
                    <td className="px-3 py-3 text-[var(--app-text-dim)]">
                      {row.createdBy?.firstName || row.createdBy?.username || '—'}
                    </td>
                    <td className="px-3 py-3 text-[var(--app-text-dim)]" dir="ltr">
                      {new Date(row.createdAt).toLocaleString('ar-DZ')}
                    </td>
                    <td className="px-3 py-3">
                      {canWrite ? (
                        <div className="flex justify-start gap-1">
                          <Button type="button" size="icon" variant="ghost" onClick={() => startEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('حذف العملية؟')) deleteMut.mutate(row.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-[var(--app-text-dim)]">
                      لا توجد عمليات
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-[var(--app-text-dim)]">{label}</span>
      {children}
    </label>
  );
}
