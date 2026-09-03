export const BUSINESS_NAME = 'معصرة الزيتون - الصفا والمروة - المصيف';

/** Marché cible : Algérie */
export const APP_MARKET = {
  country: 'DZ',
  currencyCode: 'DZD',
  currencySymbol: 'دج',
  currencyNameAr: 'دينار جزائري',
} as const;

export const OLIVE_TYPES = [
  { value: 'GREEN', slug: 'green', label: 'الزيتون الأخضر', color: 'emerald' },
  { value: 'ZBOUCH', slug: 'zbouch', label: 'الزبوش', color: 'blue' },
  { value: 'RIPE', slug: 'ripe', label: 'الزيتون الطايب', color: 'rose' },
] as const;

export type OliveTypeSlug = (typeof OLIVE_TYPES)[number]['slug'];
export type OliveTypeValue = (typeof OLIVE_TYPES)[number]['value'];

export function slugToType(slug: string): OliveTypeValue | null {
  return OLIVE_TYPES.find((t) => t.slug === slug)?.value ?? null;
}

export function typeToSlug(value: string): OliveTypeSlug | null {
  return OLIVE_TYPES.find((t) => t.value === value)?.slug ?? null;
}

/** @deprecated Use APP_NAV from lib/navigation.ts */
export const MAIN_NAV = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'Home' },
  { href: '/finance', label: 'اليومية المالية', icon: 'Wallet' },
  { href: '/print', label: 'طباعة', icon: 'Printer' },
  { href: '/settings', label: 'إعدادات', icon: 'Settings' },
] as const;

export const ENTRY_STATUS: Record<string, string> = {
  RECEIVED: 'غير مرحي',
  IN_STORAGE: 'في المخزن',
  PRESSED: 'مرحي',
  OIL_COLLECTED: 'أخذه',
  PAID: 'سلك',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export const FIELD_LABELS = {
  referenceNumber: 'الرقم',
  fullName: 'الإسم واللقب',
  phone: 'رقم الهاتف (جزائري)',
  phonePlaceholder: '05XX XX XX XX',
  bagCount: 'عدد الأكياس',
  weight: 'الوزن (كغ)',
  adhlef: 'الضلف',
  capacity: 'السعة',
  wilaya: 'الولاية',
  commune: 'البلدية / الدائرة',
  zayat: 'الزيات (نوع/منطقة العصر)',
  registerClient: 'تسجيل الزبون',
  addWeight: 'إضافة وزن آخر',
  bagUnit: 'كيس',
  kgUnit: 'كغ',
  adhlefUnit: 'وحدة',
  literUnit: 'لتر',
  currency: 'دج',
  pricePerQuintal: 'سعر القنطار (دج/ق)',
  quintalUnit: 'ق',
  priceUnit: 'دج/ق',
};
