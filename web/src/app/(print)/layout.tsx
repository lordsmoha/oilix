'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (localStorage.getItem('oilix_token')) return;
    const oilSalePrint =
      pathname.startsWith('/oil-sale') || pathname.startsWith('/print/oil-sale');
    router.replace(oilSalePrint ? '/login?workspace=sales' : '/');
  }, [router, pathname]);

  return <div className="min-h-screen bg-white text-stone-900">{children}</div>;
}
