import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  formatDateDz,
  formatDateShortDz,
  formatDateTimeDz,
  formatNumberDz,
  formatTimeDz,
} from '@/lib/locale-dz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** @deprecated Use formatNumberDz from locale-dz — kept for compatibility */
export function formatNumber(n: number, decimals = 2) {
  return formatNumberDz(n, decimals);
}

export function formatDate(d: string | Date) {
  return formatDateDz(d);
}

export { formatDateShortDz, formatDateTimeDz, formatTimeDz, formatNumberDz };
