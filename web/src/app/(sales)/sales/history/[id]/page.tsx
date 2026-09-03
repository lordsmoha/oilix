'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { oilMeta, oilSourceMeta } from '@/lib/sales-nav';
import { formatNumber, formatDateTimeDz } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import { openOilSaleReceipt } from '@/lib/oil-sale-receipt';

type SaleDetail = {
  id: string;
  receiptNumber: number;
  oilSource?: string | null;
  oilType?: string | null;
  quantityL: string | number;
  unitPrice: string | number;
  grossAmount: string | number;
  assistanceFixed: string | number;
  assistancePercent: string | number;
  assistancePercentAmount: string | number;
  totalAssistance: string | number;
  finalAmount: string | number;
  status: string;
  saleDate: string;
  saleTime: string;
  createdAt: string;
  notes?: string | null;
  customer: { id: string; name: string; phone?: string | null };
  createdBy?: { username: string; firstName?: string | null; lastName?: string | null };
    items?: Array<{
      kind: 'CONTAINER' | 'LOOSE' | 'CONTAINER_ONLY';
      containerName?: string | null;
      containerCount?: number | null;
      quantityL: string | number;
      lineGross: string | number;
    }>;
};

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const canPrint = useAuthStore((s) => s.hasPermission('OIL_SALES_PRINT_RECEIPT'));
  const canReprint = useAuthStore((s) => s.hasPermission('OIL_SALES_SALES_REPRINT'));
  const canOpenReceipt = canPrint || canReprint;

  const q = useQuery({
    queryKey: ['oil-sale', id],
    queryFn: async () => (await api.get<SaleDetail>(`/oil-sales/sales/${id}`)).data,
    retry: false,
  });

  const status = axios.isAxiosError(q.error) ? q.error.response?.status : undefined;

  if (q.isLoading) {
    return <p className="text-sm text-[var(--app-text-dim)]">جاري التحميل...</p>;
  }

  if (status === 403) {
    return (
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center">
        <p className="font-bold">ليس لديك صلاحية عرض هذا البيع</p>
        <Link href="/sales/history" className="mt-4 inline-block text-amber-800 underline">
          العودة إلى المبيعات
        </Link>
      </div>
    );
  }

  if (status === 404 || !q.data) {
    return (
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center">
        <p className="font-bold">البيع غير موجود</p>
        <Link href="/sales/history" className="mt-4 inline-block text-amber-800 underline">
          العودة إلى المبيعات
        </Link>
      </div>
    );
  }

  const s = q.data;
  const src = s.oilSource ? oilSourceMeta(s.oilSource) : null;
  const m = s.oilType ? oilMeta(s.oilType) : null;
  const operator =
    [s.createdBy?.firstName, s.createdBy?.lastName].filter(Boolean).join(' ') ||
    s.createdBy?.username ||
    '—';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/sales/history" className="text-sm text-amber-800 underline">
            المبيعات
          </Link>
          <h1 className="text-2xl font-black">وصل #{s.receiptNumber}</h1>
          <p className="text-sm text-[var(--app-text-dim)]">{formatDateTimeDz(s.createdAt)}</p>
        </div>
        {canOpenReceipt ? (
          <Button
            type="button"
            className="gap-2 bg-amber-700 hover:bg-amber-800"
            onClick={() => openOilSaleReceipt(s.id)}
          >
            <Printer className="h-4 w-4" />
            طباعة الوصل
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 space-y-3 text-sm">
        <p>
          <span className="text-[var(--app-text-dim)]">الزبون: </span>
          <strong>{s.customer.name}</strong>
        </p>
        {src && m ? (
          <p>
            <span className="text-[var(--app-text-dim)]">المصدر: </span>
            {src.label}
          </p>
        ) : null}
        {m ? (
          <p>
            <span className="text-[var(--app-text-dim)]">النوع: </span>
            {m.emoji} {m.label}
          </p>
        ) : (
          <p>
            <span className="text-[var(--app-text-dim)]">النوع: </span>
            ضلف فقط
          </p>
        )}
        <p>
          <span className="text-[var(--app-text-dim)]">الحالة: </span>
          {s.status === 'CANCELLED' ? 'ملغى' : 'مكتمل'}
        </p>
        {(s.items ?? []).length > 0 ? (
          <ul className="divide-y divide-[var(--app-border)] rounded-xl border border-[var(--app-border)]">
            {s.items!.map((item, i) => (
              <li key={i} className="flex justify-between px-3 py-2">
                <span>
                  {item.kind === 'CONTAINER'
                    ? `${item.containerCount} × ${item.containerName} (زيت)`
                    : item.kind === 'CONTAINER_ONLY'
                      ? `${item.containerCount} × ${item.containerName} (منتج)`
                      : `${formatNumber(Number(item.quantityL), 1)} لتر`}
                </span>
                <span className="tabular-nums">{formatNumber(Number(item.lineGross), 0)} د.ج</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p>
          إجمالي الزيت: <strong>{formatNumber(Number(s.quantityL), 1)} لتر</strong>
        </p>
        <p>الإجمالي: {formatNumber(Number(s.grossAmount), 0)} د.ج</p>
        <p>المساعدات: {formatNumber(Number(s.totalAssistance), 0)} د.ج</p>
        <p className="text-lg font-black">الصافي: {formatNumber(Number(s.finalAmount), 0)} د.ج</p>
        <p className="text-xs text-[var(--app-text-dim)]">العامل: {operator}</p>
      </div>
    </div>
  );
}
