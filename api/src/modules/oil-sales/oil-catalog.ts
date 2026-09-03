import { OilSource, OilType } from '@prisma/client';

/** All retail oil sources (مصدر الزيت). */
export const OIL_SOURCES: OilSource[] = [OilSource.STORED, OilSource.FARMER];

/** All retail oil types (نوع الزيت) — independent of OliveType. */
export const OIL_TYPES: OilType[] = [
  OilType.GREEN,
  OilType.TAIEB,
  OilType.DROU,
  OilType.ZEBBOUCHE,
];

export type OilBucket = { oilSource: OilSource; oilType: OilType };

export function oilBucketKey(source: OilSource, type: OilType): string {
  return `${source}:${type}`;
}

export function parseOilBucketKey(key: string): OilBucket {
  const [oilSource, oilType] = key.split(':') as [OilSource, OilType];
  return { oilSource, oilType };
}

export function allOilBuckets(): OilBucket[] {
  const buckets: OilBucket[] = [];
  for (const oilSource of OIL_SOURCES) {
    for (const oilType of OIL_TYPES) {
      buckets.push({ oilSource, oilType });
    }
  }
  return buckets;
}

export const OIL_SOURCE_LABELS: Record<OilSource, string> = {
  STORED: 'زيت المخزن',
  FARMER: 'زيت الفلاح',
};

export const OIL_TYPE_LABELS: Record<OilType, string> = {
  GREEN: 'زيت أخضر',
  TAIEB: 'زيت طايب',
  DROU: 'زيت الضرو',
  ZEBBOUCHE: 'زيت الزبوش',
};

export type OilPriceSettings = {
  priceGreen: number;
  priceTaieb: number;
  priceDrou: number;
  priceZebbouche: number;
};

export function priceForOilType(settings: OilPriceSettings, type: OilType): number {
  switch (type) {
    case OilType.GREEN:
      return settings.priceGreen;
    case OilType.TAIEB:
      return settings.priceTaieb;
    case OilType.DROU:
      return settings.priceDrou;
    case OilType.ZEBBOUCHE:
      return settings.priceZebbouche;
    default:
      return settings.priceGreen;
  }
}
