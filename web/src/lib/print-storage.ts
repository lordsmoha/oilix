import type { BatchCardsPrintData } from '@/components/print/batch-cards-document';
import type { BatchReceiptsPrintData } from '@/components/print/batch-receipts-document';
import type { ClientPhonesPrintData } from '@/components/print/client-phones-document';

export const PRINT_PAYLOAD_KEY = 'oilix-print-payload';

export type PrintPayload = ClientPhonesPrintData | BatchReceiptsPrintData | BatchCardsPrintData;

export function savePrintPayload(payload: PrintPayload) {
  sessionStorage.setItem(PRINT_PAYLOAD_KEY, JSON.stringify(payload));
}

export function loadPrintPayload(): PrintPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PRINT_PAYLOAD_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PrintPayload;
    if (data?.type === 'phones' && Array.isArray((data as ClientPhonesPrintData).rows)) {
      return data;
    }
    if (data?.type === 'receipts' && Array.isArray((data as BatchReceiptsPrintData).rows)) {
      return data;
    }
    if (data?.type === 'cards' && Array.isArray((data as BatchCardsPrintData).rows)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPrintPayload() {
  sessionStorage.removeItem(PRINT_PAYLOAD_KEY);
}
