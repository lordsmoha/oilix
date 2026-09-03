export type WeighingFieldInput = {
  bagCount: string | number;
  adhlefCount: string | number;
  capacity: string | number;
  weightKg: string | number;
};

export function parseWeighingFields(raw: WeighingFieldInput) {
  const bags = Number(raw.bagCount);
  const adhlef = Number(raw.adhlefCount);
  const cap = Number(String(raw.capacity).replace(',', '.'));
  const weight = Number(String(raw.weightKg).replace(',', '.'));

  if (!Number.isFinite(bags) || !Number.isInteger(bags) || bags < 1) {
    return { ok: false as const, error: 'أدخل عدد الأكياس (1 على الأقل)' };
  }
  if (!Number.isFinite(adhlef) || !Number.isInteger(adhlef) || adhlef < 0) {
    return { ok: false as const, error: 'أدخل عدد الضلف (0 مسموح)' };
  }
  if (!Number.isFinite(cap) || cap < 0) {
    return { ok: false as const, error: 'أدخل السعة (0 مسموح)' };
  }
  if (!Number.isFinite(weight) || weight <= 0) {
    return { ok: false as const, error: 'أدخل الوزن' };
  }

  return {
    ok: true as const,
    data: { bagCount: bags, adhlefCount: adhlef, capacity: cap, weightKg: weight },
  };
}
