'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Printer, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { OIL_SOURCES, OIL_TYPES, oilMeta, oilSourceMeta, type OilSourceValue, type OilTypeValue } from '@/lib/sales-nav';
import { previewSaleFromLines, type DraftSaleLine } from '@/lib/sales-math';
import { formatNumber, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { openOilSaleReceipt } from '@/lib/oil-sale-receipt';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type Customer = { id: string; name: string; phone?: string | null };
type StockRow = { oilSource: OilSourceValue; oilType: OilTypeValue; theoreticalQty: number; physicalQty: number | null };
type Settings = { priceGreen: number; priceTaieb: number; priceDrou: number; priceZebbouche: number };
type Container = {
  id: string;
  name: string;
  capacityL: string | number;
  isActive: boolean;
  unitPrice?: string | number | null;
  stock?: { available: number; theoreticalQty: number; minStock?: number };
};

export default function NewSalePage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const canWrite = useAuthStore((s) => s.hasPermission('OIL_SALES_SALES_CREATE'));
  const canSellContainers = useAuthStore((s) => s.hasPermission('OIL_SALES_CONTAINERS_SELL'));
  const canPrint = useAuthStore((s) => s.hasPermission('OIL_SALES_PRINT_RECEIPT'));
  const canOverride = useAuthStore((s) => s.hasPermission('OIL_SALES_STOCK_OVERRIDE'));
  const canOverrideContainers = useAuthStore((s) =>
    s.hasPermission('OIL_SALES_CONTAINER_STOCK_OVERRIDE'),
  );
  const canCustomer = useAuthStore((s) => s.hasPermission('OIL_SALES_CUSTOMERS_CREATE'));
  const canChangePrice = useAuthStore((s) => s.hasPermission('OIL_SALES_SALES_CHANGE_PRICE'));
  const canChangeContainerPrice = useAuthStore((s) =>
    s.hasPermission('OIL_SALES_CONTAINERS_CHANGE_PRICE'),
  );
  const canAssistFixed = useAuthStore((s) => s.hasPermission('OIL_SALES_ASSISTANCE_FIXED'));
  const canAssistPerLitre = useAuthStore((s) =>
    s.hasPermission('OIL_SALES_ASSISTANCE_PER_LITRE'),
  );

  const [oilSource, setOilSource] = useState<OilSourceValue>('STORED');
  const [oilType, setOilType] = useState<OilTypeValue>('GREEN');
  const [customerId, setCustomerId] = useState('');
  const [customerQ, setCustomerQ] = useState('');
  const [method, setMethod] = useState<'CONTAINER' | 'LOOSE' | 'CONTAINER_ONLY'>(
    canWrite ? 'CONTAINER' : 'CONTAINER_ONLY',
  );
  const [containerId, setContainerId] = useState('');
  const [containerCount, setContainerCount] = useState('1');
  const [looseQty, setLooseQty] = useState('');
  const [lines, setLines] = useState<Array<DraftSaleLine & { key: string; oilSource?: OilSourceValue; oilType?: OilTypeValue }>>([]);
  const [unitPrice, setUnitPrice] = useState('');
  const [containerSellPrice, setContainerSellPrice] = useState('');
  const [assistanceFixed, setAssistanceFixed] = useState('0');
  const [assistancePerLitre, setAssistancePerLitre] = useState('0');
  const [notes, setNotes] = useState('');
  const [overrideStock, setOverrideStock] = useState(false);
  const [overrideContainerStock, setOverrideContainerStock] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const uid = useId();

  const settingsQ = useQuery({
    queryKey: ['oil-sales-settings'],
    queryFn: async () => (await api.get<Settings>('/oil-sales/settings')).data,
  });

  const stockQ = useQuery({
    queryKey: ['oil-sales-stock'],
    queryFn: async () => (await api.get<StockRow[]>('/oil-sales/stock')).data,
  });

  const containersQ = useQuery({
    queryKey: ['oil-containers'],
    queryFn: async () => (await api.get<Container[]>('/oil-sales/containers')).data,
  });

  const customersQ = useQuery({
    queryKey: ['oil-sales-customers', customerQ],
    queryFn: async () =>
      (
        await api.get<{ items: Customer[] }>('/oil-sales/customers', {
          params: { q: customerQ || undefined, limit: 40 },
        })
      ).data.items,
  });

  const cashQ = useQuery({
    queryKey: ['oil-sales-cash-current'],
    queryFn: async () =>
      (
        await api.get<{
          register: { name: string; code: string } | null;
          session: { status: string } | null;
        }>('/oil-sales/cash/current')
      ).data,
  });

  const stock = stockQ.data?.find((s) => s.oilSource === oilSource && s.oilType === oilType);
  const sourceMeta = oilSourceMeta(oilSource);
  const meta = oilMeta(oilType);
  const containers = containersQ.data ?? [];

  useEffect(() => {
    if (!settingsQ.data) return;
    const prices: Record<OilTypeValue, number> = {
      GREEN: settingsQ.data.priceGreen,
      TAIEB: settingsQ.data.priceTaieb,
      DROU: settingsQ.data.priceDrou,
      ZEBBOUCHE: settingsQ.data.priceZebbouche,
    };
    setUnitPrice(String(prices[oilType]));
  }, [settingsQ.data, oilType]);

  useEffect(() => {
    if (!containerId && containers[0]) setContainerId(containers[0].id);
  }, [containers, containerId]);

  useEffect(() => {
    const c = containers.find((x) => x.id === containerId);
    if (c?.unitPrice != null) setContainerSellPrice(String(c.unitPrice));
  }, [containerId, containers]);

  const price = Number(unitPrice);
  const emptyPrice = Number(containerSellPrice);
  const pricedLines = lines.map((l) => {
    if (l.kind === 'CONTAINER_ONLY') {
      return {
        ...l,
        unitPrice: canChangeContainerPrice ? emptyPrice || l.unitPrice : l.unitPrice,
        containerPrice: canChangeContainerPrice ? emptyPrice || l.containerPrice : l.containerPrice,
      };
    }
    return { ...l, unitPrice: canChangePrice ? price : l.unitPrice || price };
  });
  const preview = previewSaleFromLines(pricedLines, {
    assistanceFixed: canAssistFixed ? Number(assistanceFixed || 0) : 0,
    assistancePerLitre: canAssistPerLitre ? Number(assistancePerLitre || 0) : 0,
  });

  const createCustomer = useMutation({
    mutationFn: async () =>
      (
        await api.post<Customer>('/oil-sales/customers', {
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
        })
      ).data,
    onSuccess: (c) => {
      toast.success('تم إنشاء الزبون');
      setCustomerId(c.id);
      setCustomerQ(c.name);
      setShowNewCustomer(false);
      setNewName('');
      setNewPhone('');
      void qc.invalidateQueries({ queryKey: ['oil-sales-customers'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر إنشاء الزبون'),
  });

  function addLine() {
    const key = `${uid}-${Date.now()}`;
    if (method === 'CONTAINER_ONLY') {
      if (!canSellContainers) {
        toast.error('ليس لديك صلاحية بيع الضلف فارغة');
        return;
      }
      const c = containers.find((x) => x.id === containerId);
      const count = Number(containerCount);
      if (!c || !(count >= 1)) {
        toast.error('اختر الضلف والعدد');
        return;
      }
      const sell = canChangeContainerPrice ? emptyPrice : Number(c.unitPrice ?? 0);
      if (!(sell >= 0) || (c.unitPrice == null && !canChangeContainerPrice)) {
        toast.error('حدد سعر بيع الضلف');
        return;
      }
      setLines((prev) => [
        ...prev,
        {
          key,
          kind: 'CONTAINER_ONLY',
          containerId: c.id,
          containerName: c.name,
          capacityL: Number(c.capacityL),
          containerCount: count,
          unitPrice: sell,
          containerPrice: sell,
        },
      ]);
      return;
    }
    if (!canWrite) {
      toast.error('ليس لديك صلاحية بيع الزيت');
      return;
    }
    if (method === 'CONTAINER') {
      const c = containers.find((x) => x.id === containerId);
      const count = Number(containerCount);
      if (!c || !(count >= 1)) {
        toast.error('اختر التعبئة وعدد الضلف');
        return;
      }
      setLines((prev) => [
        ...prev,
        {
          key,
          kind: 'CONTAINER',
          oilSource,
          oilType,
          containerId: c.id,
          containerName: c.name,
          capacityL: Number(c.capacityL),
          containerCount: count,
          unitPrice: price,
        },
      ]);
      return;
    }
    const qty = Number(looseQty);
    if (!(qty > 0)) {
      toast.error('أدخل كمية اللترات');
      return;
    }
    setLines((prev) => [
      ...prev,
      { key, kind: 'LOOSE', oilSource, oilType, quantityL: qty, unitPrice: price },
    ]);
    setLooseQty('');
  }

  const createSale = useMutation({
    mutationFn: async (print: boolean) =>
      (
        await api.post('/oil-sales/sales', {
          customerId,
          oilSource: pricedLines.some((l) => l.kind !== 'CONTAINER_ONLY') ? oilSource : undefined,
          oilType: pricedLines.some((l) => l.kind !== 'CONTAINER_ONLY') ? oilType : undefined,
          items: pricedLines.map((l) => ({
            kind: l.kind,
            oilSource: l.kind === 'CONTAINER_ONLY' ? undefined : (l.oilSource ?? oilSource),
            oilType: l.kind === 'CONTAINER_ONLY' ? undefined : (l.oilType ?? oilType),
            containerId: l.containerId,
            containerCount: l.containerCount,
            quantityL: l.kind === 'CONTAINER_ONLY' ? undefined : l.quantityL,
            unitPrice: l.unitPrice,
            containerPrice: l.kind === 'CONTAINER_ONLY' ? l.containerPrice ?? l.unitPrice : l.containerPrice,
          })),
          assistanceFixed: canAssistFixed ? Number(assistanceFixed || 0) : 0,
          assistancePerLitre: canAssistPerLitre ? Number(assistancePerLitre || 0) : 0,
          notes: notes.trim() || undefined,
          overrideStock,
          overrideContainerStock,
        })
      ).data as { id: string; receiptNumber: number; print?: boolean } & { id: string },
    onSuccess: (sale, print) => {
      toast.success(`تم البيع #${sale.receiptNumber}`);
      void qc.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-stock'] });
      void qc.invalidateQueries({ queryKey: ['oil-containers'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-list'] });
      if (print) openOilSaleReceipt(sale.id, { autoPrint: true });
      setLines([]);
      setAssistanceFixed('0');
      setAssistancePercent('0');
      setNotes('');
      setOverrideStock(false);
      setOverrideContainerStock(false);
    },
    onError: (e: { response?: { data?: { message?: string | string[] } } }) => {
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join('\n') : msg || 'تعذر إتمام البيع');
    },
  });

  function onSubmit(e: FormEvent, print: boolean) {
    e.preventDefault();
    if (createSale.isPending) return;
    if (!customerId) {
      toast.error('اختر زبوناً');
      return;
    }
    if (!preview) {
      toast.error('أضف سطراً واحداً على الأقل وتحقق من المساعدة');
      return;
    }
    createSale.mutate(print);
  }

  if ((!canWrite && !canSellContainers) || readOnly) {
    return (
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center">
        <p className="font-bold">ليس لديك صلاحية إنشاء بيع</p>
        <Link href="/sales" className="mt-4 inline-block text-amber-800 underline">
          العودة
        </Link>
      </div>
    );
  }

  const selectedContainer = containers.find((c) => c.id === containerId);
  const liveContainerLitres =
    selectedContainer && Number(containerCount) >= 1
      ? Number(selectedContainer.capacityL) * Number(containerCount)
      : 0;
  const sellingContainersOnly =
    method === 'CONTAINER_ONLY' && lines.every((l) => l.kind === 'CONTAINER_ONLY');
  const hasOilInCart = lines.some((l) => l.kind !== 'CONTAINER_ONLY');
  const showOilType = method !== 'CONTAINER_ONLY' || hasOilInCart;
  const emptyLineTotal =
    method === 'CONTAINER_ONLY' && Number(containerCount) >= 1 && emptyPrice >= 0
      ? Number(containerCount) * emptyPrice
      : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-xs font-bold text-amber-800 dark:text-amber-400">نقطة البيع</p>
        <h1 className="text-2xl font-black">بيع جديد</h1>
      </div>

      {!cashQ.data?.session ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/40 dark:bg-amber-950/40">
          <p className="font-bold">يجب فتح الصندوق قبل البيع.</p>
          <Link href="/sales/cash" className="mt-1 inline-block text-xs font-bold underline">
            فتح الصندوق
          </Link>
        </div>
      ) : cashQ.data.register ? (
        <p className="text-sm text-[var(--app-text-dim)]">
          الصندوق: {cashQ.data.register.name} ({cashQ.data.register.code})
        </p>
      ) : null}

      <form className="space-y-5" onSubmit={(e) => onSubmit(e, canPrint)}>
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
          <label className="block text-sm font-bold">1. الزبون</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-dim)]" />
            <input
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] py-2.5 pr-10 pl-3 text-sm"
              placeholder="بحث بالاسم أو الهاتف…"
              value={customerQ}
              onChange={(e) => setCustomerQ(e.target.value)}
            />
          </div>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--app-border)]">
            {(customersQ.data ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCustomerId(c.id);
                  setCustomerQ(c.name);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-[var(--app-bg-muted)]',
                  customerId === c.id && 'bg-amber-100 dark:bg-amber-950/40',
                )}
              >
                <span className="font-bold">{c.name}</span>
                <span className="text-xs text-[var(--app-text-dim)]">{c.phone || '—'}</span>
              </button>
            ))}
          </div>
          {canCustomer ? (
            showNewCustomer ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <Input label="اسم الزبون" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input label="الهاتف" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={() => createCustomer.mutate()}
                    loading={createCustomer.isPending}
                    disabled={newName.trim().length < 2}
                  >
                    حفظ
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowNewCustomer(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setShowNewCustomer(true)}>
                <Plus className="h-3.5 w-3.5" /> زبون جديد
              </Button>
            )
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
          <p className="text-sm font-bold">2. ماذا تبيع؟</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMethod('CONTAINER')}
              disabled={!canWrite}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-bold disabled:opacity-40',
                method === 'CONTAINER' ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/30' : 'border-[var(--app-border)]',
              )}
            >
              زيت معبّأ
            </button>
            <button
              type="button"
              onClick={() => setMethod('LOOSE')}
              disabled={!canWrite}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-bold disabled:opacity-40',
                method === 'LOOSE' ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/30' : 'border-[var(--app-border)]',
              )}
            >
              زيت باللتر
            </button>
            <button
              type="button"
              onClick={() => setMethod('CONTAINER_ONLY')}
              disabled={!canSellContainers}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-bold disabled:opacity-40',
                method === 'CONTAINER_ONLY' ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/30' : 'border-[var(--app-border)]',
              )}
            >
              ضلف فقط
            </button>
          </div>
          {method === 'CONTAINER_ONLY' ? (
            <p className="text-xs text-[var(--app-text-dim)]">
              بيع الضلف كمنتج مستقل — بدون زيت وبدون خصم من مخزون اللترات
            </p>
          ) : null}

          {showOilType ? (
            <>
              <p className="text-sm font-bold">مصدر الزيت</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {OIL_SOURCES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setOilSource(s.value)}
                    className={cn(
                      'rounded-2xl border-2 p-4 text-right transition',
                      oilSource === s.value ? 'shadow-md' : 'border-[var(--app-border)] opacity-70 hover:opacity-100',
                    )}
                    style={{
                      borderColor: oilSource === s.value ? s.color : undefined,
                      background: oilSource === s.value ? s.soft : undefined,
                    }}
                  >
                    <p className="text-lg font-black" style={{ color: s.color }}>
                      {s.emoji} {s.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-text-dim)]">{s.labelFr}</p>
                  </button>
                ))}
              </div>

              <p className="text-sm font-bold">نوع الزيت</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {OIL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setOilType(t.value)}
                    className={cn(
                      'rounded-2xl border-2 p-3 text-right transition',
                      oilType === t.value ? 'shadow-md' : 'border-[var(--app-border)] opacity-70 hover:opacity-100',
                    )}
                    style={{
                      borderColor: oilType === t.value ? t.color : undefined,
                      background: oilType === t.value ? t.soft : undefined,
                    }}
                  >
                    <p className="text-base font-black" style={{ color: t.color }}>
                      {t.emoji} {t.shortLabel}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--app-text-dim)]">{t.label}</p>
                  </button>
                ))}
              </div>
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: `${sourceMeta.color}55`, background: sourceMeta.soft }}
              >
                {sourceMeta.label} · {meta.label} — المتوفر:{' '}
                <strong className="tabular-nums">
                  {stock ? formatNumber(stock.theoreticalQty, 1) : '…'} لتر
                </strong>
              </div>
            </>
          ) : null}

          {containers.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {containers.map((c) => {
                const avail = c.stock?.available ?? 0;
                const low = avail <= (c.stock?.minStock ?? 0);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setContainerId(c.id)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-sm text-right',
                      containerId === c.id ? 'border-amber-700 ring-2 ring-amber-700/20' : 'border-[var(--app-border)]',
                      low && 'bg-red-50/70 dark:bg-red-950/20',
                    )}
                  >
                    <p className="text-xs text-[var(--app-text-dim)]">{c.name}</p>
                    <p className="font-black tabular-nums">{avail} قطعة</p>
                    {c.unitPrice != null ? (
                      <p className="text-[11px]">{formatNumber(Number(c.unitPrice), 0)} د.ج / قطعة</p>
                    ) : null}
                    {low ? <p className="text-[11px] font-bold text-red-700">مخزون منخفض</p> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {method === 'LOOSE' ? (
            <Input
              label="الكمية (لتر)"
              inputMode="decimal"
              value={looseQty}
              onChange={(e) => setLooseQty(e.target.value)}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  {method === 'CONTAINER_ONLY' ? 'المنتج (الضلف)' : 'التعبئة'}
                </span>
                <select
                  className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2.5"
                  value={containerId}
                  onChange={(e) => setContainerId(e.target.value)}
                >
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {method === 'CONTAINER_ONLY'
                        ? ` — ${formatNumber(Number(c.unitPrice ?? 0), 0)} د.ج · ${c.stock?.available ?? 0} قطعة`
                        : ` (${formatNumber(Number(c.capacityL), 0)} لتر) — ${c.stock?.available ?? 0}`}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="العدد"
                inputMode="numeric"
                value={containerCount}
                onChange={(e) => setContainerCount(e.target.value)}
              />
              {method === 'CONTAINER' && liveContainerLitres > 0 ? (
                <p className="sm:col-span-3 text-sm font-bold text-amber-900 dark:text-amber-300">
                  {containerCount} × {formatNumber(Number(selectedContainer?.capacityL), 0)} لتر ={' '}
                  {formatNumber(liveContainerLitres, 1)} لتر زيت + {containerCount} ضلف
                </p>
              ) : null}
              {method === 'CONTAINER_ONLY' ? (
                <>
                  <Input
                    className="sm:col-span-2"
                    label="سعر القطعة (د.ج)"
                    inputMode="decimal"
                    value={containerSellPrice}
                    onChange={(e) => setContainerSellPrice(e.target.value)}
                    disabled={!canChangeContainerPrice}
                  />
                  {emptyLineTotal > 0 ? (
                    <p className="sm:col-span-3 text-sm font-bold text-amber-900 dark:text-amber-300">
                      {containerCount} × {formatNumber(emptyPrice, 0)} د.ج = {formatNumber(emptyLineTotal, 0)} د.ج
                      {' — '}بدون زيت
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          )}

          <Button type="button" variant="outline" className="gap-1" onClick={addLine}>
            <Plus className="h-4 w-4" /> إضافة إلى البيع
          </Button>

          {lines.length > 0 ? (
            <ul className="divide-y divide-[var(--app-border)] rounded-xl border border-[var(--app-border)]">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="font-bold">
                    {l.kind === 'CONTAINER'
                      ? `${oilSourceMeta(l.oilSource ?? oilSource).emoji} ${oilMeta(l.oilType ?? oilType).shortLabel} · ${l.containerCount} × ${l.containerName} = ${formatNumber((l.capacityL ?? 0) * (l.containerCount ?? 0), 1)} لتر`
                      : l.kind === 'CONTAINER_ONLY'
                        ? `${l.containerCount} × ${l.containerName} (منتج) = ${formatNumber((l.containerCount ?? 0) * l.unitPrice, 0)} د.ج`
                        : `${oilSourceMeta(l.oilSource ?? oilSource).emoji} ${oilMeta(l.oilType ?? oilType).shortLabel} · ${formatNumber(l.quantityL ?? 0, 1)} لتر`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                    className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                    aria-label="حذف السطر"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--app-text-dim)]">أضف زيتاً أو ضلف كمنتج مستقل</p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <h3 className="text-sm font-black">المساعدة</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {canAssistPerLitre ? (
              <div className="space-y-1 sm:col-span-2">
                <Input
                  label="مساعدة لكل لتر (دج / لتر)"
                  inputMode="decimal"
                  value={assistancePerLitre}
                  onChange={(e) => setAssistancePerLitre(e.target.value)}
                />
                {preview && Number(assistancePerLitre || 0) > 0 && preview.quantityL > 0 ? (
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    {formatNumber(Number(assistancePerLitre || 0), 0)} دج ×{' '}
                    {formatNumber(preview.quantityL, 1)} لتر ={' '}
                    {formatNumber(preview.assistancePerLitreTotal, 0)} دج
                  </p>
                ) : null}
              </div>
            ) : null}
            {canAssistFixed ? (
              <Input
                label="مساعدة ثابتة (د.ج)"
                inputMode="decimal"
                value={assistanceFixed}
                onChange={(e) => setAssistanceFixed(e.target.value)}
              />
            ) : null}
          </div>
        </div>

        {showOilType ? (
          <Input
            label="سعر اللتر (د.ج)"
            inputMode="decimal"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            disabled={!canChangePrice}
          />
        ) : null}

        <Input label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="rounded-2xl border-2 border-amber-700/30 bg-amber-50/60 p-4 dark:bg-amber-950/20">
          <h3 className="mb-3 text-sm font-black">ملخص الحساب</h3>
          {preview ? (
            <dl className="space-y-1.5 text-sm">
              {preview.quantityL > 0 ? (
                <Line label="إجمالي الزيت" value={`${formatNumber(preview.quantityL, 1)} لتر`} />
              ) : (
                <Line label="النوع" value="ضلف فقط — بدون زيت" />
              )}
              <Line label="المبلغ الإجمالي" value={`${formatNumber(preview.grossAmount, 0)} د.ج`} />
              {canAssistPerLitre ? (
                <Line
                  label="مساعدة اللتر"
                  value={`− ${formatNumber(preview.assistancePerLitreTotal, 0)} د.ج`}
                />
              ) : null}
              {canAssistFixed ? (
                <Line
                  label="مساعدة ثابتة"
                  value={`− ${formatNumber(preview.assistanceFixed, 0)} د.ج`}
                />
              ) : null}
              <Line label="إجمالي المساعدات" value={`− ${formatNumber(preview.totalAssistance, 0)} د.ج`} />
              <div className="mt-3 flex items-center justify-between border-t border-amber-800/20 pt-3">
                <span className="text-base font-black">الصافي للدفع</span>
                <span className="text-2xl font-black tabular-nums text-amber-900 dark:text-amber-300">
                  {formatNumber(preview.finalAmount, 0)} د.ج
                </span>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--app-text-dim)]">أضف أسطر البيع لعرض الحساب</p>
          )}
        </div>

        {canOverride && !sellingContainersOnly ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overrideStock}
              onChange={(e) => setOverrideStock(e.target.checked)}
            />
            تجاوز مخزون الزيت (لتر)
          </label>
        ) : null}
        {canOverrideContainers ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overrideContainerStock}
              onChange={(e) => setOverrideContainerStock(e.target.checked)}
            />
            تجاوز مخزون الضلف (قطعة)
          </label>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {canPrint ? (
            <Button
              type="submit"
              className="gap-2 bg-amber-700 py-6 text-base hover:bg-amber-800"
              loading={createSale.isPending}
              disabled={!preview || !customerId}
            >
              <Printer className="h-5 w-5" />
              تأكيد البيع وطباعة الوصل
            </Button>
          ) : null}
          <Button
            type="button"
            variant={canPrint ? 'outline' : 'primary'}
            className={cn('py-6 text-base', !canPrint && 'bg-amber-700 hover:bg-amber-800')}
            loading={createSale.isPending}
            disabled={!preview || !customerId}
            onClick={(e) => onSubmit(e as unknown as FormEvent, false)}
          >
            تأكيد بدون طباعة
          </Button>
        </div>
      </form>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--app-text-muted)]">{label}</dt>
      <dd className="font-bold tabular-nums">{value}</dd>
    </div>
  );
}
