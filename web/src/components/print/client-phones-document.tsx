import { ThermalOliveTypeBanner } from '@/components/print/thermal-olive-type';
import { BUSINESS_NAME } from '@/lib/labels';
import type { OliveTypePrintInfo } from '@/lib/olive-type-labels';
import {
  formatDateShortDz,
  formatTimeDz,
} from '@/lib/locale-dz';

export type ClientPhonesPrintRow = {
  clientNumber: number;
  lastName: string;
  firstName: string;
  phone: string;
  referenceNumber?: number;
};

export type ClientPhonesPrintData = {
  type: 'phones';
  meta: {
    title: string;
    oliveTypePrint: OliveTypePrintInfo;
    companyName?: string;
    seasonName?: string | null;
    printedAt: string;
    referenceFrom?: number | null;
    referenceTo?: number | null;
    total: number;
  };
  rows: ClientPhonesPrintRow[];
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return phone;
}

export function ClientPhonesDocument({ data }: { data: ClientPhonesPrintData }) {
  const { meta, rows } = data;
  const company = meta.companyName?.trim() || BUSINESS_NAME;
  const printedAt = new Date(meta.printedAt);
  const rangeLabel =
    meta.referenceFrom != null || meta.referenceTo != null
      ? `المراجع: ${meta.referenceFrom ?? '…'} — ${meta.referenceTo ?? '…'}`
      : 'جميع المراجع';

  return (
    <article className="thermal-receipt thermal-client-phones-doc">
      <header className="thermal-block thermal-center">
        <h1 className="thermal-title thermal-wrap">{company}</h1>
        <p className="thermal-strong" style={{ marginTop: '2mm', fontSize: '12px' }}>
          {meta.title}
        </p>
        <ThermalOliveTypeBanner types={[meta.oliveTypePrint]} />
        {meta.seasonName ? (
          <p className="thermal-muted">الموسم: {meta.seasonName}</p>
        ) : null}
        <p className="thermal-xs" style={{ marginTop: '2mm' }}>
          {formatDateShortDz(printedAt)} —{' '}
          <span dir="ltr">{formatTimeDz(printedAt)}</span>
        </p>
        <p className="thermal-xs">{rangeLabel}</p>
      </header>

      <div className="thermal-divider" />

      <table className="thermal-client-list">
        <colgroup>
          <col className="col-num" />
          <col className="col-last" />
          <col className="col-first" />
          <col className="col-phone" />
        </colgroup>
        <thead>
          <tr>
            <th>رقم الزبون</th>
            <th>اللقب</th>
            <th>الاسم</th>
            <th>الهاتف</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="thermal-center thermal-muted">
                لا يوجد زبائن في هذا النطاق
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.clientNumber}-${index}`}>
                <td className="cell-num">{row.clientNumber}</td>
                <td className="cell-name">{row.lastName}</td>
                <td className="cell-name">{row.firstName}</td>
                <td className="cell-phone">{formatPhone(row.phone)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="thermal-divider" />

      <footer className="thermal-block thermal-center">
        <p className="thermal-strong">
          إجمالي الزبائن المطبوعين:{' '}
          <span className="thermal-mono">{rows.length}</span>
        </p>
        <p className="thermal-xs" style={{ marginTop: '2mm' }}>
          Oilix — طباعة حرارية 80mm
        </p>
      </footer>
    </article>
  );
}
