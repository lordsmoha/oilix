import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { WeighingEntry } from '@/lib/types';
import { addPrintHistory, historySubtitleFor, historyTitleFor } from './history';
import { buildClientCardHtml, buildClientReceiptHtml, oliveTypeInfo } from './thermal-html';
import type { ClientCardPrintData, ClientReceiptPrintData, PrintDocument } from './types';

function amountFromWeight(pricePerQuintal: number, weightKg: number) {
  return (weightKg / 100) * pricePerQuintal;
}

export async function fetchClientCard(
  clientId: string,
  oliveType: string,
): Promise<ClientCardPrintData> {
  try {
    const { data } = await api.get(`/reports/client-card/${clientId}`, {
      params: { oliveType },
    });
    return { kind: 'card', ...data };
  } catch {
    /* fallback local */
  }

  const { data: client } = await api.get(`/clients/${clientId}`);
  const { data: entriesPage } = await api.get<{ items: WeighingEntry[] }>('/olive-entries', {
    params: { clientId, oliveType, limit: 200 },
  });
  const items = entriesPage.items ?? [];
  if (!items.length) throw new Error('لا توجد أوزان لهذا الزبون');

  return buildCardFromTotals({
    oliveType,
    clientNumber: client.clientNumber,
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    bags: items.reduce((s, e) => s + e.bagCount, 0),
    weightKg: items.reduce((s, e) => s + Number(e.totalWeightKg), 0),
    adhlef: items.reduce((s, e) => s + (e.adhlefCount ?? 0), 0),
    capacity: items.reduce((s, e) => s + Number(e.capacity ?? 0), 0),
    entryCount: items.length,
  });
}

export async function fetchClientReceipt(
  clientId: string,
  oliveType: string,
): Promise<ClientReceiptPrintData> {
  const printedBy = (() => {
    const u = useAuth.getState().user;
    if (!u) return null;
    return u.firstName || u.username;
  })();

  try {
    const { data } = await api.get(`/reports/client-receipt/${clientId}`, {
      params: { oliveType },
    });
    return {
      kind: 'receipt',
      ...data,
      printedAt: data.printedAt ?? new Date().toISOString(),
      printedBy,
    };
  } catch {
    /* fallback local si permission reports absente */
  }

  return buildLocalReceipt(clientId, oliveType);
}

async function buildLocalReceipt(
  clientId: string,
  oliveType: string,
): Promise<ClientReceiptPrintData> {
  const [{ data: client }, { data: entriesPage }] = await Promise.all([
    api.get(`/clients/${clientId}`),
    api.get<{ items: WeighingEntry[] }>('/olive-entries', {
      params: { clientId, oliveType, limit: 200 },
    }),
  ]);

  let companyName = 'أوليكس';
  let pricePerQuintal = 0;
  let seasonName: string | null = null;
  try {
    const { data: settings } = await api.get('/settings');
    const map = Object.fromEntries(
      (settings.settings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value]),
    ) as Record<string, unknown>;
    if (typeof map.companyName === 'string') companyName = map.companyName;
    if (typeof map.pricePerQuintal === 'number') pricePerQuintal = map.pricePerQuintal;
    seasonName = settings.activeSeason?.name ?? null;
  } catch {
    /* ignore */
  }

  const items = entriesPage.items ?? [];
  const totalBags = items.reduce((s, e) => s + e.bagCount, 0);
  const totalWeightKg = items.reduce((s, e) => s + Number(e.totalWeightKg), 0);
  const totalAdhlef = items.reduce((s, e) => s + (e.adhlefCount ?? 0), 0);
  const totalCapacity = items.reduce((s, e) => s + Number(e.capacity ?? 0), 0);
  const u = useAuth.getState().user;

  return {
    kind: 'receipt',
    company: { name: companyName, pricePerQuintal },
    seasonName,
    printedAt: new Date().toISOString(),
    oliveTypes: [oliveTypeInfo(oliveType)],
    client: {
      clientNumber: client.clientNumber,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone ?? '',
    },
    weighing: {
      entryCount: items.length,
      totalBags,
      totalWeightKg,
      totalAdhlef,
      totalCapacity,
    },
    financial: { totalAmount: amountFromWeight(pricePerQuintal, totalWeightKg) },
    printedBy: u?.firstName || u?.username || null,
  };
}

export function documentToHtml(doc: PrintDocument): string {
  return doc.kind === 'card' ? buildClientCardHtml(doc) : buildClientReceiptHtml(doc);
}

export async function createPdfAsync(doc: PrintDocument) {
  const html = documentToHtml(doc);
  const file = await Print.printToFileAsync({ html, width: 302, height: 800 });
  return file.uri;
}

/** Ouvre le sélecteur d’imprimante natif (Bluetooth / Wi‑Fi / USB / AirPrint). */
export async function printViaSystem(doc: PrintDocument) {
  const html = documentToHtml(doc);
  await Print.printAsync({ html });
}

export async function sharePdf(doc: PrintDocument) {
  const uri = await createPdfAsync(doc);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('المشاركة غير متاحة على هذا الجهاز');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: historyTitleFor(doc),
    UTI: 'com.adobe.pdf',
  });
}

export async function downloadPdf(doc: PrintDocument) {
  return createPdfAsync(doc);
}

export async function rememberPrintWithMeta(
  doc: PrintDocument,
  meta: { clientId: string; oliveType: string },
) {
  await addPrintHistory({
    title: historyTitleFor(doc),
    subtitle: historySubtitleFor(doc),
    docKind: doc.kind,
    clientId: meta.clientId,
    oliveType: meta.oliveType,
    document: doc,
  });
}

/** Construit une carte locale à partir des totaux déjà connus (board). */
export function buildCardFromTotals(input: {
  oliveType: string;
  clientNumber: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  bags: number;
  weightKg: number;
  adhlef: number;
  capacity: number;
  entryCount: number;
  seasonName?: string | null;
}): ClientCardPrintData {
  return {
    kind: 'card',
    seasonName: input.seasonName ?? null,
    entryCount: input.entryCount,
    oliveType: oliveTypeInfo(input.oliveType),
    client: {
      clientNumber: input.clientNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
    },
    bags: input.bags,
    weightKg: input.weightKg,
    adhlef: input.adhlef,
    capacity: input.capacity,
  };
}
