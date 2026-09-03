/**
 * Documentation / concurrency-oriented test for the oil-sale cancel claim pattern.
 *
 * Production code (oil-sales.service cancelSale) uses:
 *   1. SELECT … FOR UPDATE on the sale row
 *   2. updateMany WHERE status = COMPLETED → CANCELLED (atomic claim)
 *   3. only the winner (count === 1) restores stock / cash
 *
 * This suite models that claim with an in-memory store so we can assert
 * two concurrent claimants cannot both "win" without hitting the DB.
 */

type SaleRow = { id: string; status: 'COMPLETED' | 'CANCELLED' };

function claimCancel(store: Map<string, SaleRow>, id: string): { won: boolean } {
  const row = store.get(id);
  if (!row || row.status !== 'COMPLETED') return { won: false };
  // Simulates updateMany WHERE status=COMPLETED — only one concurrent winner.
  row.status = 'CANCELLED';
  return { won: true };
}

describe('cancel claim concurrency pattern', () => {
  it('only one of two parallel claims restores side effects', async () => {
    const store = new Map<string, SaleRow>([['s1', { id: 's1', status: 'COMPLETED' }]]);
    let restores = 0;

    const run = async () => {
      // serialize claim section like a row lock would
      const result = claimCancel(store, 's1');
      if (result.won) {
        await Promise.resolve(); // stand-in for stock/cash restore
        restores += 1;
      }
    };

    await Promise.all([run(), run(), run()]);
    expect(restores).toBe(1);
    expect(store.get('s1')!.status).toBe('CANCELLED');
  });

  it('second claim after cancel fails', () => {
    const store = new Map<string, SaleRow>([['s1', { id: 's1', status: 'COMPLETED' }]]);
    expect(claimCancel(store, 's1').won).toBe(true);
    expect(claimCancel(store, 's1').won).toBe(false);
  });
});
