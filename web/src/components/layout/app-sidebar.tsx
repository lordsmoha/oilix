'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import {
  APP_NAV,
  BRAND,
  flattenNavItems,
  isNavActive,
  type NavItem,
} from '@/lib/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ModuleSwitcher } from '@/components/layout/module-switcher';
import { LogoutButton } from '@/components/layout/logout-button';
import { cn } from '@/lib/utils';

type Props = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

type NavCluster =
  | { kind: 'item'; item: NavItem }
  | { kind: 'group'; label: string; items: NavItem[] };

function clusterItems(items: NavItem[]): NavCluster[] {
  const clusters: NavCluster[] = [];
  for (const item of items) {
    if (!item.group) {
      clusters.push({ kind: 'item', item });
      continue;
    }
    const last = clusters.at(-1);
    if (last?.kind === 'group' && last.label === item.group) {
      last.items.push(item);
    } else {
      clusters.push({ kind: 'group', label: item.group, items: [item] });
    }
  }
  return clusters;
}

export function AppSidebar({ mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const BrandIcon = BRAND.icon;

  const visibleSections = APP_NAV.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.permission || hasPermission(item.permission),
    ),
  })).filter((s) => s.items.length > 0);

  const allItems = flattenNavItems(visibleSections);

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
          'rounded-[var(--app-panel-radius)] border border-[var(--app-border)] bg-[var(--app-surface)]',
          'shadow-[var(--app-shadow)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'lg:static lg:z-auto lg:h-full lg:min-h-0 lg:w-[var(--app-sidebar-width)] lg:shrink-0 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        )}
        aria-label="القائمة الجانبية"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-3.5">
          <Link href="/dashboard" className="group flex min-w-0 items-center gap-3" onClick={onMobileClose}>
            <span className="app-brand-loader flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--app-accent)] to-[var(--app-accent-dark)] text-white shadow-[var(--app-shadow-glow)]">
              <BrandIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-[var(--app-text)]">{BRAND.name}</p>
              <p className="truncate text-[11px] font-medium text-[var(--app-text-dim)]">{BRAND.tagline}</p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-xl p-2 text-[var(--app-text-muted)] transition hover:bg-[var(--app-bg-muted)] lg:hidden"
            onClick={onMobileClose}
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {visibleSections.map((section) => (
            <div key={section.id} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[10px] font-bold tracking-[0.16em] text-[var(--app-text-dim)]">
                {section.label}
              </p>
              <div className="space-y-1">
                {clusterItems(section.items).map((cluster) =>
                  cluster.kind === 'item' ? (
                    <SidebarLink
                      key={cluster.item.href}
                      item={cluster.item}
                      active={isNavActive(pathname, cluster.item, allItems)}
                      onNavigate={onMobileClose}
                    />
                  ) : (
                    <OliveTypeGroup
                      key={cluster.label}
                      label={cluster.label}
                      items={cluster.items}
                      pathname={pathname}
                      allItems={allItems}
                      onNavigate={onMobileClose}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--app-border)] px-3 py-3 space-y-2.5">
          <ModuleSwitcher className="w-full justify-center" />
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}

function OliveTypeGroup({
  label,
  items,
  pathname,
  allItems,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  allItems: NavItem[];
  onNavigate: () => void;
}) {
  const groupActive = items.some((item) => isNavActive(pathname, item, allItems));
  return (
    <div
      className={cn(
        'rounded-2xl border p-1 transition-colors',
        groupActive
          ? 'border-[color-mix(in_srgb,var(--app-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--app-accent)_8%,transparent)]'
          : 'border-transparent bg-[var(--app-bg-muted)]/70',
      )}
    >
      <p className="px-2.5 pb-1 pt-1 text-[11px] font-bold text-[var(--app-text)]">{label}</p>
      <div className={cn(items.length === 2 ? 'grid grid-cols-2 gap-1' : 'space-y-1')}>
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isNavActive(pathname, item, allItems)}
            onNavigate={onNavigate}
            compact
          />
        ))}
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
  compact = false,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center font-semibold transition-all duration-200',
          compact
            ? 'justify-center gap-1.5 rounded-xl px-2 py-2 text-[12px]'
            : 'gap-3 rounded-xl px-3 py-2.5 text-sm',
          active
            ? 'bg-gradient-to-l from-[var(--app-accent)] to-[var(--app-accent-dark)] text-white shadow-[var(--app-shadow-glow)]'
            : compact
              ? 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]'
              : 'text-[var(--app-text-muted)] hover:bg-[var(--app-bg-muted)] hover:text-[var(--app-text)]',
        )}
    >
      {active && !compact ? (
        <span className="absolute inset-y-2 right-0 w-1 rounded-full bg-white/90" aria-hidden />
      ) : null}
      <Icon
        className={cn(
          'shrink-0 transition-transform duration-200 group-hover:scale-110',
          compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
          active ? 'text-white/95' : 'text-[var(--app-accent)]',
        )}
      />
      <span className={cn('min-w-0', compact ? 'truncate' : 'flex-1 truncate')}>{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-[var(--app-gold-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-gold)]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
