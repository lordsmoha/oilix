'use client';

import { FormEvent, useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Droplet, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  OIL_SOURCES,
  OIL_TYPES,
  oilMeta,
  oilSourceMeta,
  type OilSourceValue,
  type OilTypeValue,
} from '@/lib/sales-nav';
import { previewSaleFromLines, type DraftSaleLine } from '@/lib/sales-math';
import { formatNumber, formatMoney, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { openOilSaleReceipt } from '@/lib/oil-sale-receipt';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type Customer = { id: string; name: string; phone?: string | null; address?: string | null };
type StockRow = {
  oilSource: OilSourceValue;
  oilType: OilTypeValue;
  theoreticalQty: number;
  physicalQty: number | null;
};
type Settings = {
  priceGreen: number;
  priceTaieb: number;
  priceDrou: number;
  priceZebbouche: number;
};
type Container = {
  id: string;
  name: string;
  capacityL: string | number;
  isActive: boolean;
  unitPrice?: string | number | null;
  stock?: { available: number; theoreticalQty: number; minStock?: number };
};

type CartLine = DraftSaleLine & {
  key: string;
  oilSource?: OilSourceValue;
  oilType?: OilTypeValue;
};

const LOW_STOCK_L = 20;

function availableQty(row: StockRow | undefined) {
  return row ? Number(row.theoreticalQty) || 0 : 0;
}

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
  const canAllowDebt = useAuthStore((s) => s.hasPermission('OIL_SALES_SALES_ALLOW_DEBT'));

  const [oilSource, setOilSource] = useState<OilSourceValue>('STORED');
  const [oilType, setOilType] = useState<OilTypeValue>('GREEN');
  const [customerId, setCustomerId] = useState('');
  const [customerQ, setCustomerQ] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [method, setMethod] = useState<'CONTAINER' | 'LOOSE' | 'CONTAINER_ONLY'>(
    canWrite ? 'LOOSE' : 'CONTAINER_ONLY',
  );
  const [containerId, setContainerId] = useState('');
  const [containerCount, setContainerCount] = useState('1');
  const [looseQty, setLooseQty] = useState('');
  const [lines, setLines] = useState<CartLine[]>([]);
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
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial' | 'later'>('full');
  const [amountPaidNow, setAmountPaidNow] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [oilPanelOpen, setOilPanelOpen] = useState(false);
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
    enabled: customerQ.trim().length >= 1 && !selectedCustomer,
    queryFn: async () =>
      (
        await api.get<{ items: Customer[] }>('/oil-sales/customers', {
          params: { q: customerQ.trim(), limit: 20 },
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

  const stockRows = stockQ.data ?? [];
  const stock = stockRows.find((s) => s.oilSource === oilSource && s.oilType === oilType);
  const stockAvailable = availableQty(stock);
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
  const selectedContainer = containers.find((c) => c.id === containerId);
  const liveContainerLitres =
    selectedContainer && Number(containerCount) >= 1
      ? Number(selectedContainer.capacityL) * Number(containerCount)
      : 0;

  const draftLine = useMemo((): CartLine | null => {
    const key = `${uid}-draft`;
    if (method === 'LOOSE') {
      const qty = Number(looseQty);
      if (!(qty > 0) || !(price >= 0)) return null;
      return {
        key,
        kind: 'LOOSE',
        oilSource,
        oilType,
        quantityL: qty,
        unitPrice: price,
      };
    }
    if (method === 'CONTAINER') {
      const c = selectedContainer;
      const count = Number(containerCount);
      if (!c || !(count >= 1) || !(price >= 0)) return null;
      return {
        key,
        kind: 'CONTAINER',
        oilSource,
        oilType,
        containerId: c.id,
        containerName: c.name,
        capacityL: Number(c.capacityL),
        containerCount: count,
        unitPrice: price,
      };
    }
    if (method === 'CONTAINER_ONLY') {
      const c = selectedContainer;
      const count = Number(containerCount);
      const sell = canChangeContainerPrice ? emptyPrice : Number(c?.unitPrice ?? 0);
      if (!c || !(count >= 1) || !(sell >= 0)) return null;
      if (c.unitPrice == null && !canChangeContainerPrice) return null;
      return {
        key,
        kind: 'CONTAINER_ONLY',
        containerId: c.id,
        containerName: c.name,
        capacityL: Number(c.capacityL),
        containerCount: count,
        unitPrice: sell,
        containerPrice: sell,
      };
    }
    return null;
  }, [
    method,
    looseQty,
    price,
    oilSource,
    oilType,
    selectedContainer,
    containerCount,
    canChangeContainerPrice,
    emptyPrice,
    uid,
  ]);

  const composedLines = useMemo(() => {
    const cart = lines.map((l) => {
      if (l.kind === 'CONTAINER_ONLY') {
        return {
          ...l,
          unitPrice: canChangeContainerPrice ? emptyPrice || l.unitPrice : l.unitPrice,
          containerPrice: canChangeContainerPrice
            ? emptyPrice || l.containerPrice
            : l.containerPrice,
        };
      }
      return { ...l, unitPrice: canChangePrice ? price : l.unitPrice || price };
    });
    if (draftLine) {
      const pricedDraft =
        draftLine.kind === 'CONTAINER_ONLY'
          ? draftLine
          : {
              ...draftLine,
              unitPrice: canChangePrice ? price : draftLine.unitPrice || price,
            };
      return [...cart, pricedDraft];
    }
    return cart;
  }, [lines, draftLine, canChangePrice, canChangeContainerPrice, price, emptyPrice]);

  const preview = previewSaleFromLines(composedLines, {
    assistanceFixed: canAssistFixed ? Number(assistanceFixed || 0) : 0,
    assistancePerLitre: canAssistPerLitre ? Number(assistancePerLitre || 0) : 0,
  });

  useEffect(() => {
    if (!preview) {
      setAmountPaidNow('');
      return;
    }
    if (!canAllowDebt || paymentMode === 'full') {
      setAmountPaidNow(String(preview.finalAmount));
    } else if (paymentMode === 'later') {
      setAmountPaidNow('0');
    }
  }, [preview?.finalAmount, paymentMode, canAllowDebt]);

  const paidNow = preview
    ? !canAllowDebt
      ? preview.finalAmount
      : paymentMode === 'full'
        ? preview.finalAmount
        : paymentMode === 'later'
          ? 0
          : Math.min(Math.max(0, Number(amountPaidNow || 0)), preview.finalAmount)
    : 0;
  const remainingDebt = preview ? Math.max(0, preview.finalAmount - paidNow) : 0;

  const oilNeeded = useMemo(
    () =>
      composedLines
        .filter((l) => l.kind !== 'CONTAINER_ONLY')
        .filter((l) => (l.oilSource ?? oilSource) === oilSource && (l.oilType ?? oilType) === oilType)
        .reduce((s, l) => {
          if (l.kind === 'LOOSE') return s + Number(l.quantityL ?? 0);
          if (l.kind === 'CONTAINER')
            return s + Number(l.capacityL ?? 0) * Number(l.containerCount ?? 0);
          return s;
        }, 0),
    [composedLines, oilSource, oilType],
  );

  const qtyExceedsStock =
    method !== 'CONTAINER_ONLY' &&
    oilNeeded > stockAvailable + 1e-9 &&
    !overrideStock;

  const assistTooLarge = preview == null && composedLines.length > 0;

  const createCustomer = useMutation({
    mutationFn: async () =>
      (
        await api.post<Customer>('/oil-sales/customers', {
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
          address: newAddress.trim() || undefined,
        })
      ).data,
    onSuccess: (c) => {
      toast.success('تم إنشاء الزبون');
      setCustomerId(c.id);
      setSelectedCustomer(c);
      setCustomerQ(c.name);
      setShowNewCustomer(false);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      void qc.invalidateQueries({ queryKey: ['oil-sales-customers'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر إنشاء الزبون'),
  });

  function selectOil(source: OilSourceValue, type: OilTypeValue) {
    if (method === 'CONTAINER_ONLY') return;
    const row = stockRows.find((s) => s.oilSource === source && s.oilType === type);
    const qty = availableQty(row);
    if (qty <= 0 && !canOverride && !overrideStock) {
      toast.error('هذا الزيت غير متوفر');
      return;
    }
    setOilSource(source);
    setOilType(type);
    setOilPanelOpen(false);
  }

  function addLine() {
    if (!draftLine) {
      if (method === 'LOOSE') toast.error('أدخل كمية اللترات');
      else if (method === 'CONTAINER_ONLY') toast.error('اختر الضلف والعدد');
      else toast.error('اختر التعبئة وعدد الضلف');
      return;
    }
    if (method === 'CONTAINER_ONLY' && !canSellContainers) {
      toast.error('ليس لديك صلاحية بيع الضلف فارغة');
      return;
    }
    if (method !== 'CONTAINER_ONLY' && !canWrite) {
      toast.error('ليس لديك صلاحية بيع الزيت');
      return;
    }
    if (method !== 'CONTAINER_ONLY' && stockAvailable <= 0 && !overrideStock && !canOverride) {
      toast.error('المخزون غير متوفر');
      return;
    }
    setLines((prev) => [...prev, { ...draftLine, key: `${uid}-${Date.now()}` }]);
    if (method === 'LOOSE') setLooseQty('');
    else setContainerCount('1');
  }

  const createSale = useMutation({
    mutationFn: async (print: boolean) =>
      (
        await api.post('/oil-sales/sales', {
          customerId,
          oilSource: composedLines.some((l) => l.kind !== 'CONTAINER_ONLY')
            ? oilSource
            : undefined,
          oilType: composedLines.some((l) => l.kind !== 'CONTAINER_ONLY') ? oilType : undefined,
          items: composedLines.map((l) => ({
            kind: l.kind,
            oilSource: l.kind === 'CONTAINER_ONLY' ? undefined : (l.oilSource ?? oilSource),
            oilType: l.kind === 'CONTAINER_ONLY' ? undefined : (l.oilType ?? oilType),
            containerId: l.containerId,
            containerCount: l.containerCount,
            quantityL: l.kind === 'CONTAINER_ONLY' ? undefined : l.quantityL,
            unitPrice: l.unitPrice,
            containerPrice:
              l.kind === 'CONTAINER_ONLY' ? (l.containerPrice ?? l.unitPrice) : l.containerPrice,
          })),
          assistanceFixed: canAssistFixed ? Number(assistanceFixed || 0) : 0,
          assistancePerLitre: canAssistPerLitre ? Number(assistancePerLitre || 0) : 0,
          amountPaid: paidNow,
          notes: notes.trim() || undefined,
          overrideStock,
          overrideContainerStock,
        })
      ).data as { id: string; receiptNumber: number },
    onSuccess: (sale, print) => {
      toast.success(`تم البيع #${sale.receiptNumber}`);
      void qc.invalidateQueries({ queryKey: ['oil-sales-dashboard'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-stock'] });
      void qc.invalidateQueries({ queryKey: ['oil-containers'] });
      void qc.invalidateQueries({ queryKey: ['oil-sales-list'] });
      void qc.invalidateQueries({ queryKey: ['oil-debts'] });
      void qc.invalidateQueries({ queryKey: ['oil-debts-summary'] });
      if (print) openOilSaleReceipt(sale.id, { autoPrint: true });
      setLines([]);
      setLooseQty('');
      setContainerCount('1');
      setAssistanceFixed('0');
      setAssistancePerLitre('0');
      setNotes('');
      setOverrideStock(false);
      setOverrideContainerStock(false);
      setPaymentMode('full');
      setAmountPaidNow('');
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
      toast.error('أدخل الكمية وتحقق من المساعدة');
      return;
    }
    if (qtyExceedsStock) {
      toast.error('الكمية تتجاوز المخزون المتوفر');
      return;
    }
    if (remainingDebt > 0 && !canAllowDebt) {
      toast.error('ليس لديك صلاحية البيع بالدين');
      return;
    }
    if (remainingDebt > 0 && !customerId) {
      toast.error('البيع بالدين يتطلب اختيار زبون مسجّل');
      return;
    }
    if (paymentMode === 'partial' && !(Number(amountPaidNow) >= 0)) {
      toast.error('أدخل المبلغ المدفوع');
      return;
    }
    createSale.mutate(print);
  }

  function resetForm() {
    setLines([]);
    setLooseQty('');
    setContainerCount('1');
    setAssistanceFixed('0');
    setAssistancePerLitre('0');
    setNotes('');
    setOverrideStock(false);
    setOverrideContainerStock(false);
    setPaymentMode('full');
    setAmountPaidNow('');
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

  const oilPanelDisabled = method === 'CONTAINER_ONLY';
  const showOilFields = method !== 'CONTAINER_ONLY';
  const emptyLineTotal =
    method === 'CONTAINER_ONLY' && Number(containerCount) >= 1 && emptyPrice >= 0
      ? Number(containerCount) * emptyPrice
      : 0;

  const oilPanel = (
    <OilSelectionPanel
      stockRows={stockRows}
      selectedSource={oilSource}
      selectedType={oilType}
      disabled={oilPanelDisabled}
      canOverride={canOverride || overrideStock}
      onSelect={selectOil}
    />
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-amber-800 dark:text-amber-400">نقطة البيع</p>
          <h1 className="text-2xl font-black">بيع جديد</h1>
        </div>
        {cashQ.data?.session && cashQ.data.register ? (
          <p className="text-sm text-[var(--app-text-dim)]">
            الصندوق: {cashQ.data.register.name} ({cashQ.data.register.code})
          </p>
        ) : null}
      </div>

      {/* Mobile oil picker */}
      {!oilPanelDisabled ? (
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setOilPanelOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm"
          >
            <span className="font-bold">
              {sourceMeta.emoji} {sourceMeta.label} · {meta.emoji} {meta.shortLabel}
            </span>
            <span className="tabular-nums text-[var(--app-text-dim)]">
              {formatNumber(stockAvailable, 1)} لتر
            </span>
          </button>
          {oilPanelOpen ? (
            <div className="mt-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
              {oilPanel}
            </div>
          ) : (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {OIL_SOURCES.flatMap((src) =>
                OIL_TYPES.map((t) => {
                  const row = stockRows.find(
                    (s) => s.oilSource === src.value && s.oilType === t.value,
                  );
                  const qty = availableQty(row);
                  const selected = oilSource === src.value && oilType === t.value;
                  return (
                    <button
                      key={`${src.value}-${t.value}`}
                      type="button"
                      onClick={() => selectOil(src.value, t.value)}
                      className={cn(
                        'min-w-[7.5rem] shrink-0 rounded-xl border px-2.5 py-2 text-right',
                        selected
                          ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/40'
                          : 'border-[var(--app-border)] bg-[var(--app-surface)]',
                      )}
                    >
                      <p className="text-[10px] text-[var(--app-text-dim)]">{src.label}</p>
                      <p className="text-xs font-black" style={{ color: t.color }}>
                        {t.shortLabel}
                      </p>
                      <p className="text-[11px] tabular-nums">{formatNumber(qty, 1)} لتر</p>
                    </button>
                  );
                }),
              )}
            </div>
          )}
        </div>
      ) : null}

      <form
        className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]"
        onSubmit={(e) => onSubmit(e, false)}
      >
        {/* Desktop left oil panel */}
        <aside
          className={cn(
            'hidden lg:block',
            oilPanelDisabled && 'pointer-events-none opacity-40',
          )}
        >
          <div className="sticky top-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
            <p className="mb-3 text-sm font-black">اختيار الزيت</p>
            {oilPanel}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Customer */}
          <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black">الزبون</h2>
              {canCustomer && !showNewCustomer ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => setShowNewCustomer(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> زبون جديد
                </Button>
              ) : null}
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-700/30 bg-amber-50/50 px-3 py-2 dark:bg-amber-950/20">
                <div>
                  <p className="font-bold">{selectedCustomer.name}</p>
                  <p className="text-xs text-[var(--app-text-dim)]">
                    {[selectedCustomer.phone, selectedCustomer.address].filter(Boolean).join(' · ') ||
                      'بدون هاتف'}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[var(--app-text-dim)] hover:bg-[var(--app-bg-muted)]"
                  onClick={() => {
                    setCustomerId('');
                    setSelectedCustomer(null);
                    setCustomerQ('');
                  }}
                  aria-label="تغيير الزبون"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-dim)]" />
                  <input
                    className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] py-2 pr-10 pl-3 text-sm"
                    placeholder="بحث بالاسم أو الهاتف…"
                    value={customerQ}
                    onChange={(e) => setCustomerQ(e.target.value)}
                  />
                </div>
                {customerQ.trim().length >= 1 ? (
                  <div className="max-h-28 overflow-y-auto rounded-xl border border-[var(--app-border)]">
                    {(customersQ.data ?? []).length === 0 && !customersQ.isFetching ? (
                      <p className="px-3 py-2 text-xs text-[var(--app-text-dim)]">لا نتائج</p>
                    ) : (
                      (customersQ.data ?? []).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCustomerId(c.id);
                            setSelectedCustomer(c);
                            setCustomerQ(c.name);
                          }}
                          className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-[var(--app-bg-muted)]"
                        >
                          <span className="font-bold">{c.name}</span>
                          <span className="text-xs text-[var(--app-text-dim)]">
                            {c.phone || '—'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </>
            )}

            {canCustomer && showNewCustomer ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="اسم الزبون"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Input
                  label="الهاتف"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <Input
                  label="العنوان"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
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
            ) : null}
            {!customerId ? (
              <p className="text-xs font-medium text-red-700 dark:text-red-400">اختر زبوناً للمتابعة</p>
            ) : null}
          </section>

          {/* Sale mode */}
          <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 space-y-3">
            <div
              className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--app-bg-muted)] p-1"
              role="tablist"
              aria-label="نوع البيع"
            >
              {(
                [
                  { id: 'LOOSE' as const, label: 'زيت باللتر', enabled: canWrite },
                  { id: 'CONTAINER' as const, label: 'زيت معبأ', enabled: canWrite },
                  {
                    id: 'CONTAINER_ONLY' as const,
                    label: 'ضلف فقط',
                    enabled: canSellContainers,
                  },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={method === m.id}
                  disabled={!m.enabled}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm',
                    method === m.id
                      ? 'bg-[var(--app-surface)] text-amber-900 shadow-sm dark:text-amber-200'
                      : 'text-[var(--app-text-dim)] hover:text-[var(--app-text)]',
                    !m.enabled && 'opacity-40',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {showOilFields ? (
              <div
                className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: `${sourceMeta.color}44`, background: sourceMeta.soft }}
              >
                <Droplet className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
                <span className="font-bold">
                  {sourceMeta.label} · {meta.label}
                </span>
                <span className="ms-auto tabular-nums text-[var(--app-text-dim)]">
                  المتوفر: {formatNumber(stockAvailable, 1)} لتر
                  {stockAvailable <= 0
                    ? ' — غير متوفر'
                    : stockAvailable <= LOW_STOCK_L
                      ? ' — مخزون منخفض'
                      : ''}
                </span>
              </div>
            ) : (
              <p className="text-xs text-[var(--app-text-dim)]">
                بيع الضلف كمنتج مستقل — بدون خصم من مخزون الزيت
              </p>
            )}

            {/* Primary input row — litre / packaged oil */}
            {method === 'LOOSE' ? (
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <Input
                  id="sale-qty"
                  label="الكمية (لتر)"
                  inputMode="decimal"
                  value={looseQty}
                  onChange={(e) => setLooseQty(e.target.value)}
                  error={
                    qtyExceedsStock
                      ? `تتجاوز المخزون (${formatNumber(stockAvailable, 1)} لتر)`
                      : undefined
                  }
                  autoFocus
                />
                <Input
                  id="sale-price"
                  label="سعر اللتر"
                  inputMode="decimal"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  disabled={!canChangePrice}
                />
                {canAssistPerLitre ? (
                  <Input
                    id="sale-aid-l"
                    label="مساعدة باللتر"
                    inputMode="decimal"
                    value={assistancePerLitre}
                    onChange={(e) => setAssistancePerLitre(e.target.value)}
                    hint="دج / لتر"
                  />
                ) : (
                  <div />
                )}
                {canAssistFixed ? (
                  <Input
                    id="sale-aid-fixed"
                    label="مساعدة ثابتة"
                    inputMode="decimal"
                    value={assistanceFixed}
                    onChange={(e) => setAssistanceFixed(e.target.value)}
                    hint="دج"
                  />
                ) : (
                  <div />
                )}
              </div>
            ) : null}

            {method === 'CONTAINER' ? (
              <div className="space-y-3">
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
                          'rounded-xl border px-3 py-2 text-right text-sm',
                          containerId === c.id
                            ? 'border-amber-700 ring-2 ring-amber-700/20'
                            : 'border-[var(--app-border)]',
                          low && 'bg-red-50/70 dark:bg-red-950/20',
                        )}
                      >
                        <p className="font-bold">{c.name}</p>
                        <p className="text-xs tabular-nums text-[var(--app-text-dim)]">
                          {formatNumber(Number(c.capacityL), 0)} لتر · {avail} قطعة
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <Input
                    label="عدد الضلف"
                    inputMode="numeric"
                    value={containerCount}
                    onChange={(e) => setContainerCount(e.target.value)}
                  />
                  <Input
                    label="سعر اللتر"
                    inputMode="decimal"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    disabled={!canChangePrice}
                  />
                  {canAssistPerLitre ? (
                    <Input
                      label="مساعدة باللتر"
                      inputMode="decimal"
                      value={assistancePerLitre}
                      onChange={(e) => setAssistancePerLitre(e.target.value)}
                    />
                  ) : (
                    <div />
                  )}
                  {canAssistFixed ? (
                    <Input
                      label="مساعدة ثابتة"
                      inputMode="decimal"
                      value={assistanceFixed}
                      onChange={(e) => setAssistanceFixed(e.target.value)}
                    />
                  ) : (
                    <div />
                  )}
                </div>
                {liveContainerLitres > 0 ? (
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    {containerCount} × {formatNumber(Number(selectedContainer?.capacityL), 0)} لتر ={' '}
                    {formatNumber(liveContainerLitres, 1)} لتر
                  </p>
                ) : null}
                {qtyExceedsStock ? (
                  <p className="text-xs font-medium text-red-700">
                    الكمية تتجاوز المخزون ({formatNumber(stockAvailable, 1)} لتر)
                  </p>
                ) : null}
              </div>
            ) : null}

            {method === 'CONTAINER_ONLY' ? (
              <div className="space-y-3">
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
                          'rounded-xl border px-3 py-2 text-right text-sm',
                          containerId === c.id
                            ? 'border-amber-700 ring-2 ring-amber-700/20'
                            : 'border-[var(--app-border)]',
                          low && 'bg-red-50/70 dark:bg-red-950/20',
                        )}
                      >
                        <p className="font-bold">{c.name}</p>
                        <p className="text-xs tabular-nums">{avail} قطعة</p>
                        {c.unitPrice != null ? (
                          <p className="text-[11px]">
                            {formatMoney(Number(c.unitPrice))} د.ج
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    label="العدد"
                    inputMode="numeric"
                    value={containerCount}
                    onChange={(e) => setContainerCount(e.target.value)}
                  />
                  <Input
                    label="سعر القطعة (د.ج)"
                    inputMode="decimal"
                    value={containerSellPrice}
                    onChange={(e) => setContainerSellPrice(e.target.value)}
                    disabled={!canChangeContainerPrice}
                  />
                </div>
                {emptyLineTotal > 0 ? (
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    {containerCount} × {formatMoney(emptyPrice)} د.ج ={' '}
                    {formatMoney(emptyLineTotal)} د.ج — بدون زيت
                  </p>
                ) : null}
              </div>
            ) : null}

            {canAssistPerLitre &&
            showOilFields &&
            Number(assistancePerLitre || 0) > 0 &&
            preview &&
            preview.quantityL > 0 ? (
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                مساعدة اللتر: {formatMoney(Number(assistancePerLitre || 0))} دج ×{' '}
                {formatNumber(preview.quantityL, 1)} لتر ={' '}
                {formatMoney(preview.assistancePerLitreTotal)} دج
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" /> إضافة سطر آخر
              </Button>
            </div>

            {lines.length > 0 ? (
              <ul className="divide-y divide-[var(--app-border)] rounded-xl border border-[var(--app-border)]">
                {lines.map((l) => (
                  <li
                    key={l.key}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="font-bold">
                      {l.kind === 'CONTAINER'
                        ? `${oilSourceMeta(l.oilSource ?? oilSource).emoji} ${oilMeta(l.oilType ?? oilType).shortLabel} · ${l.containerCount} × ${l.containerName} = ${formatNumber((l.capacityL ?? 0) * (l.containerCount ?? 0), 1)} لتر`
                        : l.kind === 'CONTAINER_ONLY'
                          ? `${l.containerCount} × ${l.containerName} = ${formatMoney((l.containerCount ?? 0) * l.unitPrice)} د.ج`
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
            ) : null}
          </section>

          {/* Summary */}
          <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
            <h3 className="mb-3 text-sm font-black">ملخص الحساب</h3>
            {preview ? (
              <dl className="space-y-1.5 text-sm">
                {preview.quantityL > 0 ? (
                  <SummaryLine
                    label="إجمالي الزيت"
                    value={`${formatNumber(preview.quantityL, 1)} لتر`}
                  />
                ) : (
                  <SummaryLine label="النوع" value="ضلف فقط — بدون زيت" />
                )}
                <SummaryLine
                  label="المبلغ الإجمالي"
                  value={`${formatMoney(preview.grossAmount)} د.ج`}
                />
                {canAssistPerLitre ? (
                  <SummaryLine
                    label="مساعدة اللتر"
                    value={`− ${formatMoney(preview.assistancePerLitreTotal)} د.ج`}
                  />
                ) : null}
                {canAssistFixed ? (
                  <SummaryLine
                    label="مساعدة ثابتة"
                    value={`− ${formatMoney(preview.assistanceFixed)} د.ج`}
                  />
                ) : null}
                <div className="border-t border-[var(--app-border)] pt-1.5">
                  <SummaryLine
                    label="إجمالي المساعدات"
                    value={`− ${formatMoney(preview.totalAssistance)} د.ج`}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-600/25 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                  <span className="text-base font-black text-emerald-900 dark:text-emerald-200">
                    الصافي للدفع
                  </span>
                  <span className="text-2xl font-black tabular-nums text-emerald-800 dark:text-emerald-300">
                    {formatMoney(preview.finalAmount)} د.ج
                  </span>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-[var(--app-text-dim)]">
                أدخل الكمية لعرض الحساب
                {assistTooLarge ? ' — تحقق من قيم المساعدة' : ''}
              </p>
            )}
          </section>

          {preview ? (
            <section className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <h3 className="text-sm font-black">الدفع</h3>
              {canAllowDebt ? (
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['full', 'دفع كامل'],
                      ['partial', 'دفع جزئي'],
                      ['later', 'الدفع لاحقاً'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={cn(
                        'rounded-xl border px-2 py-2.5 text-sm font-bold',
                        paymentMode === mode
                          ? 'border-amber-700 bg-amber-50 text-amber-900'
                          : 'border-[var(--app-border)]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--app-text-dim)]">
                  البيع نقداً بالكامل (لا صلاحية دين)
                </p>
              )}
              {canAllowDebt && paymentMode === 'partial' ? (
                <Input
                  label="المبلغ المدفوع الآن"
                  inputMode="decimal"
                  value={amountPaidNow}
                  onChange={(e) => setAmountPaidNow(e.target.value)}
                />
              ) : null}
              <dl className="space-y-1.5 text-sm">
                <SummaryLine label="الصافي" value={`${formatMoney(preview.finalAmount)} د.ج`} />
                <SummaryLine label="المدفوع الآن" value={`${formatMoney(paidNow)} د.ج`} />
                <div
                  className={cn(
                    'mt-2 flex items-center justify-between rounded-xl border px-4 py-3',
                    remainingDebt > 0
                      ? 'border-amber-600/30 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-950/30',
                  )}
                >
                  <span className="font-black">المتبقي على الزبون</span>
                  <span className="text-xl font-black tabular-nums">
                    {formatMoney(remainingDebt)} د.ج
                  </span>
                </div>
              </dl>
              {remainingDebt > 0 && !customerId ? (
                <p className="text-sm font-bold text-red-700">اختر زبوناً مسجّلاً لتسجيل الدين</p>
              ) : null}
            </section>
          ) : null}

          <Input label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} />

          {canOverride && showOilFields ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overrideStock}
                onChange={(e) => setOverrideStock(e.target.checked)}
              />
              تجاوز مخزون الزيت (لتر)
            </label>
          ) : null}
          {canOverrideContainers &&
          (method === 'CONTAINER' || method === 'CONTAINER_ONLY' || lines.some((l) => l.kind !== 'LOOSE')) ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overrideContainerStock}
                onChange={(e) => setOverrideContainerStock(e.target.checked)}
              />
              تجاوز مخزون الضلف (قطعة)
            </label>
          ) : null}

          {/* Actions */}
          <div className="sticky bottom-2 z-10 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]/95 p-3 shadow-lg backdrop-blur sm:grid-cols-3">
            <Button
              type="button"
              className="gap-2 bg-amber-700 py-5 text-base hover:bg-amber-800 sm:col-span-1"
              loading={createSale.isPending}
              disabled={!preview || !customerId || qtyExceedsStock}
              onClick={(e) => onSubmit(e as unknown as FormEvent, false)}
            >
              إتمام البيع
            </Button>
            {canPrint ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2 py-5 text-base"
                loading={createSale.isPending}
                disabled={!preview || !customerId || qtyExceedsStock}
                onClick={(e) => onSubmit(e as unknown as FormEvent, true)}
              >
                <Printer className="h-4 w-4" />
                معاينة الطباعة
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}
            <Button type="button" variant="ghost" className="py-5 text-base" onClick={resetForm}>
              إلغاء
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function OilSelectionPanel({
  stockRows,
  selectedSource,
  selectedType,
  disabled,
  canOverride,
  onSelect,
}: {
  stockRows: StockRow[];
  selectedSource: OilSourceValue;
  selectedType: OilTypeValue;
  disabled: boolean;
  canOverride: boolean;
  onSelect: (source: OilSourceValue, type: OilTypeValue) => void;
}) {
  return (
    <div className={cn('space-y-4', disabled && 'pointer-events-none opacity-50')}>
      {OIL_SOURCES.map((src) => (
        <div key={src.value}>
          <div
            className="mb-2 flex items-center gap-2 border-b border-[var(--app-border)] pb-1.5"
            style={{ borderColor: `${src.color}33` }}
          >
            <span className="text-sm font-black" style={{ color: src.color }}>
              {src.emoji} {src.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            {OIL_TYPES.map((t) => {
              const row = stockRows.find(
                (s) => s.oilSource === src.value && s.oilType === t.value,
              );
              const qty = availableQty(row);
              const selected = selectedSource === src.value && selectedType === t.value;
              const empty = qty <= 0;
              const low = !empty && qty <= LOW_STOCK_L;
              const blocked = empty && !canOverride;

              return (
                <button
                  key={t.value}
                  type="button"
                  disabled={blocked}
                  onClick={() => onSelect(src.value, t.value)}
                  className={cn(
                    'rounded-xl border px-2.5 py-2 text-right transition',
                    selected
                      ? 'border-2 shadow-sm'
                      : 'border-[var(--app-border)] bg-[var(--app-bg)] hover:border-[color-mix(in_srgb,var(--app-accent)_40%,var(--app-border))]',
                    blocked && 'cursor-not-allowed opacity-55',
                    low && !selected && 'border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/15',
                  )}
                  style={
                    selected
                      ? {
                          borderColor: t.color,
                          background: t.soft,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-1.5">
                    <Droplet
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      style={{ color: t.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-tight" style={{ color: t.color }}>
                        {t.label}
                      </p>
                      <p className="mt-0.5 text-sm font-black tabular-nums">
                        {formatNumber(qty, 1)} لتر
                      </p>
                      <p
                        className={cn(
                          'text-[10px] font-bold',
                          empty
                            ? 'text-red-700 dark:text-red-400'
                            : low
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-emerald-700 dark:text-emerald-400',
                        )}
                      >
                        {empty ? 'غير متوفر' : low ? 'مخزون منخفض' : 'متوفر'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--app-text-muted)]">{label}</dt>
      <dd className="font-bold tabular-nums">{value}</dd>
    </div>
  );
}
