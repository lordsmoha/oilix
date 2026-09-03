import type { OliveTypeValue } from '@/lib/labels';

/** Ouvre le وصل الزبون dans un nouvel onglet. */
export function openClientReceipt(
  clientId: string,
  options?: { autoPrint?: boolean; oliveType?: OliveTypeValue },
) {
  const params = new URLSearchParams();
  if (options?.autoPrint) params.set('print', '1');
  if (options?.oliveType) params.set('oliveType', options.oliveType);
  const q = params.toString() ? `?${params.toString()}` : '';
  const w = window.open(`/receipt/client/${clientId}${q}`, '_blank', 'noopener');
  return w;
}
