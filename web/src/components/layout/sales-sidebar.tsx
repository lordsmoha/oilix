'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import {
  SALES_BRAND,
  SALES_NAV,
  isSalesNavActive,
  type SalesNavItem,
} from '@/lib/sales-nav';
import { useAuthStore } from '@/lib/auth-store';
import { ModuleSwitcher } from '@/components/layout/module-switcher';
import { LogoutButton } from '@/components/layout/logout-button';
import { cn } from '@/lib/utils';

type Props = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function SalesSidebar({ mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const BrandIcon = SALES_BRAND.icon;

  const items = SALES_NAV.filter((item) => {
    if (item.anyOf?.length) return item.anyOf.some((p) => hasPermission(p));
    return !item.permission || hasPermission(item.permission);
  });

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onMobileClose}
        aria-hidden
      />

      <aside
        className={cn(
          'app-sidebar no-print fixed z-50 flex w-[min(calc(100vw-2*var(--app-shell-pad)),18rem)] flex-col',
          'top-[max(var(--app-shell-pad),env(safe-area-inset-top,0px))] bottom-[max(var(--app-shell-pad),env(safe-area-inset-bottom,0px))] right-[var(--app-shell-pad)]',
          'rounded-[var(--app-panel-radius)] border border-amber-900/12 bg-gradient-to-b from-[#fffaf0] to-[#f7f0e4]',
          'shadow-[var(--app-shadow)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'dark:from-[#1a1610] dark:to-[#14110d] dark:border-amber-500/20',
          'lg:static lg:z-auto lg:h-full lg:min-h-0 lg:w-[var(--app-sidebar-width)] lg:shrink-0 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        )}
        aria-label="قائمة بيع الزيت"
      >
        <div className="flex items-center justify-between gap-3 border-b border-amber-900/10 px-5 py-4 dark:border-amber-500/15">
          <Link href="/sales" className="group flex min-w-0 items-center gap-3" onClick={onMobileClose}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--app-radius)] bg-gradient-to-br from-amber-600 to-amber-800 text-white">
              <BrandIcon className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-[var(--app-text)]">
                {SALES_BRAND.name}
              </p>
              <p className="truncate text-[11px] font-bold text-amber-800 dark:text-amber-400">
                {SALES_BRAND.tagline}
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-xl p-2 text-[var(--app-text-muted)] transition hover:bg-black/5 lg:hidden"
            onClick={onMobileClose}
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-amber-900/10 px-3 py-3 dark:border-amber-500/15 lg:hidden">
          <ModuleSwitcher className="w-full justify-center" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800/70 dark:text-amber-400/70">
            بيع الزيت
          </p>
          <ul className="space-y-1">
            {items.map((item) => (
              <SalesSidebarLink
                key={item.href}
                item={item}
                active={isSalesNavActive(pathname, item, items)}
                onNavigate={onMobileClose}
              />
            ))}
          </ul>
        </nav>
        <div className="border-t border-amber-900/10 px-3 py-3 dark:border-amber-500/15">
          <ModuleSwitcher className="w-full" />
          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}

function SalesSidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: SalesNavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
          active
            ? 'bg-amber-600 text-white shadow-sm'
            : 'text-[var(--app-text-muted)] hover:bg-amber-600/10 hover:text-[var(--app-text)]',
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2.1} />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
