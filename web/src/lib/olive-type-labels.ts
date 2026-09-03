import type { OliveTypeValue } from '@/lib/labels';

/** Libellés d'impression (FR + AR) — alignés sur l'API. */
export const OLIVE_TYPE_PRINT: Record<
  OliveTypeValue,
  { labelFr: string; labelAr: string }
> = {
  GREEN: { labelFr: 'Olive verte', labelAr: 'الزيتون الأخضر' },
  ZBOUCH: { labelFr: 'Zebbouch', labelAr: 'الزبوش' },
  RIPE: { labelFr: 'Olive mûre', labelAr: 'الزيتون الطايب' },
};

export const OLIVE_TYPE_PRINT_ORDER: OliveTypeValue[] = [
  'GREEN',
  'ZBOUCH',
  'RIPE',
];

export type OliveTypePrintInfo = {
  oliveType: string;
  labelFr: string;
  labelAr: string;
  display: string;
};

export function oliveTypePrintInfo(type: string): OliveTypePrintInfo | null {
  const labels = OLIVE_TYPE_PRINT[type as OliveTypeValue];
  if (!labels) return null;
  return {
    oliveType: type,
    labelFr: labels.labelFr,
    labelAr: labels.labelAr,
    display: `${labels.labelFr} (${labels.labelAr})`,
  };
}

export function formatOliveTypeDisplay(info: OliveTypePrintInfo): string {
  return info.display;
}
