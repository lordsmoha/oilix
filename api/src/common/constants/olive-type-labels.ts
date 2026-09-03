import { OliveType } from '@prisma/client';

/** Libellés d'impression (FR + AR) — source unique côté API. */
export const OLIVE_TYPE_PRINT: Record<
  OliveType,
  { labelFr: string; labelAr: string }
> = {
  GREEN: { labelFr: 'Olive verte', labelAr: 'الزيتون الأخضر' },
  ZBOUCH: { labelFr: 'Zebbouch', labelAr: 'الزبوش' },
  RIPE: { labelFr: 'Olive mûre', labelAr: 'الزيتون الطايب' },
};

export const OLIVE_TYPE_ORDER: OliveType[] = [
  OliveType.GREEN,
  OliveType.ZBOUCH,
  OliveType.RIPE,
];

export function oliveTypePrintPayload(type: OliveType) {
  const labels = OLIVE_TYPE_PRINT[type];
  return {
    oliveType: type,
    labelFr: labels.labelFr,
    labelAr: labels.labelAr,
    display: `${labels.labelFr} (${labels.labelAr})`,
  };
}

export function oliveTypesFromEntries(types: OliveType[]): ReturnType<
  typeof oliveTypePrintPayload
>[] {
  const unique = new Set(types);
  return OLIVE_TYPE_ORDER.filter((t) => unique.has(t)).map(oliveTypePrintPayload);
}
