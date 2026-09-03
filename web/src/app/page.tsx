'use client';

import { useRouter } from 'next/navigation';
import { Droplets, Factory, Leaf } from 'lucide-react';
import { FullscreenToggle } from '@/components/layout/fullscreen-toggle';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuthStore } from '@/lib/auth-store';
import { canAccessWorkspace } from '@/lib/permission-catalog';
import { useWorkspaceStore, workspaceHome, workspaceLoginPath } from '@/lib/workspace-store';

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  function choose(id: 'mill' | 'sales') {
    setWorkspace(id);
    if (token && user) {
      if (!canAccessWorkspace(user.permissions, id, user.role)) {
        router.push(`/access-denied?workspace=${id}`);
        return;
      }
      router.push(workspaceHome(id));
      return;
    }
    router.push(workspaceLoginPath(id));
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="absolute left-5 top-5 flex gap-2">
        <FullscreenToggle />
        <ThemeToggle />
      </div>

      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg">
          <Leaf className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-[var(--app-text)]">Oilix</h1>
        <p className="mt-2 text-[var(--app-text-dim)]">اختر مساحة العمل</p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => choose('mill')}
          className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg"
        >
          <Factory className="mb-4 h-10 w-10 text-emerald-700" />
          <h2 className="text-2xl font-black">المعصرة</h2>
          <p className="mt-1 text-sm text-[var(--app-text-dim)]">Gestion de l&apos;huilerie</p>
          <p className="mt-3 text-sm text-[var(--app-text-muted)]">
            استقبال الزيتون، العصر، التصفية، المالية
          </p>
        </button>

        <button
          type="button"
          onClick={() => choose('sales')}
          className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-amber-600 hover:shadow-lg"
        >
          <Droplets className="mb-4 h-10 w-10 text-amber-700" />
          <h2 className="text-2xl font-black">بيع الزيت</h2>
          <p className="mt-1 text-sm text-[var(--app-text-dim)]">Vente d&apos;huile</p>
          <p className="mt-3 text-sm text-[var(--app-text-muted)]">
            نقطة البيع، المخزون، الزبائن، التقارير
          </p>
        </button>
      </div>
    </div>
  );
}
