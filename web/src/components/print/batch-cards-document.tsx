import type { OliveTypePrintInfo } from '@/lib/olive-type-labels';

export type BatchCardRow = {
  clientId?: string;
  referenceNumber: number;
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
  capacity: number;
  adhlef: number;
};

export type BatchCardsPrintData = {
  type: 'cards';
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
  rows: BatchCardRow[];
};

const OLIVE_TYPE_MARK: Record<string, string> = {
  GREEN: 'خ',
  ZBOUCH: 'ز',
  RIPE: 'ط',
};

/** Affichage entier pour l’impression thermique (ex. 345, pas 345.0). */
function cardValue(n: number) {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

export function BatchCardsDocument({ data }: { data: BatchCardsPrintData }) {
  const { rows } = data;

  if (!rows.length) {
    return (
      <article className="thermal-receipt thermal-receipt-compact">
        <p className="thermal-compact-empty">لا توجد بطاقات في هذا النطاق</p>
      </article>
    );
  }

  return (
    <div className="batch-print-doc batch-cards-doc">
      {rows.map((row, i) => {
        const typeMark = OLIVE_TYPE_MARK[row.oliveType.oliveType] ?? '•';
        const multi = (row.entryCount ?? 1) > 1;

        return (
          <article
            key={`${row.clientId ?? row.client.clientNumber}-${i}`}
            className="thermal-client-card"
            aria-label={`بطاقة الزبون ${row.client.clientNumber}`}
          >
            <span className="thermal-client-card-type-mark" aria-hidden>
              {typeMark}
            </span>

            <div className="thermal-client-card-inner">
              <div className="thermal-client-card-number-block">
                <div className="thermal-client-card-number">{row.client.clientNumber}</div>
                {multi ? (
                  <span className="thermal-client-card-multi">{row.entryCount} وزنات</span>
                ) : null}
              </div>

              <div className="thermal-client-card-divider" aria-hidden />

              <div className="thermal-client-card-stats">
                <div className="thermal-client-card-row thermal-client-card-row--bags">
                  <span className="thermal-client-card-value">{cardValue(row.bags)}</span>
                  <span className="thermal-client-card-hint">أكياس</span>
                </div>

                <div className="thermal-client-card-row thermal-client-card-row--equation" dir="ltr">
                  <span className="thermal-client-card-value">{cardValue(row.capacity)}</span>
                  <span className="thermal-client-card-eq-sign">=</span>
                  <span className="thermal-client-card-value">{cardValue(row.adhlef)}</span>
                </div>
                <div className="thermal-client-card-row-labels" dir="ltr" aria-hidden>
                  <span>سعة</span>
                  <span />
                  <span>ضلف</span>
                </div>

                <div className="thermal-client-card-row thermal-client-card-row--weight">
                  <span className="thermal-client-card-value thermal-client-card-value--weight">
                    {cardValue(row.weightKg)}
                  </span>
                  <span className="thermal-client-card-unit">كغ</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
