'use client';

import { useEffect, useState } from 'react';
import {
  BatchCardsDocument,
  type BatchCardsPrintData,
} from '@/components/print/batch-cards-document';
import { ThermalPrintFrame } from '@/components/print/thermal-print-frame';
import { Button } from '@/components/ui/button';
import { clearPrintPayload, loadPrintPayload } from '@/lib/print-storage';

export default function BatchCardsPrintPage() {
  const [data, setData] = useState<BatchCardsPrintData | null>(null);

  useEffect(() => {
    const payload = loadPrintPayload();
    if (payload?.type === 'cards') {
      setData(payload);
      document.title = payload.meta.title;
      clearPrintPayload();
    }
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-100 p-8">
        <p className="text-center text-lg font-bold text-stone-700">
          لا توجد بيانات طباعة. ارجع إلى مركز الطباعة واختر «البطاقات».
        </p>
        <Button variant="outline" onClick={() => window.close()}>
          إغلاق
        </Button>
      </div>
    );
  }

  return (
    <ThermalPrintFrame title={data.meta.title}>
      <BatchCardsDocument data={data} />
    </ThermalPrintFrame>
  );
}
