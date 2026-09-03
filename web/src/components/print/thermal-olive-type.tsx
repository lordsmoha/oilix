'use client';

import { cn } from '@/lib/utils';
import type { OliveTypePrintInfo } from '@/lib/olive-type-labels';
import { formatOliveTypeDisplay } from '@/lib/olive-type-labels';

const OLIVE_TYPE_LABEL = 'نوع الزيتون';

/** Bandeau visible en en-tête (après le titre). */
export function ThermalOliveTypeBanner({
  types,
  className,
}: {
  types: OliveTypePrintInfo[];
  className?: string;
}) {
  if (!types.length) return null;

  return (
    <div className={cn('thermal-olive-type-banner', className)}>
      {types.map((t) => (
        <p key={t.oliveType} className="thermal-olive-type-banner__line">
          <span className="thermal-olive-type-banner__label">{OLIVE_TYPE_LABEL}</span>
          <span className="thermal-olive-type-banner__value">{formatOliveTypeDisplay(t)}</span>
        </p>
      ))}
    </div>
  );
}

/** Ligne dans une section (ex. après بيانات الزبون). */
export function ThermalOliveTypeRow({
  types,
  emphasis,
}: {
  types: OliveTypePrintInfo[];
  emphasis?: boolean;
}) {
  if (!types.length) {
    return (
      <div className="thermal-compact-row">
        <span className="thermal-compact-label">{OLIVE_TYPE_LABEL}</span>
        <span className="thermal-compact-value">—</span>
      </div>
    );
  }

  return (
    <>
      {types.map((t) => (
        <div
          key={t.oliveType}
          className={cn('thermal-compact-row', emphasis && 'thermal-compact-row--emphasis')}
        >
          <span className="thermal-compact-label">{OLIVE_TYPE_LABEL}</span>
          <span className="thermal-compact-value thermal-wrap">{formatOliveTypeDisplay(t)}</span>
        </div>
      ))}
    </>
  );
}
