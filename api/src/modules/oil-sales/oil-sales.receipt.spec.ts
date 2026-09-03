import { hasPermission } from '../../common/permissions/permission-catalog';

describe('oil sale receipt permissions', () => {
  it('denies receipt access without print or reprint permission', () => {
    const held = ['OIL_SALES_SALES_VIEW', 'OIL_SALES_ACCESS'];
    expect(hasPermission(held, 'OIL_SALES_PRINT_RECEIPT')).toBe(false);
  });

  it('grants receipt API when user has PRINT_RECEIPT', () => {
    expect(hasPermission(['OIL_SALES_PRINT_RECEIPT'], 'OIL_SALES_PRINT_RECEIPT')).toBe(true);
  });

  it('reprint permission expands to PRINT_RECEIPT so reprint hits the same API', () => {
    expect(hasPermission(['OIL_SALES_SALES_REPRINT'], 'OIL_SALES_PRINT_RECEIPT')).toBe(true);
  });

  it('ADMIN bypasses receipt permission checks', () => {
    expect(hasPermission([], 'OIL_SALES_PRINT_RECEIPT', 'ADMIN')).toBe(true);
  });
});
