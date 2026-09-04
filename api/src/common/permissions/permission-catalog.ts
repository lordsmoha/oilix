/**
 * Catalogue des permissions Oilix.
 * Convention existante : SCREAMING_SNAKE (équivalent MODULE.RESOURCE.ACTION).
 * Les anciennes permissions OIL_SALES_READ / WRITE restent des alias.
 */

export const MILL_PERMISSIONS = [
  'MILL_ACCESS',
  'USERS_READ',
  'USERS_WRITE',
  'CLIENTS_READ',
  'CLIENTS_WRITE',
  'OLIVE_READ',
  'OLIVE_WRITE',
  'PRESSING_READ',
  'PRESSING_WRITE',
  'FILTRATION_READ',
  'FILTRATION_WRITE',
  'FINANCE_READ',
  'FINANCE_WRITE',
  'SETTINGS_READ',
  'SETTINGS_WRITE',
  'REPORTS_READ',
  'AUDIT_READ',
  'BACKUP_RESTORE',
  'MILL_DEVICES_VIEW',
  'MILL_DEVICES_MANAGE',
] as const;

export const OIL_SALES_PERMISSIONS = [
  'OIL_SALES_ACCESS',
  'OIL_SALES_DASHBOARD_VIEW',
  'OIL_SALES_SALES_VIEW',
  'OIL_SALES_SALES_CREATE',
  'OIL_SALES_SALES_EDIT',
  'OIL_SALES_SALES_CANCEL',
  'OIL_SALES_SALES_DELETE',
  'OIL_SALES_SALES_REPRINT',
  'OIL_SALES_SALES_CHANGE_PRICE',
  'OIL_SALES_ASSISTANCE_FIXED',
  'OIL_SALES_ASSISTANCE_PERCENT',
  'OIL_SALES_ASSISTANCE_PER_LITRE',
  'OIL_SALES_ASSISTANCE_MODIFY',
  'OIL_SALES_ASSISTANCE_TOTALS',
  'OIL_SALES_STOCK_VIEW',
  'OIL_SALES_STOCK_ADD',
  'OIL_SALES_STOCK_ADJUST',
  'OIL_SALES_STOCK_LOSS',
  'OIL_SALES_STOCK_OVERRIDE',
  'OIL_SALES_INVENTORY_VIEW',
  'OIL_SALES_INVENTORY_CREATE',
  'OIL_SALES_CUSTOMERS_VIEW',
  'OIL_SALES_CUSTOMERS_CREATE',
  'OIL_SALES_CUSTOMERS_EDIT',
  'OIL_SALES_CUSTOMERS_DELETE',
  'OIL_SALES_CONTAINERS_VIEW',
  'OIL_SALES_CONTAINERS_CREATE',
  'OIL_SALES_CONTAINERS_EDIT',
  'OIL_SALES_CONTAINERS_DELETE',
  'OIL_SALES_CONTAINERS_SELL',
  'OIL_SALES_CONTAINERS_CHANGE_PRICE',
  'OIL_SALES_CONTAINER_STOCK_VIEW',
  'OIL_SALES_CONTAINER_STOCK_ADD',
  'OIL_SALES_CONTAINER_STOCK_ADJUST',
  'OIL_SALES_CONTAINER_STOCK_INVENTORY',
  'OIL_SALES_CONTAINER_STOCK_LOSS',
  'OIL_SALES_CONTAINER_STOCK_OVERRIDE',
  'OIL_SALES_CASH_REGISTER_OPEN',
  'OIL_SALES_CASH_REGISTER_CLOSE',
  'OIL_SALES_CASH_REGISTER_VIEW_OWN',
  'OIL_SALES_CASH_REGISTER_VIEW_ALL',
  'OIL_SALES_CASH_REGISTER_ADJUST',
  'OIL_SALES_CASH_REGISTER_VIEW_DIFFERENCES',
  'OIL_SALES_DEVICES_VIEW',
  'OIL_SALES_DEVICES_MANAGE',
  'OIL_SALES_REPORTS_VIEW',
  'OIL_SALES_REPORTS_EXPORT',
  'OIL_SALES_PRINT_RECEIPT',
  'OIL_SALES_SETTINGS_VIEW',
  'OIL_SALES_SETTINGS_EDIT',
] as const;

