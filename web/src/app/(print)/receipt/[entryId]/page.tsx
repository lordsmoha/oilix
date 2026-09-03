'use client';

import { use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ReceiptDocument, type ReceiptData } from '@/components/print/receipt-document';
import { ThermalPrintFrame } from '@/components/print/thermal-print-frame';
import { Button } from '@/components/ui/button';

export default function ReceiptPrintPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['receipt', entryId],
    queryFn: async () => (await api.get<ReceiptData>(`/reports/receipt/${entryId}`)).data,
    retry: false,
  });

  useEffect(() => {
    if (data) document.title = `وصل ${data.referenceNumber}`;
  }, [data]);

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
        <p className="text-lg font-bold text-red-600">تعذر تحميل الوصل</p>
        <Button variant="outline" onClick={() => window.close()}>
          إغلاق
        </Button>
      </div>
    );
  }

  return (
    <ThermalPrintFrame title={`وصل معالجة · ${data.referenceNumber}`}>
      <ReceiptDocument data={data} />
    </ThermalPrintFrame>
  );
}
