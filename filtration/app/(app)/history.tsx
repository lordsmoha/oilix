import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { OliveTypePicker } from '@/components/ui/OliveTypePicker';
import { Screen } from '@/components/ui/Screen';
import { api, formatNum, type FiltrationRecord } from '@/lib/api';
import { oliveMeta, type OliveTypeValue } from '@/lib/labels';
import { useThemeColors, useShadow, radius, spacing, textRtl, typography, font } from '@/lib/theme';

export default function HistoryScreen() {
  const c = useThemeColors();
  const shadow = useShadow();
  const [oliveType, setOliveType] = useState<OliveTypeValue>('GREEN');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const meta = oliveMeta(oliveType);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['filtration', 'list', oliveType, q, region, from, to],
    queryFn: async (): Promise<FiltrationRecord[]> =>
      (
        await api.get<{ items: FiltrationRecord[] }>('/filtration', {
          params: {
            oliveType,
            q: q.trim() || undefined,
            region: region.trim() || undefined,
            from: from.trim() || undefined,
            to: to.trim() || undefined,
            limit: 100,
          },
        })
      ).data.items,
  });

  const items = data ?? [];
  const totalL = useMemo(
    () => items.reduce((s: number, r: FiltrationRecord) => s + Number(r.quantityL), 0),
    [items],
  );

  return (
    <Screen padded={false} edges={['top']}>
      <View style={[styles.top, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(app)/board');
          }}
          style={[styles.back, { backgroundColor: c.bgElevated, borderColor: c.border }]}
        >
          <Icon name="arrow-forward" size={22} color={c.text} />
          <Text style={[styles.backText, { color: c.text }]}>العودة</Text>
        </Pressable>
        <Text style={[styles.title, textRtl, { color: c.text }]}>سجل التصفية</Text>
        <Text style={[styles.sub, textRtl, { color: c.textMuted }]}>
          {meta.emoji} {meta.labelFull} · {items.length} عملية · {formatNum(totalL)} لتر
        </Text>
      </View>

      <View style={styles.filters}>
        <OliveTypePicker value={oliveType} onChange={setOliveType} />
        <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }, shadow.soft]}>
          <Icon name="search" size={18} color={c.textDim} />
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="بحث: رقم، اسم، ملاحظات…"
            placeholderTextColor={c.textDim}
            value={q}
            onChangeText={setQ}
            textAlign="right"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.chip, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
            placeholder="المنطقة"
            placeholderTextColor={c.textDim}
            value={region}
            onChangeText={setRegion}
            textAlign="right"
          />
          <TextInput
            style={[styles.chip, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
            placeholder="من YYYY-MM-DD"
            placeholderTextColor={c.textDim}
            value={from}
            onChangeText={setFrom}
            textAlign="left"
          />
          <TextInput
            style={[styles.chip, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
            placeholder="إلى YYYY-MM-DD"
            placeholderTextColor={c.textDim}
            value={to}
            onChangeText={setTo}
            textAlign="left"
          />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={meta.color} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={meta.color} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="water"
              title="لا توجد عمليات"
              message={`لا سجل لـ ${meta.labelFull} — سجّل أول عملية من الشاشة الرئيسية`}
            />
          }
          renderItem={({ item }) => {
            const m = oliveMeta(item.oliveType);
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(app)/entry',
                    params: { loadId: item.id },
                  })
                }
                style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, shadow.soft]}
              >
                <View style={[styles.stripe, { backgroundColor: m.color }]} />
                <View style={[styles.badge, { backgroundColor: `${m.color}18` }]}>
                  <Text style={styles.badgeEmoji}>{m.emoji}</Text>
                  <Text style={[styles.badgeText, { color: m.color }]}>#{item.referenceNumber}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.name, textRtl, { color: c.text }]}>{item.zayatName}</Text>
                  <Text style={[styles.meta, textRtl, { color: c.textMuted }]}>
                    {item.region || '—'} · {formatNum(Number(item.quantityL))} لتر · خلاف{' '}
                    {formatNum(Number(item.khallaf))}
                  </Text>
                  <Text style={[styles.meta, { color: c.textDim }]}>
                    {new Date(item.createdAt).toLocaleString('ar-DZ')} ·{' '}
                    {item.createdBy?.firstName || item.createdBy?.username || '—'}
                  </Text>
                </View>
                <Icon name="chevron-back" size={18} color={c.textDim} />
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  backText: { fontFamily: font.bold, fontSize: 14 },
  title: { ...typography.h1 },
  sub: { ...typography.caption, marginTop: 4 },
  filters: { paddingHorizontal: spacing.page, paddingTop: spacing.md, gap: 10 },
  search: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: { flex: 1, fontFamily: font.semiBold, fontSize: 15, paddingVertical: 12 },
  row: { flexDirection: 'row-reverse', gap: 8 },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
    fontFamily: font.semiBold,
  },
  list: { paddingHorizontal: spacing.page, paddingBottom: 40, paddingTop: 8 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
  },
  badge: {
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    gap: 2,
  },
  badgeEmoji: { fontSize: 14 },
  badgeText: { fontFamily: font.black, fontSize: 13 },
  info: { flex: 1 },
  name: { ...typography.h2, fontSize: 15 },
  meta: { ...typography.caption, marginTop: 3 },
});
