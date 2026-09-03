import type { ClientCardPrintData, ClientReceiptPrintData, OliveTypePrintInfo } from './types';

const TYPE_MARK: Record<string, string> = {
  GREEN: 'خ',
  ZBOUCH: 'ز',
  RIPE: 'ط',
};

function cardValue(n: number) {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

function formatNum(n: number, digits = 1) {
  return new Intl.NumberFormat('ar-DZ', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(n);
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return phone || '—';
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('ar-DZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    direction: rtl;
    font-family: Arial, 'Segoe UI', Tahoma, sans-serif;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: 80mm auto; margin: 0; }
  .page { width: 72mm; margin: 0 auto; padding: 2mm; }
`;

export function buildClientCardHtml(data: ClientCardPrintData): string {
  const mark = TYPE_MARK[data.oliveType.oliveType] ?? '•';
  const multi = data.entryCount > 1;

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
${BASE_CSS}
.card {
  position: relative;
  width: 72mm;
  min-height: 46mm;
  margin: 0 auto;
  padding: 2.5mm;
  border: 1.5px solid #000;
  border-radius: 1.5mm;
  background: #fff;
}
.mark {
  position: absolute; left: 3mm; top: 50%; transform: translateY(-50%);
  font-size: 26px; font-weight: 900; line-height: 1; opacity: 0.92;
}
.inner { display: flex; flex-direction: column; align-items: center; padding: 1mm 6mm 1mm 10mm; }
.num { font-size: 64px; font-weight: 900; line-height: 0.9; letter-spacing: 0.04em; text-align: center; }
.multi { margin-top: 1mm; font-size: 9px; font-weight: 700; color: #333; }
.div { width: 78%; border-top: 1px solid #000; margin: 2.5mm 0; opacity: 0.35; }
.stats { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
.row { display: flex; align-items: center; justify-content: center; gap: 3mm; width: 100%; }
.val { font-size: 20px; font-weight: 900; line-height: 1; }
.hint { font-size: 9px; font-weight: 700; color: #555; }
.eq { font-size: 16px; font-weight: 800; opacity: 0.85; }
.labels { display: grid; grid-template-columns: 1fr auto 1fr; width: 72%; font-size: 8px; font-weight: 700; color: #555; text-align: center; }
.weight-row { margin-top: 1mm; padding-top: 2mm; border-top: 1px dashed #999; width: 70%; }
.unit { font-size: 11px; font-weight: 800; color: #333; }
.meta { margin-top: 2mm; font-size: 8px; color: #444; text-align: center; }
</style></head><body>
<div class="page">
  <article class="card">
    <span class="mark">${mark}</span>
    <div class="inner">
      <div class="num">${data.client.clientNumber}</div>
      ${multi ? `<div class="multi">${data.entryCount} وزنات</div>` : ''}
      <div class="div"></div>
      <div class="stats">
        <div class="row">
          <span class="hint">أكياس</span>
          <span class="val">${cardValue(data.bags)}</span>
        </div>
        <div class="row" style="direction:ltr">
          <span class="val">${cardValue(data.capacity)}</span>
          <span class="eq">=</span>
          <span class="val">${cardValue(data.adhlef)}</span>
        </div>
        <div class="labels" style="direction:ltr"><span>سعة</span><span></span><span>ضلف</span></div>
        <div class="row weight-row">
          <span class="val" style="font-size:22px">${cardValue(data.weightKg)}</span>
          <span class="unit">كغ</span>
        </div>
      </div>
      <p class="meta">${escapeHtml(data.client.lastName)} ${escapeHtml(data.client.firstName)}${data.seasonName ? ` · ${escapeHtml(data.seasonName)}` : ''}</p>
    </div>
  </article>
</div>
</body></html>`;
}

export function buildClientReceiptHtml(data: ClientReceiptPrintData): string {
  const name = `${data.client.lastName} ${data.client.firstName}`.trim();
  const types = data.oliveTypes.map((t) => t.display || t.labelAr || t.oliveType).join(' · ');

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
${BASE_CSS}
.receipt { width: 72mm; margin: 0 auto; padding: 2mm; font-size: 11px; line-height: 1.35; }
.header { text-align: center; margin-bottom: 2mm; }
.title { font-size: 14px; font-weight: 900; margin-bottom: 1mm; }
.meta { font-size: 10px; color: #333; margin: 0.5mm 0; }
.rule { border-top: 1px dashed #000; margin: 2.5mm 0; }
.section-label { font-size: 10px; font-weight: 800; margin-bottom: 1.5mm; color: #111; }
.row { display: flex; justify-content: space-between; gap: 2mm; margin: 1mm 0; font-size: 11px; }
.row .l { color: #333; font-weight: 600; }
.row .v { font-weight: 800; text-align: left; direction: ltr; unicode-bidi: plaintext; }
.row.em .v { font-size: 13px; font-weight: 900; }
.footer { display: flex; justify-content: space-between; font-size: 9px; color: #444; margin-top: 2mm; }
</style></head><body>
<div class="page">
  <article class="receipt">
    <header class="header">
      <h1 class="title">${escapeHtml(data.company.name)}</h1>
      <p class="meta">سعر القنطار: ${formatNum(data.company.pricePerQuintal, 2)} دج</p>
      <p class="meta">وصل الزبون</p>
      ${data.seasonName ? `<p class="meta">الموسم: ${escapeHtml(data.seasonName)}</p>` : ''}
    </header>
    <div class="rule"></div>
    <p class="section-label">بيانات الزبون</p>
    ${row('رقم الزبون', String(data.client.clientNumber))}
    ${row('اللقب', data.client.lastName)}
    ${row('الاسم', data.client.firstName)}
    ${row('الهاتف', formatPhone(data.client.phone))}
    ${row('النوع', types || '—')}
    <div class="rule"></div>
    <p class="section-label">الوزنات المجمّعة · ${data.weighing.entryCount} عملية</p>
    ${row('إجمالي الأكياس', String(data.weighing.totalBags))}
    ${row('الوزن الإجمالي', `${formatNum(data.weighing.totalWeightKg, 1)} كغ`, true)}
    ${row('إجمالي الضلف', String(data.weighing.totalAdhlef))}
    ${row('السعة', formatNum(data.weighing.totalCapacity, 1))}
    <div class="rule"></div>
    <p class="section-label">المعلومات المالية</p>
    ${row('المبلغ الإجمالي', `${formatNum(data.financial.totalAmount, 2)} دج`, true)}
    ${data.printedBy ? row('المستخدم', data.printedBy) : ''}
    <div class="rule"></div>
    <footer class="footer">
      <span>شكراً لثقتكم</span>
      <span dir="ltr">${formatDateTime(data.printedAt)}</span>
    </footer>
    <p class="meta" style="text-align:center;margin-top:2mm">${escapeHtml(name)}</p>
  </article>
</div>
</body></html>`;
}

function row(label: string, value: string, emphasis = false) {
  return `<div class="row${emphasis ? ' em' : ''}"><span class="l">${escapeHtml(label)}</span><span class="v">${escapeHtml(value)}</span></div>`;
}

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function oliveTypeInfo(type: string): OliveTypePrintInfo {
  const map: Record<string, OliveTypePrintInfo> = {
    GREEN: { oliveType: 'GREEN', labelAr: 'أخضر', display: 'أخضر' },
    ZBOUCH: { oliveType: 'ZBOUCH', labelAr: 'زبوش', display: 'زبوش' },
    RIPE: { oliveType: 'RIPE', labelAr: 'طايب', display: 'طايب' },
  };
  return map[type] ?? { oliveType: type, display: type };
}
