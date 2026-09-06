import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OIL_SALE_CLIENT_RECEIPT_PATH,
  OIL_SALE_DETAIL_PATH,
  OIL_SALE_RECEIPT_API,
  OIL_SALE_RECEIPT_LEGACY_PATH,
  OIL_SALE_RECEIPT_PATH,
  isOilSaleId,
  oilSaleClientReceiptHref,
  oilSaleReceiptHref,
  oilSaleReceiptHrefForSource,
} from './oil-sale-receipt.ts';

const saleId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('oil sale receipt routes', () => {
  it('opens from sales list with sale UUID, not receipt number', () => {
    assert.equal(oilSaleReceiptHrefForSource(saleId, 'sales-list'), `/oil-sale/${saleId}`);
    assert.equal(isOilSaleId('125'), false);
    assert.throws(() => oilSaleReceiptHref('125'), /INVALID_OIL_SALE_ID/);
  });

  it('opens from sale details with the same canonical path', () => {
    assert.equal(OIL_SALE_DETAIL_PATH(saleId), `/sales/history/${saleId}`);
    assert.equal(oilSaleReceiptHrefForSource(saleId, 'sale-details'), `/oil-sale/${saleId}`);
  });

  it('Confirm Sale & Print uses autoPrint query on the canonical route', () => {
    assert.equal(
      oilSaleReceiptHrefForSource(saleId, 'confirm-print'),
      `/oil-sale/${saleId}?print=1`,
    );
  });

  it('Reprint uses the same route as first print (no /print prefix)', () => {
    assert.equal(oilSaleReceiptHrefForSource(saleId, 'reprint'), `/oil-sale/${saleId}`);
  });

  it('direct URL and refresh resolve to /oil-sale/:id (print route group)', () => {
    assert.equal(oilSaleReceiptHrefForSource(saleId, 'direct-url'), `${OIL_SALE_RECEIPT_PATH}/${saleId}`);
    assert.equal(OIL_SALE_RECEIPT_PATH, '/oil-sale');
    assert.equal(OIL_SALE_RECEIPT_LEGACY_PATH, '/print/oil-sale');
  });

  it('client delivery slip resolves to /oil-sale-client/:id', () => {
    assert.equal(OIL_SALE_CLIENT_RECEIPT_PATH, '/oil-sale-client');
    assert.equal(oilSaleClientReceiptHref(saleId), `/oil-sale-client/${saleId}`);
    assert.equal(
      oilSaleClientReceiptHref(saleId, { autoPrint: true }),
      `/oil-sale-client/${saleId}?print=1`,
    );
  });

  it('rejects missing / invalid ids so callers cannot generate a 404 URL', () => {
    assert.equal(isOilSaleId(''), false);
    assert.equal(isOilSaleId('undefined'), false);
    assert.throws(() => oilSaleReceiptHref(''), /INVALID_OIL_SALE_ID/);
  });

  it('API path uses sale UUID', () => {
    assert.equal(OIL_SALE_RECEIPT_API(saleId), `/oil-sales/sales/${saleId}/receipt`);
  });
});
