'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { FIELD_LABELS, OLIVE_TYPES } from '@/lib/labels';
import { parseWeighingFields } from '@/lib/weighing-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type OliveEntrySummary = {
  id: string;
  bagCount: number;
  adhlefCount: number | null;
  capacity: string | null;
  totalWeightKg: string;
  pressingRecord?: { id: string } | null;
};

type ClientDetail = {
  id: string;
  clientNumber: number;
  oliveType: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  notes?: string | null;
  oliveEntries: OliveEntrySummary[];
};

type Props = {
  mode: 'create' | 'edit';
  clientId?: string;
  defaultOliveType?: string;
  onClose: () => void;
  onCreated?: (client: { id: string; oliveType: string }) => void;
};

export function ClientFormModal({
  mode,
  clientId,
  defaultOliveType = 'GREEN',
  onClose,
  onCreated,
}: Props) {
  const qc = useQueryClient();
  const [oliveType, setOliveType] = useState(defaultOliveType);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bagCount, setBagCount] = useState('1');
  const [adhlefCount, setAdhlefCount] = useState('0');
  const [capacity, setCapacity] = useState('0');
  const [weightKg, setWeightKg] = useState('');

  const { data: clientDetail, isLoading } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: async () => (await api.get<ClientDetail>(`/clients/${clientId}`)).data,
    enabled: mode === 'edit' && !!clientId,
  });

  const latestEntry = clientDetail?.oliveEntries?.[0];
  const hasEntries = (clientDetail?.oliveEntries?.length ?? 0) > 0;
  const canChangeOliveType = mode === 'edit' && !hasEntries;

  useEffect(() => {
    if (mode !== 'edit' || !clientDetail) return;
    setOliveType(clientDetail.oliveType);
    setFirstName(clientDetail.firstName);
    setLastName(clientDetail.lastName);
    setPhone(clientDetail.phone ?? '');
    setNotes(clientDetail.notes ?? '');
    const entry = clientDetail.oliveEntries[0];
    if (entry) {
      setBagCount(String(entry.bagCount));
      setAdhlefCount(String(entry.adhlefCount ?? 0));
      setCapacity(String(entry.capacity != null ? Number(entry.capacity) : 0));
      setWeightKg(String(Number(entry.totalWeightKg)));
    }
  }, [mode, clientDetail]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const clientPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(mode === 'create' ? { oliveType } : {}),
        ...(canChangeOliveType && oliveType !== clientDetail?.oliveType
          ? { oliveType }
          : {}),
      };

      if (mode === 'create') {
        return api.post('/clients', clientPayload);
      }

      await api.patch(`/clients/${clientId}`, clientPayload);

      if (latestEntry) {
        const parsed = parseWeighingFields({
          bagCount,
          adhlefCount,
          capacity,
          weightKg,
        });
        if (!parsed.ok) throw new Error(parsed.error);

        await api.patch(`/olive-entries/${latestEntry.id}`, parsed.data);
      }

      return { data: { id: clientId, oliveType: clientDetail?.oliveType ?? oliveType } };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['client-detail'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['client-board'] });
      qc.invalidateQueries({ queryKey: ['olive-client-board'] });
      qc.invalidateQueries({ queryKey: ['olive-entries'] });
      qc.invalidateQueries({ queryKey: ['olive-weighings'] });
      toast.success('تم الحفظ بنجاح');
      onClose();
      if (mode === 'create' && onCreated) {
        const created = res.data as { id: string; oliveType: string };
        onCreated(created);
      }
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message;
      toast.error(typeof msg === 'string' ? msg : 'حدث خطأ أثناء الحفظ');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('أدخل الاسم واللقب');
      return;
    }
    if (mode === 'edit' && latestEntry) {
      const parsed = parseWeighingFields({ bagCount, adhlefCount, capacity, weightKg });
      if (!parsed.ok) {
        toast.error(parsed.error);
        return;
      }
    }
    saveMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="max-h-[90dvh] w-full max-w-lg overflow-y-auto border-[var(--app-border)] shadow-[var(--app-shadow-lg)]">
        <h2 className="mb-1 text-lg font-black text-[var(--app-text)]">
          {mode === 'create' ? 'إضافة زبون' : 'تعديل زبون'}
        </h2>
        {mode === 'edit' && isLoading ? (
          <p className="py-8 text-center text-sm text-[var(--app-text-muted)]">جاري التحميل...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--app-text-muted)]">
                نوع الزيتون
              </span>
              <select
                className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2.5 text-sm disabled:opacity-60"
                value={oliveType}
                onChange={(e) => setOliveType(e.target.value)}
                disabled={mode === 'edit' && !canChangeOliveType}
                required
              >
                {OLIVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {mode === 'edit' && hasEntries ? (
                <span className="mt-1 block text-xs text-[var(--app-text-dim)]">
                  لا يمكن تغيير النوع بعد تسجيل أوزان
                </span>
              ) : null}
            </label>

            <Input
              label="الاسم"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="اللقب"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input
              label="الهاتف (اختياري)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="ملاحظات (اختياري)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {mode === 'edit' && latestEntry ? (
              <div className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-muted)]/40 p-3">
                <p className="text-sm font-bold text-[var(--app-text)]">آخر وزنة</p>
                {hasEntries && (clientDetail?.oliveEntries?.length ?? 0) > 1 ? (
                  <p className="text-xs text-[var(--app-text-dim)]">
                    يتم تعديل آخر وزنة مسجّلة لهذا الزبون
                  </p>
                ) : null}
                <Input
                  label={FIELD_LABELS.weight}
                  type="number"
                  min={0}
                  step="0.01"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={FIELD_LABELS.bagCount}
                    type="number"
                    min={1}
                    step={1}
                    value={bagCount}
                    onChange={(e) => setBagCount(e.target.value)}
                  />
                  <Input
                    label={FIELD_LABELS.adhlef}
                    type="number"
                    min={0}
                    step={1}
                    value={adhlefCount}
                    onChange={(e) => setAdhlefCount(e.target.value)}
                  />
                </div>
                <Input
                  label={FIELD_LABELS.capacity}
                  type="number"
                  min={0}
                  step="0.01"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={saveMutation.isPending} className="flex-1">
                حفظ
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                إلغاء
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
