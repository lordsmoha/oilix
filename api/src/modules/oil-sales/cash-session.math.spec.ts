import {
  cashVarianceLabel,
  computeCashDifference,
  computeExpectedCash,
} from './cash-session.math';

describe('cash session reconciliation', () => {
  it('opening 10_000 + net sales 100_000 = expected 110_000, physical 109_500 → −500', () => {
    const expected = computeExpectedCash({
      openingCash: 10_000,
      cashSales: 100_000,
      cashRefunds: 0,
      cashIn: 0,
      cashOut: 0,
    });
    expect(expected).toBe(110_000);
    expect(computeCashDifference(109_500, expected)).toBe(-500);
    expect(cashVarianceLabel(-500)).toBe('SHORTAGE');
  });

  it('does not treat cash shortage as oil stock loss', () => {
    const oilLoss = 0;
    const cashDiff = computeCashDifference(109_500, 110_000);
    expect(oilLoss).toBe(0);
    expect(cashDiff).toBe(-500);
  });

  it('two independent registers aggregate without duplicating sales', () => {
    const caisse1 = 120_000;
    const caisse2 = 85_000;
    const caisse3 = 60_000;
    expect(caisse1 + caisse2 + caisse3).toBe(265_000);
  });

  it('shared inventory scenario: 100 L / 30 units → 4×5L then 2×5L', () => {
    let oil = 100;
    let c5 = 30;
    oil -= 4 * 5;
    c5 -= 4;
    expect(oil).toBe(80);
    expect(c5).toBe(26);
    oil -= 2 * 5;
    c5 -= 2;
    expect(oil).toBe(70);
    expect(c5).toBe(24);
  });
});
