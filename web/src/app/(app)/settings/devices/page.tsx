'use client';

import { DevicesAdmin } from '@/components/devices/devices-admin';

export default function MillDevicesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-black">أجهزة المعصرة</h1>
        <p className="mt-1 text-sm text-[var(--app-text-dim)]">
          كل عملية مهمة تُسجَّل مع المستخدم والجهاز الذي نُفِّذت منه.
        </p>
      </div>
      <DevicesAdmin workspace="mill" />
    </div>
  );
}
