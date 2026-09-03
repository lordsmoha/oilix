import { OilSource, OilType } from '@prisma/client';
import {
  allOilBuckets,
  oilBucketKey,
  parseOilBucketKey,
} from './oil-catalog';

/**
 * In-memory model of independent oil stock buckets (source × type).
 * Mirrors production deduction rules without requiring a database.
 */
class OilStockSimulator {
  private buckets = new Map<string, number>();
  private containerUnits = 0;

  constructor() {
    for (const { oilSource, oilType } of allOilBuckets()) {
      this.buckets.set(oilBucketKey(oilSource, oilType), 0);
    }
  }

  set(source: OilSource, type: OilType, qty: number) {
    this.buckets.set(oilBucketKey(source, type), qty);
  }

  get(source: OilSource, type: OilType) {
    return this.buckets.get(oilBucketKey(source, type)) ?? 0;
  }

  sell(source: OilSource, type: OilType, litres: number) {
    const key = oilBucketKey(source, type);
    const before = this.buckets.get(key) ?? 0;
    const after = before - litres;
    this.buckets.set(key, after);
    return { before, after };
  }

  setContainers(units: number) {
    this.containerUnits = units;
  }

  getContainers() {
    return this.containerUnits;
  }

  consumeContainers(count: number) {
    this.containerUnits -= count;
  }
}

type ReportSale = {
  oilSource: OilSource | null;
  oilType: OilType | null;
};

function filterSales(sales: ReportSale[], source?: OilSource, type?: OilType) {
  return sales.filter((s) => {
    if (source && s.oilSource !== source) return false;
    if (type && s.oilType !== type) return false;
    return true;
  });
}

describe('Oil source + type stock isolation', () => {
  it('Stored Green sale does not affect Farmer Green', () => {
    const sim = new OilStockSimulator();
    sim.set(OilSource.STORED, OilType.GREEN, 100);
    sim.set(OilSource.FARMER, OilType.GREEN, 50);

    sim.sell(OilSource.STORED, OilType.GREEN, 20);

    expect(sim.get(OilSource.STORED, OilType.GREEN)).toBe(80);
    expect(sim.get(OilSource.FARMER, OilType.GREEN)).toBe(50);
  });

  it('Farmer Green sale leaves Stored Green unchanged', () => {
    const sim = new OilStockSimulator();
    sim.set(OilSource.STORED, OilType.GREEN, 80);
    sim.set(OilSource.FARMER, OilType.GREEN, 50);

    sim.sell(OilSource.FARMER, OilType.GREEN, 10);

    expect(sim.get(OilSource.STORED, OilType.GREEN)).toBe(80);
    expect(sim.get(OilSource.FARMER, OilType.GREEN)).toBe(40);
  });

  it('Packaged Farmer Zebbouche deducts oil and shared containers only', () => {
    const sim = new OilStockSimulator();
    sim.set(OilSource.FARMER, OilType.ZEBBOUCHE, 100);
    sim.set(OilSource.STORED, OilType.GREEN, 500);
    sim.setContainers(20);

    const litres = 3 * 5;
    sim.sell(OilSource.FARMER, OilType.ZEBBOUCHE, litres);
    sim.consumeContainers(3);

    expect(sim.get(OilSource.FARMER, OilType.ZEBBOUCHE)).toBe(85);
    expect(sim.getContainers()).toBe(17);
    expect(sim.get(OilSource.STORED, OilType.GREEN)).toBe(500);
    expect(sim.get(OilSource.FARMER, OilType.GREEN)).toBe(0);
  });
});

describe('Oil sales report filters', () => {
  const sales: ReportSale[] = [
    { oilSource: OilSource.STORED, oilType: OilType.GREEN },
    { oilSource: OilSource.FARMER, oilType: OilType.GREEN },
    { oilSource: OilSource.FARMER, oilType: OilType.ZEBBOUCHE },
    { oilSource: OilSource.STORED, oilType: OilType.TAIEB },
  ];

  it('Source = FARMER excludes STORED sales', () => {
    const rows = filterSales(sales, OilSource.FARMER);
    expect(rows.every((r) => r.oilSource === OilSource.FARMER)).toBe(true);
    expect(rows).toHaveLength(2);
  });

  it('Type = GREEN with no source includes both sources', () => {
    const rows = filterSales(sales, undefined, OilType.GREEN);
    expect(rows).toHaveLength(2);
    expect(rows.some((r) => r.oilSource === OilSource.STORED)).toBe(true);
    expect(rows.some((r) => r.oilSource === OilSource.FARMER)).toBe(true);
  });
});

describe('oil catalog buckets', () => {
  it('defines 8 independent source/type combinations', () => {
    expect(allOilBuckets()).toHaveLength(8);
  });

  it('round-trips bucket keys', () => {
    const key = oilBucketKey(OilSource.FARMER, OilType.DROU);
    expect(parseOilBucketKey(key)).toEqual({
      oilSource: OilSource.FARMER,
      oilType: OilType.DROU,
    });
  });
});
