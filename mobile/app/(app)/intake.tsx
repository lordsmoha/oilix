import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
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
import { Icon, type IconName } from '@/components/ui/Icon';
import { api } from '@/lib/api';
import { oliveMeta, type OliveTypeValue } from '@/lib/labels';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { SubHeader } from '@/components/ui/SubHeader';
import { useThemeColors, useShadow, radius, spacing, textRtl, typography, font } from '@/lib/theme';

type ClientOption = {
  id: string;
  clientNumber: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

export default function IntakeScreen() {
  const c = useThemeColors();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ oliveType?: string; clientId?: string }>();
  const oliveType = (params.oliveType as OliveTypeValue) || 'GREEN';
  const meta = oliveMeta(oliveType);
  const existingClientId = params.clientId as string | undefined;

  const [mode, setMode] = useState<'new' | 'existing'>(existingClientId ? 'existing' : 'new');
  const [clientId, setClientId] = useState(existingClientId ?? '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bagCount, setBagCount] = useState('1');
  const [adhlefCount, setAdhlefCount] = useState('0');
  const [capacity, setCapacity] = useState('0');

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-select'],
    queryFn: async () =>
      (await api.get<{ items: ClientOption[] }>('/clients', { params: { limit: 500 } })).data
        .items,
    enabled: mode === 'existing',
  });

  const mutation = useMutation({
    mutationFn: (body: object) => api.post('/mobile/intake', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-board'] });
      Alert.alert('تم الحفظ', 'تمت إضافة العملية بنجاح', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    },
    onError: (err: { response?: { data?: { message?: string | string[] } } }) => {
      const msg = err.response?.data?.message;
      Alert.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : String(msg ?? 'فشل الحفظ'));
    },
  });

  function submit() {
    const w = Number(weightKg.replace(',', '.'));
    const bags = Number(bagCount);
    const adhlef = Number(adhlefCount);
    const cap = Number(capacity.replace(',', '.'));

    if (!Number.isFinite(w) || w <= 0) return Alert.alert('تنبيه', 'أدخل الوزن');
    if (!Number.isFinite(bags) || !Number.isInteger(bags) || bags < 1) {
      return Alert.alert('تنبيه', 'أدخل عدد الأكياس (1 على الأقل)');
    }
    if (Number.isNaN(adhlef) || !Number.isInteger(adhlef) || adhlef < 0) {
      return Alert.alert('تنبيه', 'أدخل عدد الضلف (0 مسموح)');
    }
    if (Number.isNaN(cap) || !Number.isFinite(cap) || cap < 0) {
      return Alert.alert('تنبيه', 'أدخل السعة (0 مسموح)');
    }

    const body: Record<string, unknown> = {
      oliveType,
      weightKg: w,
      bagCount: bags,
      adhlefCount: adhlef,
      capacity: cap,
    };

    if (mode === 'existing') {
      if (!clientId) return Alert.alert('تنبيه', 'اختر زبوناً مسجلاً');
      body.clientId = clientId;
    } else {
      if (!firstName.trim() || !lastName.trim()) {
        return Alert.alert('تنبيه', 'الاسم واللقب إجباريان');
      }
      body.firstName = firstName.trim();
      body.lastName = lastName.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (notes.trim()) body.notes = notes.trim();
    }

    mutation.mutate(body);
  }

  return (
    <Screen padded={false} edges={[]}>
      <SubHeader title="إضافة وزنة" subtitle={meta.labelFull} accent={meta.color} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!existingClientId ? (
            <SegmentControl
              options={[
                { value: 'new' as const, label: 'زبون جديد' },
                { value: 'existing' as const, label: 'زبون موجود' },
              ]}
              value={mode}
              onChange={setMode}
            />
          ) : null}

          {mode === 'new' ? (
            <Section title="بيانات الزبون" icon="person-outline">
              <Input label="الاسم *" icon="person-outline" value={firstName} onChangeText={setFirstName} />
              <Input label="اللقب *" value={lastName} onChangeText={setLastName} />
              <Input
                label="الهاتف (اختياري)"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Input
                label="ملاحظات (اختياري)"
                icon="document-text-outline"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ minHeight: 72, textAlignVertical: 'top' }}
              />
            </Section>
          ) : (
            <Section title="اختر الزبون" icon="people-outline">
              {clientsLoading ? (
                <ActivityIndicator color={meta.color} style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.clientList}>
                  {(clients ?? []).map((cl: ClientOption) => {
                    const active = clientId === cl.id;
                    return (
                      <Pressable
                        key={cl.id}
                        onPress={() => setClientId(cl.id)}
                        style={[
                          styles.clientRow,
                          {
                            borderColor: active ? meta.color : c.border,
                            backgroundColor: active ? `${meta.color}18` : c.bgElevated,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.clientNum,
                            {
                              backgroundColor: active ? `${meta.color}33` : c.surface,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.clientNumText,
                              { color: active ? meta.color : c.textMuted },
                            ]}
                          >
                            {cl.clientNumber}
                          </Text>
                        </View>
                        <Text style={[styles.clientName, textRtl, { color: c.text }]}>
                          {cl.firstName} {cl.lastName}
                        </Text>
                        {active ? (
                          <Icon name="checkmark-circle" size={22} color={meta.color} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Section>
          )}

          <Section title="بيانات الوزن" icon="scale-outline">
            <Input
              label="الوزن (كغ) *"
              icon="scale-outline"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              hint="الوزن الإجمالي لهذه الوزنة"
            />
            <View style={styles.row2}>
              <View style={styles.half}>
                <Input label="أكياس *" value={bagCount} onChangeText={setBagCount} keyboardType="number-pad" />
              </View>
              <View style={styles.half}>
                <Input label="ضلف *" value={adhlefCount} onChangeText={setAdhlefCount} keyboardType="number-pad" />
              </View>
            </View>
            <Input label="السعة *" icon="beaker-outline" value={capacity} onChangeText={setCapacity} keyboardType="decimal-pad" />
          </Section>

          <Button
            label="حفظ العملية"
            onPress={submit}
            loading={mutation.isPending}
            accentColor={meta.color}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: ReactNode;
}) {
  const c = useThemeColors();
  const shadow = useShadow();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
        },
        shadow.soft,
      ]}
    >
      <View style={[styles.sectionHead, { borderBottomColor: c.border }]}>
        <View style={[styles.sectionIcon, { backgroundColor: c.primarySoft }]}>
          <Icon name={icon} size={18} color={c.primary} />
        </View>
        <Text style={[styles.sectionTitle, textRtl, { color: c.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.page, paddingBottom: 44 },
  section: {
    borderRadius: radius.lg,
    padding: spacing.card,
    marginBottom: spacing.section,
    borderWidth: 1.5,
  },
  sectionHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { ...typography.h2 },
  row2: { flexDirection: 'row-reverse', gap: 12 },
  half: { flex: 1 },
  clientList: { gap: 10, maxHeight: 240 },
  clientRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  clientNum: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientNumText: { fontFamily: font.black },
  clientName: { flex: 1, ...typography.body, fontFamily: font.bold },
});
