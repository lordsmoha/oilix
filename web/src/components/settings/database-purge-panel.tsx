'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, DatabaseZap, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PURGE_CONFIRM_PHRASE } from '@/lib/purge-constants';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonStore } from '@/lib/season-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function normalizeConfirmPhrase(value: string): string {
  return value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
}

function axiosErrorMessage(err: unknown): string {
  const data = (err as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data;
  const msg = data?.message;
  if (Array.isArray(msg)) return msg.join(' — ');
  if (typeof msg === 'string' && msg.trim()) return msg;
  return 'تعذر تنفيذ التفريغ';
}

export function DatabasePurgePanel() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clearViewSeason = useSeasonStore((s) => s.clearViewSeason);
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const phraseOk = normalizeConfirmPhrase(phrase) === PURGE_CONFIRM_PHRASE;

  const purgeMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/settings/purge-database', {
          confirmPhrase: normalizeConfirmPhrase(phrase),
        })
      ).data,
    onSuccess: () => {
      clearViewSeason();
      qc.clear();
      setOpen(false);
      setPhrase('');
      toast.success('تم تفريغ البيانات — التطبيق جاهز للبدء من جديد');
      router.push('/dashboard');
      router.refresh();
    },
    onError: (err: unknown) => {
      toast.error(axiosErrorMessage(err));
    },
  });

  if (!isAdmin) return null;

  return (
    <>
      <section
        className={cn(
          'module-panel-enter overflow-hidden rounded-3xl border-2 border-red-400/70 bg-red-50/30 shadow-lg dark:border-red-900/60 dark:bg-red-950/20',
        )}
      >
        <div className="border-b border-red-200/80 bg-red-100/60 px-5 py-4 dark:border-red-900/50 dark:bg-red-950/40">
          <h2 className="flex items-center gap-2 font-black text-red-900 dark:text-red-100">
            <ShieldAlert className="h-5 w-5" />
            منطقة خطرة — إدارة النظام
          </h2>
          <p className="mt-1 text-sm text-red-800/80 dark:text-red-200/80">
            مخصص للمدير الرئيسي فقط
          </p>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex gap-3 rounded-2xl border border-red-300/80 bg-white/70 p-4 dark:border-red-900/50 dark:bg-stone-900/50">
            <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
            <div className="space-y-2 text-sm text-red-950 dark:text-red-100">
              <p className="font-bold">تفريغ كامل لقاعدة البيانات</p>
              <ul className="list-inside list-disc space-y-1 text-red-900/90 dark:text-red-200/90">
                <li>حذف جميع الزبائن، الأوزان، العمليات، العصر، المدفوعات والمواسم</li>
                <li>حذف مبيعات الزيت، المخزون، والجرد المرتبط بالموسم</li>
                <li>حذف السجل والإشعارات والإحصائيات المحفوظة</li>
                <li>حذف جميع حسابات المستخدمين ما عدا المدير</li>
                <li>
                  <strong>عملية لا رجعة فيها</strong> — يُعاد ترقيم الزبائن والمراجع من 1
                </li>
              </ul>
              <p className="text-xs text-red-800/70 dark:text-red-300/80">
                يُحتفظ بحساب المدير ({user?.username}) وإعدادات المعصرة والأجهزة والصناديق
                وقائمة حاويات التعبئة.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            className="gap-2"
            onClick={() => {
              setPhrase('');
              setOpen(true);
            }}
          >
            <DatabaseZap className="h-4 w-4" />
            تفريغ قاعدة البيانات
          </Button>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl border-2 border-red-400 bg-white p-6 shadow-2xl dark:border-red-800 dark:bg-stone-900"
            role="alertdialog"
            aria-labelledby="purge-title"
          >
            <h3
              id="purge-title"
              className="flex items-center gap-2 text-lg font-black text-red-700 dark:text-red-300"
            >
              <AlertTriangle className="h-6 w-6" />
              تأكيد التفريغ الكامل
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              هذا الإجراء <strong>نهائي ولا يمكن التراجع عنه</strong>. سيتم مسح كل البيانات
              التشغيلية وبدء موسم جديد فارغ.
            </p>
            <p className="mt-4 text-sm font-medium text-stone-800 dark:text-stone-200">
              للمتابعة، اكتب بالضبط:
            </p>
            <p
              className="mt-1 select-all rounded-lg bg-red-50 px-3 py-2 text-center font-mono text-base font-bold text-red-800 dark:bg-red-950/50 dark:text-red-200"
              dir="ltr"
            >
              {PURGE_CONFIRM_PHRASE}
            </p>
            <Input
              className="mt-3"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && phraseOk && !purgeMutation.isPending) {
                  purgeMutation.mutate();
                }
              }}
              placeholder={PURGE_CONFIRM_PHRASE}
              autoComplete="off"
              spellCheck={false}
              dir="ltr"
            />
            {!phraseOk && phrase.trim().length > 0 ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                النص غير مطابق — انسخ العبارة أعلاه كما هي
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                type="button"
                variant="danger"
                className="flex-1 gap-2 disabled:opacity-40"
                disabled={!phraseOk || purgeMutation.isPending}
                loading={purgeMutation.isPending}
                onClick={() => purgeMutation.mutate()}
              >
                <DatabaseZap className="h-4 w-4" />
                نعم، احذف كل البيانات
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={purgeMutation.isPending}
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
