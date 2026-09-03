import { api } from '@/lib/api';
import type { BatchCardsPrintData } from '@/components/print/batch-cards-document';
import type { OliveTypeValue } from '@/lib/labels';
import { BUSINESS_NAME } from '@/lib/labels';
import { oliveTypePrintInfo } from '@/lib/olive-type-labels';
import { savePrintPayload } from '@/lib/print-storage';

type ClientCardApi = {
  seasonName: string | null;
  entryCount: number;
  oliveType: BatchCardsPrintData['rows'][0]['oliveType'];
  client: {
    clientNumber: number;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  bags: number;
  capacity: number;
  adhlef: number;
  weightKg: number;
};

/** Ouvre la بطاقة تعريف (valeurs cumulées) dans un nouvel onglet. */
export async function openClientCard(clientId: string, oliveType: OliveTypeValue) {
  const { data } = await api.get<ClientCardApi>(`/reports/client-card/${clientId}`, {
    params: { oliveType },
  });

  const oliveTypePrint = oliveTypePrintInfo(oliveType);
  if (!oliveTypePrint) return;

  const payload: BatchCardsPrintData = {
    type: 'cards',
    meta: {
      title: `بطاقة زبون ${data.client.clientNumber}`,
      oliveTypePrint,
      companyName: BUSINESS_NAME,
      seasonName: data.seasonName,
      printedAt: new Date().toISOString(),
      referenceFrom: null,
      referenceTo: null,
      total: 1,
    },
    rows: [
      {
        clientId,
        referenceNumber: data.client.clientNumber,
        entryCount: data.entryCount,
        oliveType: data.oliveType,
        client: data.client,
        bags: data.bags,
        weightKg: data.weightKg,
        capacity: data.capacity,
        adhlef: data.adhlef,
      },
    ],
  };

  savePrintPayload(payload);
  window.open('/batch-cards', '_blank', 'noopener');
}
