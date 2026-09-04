'use client';

import { Suspense, use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/lib/api';
import {
  OilDebtPaymentReceiptDocument,
  type OilDebtPaymentReceiptPayload,
} from '@/components/print/oil-debt-payment-receipt-document';
import { ThermalPrintFrame } from '@/components/print/thermal-print-frame';
import { Button } from '@/components/ui/button';

export default function OilDebtPaymentPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500">
          جاري تحميل وصل التسديد...
        </div>
      }
    >
      <Body id={id} />
    </Suspense>
  );
}

function Body({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['oil-debt-payment-receipt', id],
    queryFn: async () =>
      (
        await api.get<OilDebtPaymentReceiptPayload>(
          `/oil-sales/debts/payments/${encodeURIComponent(id)}/receipt`,
        )
      ).data,
    retry: false,
    enabled: !!id,
  });

  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  useEffect(() => {
    if (data) document.title = `تسديد PAY-${String(data.payment.receiptNumber).padStart(6, '0')}`;
  }, [data]);

  useEffect(() => {
    if (!autoPrint || !data) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [autoPrint, data]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500">
        جاري تحميل وصل التسديد...
      </div>
    );
  }

  if (status === 403 || status === 404 || isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-100 p-8 text-center">
        <p className="text-lg font-bold text-red-600">تعذر تحميل وصل التسديد</p>
        <Button variant="outline" onClick={() => window.close()}>
          إغلاق
        </Button>
      </div>
    );
  }

  return (
    <ThermalPrintFrame title={`تسديد دين · PAY-${String(data.payment.receiptNumber).padStart(6, '0')}`}>
      <OilDebtPaymentReceiptDocument data={data} />
    </ThermalPrintFrame>
  );
}
