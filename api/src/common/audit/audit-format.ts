import { AUDIT_MODULES } from '../constants/audit';

export type ClientLike = {
  firstName: string;
  lastName: string;
  clientNumber?: number;
};

export type FieldChange = {
  label: string;
  before: string;
  after: string;
};

export const MODULE_LABELS_AR: Record<string, string> = {
  [AUDIT_MODULES.AUTH]: 'المصادقة',
  [AUDIT_MODULES.USERS]: 'المستخدمون',
  [AUDIT_MODULES.CLIENTS]: 'الزبائن',
  [AUDIT_MODULES.OLIVE]: 'استقبال الزيتون',
  [AUDIT_MODULES.PROCESSING]: 'المعالجة',
  [AUDIT_MODULES.PRESSING]: 'العصر / الاستخراج',
  [AUDIT_MODULES.PAYMENTS]: 'المدفوعات',
  [AUDIT_MODULES.FINANCE]: 'المالية',
  [AUDIT_MODULES.SETTINGS]: 'الإعدادات',
  [AUDIT_MODULES.SEASONS]: 'المواسم',
  [AUDIT_MODULES.REPORTS]: 'التذاكر / الطباعة',
  [AUDIT_MODULES.SYSTEM]: 'النظام',
};

export function clientLabel(c: ClientLike): string {
  const name = `${c.firstName} ${c.lastName}`.trim();
  return c.clientNumber != null ? `${name} (#${c.clientNumber})` : name;
}

export function formatNum(value: number | string | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat('ar-DZ', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals > 0 ? decimals : 0,
  }).format(n);
}

export function arrowChange(before: string, after: string): string {
  return `${before} → ${after}`;
}

export function joinChanges(changes: FieldChange[]): string {
  if (!changes.length) return '';
  return changes.map((c) => `${c.label}: ${arrowChange(c.before, c.after)}`).join(' · ');
}

export function withChanges(base: string, changes: FieldChange[]): string {
  const detail = joinChanges(changes);
  return detail ? `${base} : ${detail}` : base;
}

export function actorPrefix(actorName: string, sentence: string): string {
  return `${actorName} — ${sentence}`;
}

/** استقبال الزيتون */
export const olive = {
  newWeighing(params: {
    client: ClientLike;
    oliveTypeAr: string;
    reference: number;
    weightKg: number;
    bagCount: number;
    adhlefCount: number;
    capacity?: number | null;
  }) {
    const cap =
      params.capacity != null ? ` · السعة ${formatNum(params.capacity)}` : '';
    return `أضاف وزنة جديدة (${params.oliveTypeAr}) للزبون ${clientLabel(params.client)} — مرجع #${params.reference} — ${formatNum(params.weightKg)} كغ · ${params.bagCount} أكياس · ${params.adhlefCount} ضلف${cap}`;
  },
  newClientInReception(client: ClientLike) {
    return `أضاف زبوناً جديداً في استقبال الزيتون : ${clientLabel(client)}`;
  },
  deleteWeighing(params: {
    client: ClientLike;
    reference: number;
    oliveTypeAr: string;
  }) {
    return `حذف وزنة (${params.oliveTypeAr}) للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  viewWeighingsDetail(client: ClientLike) {
    return `اطّلع على تفاصيل الأوزان للزبون ${clientLabel(client)} في استقبال الزيتون`;
  },
  updateWeighing(params: {
    client: ClientLike;
    reference: number;
    oliveTypeAr: string;
    changes: FieldChange[];
  }) {
    return withChanges(
      `عدّل وزنة (${params.oliveTypeAr}) للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`,
      params.changes,
    );
  },
};

/** المعالجة */
export const processing = {
  startTreatment(params: { client: ClientLike; reference: number }) {
    return `بدأ معالجة الزيتون للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  updateTreatment(params: {
    client: ClientLike;
    reference: number;
    changes: FieldChange[];
  }) {
    return withChanges(
      `عدّل معلومات المعالجة للزبون ${clientLabel(params.client)} (مرجع #${params.reference})`,
      params.changes,
    );
  },
  cancelTreatment(params: {
    client: ClientLike;
    reference: number;
    reason?: string;
  }) {
    const r = params.reason ? ` — السبب: ${params.reason}` : '';
    return `ألغى معالجة الزبون ${clientLabel(params.client)} — مرجع #${params.reference}${r}`;
  },
  collectOil(params: { client: ClientLike; reference: number }) {
    return `سجّل أخذ الزيت (أخذه) للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  uncollectOil(params: { client: ClientLike; reference: number }) {
    return `استرجع عملية أخذ الزيت للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  payClient(params: { client: ClientLike; reference: number }) {
    return `سجّل الدفع (سالك) للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  unpayClient(params: { client: ClientLike; reference: number }) {
    return `استرجع عملية الدفع (سالك) للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  nonReferential(params: {
    client: ClientLike;
    reference: number;
    value: boolean;
  }) {
    return params.value
      ? `علّم العملية غير مرجعية للزبون ${clientLabel(params.client)} — مرجع #${params.reference}`
      : `أزال وسم غير مرجعي عن الزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  transferToProcessing(params: { client: ClientLike; reference: number }) {
    return `نقل الزبون ${clientLabel(params.client)} إلى جدول المعالجة — مرجع #${params.reference}`;
  },
};

/** العصر / الاستخراج */
export const extraction = {
  start(params: {
    client: ClientLike;
    reference: number;
    oilL: number;
    amount: number;
  }) {
    return `بدأ استخراج/عصر الزيتون للزبون ${clientLabel(params.client)} — مرجع #${params.reference} — ${formatNum(params.oilL, 1)} ل · ${formatNum(params.amount)} دج`;
  },
  update(params: {
    client: ClientLike;
    reference: number;
    changes: FieldChange[];
  }) {
    return withChanges(
      `عدّل بيانات الاستخراج للزبون ${clientLabel(params.client)} (مرجع #${params.reference})`,
      params.changes,
    );
  },
  validate(params: { client: ClientLike; reference: number }) {
    return `أكّد/تحقّق من استخراج الزبون ${clientLabel(params.client)} — مرجع #${params.reference}`;
  },
  cancel(params: {
    client: ClientLike;
    reference: number;
    reason?: string;
  }) {
    const r = params.reason ? ` — ${params.reason}` : '';
    return `ألغى استخراج الزبون ${clientLabel(params.client)} — مرجع #${params.reference}${r}`;
  },
};

export const clients = {
  create(c: ClientLike) {
    return `أنشأ زبوناً جديداً : ${clientLabel(c)}`;
  },
  update(c: ClientLike, changes: FieldChange[]) {
    return withChanges(`عدّل معلومات الزبون ${clientLabel(c)}`, changes);
  },
  delete(c: ClientLike) {
    return `حذف الزبون ${clientLabel(c)}`;
  },
};

export const users = {
  create(username: string, roleAr: string) {
    return `أنشأ مستخدماً جديداً : ${username} — الدور: ${roleAr}`;
  },
  update(username: string, changes: FieldChange[]) {
    return withChanges(`عدّل حساب المستخدم ${username}`, changes);
  },
  resetPassword(username: string) {
    return `أعاد تعيين كلمة مرور المستخدم ${username}`;
  },
  deactivate(username: string) {
    return `عطّل حساب المستخدم ${username}`;
  },
  activate(username: string) {
    return `فعّل حساب المستخدم ${username}`;
  },
  delete(username: string) {
    return `حذف المستخدم ${username}`;
  },
  roleChange(username: string, before: string, after: string) {
    return `غيّر صلاحيات/دور المستخدم ${username} : ${arrowChange(before, after)}`;
  },
};

export const seasons = {
  create(name: string) {
    return `أنشأ موسم جديد : ${name}`;
  },
  close(name: string) {
    return `أغلق الموسم : ${name}`;
  },
  viewArchive(name: string) {
    return `اطّلع على أرشيف الموسم : ${name} (قراءة فقط)`;
  },
};

export function diffFields(
  labels: Record<string, string>,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  formatters?: Record<string, (v: unknown) => string>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const key of Object.keys(labels)) {
    if (after[key] === undefined) continue;
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) === JSON.stringify(a)) continue;
    const fmt = formatters?.[key] ?? ((v: unknown) => String(v ?? '—'));
    changes.push({
      label: labels[key],
      before: fmt(b),
      after: fmt(a),
    });
  }
  return changes;
}

