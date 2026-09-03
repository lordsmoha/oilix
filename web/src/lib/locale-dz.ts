/** Paramètres régionaux — Algérie (DZD, ar-DZ, Africa/Algiers) */
export const LOCALE_DZ = 'ar-DZ';
export const TIMEZONE_DZ = 'Africa/Algiers';
export const CURRENCY_CODE = 'DZD';
/** Symbole courant en Algérie */
export const CURRENCY_SYMBOL = 'دج';
export const CURRENCY_NAME_AR = 'دينار جزائري';
export const COUNTRY_NAME_AR = 'الجمهورية الجزائرية الديمقراطية الشعبية';
export const PHONE_COUNTRY_CODE = '+213';
export const PHONE_PLACEHOLDER = '05XX XX XX XX';

export function formatNumberDz(n: number, decimals = 2): string {
  return new Intl.NumberFormat(LOCALE_DZ, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatDateDz(d: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE_DZ, {
    timeZone: TIMEZONE_DZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(d));
}

/** Format courant en Algérie : jj/mm/aaaa */
export function formatDateShortDz(d: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE_DZ, {
    timeZone: TIMEZONE_DZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(d));
}

export function formatTimeDz(d: string | Date = new Date()): string {
  return new Intl.DateTimeFormat(LOCALE_DZ, {
    timeZone: TIMEZONE_DZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(d));
}

export function formatDateTimeDz(d: string | Date = new Date()): string {
  return new Intl.DateTimeFormat(LOCALE_DZ, {
    timeZone: TIMEZONE_DZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(d));
}

export function formatCurrencyDz(amount: number, decimals = 2): string {
  return `${formatNumberDz(amount, decimals)} ${CURRENCY_SYMBOL}`;
}
