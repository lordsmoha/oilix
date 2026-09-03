'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Menu } from 'lucide-react';
import { SalesSidebar } from './sales-sidebar';
import { ModuleSwitcher } from './module-switcher';
import { SeasonPicker } from '@/components/season/season-picker';
import { SeasonViewBanner } from '@/components/season/season-view-banner';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { FullscreenToggle } from '@/components/layout/fullscreen-toggle';
import { LogoutButton } from '@/components/layout/logout-button';
import { DeviceStatusBanner } from '@/components/devices/device-status-banner';
import { useAuthStore } from '@/lib/auth-store';
import { canAccessWorkspace } from '@/lib/permission-catalog';
import { useWorkspaceStore, workspaceLoginPath } from '@/lib/workspace-store';
import { SALES_BRAND } from '@/lib/sales-nav';
import { formatDateShortDz, formatTimeDz } from '@/lib/locale-dz';

export function SalesShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setWorkspace('sales');
  }, [setWorkspace]);

  useEffect(() => {
    if (!token) router.replace(workspaceLoginPath('sales'));
  }, [token, router]);

  useEffect(() => {
    if (token && user && !canAccessWorkspace(user.permissions, 'sales', user.role)) {
      router.replace('/access-denied?workspace=sales');
    }
  }, [token, user, router]);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="text-center">
          <Leaf className="mx-auto h-8 w-8 text-amber-700" />
          <p className="mt-2 text-sm text-[var(--app-text-dim)]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex flex-col bg-[var(--app-bg)]">
      <div className="app-shell-row">
        <SalesSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

        <div className="app-content-panel">
          <header className="no-print shrink-0 border-b border-amber-900/10 bg-[var(--app-surface)] dark:border-amber-500/15">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-muted)] lg:hidden"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--app-text)]">
                    {SALES_BRAND.tagline} · {user?.firstName || user?.username}
                  </p>
                  <p className="truncate text-xs text-amber-800/80 dark:text-amber-400/80">
                    وحدة مستقلة عن إدارة المعصرة
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2">
                <ModuleSwitcher compact className="hidden sm:inline-flex" />
                <SeasonPicker className="hidden shrink-0 sm:block" />
                {now ? (
                  <span className="hidden text-xs text-[var(--app-text-dim)] md:inline">
                    {formatDateShortDz(now)} · {formatTimeDz(now)}
                  </span>
                ) : null}
                <FullscreenToggle />
                <ThemeToggle />
                <LogoutButton compact />
              </div>
            </div>
          </header>
          <DeviceStatusBanner workspace="sales" />
          <SeasonViewBanner />
          <main className="app-main flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