/** Alias rétrocompatibles → permissions granulaires */
export const PERMISSION_ALIASES: Record<string, string[]> = {
  OIL_SALES_READ: [
    'OIL_SALES_ACCESS',
    'OIL_SALES_DASHBOARD_VIEW',
    'OIL_SALES_SALES_VIEW',
    'OIL_SALES_STOCK_VIEW',
    'OIL_SALES_STOCK_LOSS',
    'OIL_SALES_INVENTORY_VIEW',
    'OIL_SALES_CUSTOMERS_VIEW',
    'OIL_SALES_CONTAINERS_VIEW',
    'OIL_SALES_CONTAINER_STOCK_VIEW',
    'OIL_SALES_REPORTS_VIEW',
    'OIL_SALES_ASSISTANCE_TOTALS',
    'OIL_SALES_SETTINGS_VIEW',
    'OIL_SALES_CASH_REGISTER_VIEW_OWN',
    'OIL_SALES_DEVICES_VIEW',
  ],
  OIL_SALES_WRITE: [
    'OIL_SALES_ACCESS',
    'OIL_SALES_SALES_CREATE',
    'OIL_SALES_SALES_VIEW',
    'OIL_SALES_PRINT_RECEIPT',
    'OIL_SALES_CUSTOMERS_VIEW',
    'OIL_SALES_CUSTOMERS_CREATE',
    'OIL_SALES_CONTAINERS_VIEW',
    'OIL_SALES_CONTAINERS_SELL',
    'OIL_SALES_STOCK_VIEW',
    'OIL_SALES_ASSISTANCE_FIXED',
    'OIL_SALES_ASSISTANCE_PERCENT',
    'OIL_SALES_ASSISTANCE_PER_LITRE',
    'OIL_SALES_CASH_REGISTER_VIEW_OWN',
    'OIL_SALES_CASH_REGISTER_OPEN',
  ],
  OIL_SALES_CANCEL: ['OIL_SALES_SALES_CANCEL'],
  OIL_SALES_SALES_REPRINT: ['OIL_SALES_PRINT_RECEIPT'],
  OIL_STOCK_WRITE: ['OIL_SALES_STOCK_ADD', 'OIL_SALES_STOCK_ADJUST', 'OIL_SALES_STOCK_VIEW'],
  OIL_INVENTORY_WRITE: ['OIL_SALES_INVENTORY_CREATE', 'OIL_SALES_INVENTORY_VIEW'],
  OIL_CUSTOMERS_WRITE: [
    'OIL_SALES_CUSTOMERS_CREATE',
    'OIL_SALES_CUSTOMERS_EDIT',
    'OIL_SALES_CUSTOMERS_VIEW',
  ],
  OIL_SALES_SETTINGS: ['OIL_SALES_SETTINGS_VIEW', 'OIL_SALES_SETTINGS_EDIT'],
  OIL_SALES_OVERRIDE: ['OIL_SALES_STOCK_OVERRIDE'],
  OIL_SALES_CASH_REGISTER_VIEW_ALL: [
    'OIL_SALES_CASH_REGISTER_VIEW_OWN',
    'OIL_SALES_CASH_REGISTER_VIEW_DIFFERENCES',
  ],
  OIL_SALES_DEVICES_MANAGE: ['OIL_SALES_DEVICES_VIEW'],
  MILL_DEVICES_MANAGE: ['MILL_DEVICES_VIEW'],
};

const MILL_OPS = [
  'CLIENTS_READ',
  'CLIENTS_WRITE',
  'OLIVE_READ',
  'OLIVE_WRITE',
  'PRESSING_READ',
  'PRESSING_WRITE',
  'FILTRATION_READ',
  'FILTRATION_WRITE',
  'FINANCE_READ',
  'FINANCE_WRITE',
];

export function expandPermissions(held: string[]): Set<string> {
  const set = new Set(held);
  for (const p of held) {
    for (const extra of PERMISSION_ALIASES[p] ?? []) set.add(extra);
  }
  if (MILL_OPS.some((p) => set.has(p)) || set.has('MILL_ACCESS')) {
    set.add('MILL_ACCESS');
  }
  if ([...set].some((p) => p.startsWith('OIL_SALES') || p.startsWith('OIL_STOCK') || p.startsWith('OIL_INVENTORY') || p.startsWith('OIL_CUSTOMERS'))) {
    set.add('OIL_SALES_ACCESS');
  }
  return set;
}

