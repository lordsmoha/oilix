/**
 * Client-side sale amount preview (mirrors API oil-sales.math).
 * Server remains source of truth.
 */
export type SalePreview = {
  grossAmount: number;
  assistanceFixed: number;
  assistancePercent: number;
  assistancePercentAmount: number;
  assistancePerLitre: number;
  assistancePerLitreTotal: number;
  totalAssistance: number;
  finalAmount: number;
};

function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function finalizePreview(input: {
  grossAmount: number;
  oilQuantityL: number;
  assistanceFixed?: number;
  assistancePercent?: number;
  assistancePerLitre?: number;
}): SalePreview | null {
  const grossAmount = roundMoney(Number(input.grossAmount));
  const oilQuantityL = roundMoney(Number(input.oilQuantityL) || 0);
  const assistanceFixed = roundMoney(Number(input.assistanceFixed ?? 0));
  const assistancePercent = Number(input.assistancePercent ?? 0);
  const assistancePerLitre = roundMoney(Number(input.assistancePerLitre ?? 0));

  if (!(grossAmount >= 0) || oilQuantityL < 0) return null;
  if (assistanceFixed < 0 || assistancePercent < 0 || assistancePercent > 100) return null;
  if (assistancePerLitre < 0) return null;

  const assistancePerLitreTotal = roundMoney(oilQuantityL * assistancePerLitre);
  const assistancePercentAmount = roundMoney((grossAmount * assistancePercent) / 100);
  const totalAssistance = roundMoney(
    assistanceFixed + assistancePercentAmount + assistancePerLitreTotal,
  );
  if (totalAssistance > grossAmount) return null;
  const finalAmount = roundMoney(grossAmount - totalAssistance);
  if (finalAmount < 0) return null;

  return {
    grossAmount,
    assistanceFixed,
    assistancePercent,
    assistancePercentAmount,
    assistancePerLitre,
    assistancePerLitreTotal,
    totalAssistance,
    finalAmount,
  };
}

export function previewSaleAmounts(input: {
  quantityL: number;
  unitPrice: number;
  assistanceFixed?: number;
  assistancePercent?: number;
  assistancePerLitre?: number;
}): SalePreview | null {
  const quantityL = Number(input.quantityL);
  const unitPrice = Number(input.unitPrice);
  if (!(quantityL > 0) || !(unitPrice >= 0)) return null;
  return finalizePreview({
    grossAmount: roundMoney(quantityL * unitPrice),
    oilQuantityL: quantityL,
    assistanceFixed: input.assistanceFixed,
    assistancePercent: input.assistancePercent,
    assistancePerLitre: input.assistancePerLitre,
  });
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
  assistance?: {
    assistanceFixed?: number;
    assistancePercent?: number;
    assistancePerLitre?: number;
  },
): (SalePreview & { quantityL: number }) | null {
  if (!lines.length) return null;
  const resolved = lines.map(resolveDraftLine);
  if (resolved.some((r) => !r)) return null;
  const quantityL = roundMoney(resolved.reduce((s, r) => s + (r?.quantityL ?? 0), 0));
  const grossAmount = roundMoney(resolved.reduce((s, r) => s + (r?.lineGross ?? 0), 0));
  if (!(grossAmount > 0) && !(quantityL > 0)) return null;
  const rest = finalizePreview({
    grossAmount,
    oilQuantityL: quantityL,
    assistanceFixed: assistance?.assistanceFixed,
    assistancePercent: assistance?.assistancePercent,
    assistancePerLitre: assistance?.assistancePerLitre,
  });
  if (!rest) return null;
  return { ...rest, quantityL };
}
