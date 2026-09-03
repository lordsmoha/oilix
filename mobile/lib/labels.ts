export const OLIVE_TYPES = [
  {
    value: 'GREEN' as const,
    label: 'أخضر',
    labelFull: 'زيتون أخضر',
    color: '#34d399',
    icon: 'leaf' as const,
  },
  {
    value: 'ZBOUCH' as const,
    label: 'زبوش',
    labelFull: 'الزبوش',
    color: '#60a5fa',
    icon: 'water' as const,
  },
  {
    value: 'RIPE' as const,
    label: 'طايب',
    labelFull: 'زيتون طايب',
    color: '#fb7185',
    icon: 'moon' as const,
  },
] as const;

export type OliveTypeValue = (typeof OLIVE_TYPES)[number]['value'];

export function oliveMeta(value: OliveTypeValue) {
  return OLIVE_TYPES.find((t) => t.value === value) ?? OLIVE_TYPES[0];
}
