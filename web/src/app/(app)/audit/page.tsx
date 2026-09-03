'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Filter, Users } from 'lucide-react';
import { api, Paginated } from '@/lib/api';
import {
  auditActionLabel,
  auditModuleLabel,
  formatAuditDiff,
} from '@/lib/audit-labels';
import { formatDateTimeDz } from '@/lib/locale-dz';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ModulePageHero } from '@/components/ui/module-page-hero';

type AuditLog = {
  id: string;
  action: string;
  module: string;
  description?: string | null;
  entity: string;
  entityId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: { nameAr: string };
  } | null;
  device?: { code?: string | null; name?: string } | null;
  deviceCode?: string | null;
  workspace?: string | null;
};

type FilterOptions = {
  actions: string[];
  modules: string[];
  users: { id: string; username: string; firstName?: string | null; lastName?: string | null }[];
};

export default function AuditPage() {
  const canRead = useAuthStore((s) => s.hasPermission('AUDIT_READ'));
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [module, setModule] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const { data: filters } = useQuery({
    queryKey: ['audit-filters'],
    queryFn: async () => (await api.get<FilterOptions>('/audit-logs/filters')).data,
    enabled: canRead,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit', userId, action, module, dateFrom, dateTo, search],
    queryFn: async () =>
      (
        await api.get<Paginated<AuditLog>>('/audit-logs', {
          params: {
            limit: 200,
            userId: userId || undefined,
            action: action || undefined,
            module: module || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            search: search || undefined,
          },
        })
      ).data,
    enabled: canRead,
  });

  if (!canRead) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        ليس لديك صلاحية عرض سجل النشاط.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModulePageHero
        gradient="from-indigo-800 via-indigo-700 to-violet-600"
        icon={<ClipboardList className="h-7 w-7 text-white" />}
        title="سجل النشاط"
        subtitle="وصف تفصيلي لكل عملية — يمكن فهم ما حدث دون فتح التفاصيل"
        actions={
          isAdmin ? (
            <Link href="/users">
              <Button type="button" className="gap-2 bg-white/20 text-white hover:bg-white/30">
                <Users className="h-4 w-4" />
                المستخدمون
              </Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300">
          <Filter className="h-4 w-4" />
          تصفية السجل
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">المستخدم</label>
            <select
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">الكل</option>
              {filters?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                  {u.firstName ? ` — ${u.firstName} ${u.lastName ?? ''}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">نوع الإجراء</label>
            <select
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">الكل</option>
              {filters?.actions.map((a) => (
                <option key={a} value={a}>
                  {auditActionLabel(a)} ({a})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">الموديول</label>
            <select
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="">الكل</option>
              {filters?.modules.map((m) => (
                <option key={m} value={m}>
                  {auditModuleLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="من تاريخ"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="إلى تاريخ"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Input
            label="بحث في الوصف"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="وصف، مستخدم، إجراء..."
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          تحديث
        </Button>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-stone-50 dark:bg-stone-800/50">
                <th className="px-3 py-3 text-right">التاريخ والوقت</th>
                <th className="px-3 py-3 text-right">المستخدم</th>
                <th className="px-3 py-3 text-right">الجهاز</th>
                <th className="px-3 py-3 text-right">الإجراء</th>
                <th className="px-3 py-3 text-right">الموديول</th>
                <th className="min-w-[16rem] px-3 py-3 text-right">الوصف التفصيلي</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    لا توجد عمليات مسجّلة
                  </td>
                </tr>
              ) : (
                data?.items.map((log) => (
                  <tr key={log.id} className="border-b align-top hover:bg-stone-50/80 dark:hover:bg-stone-800/30">
                    <td className="whitespace-nowrap px-3 py-3 text-xs" dir="ltr">
                      {formatDateTimeDz(log.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{log.user?.username ?? '—'}</p>
                      {log.user?.role?.nameAr ? (
                        <p className="text-xs text-stone-500">{log.user.role.nameAr}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-xs font-mono">
                      {log.device?.code || log.deviceCode || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold dark:bg-stone-800">
                        {auditActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">{auditModuleLabel(log.module)}</td>
                    <td className="min-w-[16rem] max-w-xl px-3 py-3">
                      <p className="font-medium leading-relaxed text-stone-800 dark:text-stone-200">
                        {log.description ??
                          `${log.entity}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}`}
                      </p>
                      {formatAuditDiff(log.oldData, log.newData) ? (
                        <p className="mt-1 text-xs text-stone-500" dir="ltr">
                          {formatAuditDiff(log.oldData, log.newData)}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.meta ? (
          <p className="mt-3 text-xs text-stone-500">
            {data.meta.total} عملية — الصفحة {data.meta.page} / {data.meta.totalPages}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
