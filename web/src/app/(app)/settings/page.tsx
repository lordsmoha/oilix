'use client';

import Link from 'next/link';
import { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  CalendarPlus,
  Gauge,
  MapPin,
  Save,
  Settings2,
  Sparkles,
  ClipboardList,
  Users,
  Bell,
} from 'lucide-react';
import { NotificationSoundSettings } from '@/components/notifications/notification-sound-settings';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModulePageHero } from '@/components/ui/module-page-hero';
import { SeasonArchivePanel } from '@/components/season/season-archive-panel';
import { DatabasePurgePanel } from '@/components/settings/database-purge-panel';
import { useSeasonReadOnly } from '@/hooks/use-season-read-only';
import { useAuthStore } from '@/lib/auth-store';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { readOnly } = useSeasonReadOnly();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const canAudit = useAuthStore((s) => s.hasPermission('AUDIT_READ'));
  const canUsers = useAuthStore((s) => s.hasPermission('USERS_READ'));

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  const updateMutation = useMutation({
    mutationFn: (body: object) => api.put('/settings', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('تم حفظ الإعدادات');
    },
  });

  const newSeasonMutation = useMutation({
    mutationFn: (name: string) => api.post('/settings/new-season', { name }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('تم بدء موسم جديد');
    },
  });

  const settingsMap = Object.fromEntries(
    (data?.settings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value]),
  );

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      pricePerQuintal: Number(fd.get('pricePerQuintal')),
      companyName: fd.get('companyName'),
      companyPhone: fd.get('companyPhone'),
      companyAddress: fd.get('companyAddress'),
    });
  }

  if (isLoading) {
    return (
      <div className="settings-page-bg relative -mx-3 flex min-h-[50vh] items-center justify-center px-3 md:-mx-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="settings-page-bg relative -mx-3 min-h-full px-3 pb-12 md:-mx-6 md:px-6">
      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        <ModulePageHero
          gradient="from-violet-800 via-purple-700 to-fuchsia-600"
          glow="shadow-violet-600/25"
          patternClass="olive-add-hero-pattern"
          icon={<Settings2 className="h-7 w-7 text-white" />}
          badge={
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              الموسم: {data?.activeSeason?.name ?? '—'}
            </span>
          }
          title="الإعدادات"
          subtitle="إعدادات المعصرة والموسم الحالي"
          actions={
            isAdmin || canUsers || canAudit ? (
              <div className="flex flex-wrap gap-2">
                {canUsers || isAdmin ? (
                  <Link href="/users">
                    <Button type="button" className="gap-2 bg-white/20 text-white hover:bg-white/30">
                      <Users className="h-4 w-4" />
                      المستخدمون
                    </Button>
                  </Link>
                ) : null}
                {canAudit || isAdmin ? (
                  <Link href="/audit">
                    <Button type="button" className="gap-2 bg-white/20 text-white hover:bg-white/30">
                      <ClipboardList className="h-4 w-4" />
                      سجل النشاط
                    </Button>
                  </Link>
                ) : null}
              </div>
            ) : null
          }
        />

        <section className="module-panel-enter overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 shadow-lg backdrop-blur-xl dark:border-stone-700/60 dark:bg-stone-900/80">
          <div className="border-b border-stone-200/80 bg-gradient-to-l from-violet-50 to-fuchsia-50/50 px-5 py-4 dark:border-stone-700 dark:from-violet-950/30 dark:to-stone-900/50">
            <h2 className="flex items-center gap-2 font-black text-stone-900 dark:text-white">
              <Building2 className="h-5 w-5 text-violet-600" />
              إعدادات عامة
            </h2>
            <p className="mt-1 text-sm text-stone-500">تظهر على الوصلات والتقارير</p>
          </div>
          <form onSubmit={onSave} className="space-y-4 p-5">
            <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-60">
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                <Gauge className="h-4 w-4" />
                السعر لكل قنطار (100 كغ)
              </label>
              <Input
                name="pricePerQuintal"
                type="number"
                step="0.01"
                defaultValue={
                  (settingsMap.price_per_quintal as number) ??
                  Number(settingsMap.price_per_kg ?? 0) * 100
                }
                required
                className="border-emerald-200/80 bg-white dark:border-emerald-800 dark:bg-stone-900"
              />
            </div>
            <Input
              name="companyName"
              label="اسم المعصرة"
              defaultValue={settingsMap.company_name as string}
            />
            <Input
              name="companyPhone"
              label="الهاتف"
              defaultValue={settingsMap.company_phone as string}
            />
            <Input
              name="companyAddress"
              label="العنوان"
              defaultValue={settingsMap.company_address as string}
            />
            <Button type="submit" className="w-full gap-2 sm:w-auto" loading={updateMutation.isPending}>
              <Save className="h-4 w-4" />
              حفظ الإعدادات
            </Button>
            </fieldset>
            {readOnly ? (
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                الإعدادات معطّلة أثناء استعراض موسم أرشيفي.
              </p>
            ) : null}
          </form>
        </section>

        <section className="module-panel-enter overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 shadow-lg backdrop-blur-xl dark:border-stone-700/60 dark:bg-stone-900/80">
          <div className="border-b border-stone-200/80 bg-gradient-to-l from-sky-50 to-emerald-50/50 px-5 py-4 dark:border-stone-700 dark:from-sky-950/30 dark:to-stone-900/50">
            <h2 className="flex items-center gap-2 font-black text-stone-900 dark:text-white">
              <Bell className="h-5 w-5 text-sky-600" />
              إشعارات صوتية
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              تنبيه فوري عند الزبائن الجدد، الوزنات، المعالجة، التصفية والموسم
            </p>
          </div>
          <div className="p-5">
            <NotificationSoundSettings />
          </div>
        </section>

        <SeasonArchivePanel />

        <section
          className={cn(
            'module-panel-enter overflow-hidden rounded-3xl border-2 border-amber-300/60 bg-amber-50/40 shadow-lg dark:border-amber-800/50 dark:bg-amber-950/15',
          )}
        >
          <div className="border-b border-amber-200/80 bg-amber-100/50 px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <h2 className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-100">
              <CalendarPlus className="h-5 w-5" />
              موسم جديد
            </h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex gap-3 rounded-2xl border border-amber-200/80 bg-white/60 p-4 dark:border-amber-900/40 dark:bg-stone-900/40">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900/90 dark:text-amber-100/90">
                يبدأ موسم جديد من الصفر: لا زبائن ولا عمليات ولا تصفية — يُعاد ترقيم الزبائن والمراجع
                من 1. يمكن إعادة تسجيل نفس الأشخاص كزبائن جدد. المواسم السابقة تبقى للعرض فقط.
              </p>
            </div>
            <Button
              variant="danger"
              className="gap-2"
              disabled={readOnly}
              onClick={() => {
                const name = prompt('اسم الموسم الجديد:', `موسم ${new Date().getFullYear()}`);
                if (name) newSeasonMutation.mutate(name);
              }}
              loading={newSeasonMutation.isPending}
            >
              <CalendarPlus className="h-4 w-4" />
              بدء موسم جديد
            </Button>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsHint icon={MapPin} title="العنوان" text="يُطبع على الوصلات الحرارية 80mm" />
          <SettingsHint icon={Gauge} title="التسعير" text="التعريفة بالقنطار (دج/ق) — يُحسب المبلغ تلقائياً من الوزن بالكيلو" />
        </div>

        <DatabasePurgePanel />
      </div>
    </div>
  );
}

function SettingsHint({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="module-stat-enter rounded-2xl border border-stone-200/70 bg-white/60 p-4 dark:border-stone-700/60 dark:bg-stone-900/50">
      <Icon className="mb-2 h-5 w-5 text-violet-600" />
      <p className="font-bold text-stone-800 dark:text-stone-100">{title}</p>
      <p className="mt-1 text-xs text-stone-500">{text}</p>
    </div>
  );
}
