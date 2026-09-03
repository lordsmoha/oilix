/**
 * Canonical Oil Sales thermal receipt route.
 *
 * Print documents live in the `(print)` route group (same as mill `/receipt/:id`).
 * They are NOT under `/print`, which is the Olive Mill print-center page.
 *
 * Wrong (404): `/print/oil-sale/:id`  — no App Router page exists there
 * Correct:      `/oil-sale/:id`       — `app/(print)/oil-sale/[id]/page.tsx`
 *
 * Always pass the sale UUID (`sale.id`), never the receipt number.
 */

export const OIL_SALE_RECEIPT_PATH = '/oil-sale';

/** Legacy URL used by older buttons — rewritten in next.config to the canonical path. */
export const OIL_SALE_RECEIPT_LEGACY_PATH = '/print/oil-sale';

export const OIL_SALE_RECEIPT_API = (saleId: string) =>
  `/oil-sales/sales/${encodeURIComponent(saleId)}/receipt`;

export const OIL_SALE_DETAIL_PATH = (saleId: string) =>
  `/sales/history/${encodeURIComponent(saleId)}`;

export function isOilSaleId(value: string | null | undefined): boolean {
  if (!value) return false;
  const id = value.trim();
  if (!id || id === 'undefined' || id === 'null') return false;
  if (/^\d+$/.test(id)) return false;
  return id.length >= 8;
}

export function oilSaleReceiptHref(
  saleId: string,
  options?: { autoPrint?: boolean },
): string {
  const id = saleId?.trim();
  if (!isOilSaleId(id)) {
    throw new Error('INVALID_OIL_SALE_ID');
  }
  const base = `${OIL_SALE_RECEIPT_PATH}/${encodeURIComponent(id)}`;
  if (options?.autoPrint) return `${base}?print=1`;
  return base;
}

export function openOilSaleReceipt(
  saleId: string,
  options?: { autoPrint?: boolean },
): Window | null {
  if (typeof window === 'undefined') return null;
  const href = oilSaleReceiptHref(saleId, options);
  return window.open(href, '_blank', 'noopener');
}

export type ReceiptOpenSource =
  | 'sales-list'
  | 'sale-details'
  | 'confirm-print'
  | 'reprint'
  | 'direct-url';

export function oilSaleReceiptHrefForSource(
  saleId: string,
  source: ReceiptOpenSource,
): string {
  return oilSaleReceiptHref(saleId, { autoPrint: source === 'confirm-print' });
}
