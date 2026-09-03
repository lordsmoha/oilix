import type { OliveTypePrintInfo } from '@/lib/olive-type-labels';
import { formatNumber } from '@/lib/utils';
import { ThermalOliveTypeRow } from '@/components/print/thermal-olive-type';

export type BatchReceiptRow = {
  clientId?: string;
  referenceNumber: number;
  lastReferenceNumber?: number;
  entryCount?: number;
  oliveType: OliveTypePrintInfo;
  client: {
    clientNumber: number;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  bags: number;
  weightKg: number;
  adhlef: number | null;
  capacity: number | null;
};

export type BatchReceiptsPrintData = {
  type: 'receipts';
  meta: {
    title: string;
    oliveTypePrint: OliveTypePrintInfo;
    companyName: string;
    seasonName: string | null;
    printedAt: string;
    referenceFrom: number | null;
    referenceTo: number | null;
    total: number;
  };
  rows: BatchReceiptRow[];
};

function formatPhone(phone: string | null) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return phone;
}

export function BatchReceiptsDocument({ data }: { data: BatchReceiptsPrintData }) {
  const { meta, rows } = data;

  return (
    <div className="batch-print-doc">
      {rows.length === 0 ? (
        <article className="thermal-receipt thermal-receipt-compact">
          <p className="thermal-compact-empty">لا توجد وصلات في هذا النطاق</p>
        </article>
      ) : (
        rows.map((row, i) => (
          <article
            key={`${row.clientId ?? row.client.clientNumber}-${i}`}
            className="thermal-receipt thermal-receipt-compact batch-receipt-item"
          >
            <header className="thermal-compact-header">
              <h1 className="thermal-compact-title">{meta.companyName}</h1>
              <p className="thermal-compact-meta">
                وصل استقبال · زبون{' '}
                <span className="thermal-mono">{row.client.clientNumber}</span>
                {(row.entryCount ?? 1) > 1 ? (
                  <span> · {row.entryCount} وزنات</span>
                ) : null}
              </p>
              {meta.seasonName ? (
                <p className="thermal-compact-meta">الموسم: {meta.seasonName}</p>
              ) : null}
            </header>

            <div className="thermal-rule" />

            <section className="thermal-compact-section">
              <p className="thermal-compact-section-label">بيانات الزبون</p>
              <div className="thermal-compact-row">
                <span className="thermal-compact-label">رقم الزبون</span>
                <span className="thermal-compact-value thermal-mono">{row.client.clientNumber}</span>
              </div>
              <div className="thermal-compact-row">
                <span className="thermal-compact-label">الاسم</span>
                <span className="thermal-compact-value thermal-wrap">
                  {row.client.firstName} {row.client.lastName}
                </span>
              </div>
              <div className="thermal-compact-row">
                <span className="thermal-compact-label">الهاتف</span>
                <span className="thermal-compact-value thermal-mono" dir="ltr">
                  {formatPhone(row.client.phone)}
                </span>
              </div>
              <ThermalOliveTypeRow types={[row.oliveType]} emphasis />
            </section>

            <section className="thermal-compact-section">
              <p className="thermal-compact-section-label">الوزن</p>
              <div className="thermal-compact-row">
                <span className="thermal-compact-label">الأكياس</span>
                <span className="thermal-compact-value thermal-mono">{row.bags}</span>
              </div>
              <div className="thermal-compact-row thermal-compact-row--emphasis">
                <span className="thermal-compact-label">الوزن</span>
                <span className="thermal-compact-value">{formatNumber(row.weightKg, 1)} كغ</span>
              </div>
              <div className="thermal-compact-row">
                <span className="thermal-compact-label">الضلف</span>
                <span className="thermal-compact-value thermal-mono">{row.adhlef ?? 0}</span>
              </div>
              {row.capacity != null ? (
                <div className="thermal-compact-row">
                  <span className="thermal-compact-label">السعة</span>
                  <span className="thermal-compact-value thermal-mono">
                    {formatNumber(row.capacity, 1)}
                  </span>
                </div>
              ) : null}
            </section>

            <div className="thermal-rule" />
            <footer className="thermal-compact-footer">
              <span>شكراً لثقتكم</span>
            </footer>
          </article>
        ))
      )}
    </div>
  );
}
