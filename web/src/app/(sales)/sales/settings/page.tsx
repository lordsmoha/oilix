'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';

type Settings = {
  priceGreen: number;
  priceTaieb: number;
  priceDrou: number;
  priceZebbouche: number;
  receiptHeader: string;
  receiptFooter: string;
};

export default function SalesSettingsPage() {
  const qc = useQueryClient();
  const canWrite = useAuthStore((s) => s.hasPermission('OIL_SALES_SETTINGS_EDIT'));
  const [form, setForm] = useState<Settings>({
    priceGreen: 900,
    priceTaieb: 900,
    priceDrou: 900,
    priceZebbouche: 900,
    receiptHeader: '',
    receiptFooter: '',
  });

  const q = useQuery({
    queryKey: ['oil-sales-settings'],
    queryFn: async () => (await api.get<Settings>('/oil-sales/settings')).data,
  });

  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  const mut = useMutation({
    mutationFn: async () => (await api.patch('/oil-sales/settings', form)).data,
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات');
      void qc.invalidateQueries({ queryKey: ['oil-sales-settings'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'تعذر الحفظ'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mut.mutate();
  }

  if (!canWrite) {
    return <p className="p-8 text-center font-bold">لا صلاحية لتعديل إعدادات بيع الزيت</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-black">إعدادات بيع الزيت</h1>
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5"
      >
        <Input
          label="سعر اللتر — زيت أخضر (د.ج)"
          inputMode="decimal"
          value={String(form.priceGreen)}
          onChange={(e) => setForm((f) => ({ ...f, priceGreen: Number(e.target.value) }))}
        />
        <Input
          label="سعر اللتر — زيت طايب (د.ج)"
          inputMode="decimal"
          value={String(form.priceTaieb)}
          onChange={(e) => setForm((f) => ({ ...f, priceTaieb: Number(e.target.value) }))}
        />
        <Input
          label="سعر اللتر — زيت الضرو (د.ج)"
          inputMode="decimal"
          value={String(form.priceDrou)}
          onChange={(e) => setForm((f) => ({ ...f, priceDrou: Number(e.target.value) }))}
        />
        <Input
          label="سعر اللتر — زيت الزبوش (د.ج)"
          inputMode="decimal"
          value={String(form.priceZebbouche)}
          onChange={(e) => setForm((f) => ({ ...f, priceZebbouche: Number(e.target.value) }))}
        />
        <Input
          label="ترويسة الوصل"
          value={form.receiptHeader}
          onChange={(e) => setForm((f) => ({ ...f, receiptHeader: e.target.value }))}
        />
        <Input
          label="تذييل الوصل"
          value={form.receiptFooter}
          onChange={(e) => setForm((f) => ({ ...f, receiptFooter: e.target.value }))}
        />
        <Button type="submit" loading={mut.isPending} className="bg-amber-700 hover:bg-amber-800">
          حفظ
        </Button>
      </form>
    </div>
  );
}
