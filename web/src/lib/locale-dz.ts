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
/** Ensures dd/mm/yyyy with Latin digits */
const DATE_LOCALE = 'en-GB';

function dzDateParts(d: string | Date) {
  const parts = new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: TIMEZONE_DZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(d));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    day: get('day'),
    month: get('month'),
    year: get('year'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** Always dd/mm/yyyy */
export function formatDatePartsDdMmYyyy(d: string | Date): string {
  const { day, month, year } = dzDateParts(d);
  return `${day}/${month}/${year}`;
}

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

/** dd/mm/yyyy */
export function formatDateDz(d: string | Date): string {
  return formatDatePartsDdMmYyyy(d);
}

/** dd/mm/yyyy */
export function formatDateShortDz(d: string | Date): string {
  return formatDatePartsDdMmYyyy(d);
}

export function formatTimeDz(d: string | Date = new Date()): string {
  const { hour, minute } = dzDateParts(d);
  return `${hour}:${minute}`;
}

/** dd/mm/yyyy HH:mm */
export function formatDateTimeDz(d: string | Date = new Date()): string {
  const { day, month, year, hour, minute } = dzDateParts(d);
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function formatCurrencyDz(amount: number, decimals = 2): string {
  return `${formatNumberDz(amount, decimals)} ${CURRENCY_SYMBOL}`;
}
