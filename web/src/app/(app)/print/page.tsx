'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  CreditCard,
  Hash,
  Phone,
  Printer,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BatchCardsPrintData } from '@/components/print/batch-cards-document';
import type { BatchReceiptsPrintData } from '@/components/print/batch-receipts-document';
import type { ClientPhonesPrintData } from '@/components/print/client-phones-document';
import { api } from '@/lib/api';
import { BUSINESS_NAME, OLIVE_TYPES } from '@/lib/labels';
import { oliveTypePrintInfo } from '@/lib/olive-type-labels';
import { savePrintPayload } from '@/lib/print-storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModulePageHero } from '@/components/ui/module-page-hero';

const TYPE_CARDS = [
  {
    gradient: 'from-emerald-700 via-emerald-600 to-teal-500',
    border: 'border-emerald-200/60 dark:border-emerald-800/50',
    icon: '🫒',
    btn: 'hover:border-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30',
  },
  {
    gradient: 'from-blue-700 via-blue-600 to-indigo-500',
    border: 'border-blue-200/60 dark:border-blue-800/50',
    icon: '🌿',
    btn: 'hover:border-blue-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/30',
  },
  {
    gradient: 'from-rose-700 via-rose-600 to-red-500',
    border: 'border-rose-200/60 dark:border-rose-800/50',
    icon: '🍇',
    btn: 'hover:border-rose-300 hover:bg-rose-50/80 dark:hover:bg-rose-950/30',
  },
] as const;

const PRINT_ACTIONS = [
  { type: 'phones' as const, label: 'أرقام الهواتف', icon: Phone, desc: 'قائمة أرقام الزبائن' },
  { type: 'cards' as const, label: 'البطاقات', icon: CreditCard, desc: 'بطاقات تعريف حرارية' },
  { type: 'receipt' as const, label: 'الوصلات', icon: Receipt, desc: 'وصلات استقبال جماعية' },
];

