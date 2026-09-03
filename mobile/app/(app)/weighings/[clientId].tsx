import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { PrintSheet } from '@/components/print/PrintSheet';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { api, formatNum } from '@/lib/api';
import { oliveMeta, type OliveTypeValue } from '@/lib/labels';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SubHeader } from '@/components/ui/SubHeader';
import { WeighingCard } from '@/components/ui/WeighingCard';
import { useThemeColors, useShadow, radius, spacing, font } from '@/lib/theme';
import type { WeighingEntry } from '@/lib/types';

export default function WeighingsScreen() {
  const c = useThemeColors();
  const shadow = useShadow();
  const params = useLocalSearchParams<{
    clientId: string;
    oliveType: string;
    name?: string;
    clientNumber?: string;
  }>();

  const oliveType = (params.oliveType as OliveTypeValue) || 'GREEN';
  const meta = oliveMeta(oliveType);
  const [printOpen, setPrintOpen] = useState(false);
  const [printKind, setPrintKind] = useState<'card' | 'receipt'>('card');

  const { data: clientDetail } = useQuery({
    queryKey: ['client-detail', params.clientId],
    queryFn: async () =>
      (
        await api.get<{ notes?: string | null; phone?: string | null }>(
          `/clients/${params.clientId}`,
        )
      ).data,
    enabled: !!params.clientId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['weighings', params.clientId, params.oliveType],
    queryFn: async () =>
      (
        await api.get<{ items: WeighingEntry[] }>('/olive-entries', {
          params: {
            clientId: params.clientId,
            oliveType: params.oliveType,
            limit: 200,
            logView: true,
          },
        })
      ).data.items,
  });

  const items = data ?? [];
  const totalKg = items.reduce((s: number, e: WeighingEntry) => s + Number(e.totalWeightKg), 0);
  const title = params.name ?? 'تفاصيل الأوزان';

  function openPrint(kind: 'card' | 'receipt') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrintKind(kind);
    setPrintOpen(true);
  }

  return (
    <Screen padded={false} edges={[]}>
      <SubHeader
        title={title}
        subtitle={`#${params.clientNumber ?? ''} · ${items.length} وزنة`}
        accent={meta.color}
      />

      <View style={styles.summary}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: c.surface,
              borderColor: `${meta.color}44`,
            },
            shadow.card,
          ]}
        >
          <Badge label={meta.labelFull} tone="accent" accent={meta.color} style={styles.badge} />
          <Text style={[styles.summaryValue, { color: meta.color }]}>{formatNum(totalKg)}</Text>
          <Text style={[styles.summaryLabel, { color: c.textMuted }]}>إجمالي الوزن (كغ)</Text>
        </View>
      </View>

      <View style={styles.printRow}>
        <Pressable
          style={[styles.printBtn, { backgroundColor: c.surface, borderColor: c.border }, shadow.soft]}
          onPress={() => openPrint('card')}
        >
          <Icon name="document-text-outline" size={20} color={meta.color} />
          <Text style={[styles.printBtnText, { color: c.text }]}>بطاقة</Text>
        </Pressable>
        <Pressable
          style={[styles.printBtn, { backgroundColor: c.surface, borderColor: c.border }, shadow.soft]}
          onPress={() => openPrint('receipt')}
        >
          <Icon name="print" size={20} color={meta.color} />
          <Text style={[styles.printBtnText, { color: c.text }]}>وصل</Text>
        </Pressable>
      </View>

      {clientDetail?.notes?.trim() ? (
        <View
          style={[
            styles.notesCard,
            { backgroundColor: c.surface, borderColor: c.border },
            shadow.card,
          ]}
        >
          <Text style={[styles.notesLabel, { color: c.textMuted }]}>ملاحظات</Text>
          <Text style={[styles.notesText, { color: c.text }]}>{clientDetail.notes}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.addRow, { backgroundColor: `${meta.color}18`, borderColor: meta.color }]}
        onPress={() =>
          router.push({
            pathname: '/(app)/edit-client',
            params: { clientId: params.clientId, oliveType },
          })
        }
      >
        <Icon name="create-outline" size={22} color={meta.color} />
        <Text style={[styles.addText, { color: meta.color }]}>تعديل بيانات الزبون</Text>
      </Pressable>

      <Pressable
        style={[styles.addRow, { backgroundColor: `${meta.color}22`, borderColor: meta.color }]}
        onPress={() =>
          router.push({
            pathname: '/(app)/intake',
            params: { oliveType, clientId: params.clientId },
          })
        }
      >
        <Icon name="add-circle" size={22} color={meta.color} />
        <Text style={[styles.addText, { color: meta.color }]}>إضافة وزنة جديدة</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={meta.color} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="scale-outline" title="لا توجد أوزان مسجّلة" />
          }
          renderItem={({ item }) => (
            <WeighingCard
              reference={item.referenceNumber}
              date={new Date(item.entryDate).toLocaleDateString('ar-DZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              time={item.entryTime}
              weightKg={Number(item.totalWeightKg)}
              bagCount={item.bagCount}
              adhlefCount={item.adhlefCount ?? 0}
              capacity={item.capacity != null ? Number(item.capacity) : null}
              userName={item.user?.firstName || item.user?.username || '—'}
              accent={meta.color}
            />
          )}
        />
      )}

      <PrintSheet
        visible={printOpen}
        onClose={() => setPrintOpen(false)}
        clientId={params.clientId}
        oliveType={oliveType}
        defaultKind={printKind}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { paddingHorizontal: spacing.page, marginBottom: spacing.sm },
  badge: { alignSelf: 'center', marginBottom: 8 },
  notesCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.card,
    borderWidth: 1,
  },
  notesLabel: { fontSize: 12, fontFamily: font.bold, marginBottom: 6, textAlign: 'right' },
  notesText: { fontSize: 14, fontFamily: font.semiBold, lineHeight: 22, textAlign: 'right' },
  summaryCard: {
    borderRadius: radius.lg,
    padding: spacing.card,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryValue: { fontSize: 40, fontFamily: font.black, letterSpacing: -1 },
  summaryLabel: { fontSize: 12, fontFamily: font.semiBold, marginTop: 6 },
  printRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  printBtnText: { fontSize: 15, fontFamily: font.bold },
  addRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  addText: { fontSize: 17, fontFamily: font.extraBold },
  list: { paddingHorizontal: spacing.page, paddingBottom: 36 },
});