export function hasPermission(
  held: string[] | undefined,
  required: string,
  role?: string,
): boolean {
  if (role === 'ADMIN') return true;
  if (!held?.length) return false;
  return expandPermissions(held).has(required);
}

export function canAccessWorkspace(
  held: string[] | undefined,
  workspace: 'mill' | 'sales',
  role?: string,
): boolean {
  if (role === 'ADMIN') return true;
  return hasPermission(held, workspace === 'sales' ? 'OIL_SALES_ACCESS' : 'MILL_ACCESS', role);
}

export type PermissionMatrixGroup = {
  workspace: 'mill' | 'sales';
  section: string;
  sectionAr: string;
  actions: { key: string; label: string }[];
};

export const PERMISSION_MATRIX: PermissionMatrixGroup[] = [
  {
    workspace: 'mill',
    section: 'mill',
    sectionAr: 'المعصرة',
    actions: [
      { key: 'MILL_ACCESS', label: 'دخول مساحة المعصرة' },
      { key: 'CLIENTS_READ', label: 'عرض الزبائن' },
      { key: 'CLIENTS_WRITE', label: 'إدارة الزبائن' },
      { key: 'OLIVE_READ', label: 'عرض الاستقبال' },
      { key: 'OLIVE_WRITE', label: 'إدارة الاستقبال' },
      { key: 'PRESSING_READ', label: 'عرض العصر' },
      { key: 'PRESSING_WRITE', label: 'إدارة العصر' },
      { key: 'FILTRATION_READ', label: 'عرض التصفية' },
      { key: 'FILTRATION_WRITE', label: 'إدارة التصفية' },
      { key: 'FINANCE_READ', label: 'عرض المالية' },
      { key: 'FINANCE_WRITE', label: 'إدارة المالية' },
      { key: 'REPORTS_READ', label: 'التقارير' },
      { key: 'SETTINGS_READ', label: 'عرض الإعدادات' },
      { key: 'SETTINGS_WRITE', label: 'تعديل الإعدادات' },
      { key: 'USERS_READ', label: 'عرض المستخدمين' },
      { key: 'USERS_WRITE', label: 'إدارة المستخدمين' },
      { key: 'AUDIT_READ', label: 'سجل النشاط' },
      { key: 'BACKUP_RESTORE', label: 'نسخ احتياطي' },
      { key: 'MILL_DEVICES_VIEW', label: 'عرض الأجهزة' },
      { key: 'MILL_DEVICES_MANAGE', label: 'إدارة الأجهزة' },
    ],
  },
  {
    workspace: 'sales',
    section: 'dashboard',
    sectionAr: 'لوحة التحكم',
    actions: [
      { key: 'OIL_SALES_ACCESS', label: 'دخول مساحة بيع الزيت' },
      { key: 'OIL_SALES_DASHBOARD_VIEW', label: 'عرض' },
    ],
  },
  {
    workspace: 'sales',
    section: 'sales',
    sectionAr: 'المبيعات',
    actions: [
      { key: 'OIL_SALES_SALES_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_SALES_CREATE', label: 'إنشاء' },
      { key: 'OIL_SALES_SALES_EDIT', label: 'تعديل' },
      { key: 'OIL_SALES_SALES_CANCEL', label: 'إلغاء' },
      { key: 'OIL_SALES_SALES_DELETE', label: 'حذف' },
      { key: 'OIL_SALES_SALES_REPRINT', label: 'إعادة طباعة' },
      { key: 'OIL_SALES_SALES_CHANGE_PRICE', label: 'تغيير السعر' },
      { key: 'OIL_SALES_PRINT_RECEIPT', label: 'طباعة الوصل' },
    ],
  },
  {
    workspace: 'sales',
    section: 'assistance',
    sectionAr: 'المساعدة',
    actions: [
      { key: 'OIL_SALES_ASSISTANCE_FIXED', label: 'مساعدة ثابتة' },
      { key: 'OIL_SALES_ASSISTANCE_PERCENT', label: 'مساعدة نسبة' },
      { key: 'OIL_SALES_ASSISTANCE_PER_LITRE', label: 'مساعدة لكل لتر' },
      { key: 'OIL_SALES_ASSISTANCE_MODIFY', label: 'تعديل المساعدة' },
      { key: 'OIL_SALES_ASSISTANCE_TOTALS', label: 'عرض إجمالي المساعدات' },
    ],
  },
  {
    workspace: 'sales',
    section: 'stock',
    sectionAr: 'المخزون',
    actions: [
      { key: 'OIL_SALES_STOCK_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_STOCK_ADD', label: 'إضافة' },
      { key: 'OIL_SALES_STOCK_ADJUST', label: 'تعديل / تصحيح' },
      { key: 'OIL_SALES_STOCK_LOSS', label: 'عرض الخسارة' },
      { key: 'OIL_SALES_STOCK_OVERRIDE', label: 'تجاوز المخزون' },
    ],
  },
  {
    workspace: 'sales',
    section: 'inventory',
    sectionAr: 'الجرد',
    actions: [
      { key: 'OIL_SALES_INVENTORY_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_INVENTORY_CREATE', label: 'تسجيل جرد' },
    ],
  },
  {
    workspace: 'sales',
    section: 'customers',
    sectionAr: 'الزبائن',
    actions: [
      { key: 'OIL_SALES_CUSTOMERS_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_CUSTOMERS_CREATE', label: 'إضافة' },
      { key: 'OIL_SALES_CUSTOMERS_EDIT', label: 'تعديل' },
      { key: 'OIL_SALES_CUSTOMERS_DELETE', label: 'حذف' },
    ],
  },
  {
    workspace: 'sales',
    section: 'containers',
    sectionAr: 'الضلف / التعبئة',
    actions: [
      { key: 'OIL_SALES_CONTAINERS_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_CONTAINERS_CREATE', label: 'إضافة' },
      { key: 'OIL_SALES_CONTAINERS_EDIT', label: 'تعديل' },
      { key: 'OIL_SALES_CONTAINERS_DELETE', label: 'تعطيل / حذف' },
      { key: 'OIL_SALES_CONTAINERS_SELL', label: 'بيع ضلف فارغة' },
      { key: 'OIL_SALES_CONTAINERS_CHANGE_PRICE', label: 'تغيير سعر الضلف' },
    ],
  },
  {
    workspace: 'sales',
    section: 'container-stock',
    sectionAr: 'مخزون الضلف',
    actions: [
      { key: 'OIL_SALES_CONTAINER_STOCK_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_CONTAINER_STOCK_ADD', label: 'إضافة' },
      { key: 'OIL_SALES_CONTAINER_STOCK_ADJUST', label: 'تصحيح' },
      { key: 'OIL_SALES_CONTAINER_STOCK_INVENTORY', label: 'جرد' },
      { key: 'OIL_SALES_CONTAINER_STOCK_LOSS', label: 'تلف / فقدان' },
      { key: 'OIL_SALES_CONTAINER_STOCK_OVERRIDE', label: 'تجاوز المخزون' },
    ],
  },
  {
    workspace: 'sales',
    section: 'cash',
    sectionAr: 'الصناديق',
    actions: [
      { key: 'OIL_SALES_CASH_REGISTER_OPEN', label: 'فتح الصندوق' },
      { key: 'OIL_SALES_CASH_REGISTER_CLOSE', label: 'إغلاق الصندوق' },
      { key: 'OIL_SALES_CASH_REGISTER_VIEW_OWN', label: 'عرض الصندوق الحالي' },
      { key: 'OIL_SALES_CASH_REGISTER_VIEW_ALL', label: 'عرض كل الصناديق' },
      { key: 'OIL_SALES_CASH_REGISTER_ADJUST', label: 'تعديل حركة الصندوق' },
      { key: 'OIL_SALES_CASH_REGISTER_VIEW_DIFFERENCES', label: 'عرض الفروقات' },
    ],
  },
  {
    workspace: 'sales',
    section: 'devices',
    sectionAr: 'الأجهزة',
    actions: [
      { key: 'OIL_SALES_DEVICES_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_DEVICES_MANAGE', label: 'إدارة / اعتماد' },
    ],
  },
  {
    workspace: 'sales',
    section: 'reports',
    sectionAr: 'التقارير',
    actions: [
      { key: 'OIL_SALES_REPORTS_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_REPORTS_EXPORT', label: 'تصدير' },
    ],
  },
  {
    workspace: 'sales',
    section: 'settings',
    sectionAr: 'الإعدادات',
    actions: [
      { key: 'OIL_SALES_SETTINGS_VIEW', label: 'عرض' },
      { key: 'OIL_SALES_SETTINGS_EDIT', label: 'تعديل' },
    ],
  },
];
