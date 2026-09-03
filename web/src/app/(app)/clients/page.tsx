'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Printer, Users } from 'lucide-react';
import { openClientReceipt } from '@/lib/open-client-receipt';
import { toast } from 'sonner';
import { api, Paginated } from '@/lib/api';
import { OLIVE_TYPES } from '@/lib/labels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ModulePageHero } from '@/components/ui/module-page-hero';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';

type Client = {
  id: string;
  clientNumber: number;
  oliveType: string;
  firstName: string;
  lastName: string;
  phone?: string;
  notes?: string;
};

export default function ClientsPage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editClientId, setEditClientId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, filterType],
    queryFn: async () =>
      (
        await api.get<Paginated<Client>>('/clients', {
          params: { search, limit: 50, ...(filterType ? { oliveType: filterType } : {}) },
        })
      ).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم الحذف');
    },
  });

  return (
    <div className="clients-page module-page relative -mx-3 min-h-full px-3 pb-12 md:-mx-6 md:px-6">
      <div className="module-page-bg" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl space-y-6 py-5 md:py-8">
        <ModulePageHero
          gradient="from-violet-900 via-violet-800 to-indigo-700"
          glow="shadow-violet-800/25"
          patternClass="olive-add-hero-pattern"
          icon={<Users className="h-7 w-7 text-white" />}
          title="الزبائن"
          subtitle="ترقيم مستقل لكل نوع زيتون — موسم حالي"
          actions={
            !readOnly ? (
              <Button
                onClick={() => {
                  setEditClientId(null);
                  setModal('create');
                }}
                className="border-white/30 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
              >
                <Plus className="h-4 w-4" />
                زبون جديد
              </Button>
            ) : undefined
          }
        />

        <Card className="module-panel-enter border-[var(--app-border)] bg-[var(--app-surface)]/85 shadow-[var(--app-shadow-lg)] backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-dim)]" />
              <Input
                placeholder="بحث بالاسم أو الهاتف أو الرقم..."
                className="pr-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2.5 text-sm font-medium text-[var(--app-text)]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">كل الأنواع</option>
              {OLIVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)]">
            <table className="app-table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>النوع</th>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>ملاحظات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[var(--app-text-muted)]">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[var(--app-text-muted)]">
                      لا يوجد زبائن
                    </td>
                  </tr>
                ) : (
                  data?.items.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono font-bold tabular-nums">{c.clientNumber}</td>
                      <td className="text-xs text-[var(--app-text-muted)]">
                        {OLIVE_TYPES.find((t) => t.value === c.oliveType)?.label ?? c.oliveType}
                      </td>
                      <td>
                        {c.firstName} {c.lastName}
                      </td>
                      <td dir="ltr">{c.phone ?? '—'}</td>
                      <td
                        className="max-w-[10rem] truncate text-[var(--app-text-muted)]"
                        title={c.notes ?? undefined}
                      >
                        {c.notes?.trim() ? c.notes : '—'}
                      </td>
                      <td>
                        {readOnly ? (
                          <span className="text-xs text-[var(--app-text-dim)]">عرض فقط</span>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="طباعة الوصل"
                              onClick={() =>
                                openClientReceipt(c.id, {
                                  oliveType: c.oliveType as 'GREEN' | 'ZBOUCH' | 'RIPE',
                                })
                              }
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditClientId(c.id);
                                setModal('edit');
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('هل تريد حذف هذا الزبون؟'))
                                  deleteMutation.mutate(c.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {modal && !readOnly ? (
        <ClientFormModal
          mode={modal}
          clientId={editClientId ?? undefined}
          onClose={() => {
            setModal(null);
            setEditClientId(null);
          }}
          onCreated={(client) => {
            openClientReceipt(client.id, {
              autoPrint: true,
              oliveType: client.oliveType as 'GREEN' | 'ZBOUCH' | 'RIPE',
            });
          }}
        />
      ) : null}
    </div>
  );
}
