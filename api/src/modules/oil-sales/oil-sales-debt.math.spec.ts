import {
  allocateDebtPaymentFifo,
  computeSalePaymentFields,
  roundMoney,
} from './oil-sales-debt.math';

describe('oil-sales-debt.math', () => {
  describe('computeSalePaymentFields', () => {
    it('full payment', () => {
      const r = computeSalePaymentFields(20000, 20000);
      expect(r.remainingAmount).toBe(0);
      expect(r.paymentStatus).toBe('PAID');
    });

    it('partial payment', () => {
      const r = computeSalePaymentFields(20000, 8000);
      expect(r.remainingAmount).toBe(12000);
      expect(r.paymentStatus).toBe('PARTIALLY_PAID');
    });

    it('unpaid', () => {
      const r = computeSalePaymentFields(20000, 0);
      expect(r.remainingAmount).toBe(20000);
      expect(r.paymentStatus).toBe('UNPAID');
    });

    it('rejects overpayment', () => {
      expect(() => computeSalePaymentFields(10000, 12000)).toThrow('PAYMENT_EXCEEDS_NET');
    });
  });

  describe('allocateDebtPaymentFifo', () => {
    it('acceptance: 12k + 10k debt, pay 7k → oldest first', () => {
      const alloc = allocateDebtPaymentFifo(
        [
          { saleId: 'A', remainingAmount: 12000, saleDate: '2026-09-01' },
          { saleId: 'B', remainingAmount: 10000, saleDate: '2026-09-03' },
        ],
        7000,
      );
      expect(alloc).toEqual([{ saleId: 'A', amount: 7000 }]);
    });

    it('acceptance: after 7k, remaining A=5k B=10k; pay 15k clears all', () => {
      const alloc = allocateDebtPaymentFifo(
        [
          { saleId: 'A', remainingAmount: 5000, saleDate: '2026-09-01' },
          { saleId: 'B', remainingAmount: 10000, saleDate: '2026-09-03' },
        ],
        15000,
      );
      expect(alloc).toEqual([
        { saleId: 'A', amount: 5000 },
        { saleId: 'B', amount: 10000 },
      ]);
      const leftA = roundMoney(5000 - 5000);
      const leftB = roundMoney(10000 - 10000);
      expect(leftA + leftB).toBe(0);
    });

    it('splits across sales when payment covers first fully', () => {
      const alloc = allocateDebtPaymentFifo(
        [
          { saleId: 'A', remainingAmount: 5000, saleDate: '2026-09-01' },
          { saleId: 'B', remainingAmount: 10000, saleDate: '2026-09-02' },
        ],
        7000,
      );
      expect(alloc).toEqual([
        { saleId: 'A', amount: 5000 },
        { saleId: 'B', amount: 2000 },
      ]);
    });

    it('rejects payment exceeding total debt', () => {
      expect(() =>
        allocateDebtPaymentFifo([{ saleId: 'A', remainingAmount: 10000 }], 12000),
      ).toThrow('PAYMENT_EXCEEDS_DEBT');
    });
  });
});
