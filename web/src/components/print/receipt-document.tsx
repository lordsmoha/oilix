'use client';

import { formatDateTimeDz } from '@/lib/locale-dz';
import type { OliveTypePrintInfo } from '@/lib/olive-type-labels';
import { cn, formatNumber } from '@/lib/utils';
import {
  ThermalOliveTypeBanner,
  ThermalOliveTypeRow,
} from '@/components/print/thermal-olive-type';

export type ReceiptData = {
  company: { name: string };
  referenceNumber: number;
  oliveType: OliveTypePrintInfo;
  client: {
    clientNumber: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  totalWeightKg: number;
  pressing: {
    oilQuantityL: number;
    yieldPercent: number | null;
    amount: number;
  } | null;
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return phone;
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const p = data.pressing;
  const oliveTypes = [data.oliveType];

  return (
    <article className="thermal-receipt thermal-receipt-compact">
      <header className="thermal-compact-header">
        <h1 className="thermal-compact-title">{data.company.name}</h1>
        <p className="thermal-compact-meta">
          وصل المعالجة ·{' '}
          <span className="thermal-mono">{data.referenceNumber}</span>
        </p>
        <ThermalOliveTypeBanner types={oliveTypes} />
      </header>

      <div className="thermal-rule" />

      <section className="thermal-compact-section">
        <p className="thermal-compact-section-label">بيانات الزبون</p>
        <ThermalRow label="رقم الزبون" value={String(data.client.clientNumber)} mono />
        <ThermalRow
          label="الاسم"
          value={`${data.client.firstName} ${data.client.lastName}`}
          wrap
        />
        <ThermalRow
          label="الهاتف"
          value={formatPhone(data.client.phone)}
          dir="ltr"
          mono
        />
        <ThermalOliveTypeRow types={oliveTypes} emphasis />
        <ThermalRow
          label="الوزن"
          value={`${formatNumber(data.totalWeightKg, 1)} كغ`}
          emphasis
        />
      </section>

      {p ? (
        <section className="thermal-compact-section">
          <p className="thermal-compact-section-label">بيانات المعالجة</p>
          <ThermalRow
            label="كمية الزيت"
            value={`${formatNumber(p.oilQuantityL, 2)} ل`}
            emphasis
          />
          <ThermalRow
            label="الريات"
            value={
              p.yieldPercent != null ? `${formatNumber(p.yieldPercent, 1)} %` : '—'
            }
          />
        </section>
      ) : null}

      {p ? (
        <section className="thermal-compact-section">
          <p className="thermal-compact-section-label">المعلومات المالية</p>
          <ThermalRow
            label="المبلغ الإجمالي"
            value={`${formatNumber(p.amount, 2)} دج`}
            emphasis
          />
        </section>
      ) : null}

      <div className="thermal-rule" />

      <footer className="thermal-compact-footer">
        <span>شكراً لثقتكم</span>
        <span className="thermal-mono" dir="ltr">
          {formatDateTimeDz()}
        </span>
      </footer>
    </article>
  );
}

function ThermalRow({
  label,
  value,
  dir,
  wrap,
  mono,
  emphasis,
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
  wrap?: boolean;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className={cn('thermal-compact-row', emphasis && 'thermal-compact-row--emphasis')}>
      <span className="thermal-compact-label">{label}</span>
      <span
        className={cn(
          'thermal-compact-value',
          wrap && 'thermal-wrap',
          mono && 'thermal-mono',
        )}
        dir={dir}
      >
        {value}
      </span>
    </div>
  );
}