export function pressingFieldChanges(
  existing: {
    oilQuantityL: unknown;
    aidAmount: unknown;
    region?: string | null;
    zayat?: string | null;
    yieldPercent?: unknown;
    amount?: unknown;
    oilCollected?: boolean;
    paid?: boolean;
  },
  dto: {
    oilQuantityL?: number;
    aidAmount?: number;
    region?: string;
    zayat?: string;
    yieldPercent?: number;
    oilCollected?: boolean;
    paid?: boolean;
  },
): FieldChange[] {
  const changes: FieldChange[] = [];
  const push = (label: string, b: unknown, a: unknown, fmt?: (v: unknown) => string) => {
    if (a === undefined) return;
    const bs = fmt ? fmt(b) : String(b ?? '—');
    const as = fmt ? fmt(a) : String(a ?? '—');
    if (bs !== as) changes.push({ label, before: bs, after: as });
  };
  push('كمية الزيت', existing.oilQuantityL, dto.oilQuantityL, (v) =>
    `${formatNum(v as number, 1)} ل`,
  );
  push('المساعدة', existing.aidAmount, dto.aidAmount, (v) =>
    `${formatNum(v as number)} دج`,
  );
  push('المنطقة', existing.region, dto.region);
  push('الزيات', existing.zayat, dto.zayat);
  push(
    'الريات %',
    existing.yieldPercent,
    dto.yieldPercent,
    (v) => `${formatNum(v as number, 1)}%`,
  );
  if (dto.oilCollected !== undefined && dto.oilCollected !== existing.oilCollected) {
    push('أخذ الزيت', existing.oilCollected ? 'نعم' : 'لا', dto.oilCollected ? 'نعم' : 'لا');
  }
  if (dto.paid !== undefined && dto.paid !== existing.paid) {
    push('الدفع', existing.paid ? 'نعم' : 'لا', dto.paid ? 'نعم' : 'لا');
  }
  return changes;
}

export function clientFieldChanges(
  existing: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    oliveType?: string;
  },
  dto: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    notes?: string;
    oliveType?: string;
  },
): FieldChange[] {
  return diffFields(
    {
      firstName: 'الاسم',
      lastName: 'اللقب',
      phone: 'الهاتف',
      notes: 'ملاحظات',
      oliveType: 'نوع الزيتون',
    },
    existing as Record<string, unknown>,
    dto as Record<string, unknown>,
  );
}
