'use client';

import { Suspense, use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ClientReceiptDocument,
  type ClientReceiptData,
} from '@/components/print/client-receipt-document';
import { ThermalPrintFrame } from '@/components/print/thermal-print-frame';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

function ClientReceiptContent({ clientId }: { clientId: string }) {
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';
  const oliveType = searchParams.get('oliveType') ?? undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['client-receipt', clientId, oliveType],
    queryFn: async () =>
      (
        await api.get<ClientReceiptData>(`/reports/client-receipt/${clientId}`, {
          params: oliveType ? { oliveType } : undefined,
        })
      ).data,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      document.title = `وصل زبون ${data.client.clientNumber}`;
    }
  }, [data]);

  useEffect(() => {
    if (!autoPrint || !data) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [autoPrint, data]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500">
        جاري تحميل الوصل...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-100 p-8">
        <p className="text-lg font-bold text-red-600">تعذر تحميل وصل الزبون</p>
        <Button variant="outline" onClick={() => window.close()}>
          إغلاق
        </Button>
      </div>
    );
  }

  return (
    <ThermalPrintFrame title={`وصل زبون · ${data.client.clientNumber}`}>
      <ClientReceiptDocument data={data} />
    </ThermalPrintFrame>
  );
}

export default function ClientReceiptPrintPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-stone-500">
          جاري التحميل...
        </div>
      }
    >
      <ClientReceiptContent clientId={clientId} />
    </Suspense>
  );
}
