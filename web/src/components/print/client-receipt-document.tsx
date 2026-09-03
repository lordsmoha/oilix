'use client';

import { formatDateTimeDz } from '@/lib/locale-dz';
import type { OliveTypePrintInfo } from '@/lib/olive-type-labels';
import { PRICE_UNIT_LABEL } from '@/lib/pricing';
import { cn, formatNumber } from '@/lib/utils';
import { ThermalOliveTypeRow } from '@/components/print/thermal-olive-type';

export type ClientReceiptOliveBreakdown = OliveTypePrintInfo & {
  entryCount: number;
  totalBags: number;
  totalWeightKg: number;
  totalAdhlef: number;
  totalCapacity: number;
};

export type ClientReceiptData = {
  company: { name: string; pricePerQuintal: number };
  seasonName: string | null;
  printedAt: string;
  oliveTypes: OliveTypePrintInfo[];
  client: {
    clientNumber: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  weighing: {
    entryCount: number;
    totalBags: number;
    totalWeightKg: number;
    totalAdhlef: number;
    totalCapacity: number;
    byOliveType: ClientReceiptOliveBreakdown[];
  };
  financial: {
    totalAmount: number;
  };
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return phone || '—';
}

export function ClientReceiptDocument({ data }: { data: ClientReceiptData }) {
  const { client, weighing, financial, oliveTypes } = data;
  const hasWeighings = weighing.entryCount > 0;

  return (
    <article className="thermal-receipt thermal-receipt-compact">
      <header className="thermal-compact-header">
        <h1 className="thermal-compact-title">{data.company.name}</h1>
        <p className="thermal-compact-meta">
          سعر القنطار: {formatNumber(data.company.pricePerQuintal)} {PRICE_UNIT_LABEL}
        </p>
        <p className="thermal-compact-meta">وصل الزبون</p>
        {data.seasonName ? (
          <p className="thermal-compact-meta">الموسم: {data.seasonName}</p>
        ) : null}
      </header>

      <div className="thermal-rule" />

      <section className="thermal-compact-section">
        <p className="thermal-compact-section-label">بيانات الزبون</p>
        <ThermalRow label="رقم الزبون" value={String(client.clientNumber)} mono />
        <ThermalRow label="اللقب" value={client.lastName} wrap />
        <ThermalRow label="الاسم" value={client.firstName} wrap />
        <ThermalRow label="الهاتف" value={formatPhone(client.phone)} dir="ltr" mono />
        <ThermalOliveTypeRow types={oliveTypes} emphasis />
      </section>

      <section className="thermal-compact-section">
        <p className="thermal-compact-section-label">
          الوزنات المجمّعة
          {hasWeighings ? (
            <span className="thermal-compact-meta-inline">
              {' '}
              · {weighing.entryCount} عملية
            </span>
          ) : null}
        </p>
        {hasWeighings ? (
          <>
            <ThermalRow
              label="إجمالي الأكياس"
              value={String(weighing.totalBags)}
              mono
            />
            <ThermalRow
              label="الوزن الإجمالي"
              value={`${formatNumber(weighing.totalWeightKg, 1)} كغ`}
              emphasis
            />
            <ThermalRow label="إجمالي الضلف" value={String(weighing.totalAdhlef)} mono />
            <ThermalRow
              label="السعة"
              value={formatNumber(weighing.totalCapacity, 1)}
              mono
            />
            {weighing.byOliveType.length > 1
              ? weighing.byOliveType.map((b) => (
                  <p key={b.oliveType} className="thermal-compact-subline">
                    {b.display}: {b.entryCount} · {b.totalBags} كيس ·{' '}
                    {formatNumber(b.totalWeightKg, 1)} كغ
                  </p>
                ))
              : null}
          </>
        ) : (
          <p className="thermal-compact-empty">لا توجد عمليات وزن بعد</p>
        )}
      </section>

      <section className="thermal-compact-section">
        <p className="thermal-compact-section-label">المعلومات المالية</p>
        <ThermalRow
          label="المبلغ الإجمالي"
          value={`${formatNumber(financial.totalAmount, 2)} دج`}
          emphasis
        />
      </section>

      <div className="thermal-rule" />

      <footer className="thermal-compact-footer">
        <span>شكراً لثقتكم</span>
        <span className="thermal-mono" dir="ltr">
          {formatDateTimeDz(data.printedAt)}
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
        className={cn('thermal-compact-value', wrap && 'thermal-wrap', mono && 'thermal-mono')}
        dir={dir}
      >
        {value}
      </span>
    </div>
  );
}
