/**
 * Client-side sale amount preview (mirrors API oil-sales.math).
 * Server remains source of truth.
 */
export type SalePreview = {
  grossAmount: number;
  assistanceFixed: number;
  assistancePercent: number;
  assistancePercentAmount: number;
  totalAssistance: number;
  finalAmount: number;
};

function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function previewSaleAmounts(input: {
  quantityL: number;
  unitPrice: number;
  assistanceFixed?: number;
  assistancePercent?: number;
}): SalePreview | null {
  const quantityL = Number(input.quantityL);
  const unitPrice = Number(input.unitPrice);
  const assistanceFixed = roundMoney(Number(input.assistanceFixed ?? 0));
  const assistancePercent = Number(input.assistancePercent ?? 0);

  if (!(quantityL > 0) || !(unitPrice >= 0)) return null;
  if (assistanceFixed < 0 || assistancePercent < 0 || assistancePercent > 100) return null;

  const grossAmount = roundMoney(quantityL * unitPrice);
  const assistancePercentAmount = roundMoney((grossAmount * assistancePercent) / 100);
  const totalAssistance = roundMoney(assistanceFixed + assistancePercentAmount);
  if (totalAssistance > grossAmount) return null;
  const finalAmount = roundMoney(grossAmount - totalAssistance);
  if (finalAmount < 0) return null;

  return {
    grossAmount,
    assistanceFixed,
    assistancePercent,
    assistancePercentAmount,
    totalAssistance,
    finalAmount,
  };
}

export type SaleLineKind = 'CONTAINER' | 'LOOSE' | 'CONTAINER_ONLY';

export type DraftSaleLine = {
  kind: SaleLineKind;
  containerId?: string;
  containerName?: string;
  capacityL?: number;
  containerCount?: number;
  quantityL?: number;
  unitPrice: number;
  containerPrice?: number;
};

export function resolveDraftLine(line: DraftSaleLine) {
  if (line.kind === 'CONTAINER_ONLY') {
    const containerCount = Number(line.containerCount);
    if (!(containerCount >= 1)) return null;
    const price = Number(line.containerPrice ?? line.unitPrice);
    if (!(price >= 0)) return null;
    return {
      quantityL: 0,
      lineGross: roundMoney(containerCount * price),
    };
  }
  if (line.kind === 'CONTAINER') {
    const capacityL = Number(line.capacityL);
    const containerCount = Number(line.containerCount);
    if (!(capacityL > 0) || !(containerCount >= 1)) return null;
    const quantityL = roundMoney(capacityL * containerCount);
    return {
      quantityL,
      lineGross: roundMoney(quantityL * Number(line.unitPrice)),
    };
  }
  const quantityL = Number(line.quantityL);
  if (!(quantityL > 0)) return null;
  return {
    quantityL: roundMoney(quantityL),
    lineGross: roundMoney(quantityL * Number(line.unitPrice)),
  };
}

export function previewSaleFromLines(
  lines: DraftSaleLine[],
  assistance?: { assistanceFixed?: number; assistancePercent?: number },
): (SalePreview & { quantityL: number }) | null {
  if (!lines.length) return null;
  const resolved = lines.map(resolveDraftLine);
  if (resolved.some((r) => !r)) return null;
  const quantityL = roundMoney(resolved.reduce((s, r) => s + (r?.quantityL ?? 0), 0));
  const grossAmount = roundMoney(resolved.reduce((s, r) => s + (r?.lineGross ?? 0), 0));
  if (!(grossAmount > 0) && !(quantityL > 0)) return null;
  const rest = previewSaleAmounts({
    quantityL: 1,
    unitPrice: grossAmount,
    assistanceFixed: assistance?.assistanceFixed,
    assistancePercent: assistance?.assistancePercent,
  });
  if (!rest) return null;
  return { ...rest, quantityL };
}

