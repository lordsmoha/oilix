'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatNumber, formatDateTimeDz, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type ContainerRow = {
  id: string;
  name: string;
  capacityL: string | number;
  unitPrice?: string | number | null;
  costPrice?: string | number | null;
  minStock: number;
  isActive: boolean;
  stock: {
    totalAdded: number;
    totalSoldEmpty: number;
    totalConsumedInOil: number;
    totalDamaged: number;
    theoreticalQty: number;
    physicalQty: number | null;
    difference: number;
    lossQty: number;
    available: number;
  };
};

type Movement = {
  id: string;
  type: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note?: string | null;
  createdAt: string;
  container?: { name: string };
  user?: { username: string; firstName?: string | null };
};

type Count = {
  id: string;
  theoreticalBefore: number;
  physicalQty: number;
  difference: number;
  lossQty: number;
  note?: string | null;
  createdAt: string;
  container?: { name: string };
  user?: { username: string; firstName?: string | null };
};

const TYPE_AR: Record<string, string> = {
  PURCHASE: 'شراء',
  STOCK_ADDITION: 'إضافة',
  OIL_SALE_CONSUMPTION: 'استهلاك بيع زيت',
  DIRECT_CONTAINER_SALE: 'بيع فارغ',
  SALE_CANCELLATION: 'إلغاء بيع',
  INVENTORY_COUNT: 'جرد',
  DAMAGE: 'تلف',
  LOSS: 'فقدان',
  ADJUSTMENT: 'تصحيح',
  MANUAL_CORRECTION: 'تصحيح يدوي',
};

