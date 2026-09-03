'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, Factory, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { canAccessWorkspace } from '@/lib/permission-catalog';
import { useWorkspaceStore, workspaceHome, type WorkspaceId } from '@/lib/workspace-store';
import { cn } from '@/lib/utils';

export function ModuleSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const canMill = canAccessWorkspace(user?.permissions, 'mill', user?.role);
  const canSales = canAccessWorkspace(user?.permissions, 'sales', user?.role);
  const current = workspace ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/sales') ? 'sales' : 'mill');

  function go(id: WorkspaceId) {
    setWorkspace(id);
    if (!canAccessWorkspace(user?.permissions, id, user?.role)) {
      router.push(`/access-denied?workspace=${id}`);
      return;
    }
    router.push(workspaceHome(id));
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className="inline-flex items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-muted)] p-1"
        role="tablist"
        aria-label="تبديل الوحدة"
      >
        <button
          type="button"
          onClick={() => go('mill')}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition',
            current === 'mill'
              ? 'bg-[var(--app-surface)] text-[var(--app-accent)] shadow-sm'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]',
            !canMill && current !== 'mill' ? 'opacity-50' : '',
          )}
        >
          <Factory className="h-3.5 w-3.5" />
          المعصرة
        </button>
        <button
          type="button"
          onClick={() => go('sales')}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition',
            current === 'sales'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]',
            !canSales && current !== 'sales' ? 'opacity-50' : '',
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          بيع الزيت
        </button>
      </div>
      {compact ? null : (
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
        >
          <ArrowLeftRight className="h-3 w-3" />
          تغيير مساحة العمل
        </Link>
      )}
    </div>
  );
}
