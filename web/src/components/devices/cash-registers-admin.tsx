'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';

type Register = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  notes?: string | null;
};

export function CashRegistersAdmin() {
  const qc = useQueryClient();
  const canManage = useAuthStore((s) => s.hasPermission('OIL_SALES_DEVICES_MANAGE'));
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const listQ = useQuery({
    queryKey: ['cash-registers', 'all'],
    queryFn: async () =>
      (await api.get<Register[]>('/oil-sales/cash/registers', { params: { all: '1' } })).data,
    enabled: canManage,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      (await api.post('/oil-sales/cash/registers', { code: code.trim(), name: name.trim() })).data,
    onSuccess: () => {
      toast.success('تم إنشاء الصندوق');
      setCode('');
      setName('');
      void qc.invalidateQueries({ queryKey: ['cash-registers'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر إنشاء الصندوق'),
  });

  const toggleMut = useMutation({
    mutationFn: async (r: Register) =>
      (await api.patch(`/oil-sales/cash/registers/${r.id}`, { isActive: !r.isActive })).data,
    onSuccess: () => {
      toast.success('تم تحديث الصندوق');
      void qc.invalidateQueries({ queryKey: ['cash-registers'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر التحديث'),
  });

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createMut.mutate();
  }

  if (!canManage) return null;

  const rows = listQ.data ?? [];

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <div>
        <h2 className="font-black">الصناديق النقدية</h2>
        <p className="text-sm text-[var(--app-text-dim)]">
          أنشئ صناديق قبل اعتماد الأجهزة. كل جهاز بيع يُربط بصندوق واحد.
        </p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          label="الرمز"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CAISSE-04"
          required
        />
        <Input
          label="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="صندوق البيع 4"
          required
        />
        <div className="flex items-end">
          <Button type="submit" loading={createMut.isPending} className="w-full sm:w-auto">
            إضافة
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-[var(--app-border)] text-right text-[var(--app-text-dim)]">
              <th className="px-2 py-2 font-semibold">الرمز</th>
              <th className="px-2 py-2 font-semibold">الاسم</th>
              <th className="px-2 py-2 font-semibold">الحالة</th>
              <th className="px-2 py-2 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--app-border)] last:border-0">
                <td className="px-2 py-2 font-mono font-bold">{r.code}</td>
                <td className="px-2 py-2">{r.name}</td>
                <td className="px-2 py-2">{r.isActive ? 'نشط' : 'معطّل'}</td>
                <td className="px-2 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMut.mutate(r)}
                    disabled={toggleMut.isPending}
                  >
                    {r.isActive ? 'تعطيل' : 'تفعيل'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-2 text-sm text-[var(--app-text-dim)]">لا صناديق بعد — أضف صندوقاً أولاً</p>
        ) : null}
      </div>
    </div>
  );
}
