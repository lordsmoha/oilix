/** Locale et fuseau horaire — République algérienne démocratique et populaire */
export const ALGERIA_LOCALE = 'ar-DZ';
export const ALGERIA_TIMEZONE = 'Africa/Algiers';
export const ALGERIA_COUNTRY_CODE = 'DZ';
export const ALGERIA_PHONE_PREFIX = '+213';

export function currentTimeAlgeria(): string {
  return new Date().toLocaleTimeString(ALGERIA_LOCALE, {
    timeZone: ALGERIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateAlgeria(d: Date | string): string {
  return new Intl.DateTimeFormat(ALGERIA_LOCALE, {
    timeZone: ALGERIA_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(d));
}