type BatchApiRow = {
  clientId?: string;
  referenceNumber: number;
  lastReferenceNumber?: number;
  entryCount?: number;
  oliveType: { oliveType: string; labelFr: string; labelAr: string; display: string };
  client: {
    clientNumber: number;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  bags: number;
  weightKg: number;
  adhlef: number | null;
  capacity: number | null;
};

function openPrintWindow(path: string) {
  const w = window.open(path, '_blank');
  if (!w) toast.error('يُرجى السماح بالنوافذ المنبثقة للطباعة');
}

export default function PrintPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const printMutation = useMutation({
    mutationFn: async ({
      oliveType,
      type,
    }: {
      oliveType: string;
      type: 'receipt' | 'cards' | 'phones';
    }) => {
      const { data } = await api.get(`/reports/print/${oliveType}`, {
        params: { from: from || undefined, to: to || undefined, type },
      });
      return { data, oliveType, type };
    },
    onSuccess: ({ data, oliveType, type }) => {
      const metaLabel = OLIVE_TYPES.find((t) => t.value === oliveType)?.label ?? oliveType;
      const oliveTypePrint = oliveTypePrintInfo(oliveType);
      if (!oliveTypePrint) return;

      if (type === 'phones' && data?.type === 'phones') {
        savePrintPayload(data as ClientPhonesPrintData);
        openPrintWindow('/client-phones');
        return;
      }

      const rows = data as BatchApiRow[];
      if (!Array.isArray(rows)) {
        toast.error('تعذر تحميل بيانات الطباعة');
        return;
      }

      const baseMeta = {
        oliveTypePrint,
        companyName: BUSINESS_NAME,
        seasonName: null as string | null,
        printedAt: new Date().toISOString(),
        referenceFrom: from ? Number(from) : null,
        referenceTo: to ? Number(to) : null,
        total: rows.length,
      };

      if (type === 'receipt') {
        const payload: BatchReceiptsPrintData = {
          type: 'receipts',
          meta: { ...baseMeta, title: `وصلات استقبال — ${metaLabel}` },
          rows: rows.map((r) => ({
            clientId: r.clientId,
            referenceNumber: r.referenceNumber,
            lastReferenceNumber: r.lastReferenceNumber,
            entryCount: r.entryCount,
            oliveType: r.oliveType,
            client: r.client,
            bags: r.bags,
            weightKg: r.weightKg,
            adhlef: r.adhlef,
            capacity: r.capacity,
          })),
        };
        savePrintPayload(payload);
        openPrintWindow('/batch-receipts');
        toast.success(`جاري طباعة ${rows.length} وصل`);
        return;
      }

      if (type === 'cards') {
        const payload: BatchCardsPrintData = {
          type: 'cards',
          meta: { ...baseMeta, title: `بطاقات تعريف — ${metaLabel}` },
          rows: rows.map((r) => ({
            clientId: r.clientId,
            referenceNumber: r.referenceNumber,
            entryCount: r.entryCount,
            oliveType: r.oliveType,
            client: r.client,
            bags: r.bags,
            weightKg: r.weightKg,
            capacity: r.capacity ?? 0,
            adhlef: r.adhlef ?? 0,
          })),
        };
        savePrintPayload(payload);
        openPrintWindow('/batch-cards');
        toast.success(`جاري طباعة ${rows.length} بطاقة`);
      }
    },
    onError: () => toast.error('تعذر تحميل بيانات الطباعة'),
  });

  return (
    <div className="print-page-bg module-page relative -mx-3 min-h-full px-3 pb-12 md:-mx-6 md:px-6">
      <div className="module-page-bg" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl space-y-6 py-5 md:py-8">
        <ModulePageHero
          gradient="from-emerald-900 via-emerald-800 to-teal-700"
          glow="shadow-emerald-800/30"
          patternClass="olive-add-hero-pattern"
          icon={<Printer className="h-7 w-7 text-white" />}
          badge={
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              مركز الطباعة
            </span>
          }
          title="طباعة جماعية"
          subtitle="وصلات، بطاقات وأرقام الهواتف — حسب نوع الزيتون"
        />

        <section className="module-panel-enter rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)]/80 p-5 shadow-[var(--app-shadow-lg)] backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-[var(--app-accent)]" />
            <h2 className="font-black text-[var(--app-text)]">نطاق الأرقام المرجعية</h2>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <Input
              label="من"
              type="number"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-32"
            />
            <Input
              label="إلى"
              type="number"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-32"
            />
            <p className="text-sm text-[var(--app-text-muted)]">اترك الحقول فارغة لطباعة الكل</p>
          </div>
        </section>

        <div className="module-stats-enter grid gap-5 md:grid-cols-3">
          {OLIVE_TYPES.map((t, i) => {
            const card = TYPE_CARDS[i] ?? TYPE_CARDS[0];
            return (
              <article
                key={t.value}
                className={cn(
                  'overflow-hidden rounded-3xl border bg-[var(--app-surface)]/90 shadow-[var(--app-shadow-lg)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-xl',
                  card.border,
                )}
              >
                <div className={cn('bg-gradient-to-l px-5 py-5 text-white', card.gradient)}>
                  <span className="text-3xl">{card.icon}</span>
                  <h3 className="mt-2 text-xl font-black">{t.label}</h3>
                  <p className="mt-1 text-sm text-white/85">اختر نوع المستند</p>
                </div>
                <div className="space-y-2 p-4">
                  {PRINT_ACTIONS.map((action) => (
                    <Button
                      key={action.type}
                      variant="outline"
                      className={cn(
                        'h-auto w-full flex-col items-start gap-1 rounded-2xl border-[var(--app-border)] py-3 text-right',
                        card.btn,
                      )}
                      loading={printMutation.isPending}
                      onClick={() =>
                        printMutation.mutate({ oliveType: t.value, type: action.type })
                      }
                    >
                      <span className="flex w-full items-center gap-2 font-bold">
                        <action.icon className="h-4 w-4 shrink-0" />
                        {action.label}
                      </span>
                      <span className="text-xs font-normal text-[var(--app-text-muted)]">
                        {action.desc}
                      </span>
                    </Button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
