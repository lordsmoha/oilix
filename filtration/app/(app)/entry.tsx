import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { OliveTypePicker } from '@/components/ui/OliveTypePicker';
import { Screen } from '@/components/ui/Screen';
import { SubHeader } from '@/components/ui/SubHeader';
import { api, type FiltrationRecord } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { oliveMeta, type OliveTypeValue } from '@/lib/labels';
import { useThemeColors, useShadow, radius, spacing, textRtl, typography, font } from '@/lib/theme';

type FormState = {
  id?: string;
  oliveType: OliveTypeValue;
  referenceNumber: string;
  zayatName: string;
  region: string;
  quantityL: string;
  khallaf: string;
  notes: string;
};

const emptyForm = (oliveType: OliveTypeValue = 'GREEN'): FormState => ({
  oliveType,
  referenceNumber: '',
  zayatName: '',
  region: '',
  quantityL: '',
  khallaf: '0',
  notes: '',
});

export default function EntryScreen() {
  const c = useThemeColors();
  const shadow = useShadow();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{
    loadId?: string;
    oliveType?: string;
    clientId?: string;
    clientNumber?: string;
    name?: string;
  }>();
  const canWrite = useAuth((s) => s.hasPermission('FILTRATION_WRITE'));
  const initialType = (params.oliveType as OliveTypeValue) || 'GREEN';
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm(initialType),
    zayatName: params.name?.trim() || '',
  }));
  const [searchRef, setSearchRef] = useState('');
  const [searchName, setSearchName] = useState('');

  const meta = oliveMeta(form.oliveType);

  const loadRecord = useCallback((row: FiltrationRecord) => {
    setForm({
      id: row.id,
      oliveType: (row.oliveType as OliveTypeValue) || 'GREEN',
      referenceNumber: String(row.referenceNumber),
      zayatName: row.zayatName,
      region: row.region ?? '',
      quantityL: String(row.quantityL),
      khallaf: String(row.khallaf ?? 0),
      notes: row.notes ?? '',
    });
    setSearchRef(String(row.referenceNumber));
  }, []);

  useEffect(() => {
    if (!params.loadId) return;
    void (async () => {
      try {
        const { data } = await api.get<FiltrationRecord>(`/filtration/${params.loadId}`);
        loadRecord(data);
      } catch {
        /* ignore */
      }
    })();
  }, [params.loadId, loadRecord]);

  useEffect(() => {
    if (params.loadId) return;
    if (params.oliveType) {
      setForm((f) => ({
        ...f,
        oliveType: (params.oliveType as OliveTypeValue) || f.oliveType,
        zayatName: params.name?.trim() || f.zayatName,
        id: undefined,
      }));
    }
  }, [params.oliveType, params.name, params.loadId]);

  const nextQ = useQuery({
    queryKey: ['filtration', 'next', form.oliveType],
    queryFn: async () =>
      (
        await api.get<{ next: number }>('/filtration/next-reference', {
          params: { oliveType: form.oliveType },
        })
      ).data,
    enabled: !form.id,
  });

  useEffect(() => {
    if (!form.id && nextQ.data?.next != null) {
      setForm((f) => ({ ...f, referenceNumber: String(nextQ.data.next) }));
      setSearchRef(String(nextQ.data.next));
    }
  }, [nextQ.data, form.id, form.oliveType]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  function onOliveTypeChange(v: OliveTypeValue) {
    setForm((f) => ({
      ...emptyForm(v),
      // keep draft text fields when switching type on new entry
      zayatName: f.id ? f.zayatName : f.zayatName,
      region: f.id ? f.region : f.region,
      quantityL: f.id ? f.quantityL : '',
      khallaf: f.id ? f.khallaf : '0',
      notes: f.id ? f.notes : '',
      id: undefined,
    }));
    setSearchRef('');
  }

  function validate(): string | null {
    if (!form.zayatName.trim() || form.zayatName.trim().length < 2) {
      return 'اسم ولقب الزيات مطلوب';
    }
    const qty = Number(form.quantityL);
    if (!Number.isFinite(qty) || qty <= 0) return 'الكمية يجب أن تكون أكبر من صفر';
    const kh = Number(form.khallaf || 0);
    if (!Number.isFinite(kh) || kh < 0) return 'قيمة الخلاف غير صالحة';
    return null;
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const err = validate();
      if (err) throw new Error(err);
      const payload = {
        oliveType: form.oliveType,
        referenceNumber: form.referenceNumber ? Number(form.referenceNumber) : undefined,
        zayatName: form.zayatName.trim(),
        region: form.region.trim(),
        quantityL: Number(form.quantityL),
        khallaf: Number(form.khallaf || 0),
        notes: form.notes.trim() || undefined,
      };
      if (form.id) {
        return (await api.patch<FiltrationRecord>(`/filtration/${form.id}`, payload)).data;
      }
      return (await api.post<FiltrationRecord>('/filtration', payload)).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['filtration'] });
      Alert.alert('تم الحفظ', form.id ? 'تم تعديل العملية' : 'تم تسجيل العملية', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    },
    onError: (e: Error & { response?: { data?: { message?: string | string[] } } }) => {
      const msg = e.response?.data?.message || e.message || 'تعذر الحفظ';
      Alert.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : String(msg));
    },
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!form.id) return;
      await api.delete(`/filtration/${form.id}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['filtration'] });
      Alert.alert('تم الحذف', 'تم حذف سجل التصفية', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('خطأ', 'تعذر الحذف'),
  });

  async function searchByNumber() {
    const n = Number(searchRef.trim() || form.referenceNumber);
    if (!Number.isFinite(n) || n < 1) {
      Alert.alert('تنبيه', 'أدخل رقماً صالحاً للبحث');
      return;
    }
    try {
      const { data } = await api.get<FiltrationRecord>(`/filtration/by-ref/${n}`, {
        params: { oliveType: form.oliveType },
      });
      loadRecord(data);
    } catch {
      Alert.alert('غير موجود', 'لا يوجد سجل بهذا الرقم لهذا النوع — يمكنك التسجيل كعملية جديدة');
      setForm((f) => ({ ...emptyForm(f.oliveType), referenceNumber: String(n) }));
      setSearchRef(String(n));
    }
  }

  async function searchByName() {
    const q = searchName.trim();
    if (q.length < 2) {
      Alert.alert('تنبيه', 'أدخل اسماً للبحث');
      return;
    }
    try {
      const { data } = await api.get<{ items: FiltrationRecord[] }>('/filtration', {
        params: { q, oliveType: form.oliveType, limit: 1 },
      });
      if (!data.items.length) {
        Alert.alert('غير موجود', 'لا توجد نتائج');
        return;
      }
      loadRecord(data.items[0]);
    } catch {
      Alert.alert('خطأ', 'تعذر البحث');
    }
  }

  function confirmDelete() {
    if (!form.id || !canWrite) return;
    Alert.alert('حذف', 'هل تريد حذف هذه العملية؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteMut.mutate() },
    ]);
  }

  return (
    <Screen padded={false} edges={['top']}>
      <SubHeader
        title={form.id ? 'تعديل التصفية' : 'تصفية جديدة'}
        subtitle={`${meta.emoji} ${meta.labelFull}${params.name ? ` · ${params.name}` : ''}`}
        accent={meta.color}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!params.name ? (
            <OliveTypePicker value={form.oliveType} onChange={onOliveTypeChange} />
          ) : null}

          <View
            style={[
              styles.card,
              { backgroundColor: c.surface, borderColor: c.border },
              shadow.card,
            ]}
          >
            <Text style={[styles.cardTitle, textRtl, { color: c.text }]}>معلومات العملية</Text>

            <View style={styles.refRow}>
              <View style={styles.refGrow}>
                <Input
                  label="الرقم"
                  icon="search"
                  value={searchRef || form.referenceNumber}
                  onChangeText={(t) => {
                    setSearchRef(t);
                    setField('referenceNumber', t);
                  }}
                  keyboardType="number-pad"
                />
              </View>
              <Pressable
                onPress={() => void searchByNumber()}
                style={[styles.searchBtn, { backgroundColor: `${meta.color}18`, borderColor: meta.color }]}
              >
                <Icon name="search" size={20} color={meta.color} />
                <Text style={[styles.searchBtnText, { color: meta.color }]}>بحث</Text>
              </Pressable>
            </View>

            <View style={styles.refRow}>
              <View style={styles.refGrow}>
                <Input
                  label="بحث بالاسم"
                  icon="person-outline"
                  value={searchName}
                  onChangeText={setSearchName}
                />
              </View>
              <Pressable
                onPress={() => void searchByName()}
                style={[styles.searchBtn, { backgroundColor: c.goldMuted, borderColor: c.gold }]}
              >
                <Icon name="search" size={20} color={c.gold} />
                <Text style={[styles.searchBtnText, { color: c.gold }]}>بحث</Text>
              </Pressable>
            </View>

            <Input
              label="اسم ولقب الزيات"
              icon="person-outline"
              value={form.zayatName}
              onChangeText={(t) => setField('zayatName', t)}
            />
            <Input
              label="المنطقة"
              icon="locate"
              value={form.region}
              onChangeText={(t) => setField('region', t)}
            />
            <Input
              label="الكمية (لتر)"
              icon="beaker-outline"
              value={form.quantityL}
              onChangeText={(t) => setField('quantityL', t)}
              keyboardType="decimal-pad"
              hint="باللتر"
            />
            <Input
              label="الخلاف"
              icon="layers-outline"
              value={form.khallaf}
              onChangeText={(t) => setField('khallaf', t)}
              keyboardType="decimal-pad"
            />
            <Input
              label="ملاحظات"
              icon="document-text-outline"
              value={form.notes}
              onChangeText={(t) => setField('notes', t)}
              multiline
            />

            {form.id ? (
              <Text style={[styles.editBadge, textRtl, { color: meta.color }]}>
                تعديل السجل #{form.referenceNumber} · {meta.emoji} {meta.label}
              </Text>
            ) : null}

            {canWrite ? (
              <View style={styles.actions}>
                <Button
                  label={form.id ? 'حفظ التعديل' : 'تسجيل'}
                  onPress={() => saveMut.mutate()}
                  loading={saveMut.isPending}
                  accentColor={meta.color}
                />
                {form.id ? (
                  <Button
                    label="حذف"
                    variant="danger"
                    onPress={confirmDelete}
                    loading={deleteMut.isPending}
                  />
                ) : null}
                <Button
                  label="جديد"
                  variant="secondary"
                  onPress={() => {
                    setForm(emptyForm(form.oliveType));
                    setSearchRef('');
                    setSearchName('');
                    void nextQ.refetch();
                  }}
                />
              </View>
            ) : (
              <Text style={[styles.readOnly, textRtl, { color: c.textMuted }]}>
                صلاحية القراءة فقط — لا يمكن التسجيل أو التعديل
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.page, paddingBottom: 40 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.card,
  },
  cardTitle: { ...typography.h1, marginBottom: spacing.md, textAlign: 'center' },
  refRow: { flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' },
  refGrow: { flex: 1 },
  searchBtn: {
    marginTop: 28,
    minWidth: 72,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  searchBtnText: { fontFamily: font.bold, fontSize: 12 },
  actions: { gap: 10, marginTop: 8 },
  editBadge: { ...typography.caption, fontFamily: font.bold, marginBottom: 10 },
  readOnly: { ...typography.body, textAlign: 'center', marginTop: 8 },
});
