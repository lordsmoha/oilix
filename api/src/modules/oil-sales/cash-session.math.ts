import { roundMoney } from './oil-sales.math';

export type CashSessionTotals = {
  openingCash: number;
  cashSales: number;
  cashRefunds: number;
  cashIn: number;
  cashOut: number;
};

export function computeExpectedCash(input: CashSessionTotals): number {
  return roundMoney(
    Number(input.openingCash || 0) +
      Number(input.cashSales || 0) +
      Number(input.cashIn || 0) -
      Number(input.cashRefunds || 0) -
      Number(input.cashOut || 0),
  );
}

/** Physical − expected. Negative = shortage, positive = surplus. */
export function computeCashDifference(physicalCash: number, expectedCash: number): number {
  return roundMoney(Number(physicalCash) - Number(expectedCash));
}

export function cashVarianceLabel(difference: number): 'BALANCED' | 'SURPLUS' | 'SHORTAGE' {
  if (Math.abs(difference) < 1e-9) return 'BALANCED';
  return difference > 0 ? 'SURPLUS' : 'SHORTAGE';
}
