'use client';

import { CashRegistersAdmin } from '@/components/devices/cash-registers-admin';
import { DevicesAdmin } from '@/components/devices/devices-admin';

export default function SalesDevicesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <p className="text-xs font-bold text-amber-800 dark:text-amber-400">بيع الزيت</p>
        <h1 className="text-2xl font-black">الأجهزة / محطات العمل</h1>
        <p className="mt-1 text-sm text-[var(--app-text-dim)]">
          اعتماد الأجهزة وربط كل جهاز بصندوق نقدي مستقل. المخزون مشترك بين كل الأجهزة.
        </p>
      </div>
      <CashRegistersAdmin />
      <DevicesAdmin workspace="sales" />
    </div>
  );
}
