import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { parseWeighingFields } from '@/lib/weighing-validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SubHeader } from '@/components/ui/SubHeader';
import { useThemeColors, radius, spacing, textRtl, typography } from '@/lib/theme';

type OliveEntrySummary = {
  id: string;
  bagCount: number;
  adhlefCount: number | null;
  capacity: string | null;
  totalWeightKg: string;
};

type ClientDetail = {
  id: string;
  clientNumber: number;
  oliveType: OliveTypeValue;
  firstName: string;
  lastName: string;
  phone?: string | null;
  notes?: string | null;
  oliveEntries: OliveEntrySummary[];
};

export default function EditClientScreen() {
  const c = useThemeColors();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ clientId: string; oliveType?: string }>();
  const clientId = params.clientId as string;
  const oliveType = (params.oliveType as OliveTypeValue) || 'GREEN';
  const meta = oliveMeta(oliveType);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bagCount, setBagCount] = useState('1');
  const [adhlefCount, setAdhlefCount] = useState('0');
  const [capacity, setCapacity] = useState('0');
  const [weightKg, setWeightKg] = useState('');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: async () => (await api.get<ClientDetail>(`/clients/${clientId}`)).data,
    enabled: !!clientId,
  });

  const latestEntry = client?.oliveEntries?.[0];

  useEffect(() => {
    if (!client) return;
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setPhone(client.phone ?? '');
    setNotes(client.notes ?? '');
    const entry = client.oliveEntries[0];
    if (entry) {
      setBagCount(String(entry.bagCount));
      setAdhlefCount(String(entry.adhlefCount ?? 0));
      setCapacity(String(entry.capacity != null ? Number(entry.capacity) : 0));
      setWeightKg(String(Number(entry.totalWeightKg)));
    }
  }, [client]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/mobile/clients/${clientId}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (latestEntry) {
        const parsed = parseWeighingFields({
          bagCount,
          adhlefCount,
          capacity,
          weightKg,
        });
        if (!parsed.ok) throw new Error(parsed.error);
        await api.patch(`/mobile/entries/${latestEntry.id}`, parsed.data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-board'] });
      qc.invalidateQueries({ queryKey: ['client-detail'] });
      qc.invalidateQueries({ queryKey: ['weighings'] });
      Alert.alert('تم الحفظ', 'تم تحديث بيانات الزبون', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    },
    onError: (err: { message?: string; response?: { data?: { message?: string | string[] } } }) => {
      const msg = err.response?.data?.message;
      Alert.alert(
        'خطأ',
        err.message || (Array.isArray(msg) ? msg.join('\n') : String(msg ?? 'فشل الحفظ')),
      );
    },
  });

  function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      return Alert.alert('تنبيه', 'أدخل الاسم واللقب');
    }
    if (latestEntry) {
      const parsed = parseWeighingFields({ bagCount, adhlefCount, capacity, weightKg });
      if (!parsed.ok) return Alert.alert('تنبيه', parsed.error);
    }
    mutation.mutate();
  }

  return (
    <Screen padded={false} edges={[]}>
      <SubHeader title="تعديل زبون" subtitle={meta.labelFull} accent={meta.color} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <ActivityIndicator color={meta.color} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Section title="بيانات الزبون" icon="person-outline">
              <Input label="الاسم *" value={firstName} onChangeText={setFirstName} />
              <Input label="اللقب *" value={lastName} onChangeText={setLastName} />
              <Input
                label="الهاتف (اختياري)"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Input label="ملاحظات (اختياري)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
            </Section>

            {latestEntry ? (
              <Section title="آخر وزنة" icon="scale-outline">
                {(client?.oliveEntries?.length ?? 0) > 1 ? (
                  <Text style={[styles.hint, textRtl, { color: c.textMuted }]}>
                    يتم تعديل آخر وزنة مسجّلة
                  </Text>
                ) : null}
                <Input
                  label="الوزن (كغ) *"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="decimal-pad"
                />
                <View style={styles.row2}>
                  <View style={styles.half}>
                    <Input
                      label="أكياس *"
                      value={bagCount}
                      onChangeText={setBagCount}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.half}>
                    <Input
                      label="ضلف *"
                      value={adhlefCount}
                      onChangeText={setAdhlefCount}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <Input
                  label="السعة *"
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="decimal-pad"
                />
              </Section>
            ) : null}

            <Button
              label="حفظ التعديلات"
              onPress={submit}
              loading={mutation.isPending}
              accentColor={meta.color}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        )}
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

  return (
    <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.sectionHead, { borderBottomColor: c.border }]}>
        <Icon name={icon} size={18} color={c.primary} />
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
    borderWidth: 1,
  },
  sectionHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: { ...typography.h2 },
  hint: { fontSize: 12, marginBottom: 10 },
  row2: { flexDirection: 'row-reverse', gap: 12 },
  half: { flex: 1 },
});
