/** 1 quintal (ق) = 100 kg — unité de tarification affichée dans l'application. */
export const KG_PER_QUINTAL = 100;

export function amountFromWeightQuintal(
  pricePerQuintal: number,
  totalWeightKg: number,
): number {
  return (
    Math.round((totalWeightKg / KG_PER_QUINTAL) * pricePerQuintal * 100) / 100
  );
}

export function pricePerKgFromQuintal(pricePerQuintal: number): number {
  return pricePerQuintal / KG_PER_QUINTAL;
}

export function pricePerQuintalFromKg(pricePerKg: number): number {
  return pricePerKg * KG_PER_QUINTAL;
}

/** مساعدة تغطي كامل المبلغ (100%) */
export function isFullPriceAid(amount: number, aidAmount: number): boolean {
  return amount > 0 && aidAmount + 1e-6 >= amount;
}
