'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  OilDayReportDocument,
  buildOilDayReportPayload,
} from '@/components/print/oil-day-report-document';
import { ThermalPrintFrame } from '@/components/print/thermal-print-frame';
import { Button } from '@/components/ui/button';

type Report = {
  summary: { net: number };
  byBucket?: Array<{
    oilSource: string;
    oilType: string;
    litres: number;
    gross: number;
    assistance: number;
    net: number;
    stock: {
      totalAdded: number;
      theoreticalQty: number;
      physicalQty: number | null;
      lossQty: number;
    } | null;
  }>;
};

function formatDayLabel(iso: string) {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function todayIso() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function OilDayReportPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500">
          جاري تحميل اليومية...
        </div>
      }
    >
      <OilDayReportBody />
    </Suspense>
  );
}

function OilDayReportBody() {
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';
  const date = searchParams.get('date') || todayIso();
  const from = searchParams.get('from') || date;
  const to = searchParams.get('to') || date;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['oil-day-report', from, to],
    queryFn: async () =>
      (
        await api.get<Report>('/oil-sales/reports', {
          params: { from, to },
        })
      ).data,
  });

  const payload = useMemo(() => {
    if (!data) return null;
    const label =
      from === to ? formatDayLabel(from) : `${formatDayLabel(from)} → ${formatDayLabel(to)}`;
    return buildOilDayReportPayload(data, label);
  }, [data, from, to]);

  useEffect(() => {
    if (payload) document.title = `يومية بيع الزيت ${payload.dateLabel}`;
  }, [payload]);

  useEffect(() => {
    if (!autoPrint || !payload) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [autoPrint, payload]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500">
        جاري تحميل اليومية...
      </div>
    );
  }

  if (isError || !payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-100 p-8 text-center">
        <p className="text-lg font-bold text-red-600">تعذر تحميل اليومية</p>
        <Button variant="outline" onClick={() => window.close()}>
          إغلاق
        </Button>
      </div>
    );
  }

  return (
    <ThermalPrintFrame title={`يومية بيع الزيت · ${payload.dateLabel}`}>
      <OilDayReportDocument data={payload} />
    </ThermalPrintFrame>
  );
}
