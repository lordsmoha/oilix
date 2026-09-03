/** 1 quintal (ق) = 100 kg */
export const KG_PER_QUINTAL = 100;

export const PRICE_UNIT_LABEL = 'دج/ق';

export function amountFromWeightQuintal(
  pricePerQuintal: number,
  totalWeightKg: number,
): number {
  return (
    Math.round((totalWeightKg / KG_PER_QUINTAL) * pricePerQuintal * 100) / 100
  );
}

/** @deprecated Use amountFromWeightQuintal — kept as alias during rename */
export function computePressingAmount(
  pricePerQuintal: number,
  totalWeightKg: number,
): number {
  return amountFromWeightQuintal(pricePerQuintal, totalWeightKg);
}

export function formatPricePerQuintal(
  pricePerQuintal: number,
  formatNumber: (n: number, d?: number) => string,
): string {
  return `${formatNumber(pricePerQuintal)} ${PRICE_UNIT_LABEL}`;
}
