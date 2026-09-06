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

/** Western digits: 1,234.56 (not ar-DZ 1.234,56) */
const NUMBER_LOCALE = 'en-US';

export function formatNumberDz(n: number, decimals = 2): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Money amounts — always two decimals: 63,000.00 */
export function formatMoneyDz(amount: number): string {
  return formatNumberDz(amount, 2);
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

export function formatCurrencyDz(amount: number): string {
  return `${formatMoneyDz(amount)} ${CURRENCY_SYMBOL}`;
}