export default function ContainerStockPage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const canAdd = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINER_STOCK_ADD'));
  const canAdjust = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINER_STOCK_ADJUST'));
  const canLoss = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINER_STOCK_LOSS'));
  const canInventory = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINER_STOCK_INVENTORY'));

  const [containerId, setContainerId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addNote, setAddNote] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [lossQty, setLossQty] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [lossType, setLossType] = useState<'DAMAGE' | 'LOSS'>('DAMAGE');
  const [physical, setPhysical] = useState('');
  const [countNote, setCountNote] = useState('');

  const listQ = useQuery({
    queryKey: ['oil-container-stock'],
    queryFn: async () => (await api.get<ContainerRow[]>('/oil-sales/container-stock')).data,
  });
  const movesQ = useQuery({
    queryKey: ['oil-container-movements', containerId],
    queryFn: async () =>
      (
        await api.get<{ items: Movement[] }>('/oil-sales/container-stock/movements', {
          params: { containerId: containerId || undefined, limit: 40 },
        })
      ).data.items,
  });
  const countsQ = useQuery({
    queryKey: ['oil-container-counts', containerId],
    enabled: canInventory,
    queryFn: async () =>
      (
        await api.get<Count[]>('/oil-sales/container-stock/inventory', {
          params: { containerId: containerId || undefined },
        })
      ).data,
  });

  const rows = listQ.data ?? [];
  const selected = useMemo(
    () => rows.find((r) => r.id === containerId) ?? rows[0],
    [rows, containerId],
  );
  const activeId = containerId || selected?.id || '';

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['oil-container-stock'] });
    void qc.invalidateQueries({ queryKey: ['oil-container-movements'] });
    void qc.invalidateQueries({ queryKey: ['oil-container-counts'] });
    void qc.invalidateQueries({ queryKey: ['oil-containers'] });
    void qc.invalidateQueries({ queryKey: ['oil-containers-all'] });
    void qc.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
  }

  const addMut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/container-stock/add', {
          containerId: activeId,
          quantity: Number(addQty),
          note: addNote.trim() || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success('تمت إضافة مخزون الضلف');
      setAddQty('');
      setAddNote('');
      invalidate();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الإضافة'),
  });

  const adjustMut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/container-stock/adjust', {
          containerId: activeId,
          quantity: Number(adjustQty),
          reason: adjustReason.trim(),
        })
      ).data,
    onSuccess: () => {
      toast.success('تم تصحيح المخزون');
      setAdjustQty('');
      setAdjustReason('');
      invalidate();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر التصحيح'),
  });

  const lossMut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/container-stock/loss', {
          containerId: activeId,
          quantity: Number(lossQty),
          type: lossType,
          reason: lossReason.trim(),
        })
      ).data,
    onSuccess: () => {
      toast.success('تم تسجيل التلف / الفقدان');
      setLossQty('');
      setLossReason('');
      invalidate();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر التسجيل'),
  });

  const countMut = useMutation({
    mutationFn: async () =>
      (
        await api.post('/oil-sales/container-stock/inventory', {
          containerId: activeId,
          physicalQty: Number(physical),
          note: countNote.trim() || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success('تم تسجيل جرد الضلف');
      setPhysical('');
      setCountNote('');
      invalidate();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الجرد'),
  });

  const theoretical = selected?.stock.theoreticalQty ?? 0;
  const phys = Number(physical);
  const diffPreview = Number.isFinite(phys) && phys >= 0 ? phys - theoretical : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">مخزون الضلف</h1>
        <p className="text-sm text-[var(--app-text-dim)]">وحدات مستقلة عن لترات الزيت</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => {
          const low = c.stock.available <= c.minStock;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setContainerId(c.id)}
              className={cn(
                'rounded-2xl border p-4 text-right',
                activeId === c.id ? 'border-amber-700 ring-2 ring-amber-700/30' : 'border-[var(--app-border)]',
                low && 'bg-red-50/70 dark:bg-red-950/20',
              )}
            >
              <p className="font-black">{c.name}</p>
              <p className="text-xs text-[var(--app-text-dim)]">
                {formatNumber(Number(c.capacityL), 0)} لتر · حد أدنى {c.minStock}
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums">{c.stock.available}</p>
              <p className="text-xs">قطعة متاحة</p>
              {low ? <p className="mt-1 text-xs font-bold text-red-700">مخزون منخفض</p> : null}
              <dl className="mt-3 grid grid-cols-2 gap-1 text-[11px]">
                <span>مضاف {c.stock.totalAdded}</span>
                <span>تعبئة زيت {c.stock.totalConsumedInOil}</span>
                <span>بيع فارغ {c.stock.totalSoldEmpty}</span>
                <span>تلف {c.stock.totalDamaged}</span>
                <span>نظري {c.stock.theoreticalQty}</span>
                <span>فعلي {c.stock.physicalQty ?? '—'}</span>
              </dl>
            </button>
          );
        })}
      </div>

      {selected && !readOnly ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {canAdd ? (
            <form
              className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                addMut.mutate();
              }}
            >
              <h2 className="font-black">إضافة مخزون — {selected.name}</h2>
              <Input label="الكمية (قطعة)" inputMode="numeric" value={addQty} onChange={(e) => setAddQty(e.target.value)} required />
              <Input label="مرجع / ملاحظة" value={addNote} onChange={(e) => setAddNote(e.target.value)} />
              <Button type="submit" loading={addMut.isPending} className="bg-amber-700 hover:bg-amber-800">
                تسجيل الإضافة
              </Button>
            </form>
          ) : null}

          {canInventory ? (
            <form
              className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                countMut.mutate();
              }}
            >
              <h2 className="font-black">جرد فعلي — {selected.name}</h2>
              <p className="text-sm">
                النظري: <strong>{theoretical}</strong>
                {diffPreview != null ? (
                  <>
                    {' '}
                    · الفرق: <strong>{diffPreview}</strong>
                  </>
                ) : null}
              </p>
              <Input label="الكمية الفعلية" inputMode="numeric" value={physical} onChange={(e) => setPhysical(e.target.value)} required />
              <Input label="ملاحظة" value={countNote} onChange={(e) => setCountNote(e.target.value)} />
              <Button type="submit" loading={countMut.isPending} className="bg-amber-700 hover:bg-amber-800">
                حفظ الجرد
              </Button>
            </form>
          ) : null}

          {canLoss ? (
            <form
              className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                lossMut.mutate();
              }}
            >
              <h2 className="font-black">تلف / فقدان</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn('rounded-xl border px-3 py-2 text-sm font-bold', lossType === 'DAMAGE' && 'border-amber-700')}
                  onClick={() => setLossType('DAMAGE')}
                >
                  تلف
                </button>
                <button
                  type="button"
                  className={cn('rounded-xl border px-3 py-2 text-sm font-bold', lossType === 'LOSS' && 'border-amber-700')}
                  onClick={() => setLossType('LOSS')}
                >
                  فقدان
                </button>
              </div>
              <Input label="الكمية" inputMode="numeric" value={lossQty} onChange={(e) => setLossQty(e.target.value)} required />
              <Input label="السبب" value={lossReason} onChange={(e) => setLossReason(e.target.value)} required />
              <Button type="submit" loading={lossMut.isPending} variant="danger">
                تسجيل
              </Button>
            </form>
          ) : null}

          {canAdjust ? (
            <form
              className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                adjustMut.mutate();
              }}
            >
              <h2 className="font-black">تصحيح يدوي</h2>
              <Input
                label="الكمية الموقّعة (+ إضافة / − خصم)"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
              />
              <Input label="السبب" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} required />
              <Button type="submit" loading={adjustMut.isPending} variant="outline">
                تطبيق التصحيح
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <h2 className="mb-3 font-black">الحركات</h2>
        <ul className="divide-y divide-[var(--app-border)] text-sm">
          {(movesQ.data ?? []).map((m) => (
            <li key={m.id} className="flex justify-between gap-3 py-2">
              <div>
                <p className="font-bold">
                  {TYPE_AR[m.type] || m.type} · {m.container?.name}
                </p>
                <p className="text-xs text-[var(--app-text-dim)]">
                  {formatDateTimeDz(m.createdAt)} · {m.user?.firstName || m.user?.username} · {m.note || ''}
                </p>
              </div>
              <span className="font-black tabular-nums">
                {m.quantity > 0 ? '+' : ''}
                {m.quantity} → {m.stockAfter}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {canInventory ? (
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <h2 className="mb-3 font-black">سجل الجرد</h2>
          <ul className="divide-y divide-[var(--app-border)] text-sm">
            {(countsQ.data ?? []).map((c) => (
              <li key={c.id} className="flex justify-between py-2">
                <div>
                  <p className="font-bold">{c.container?.name}</p>
                  <p className="text-xs text-[var(--app-text-dim)]">{formatDateTimeDz(c.createdAt)}</p>
                </div>
                <span>
                  نظري {c.theoreticalBefore} · فعلي {c.physicalQty} · فرق {c.difference}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
