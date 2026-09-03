import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PrintHistoryItem, PrintDocument } from './types';

const KEY = 'oilix-print-history';
const MAX = 80;

export async function listPrintHistory(): Promise<PrintHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrintHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addPrintHistory(item: Omit<PrintHistoryItem, 'id' | 'createdAt'> & { id?: string }) {
  const entry: PrintHistoryItem = {
    ...item,
    id: item.id ?? `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const prev = await listPrintHistory();
  const next = [entry, ...prev].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return entry;
}

export async function getPrintHistoryItem(id: string) {
  const list = await listPrintHistory();
  return list.find((x) => x.id === id) ?? null;
}

export function historyTitleFor(doc: PrintDocument) {
  if (doc.kind === 'card') {
    return `بطاقة #${doc.client.clientNumber}`;
  }
  return `وصل #${doc.client.clientNumber}`;
}

export function historySubtitleFor(doc: PrintDocument) {
  const name = `${doc.client.firstName} ${doc.client.lastName}`.trim();
  if (doc.kind === 'card') {
    return `${name} · ${doc.weightKg} كغ`;
  }
  return `${name} · ${doc.financial.totalAmount.toFixed(0)} دج`;
}
