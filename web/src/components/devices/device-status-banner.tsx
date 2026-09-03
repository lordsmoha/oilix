'use client';

import Link from 'next/link';
import { useDeviceMe } from '@/hooks/use-device-me';
import { useAuthStore } from '@/lib/auth-store';

export function DeviceStatusBanner({ workspace }: { workspace: 'mill' | 'sales' }) {
  const { data } = useDeviceMe();
  const canManage = useAuthStore((s) =>
    s.hasPermission(workspace === 'sales' ? 'OIL_SALES_DEVICES_MANAGE' : 'MILL_DEVICES_MANAGE'),
  );
  const device = data?.device;
  if (!device || device.status === 'ACTIVE') return null;

  const pending = device.status === 'PENDING';
  const href = workspace === 'sales' ? '/sales/devices' : '/settings/devices';

  return (
    <div
      className={`no-print mx-4 mt-3 rounded-xl border px-4 py-3 text-sm ${
        pending
          ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100'
          : 'border-red-300 bg-red-50 text-red-950 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100'
      }`}
    >
      <p className="font-bold">
        {pending
          ? 'هذا الجهاز بانتظار موافقة المدير قبل تنفيذ العمليات.'
          : 'هذا الجهاز غير مصرّح له بتنفيذ العمليات.'}
      </p>
      <p className="mt-1 text-xs opacity-80">
        {device.name}
        {device.code ? ` · ${device.code}` : ''}
      </p>
      {canManage ? (
        <Link href={href} className="mt-2 inline-block text-xs font-bold underline">
          إدارة الأجهزة
        </Link>
      ) : null}
    </div>
  );
}
