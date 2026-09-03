import { useCallback, useMemo, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PrintSheet } from '@/components/print/PrintSheet';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { oliveMeta, type OliveTypeValue } from '@/lib/labels';
import { AppHeader } from '@/components/ui/AppHeader';
import { ClientCard } from '@/components/ui/ClientCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { OliveTypePicker } from '@/components/ui/OliveTypePicker';
import { Screen } from '@/components/ui/Screen';
import { useThemeColors, useShadow, radius, spacing, font } from '@/lib/theme';
import type { ClientBoardRow } from '@/lib/types';

const FETCH_LIMIT = 9999;

export default function BoardScreen() {
  const c = useThemeColors();
  const shadow = useShadow();
  const clearSession = useAuth((s) => s.clearSession);
  const user = useAuth((s) => s.user);
  const [oliveType, setOliveType] = useState<OliveTypeValue>('GREEN');
  const [search, setSearch] = useState('');
  const listRef = useRef<FlatList>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [printClientId, setPrintClientId] = useState<string | null>(null);

  const meta = oliveMeta(oliveType);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['client-board', oliveType],
    queryFn: async () =>
      (
        await api.get<{ items: ClientBoardRow[] }>('/olive-entries/client-board', {
          params: { oliveType, limit: FETCH_LIMIT },
        })
      ).data.items,
  });

  const rows = data ?? [];
  const totalWeight = rows.reduce((s: number, r: ClientBoardRow) => s + r.totalWeightKg, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r: ClientBoardRow) => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      const phone = (r.phone ?? '').toLowerCase();
      return name.includes(q) || phone.includes(q) || String(r.clientNumber).includes(q);
    });
  }, [rows, search]);

  const scrollToMatch = useCallback(() => {
    if (!search.trim() || filtered.length === 0) return;
    const target = filtered[0];
    const index = rows.findIndex((r: ClientBoardRow) => r.clientId === target.clientId);
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.25 });
      setHighlightId(target.clientId);
      setTimeout(() => setHighlightId(null), 2800);
    }
  }, [search, filtered, rows]);

  return (
    <Screen padded={false} edges={['top']}>
      <View style={[styles.bgMesh, { backgroundColor: c.meshA }]} />
      <AppHeader
        title={meta.labelFull}
        subtitle={`${rows.length} زبون · ${new Intl.NumberFormat('ar-DZ').format(Math.round(totalWeight))} كغ`}
        userName={user?.firstName ? `${user.firstName}` : user?.username}
        accent={meta.color}
        onPrintHistory={() => router.push('/print-history' as never)}
        onLogout={() => void clearSession({ notifyServer: true }).then(() => router.replace('/'))}
      />

      <View style={styles.body}>
        <OliveTypePicker value={oliveType} onChange={setOliveType} />

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: c.surface, borderColor: c.border },
            shadow.soft,
          ]}
        >
          <Icon name="search" size={20} color={c.textDim} style={styles.searchIcon} />
          <TextInput
            style={[styles.search, { color: c.text }]}
            placeholder="بحث بالاسم، الهاتف أو الرقم..."
            placeholderTextColor={c.textDim}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search.trim() ? (
            <Pressable
              onPress={scrollToMatch}
              style={[styles.jumpBtn, { backgroundColor: meta.color }]}
            >
              <Icon name="locate" size={18} color={c.white} />
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={meta.color} size="large" />
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => item.clientId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetch()}
                tintColor={meta.color}
              />
            }
            onScrollToIndexFailed={() => undefined}
            ListEmptyComponent={
              <EmptyState
                icon="leaf-outline"
                title="لا يوجد زبائن"
                message="اضغط + لإضافة أول وزنة لهذا النوع"
              />
            }
            renderItem={({ item }) => (
              <ClientCard
                item={item}
                oliveType={oliveType}
                highlighted={highlightId === item.clientId}
                dimmed={
                  !!search.trim() &&
                  !filtered.some((f: ClientBoardRow) => f.clientId === item.clientId)
                }
                onPrint={() => setPrintClientId(item.clientId)}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/weighings/[clientId]',
                    params: {
                      clientId: item.clientId,
                      oliveType,
                      name: `${item.firstName} ${item.lastName}`.trim(),
                      clientNumber: String(item.clientNumber),
                    },
                  })
                }
              />
            )}
          />
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.fabOuter,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
          shadow.fab,
        ]}
        onPress={() => router.push({ pathname: '/(app)/intake', params: { oliveType } })}
      >
        <LinearGradient
          colors={[meta.color, c.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Icon name="add" size={26} color={c.white} />
          <Text style={styles.fabLabel}>وزنة جديدة</Text>
        </LinearGradient>
      </Pressable>

      {printClientId ? (
        <PrintSheet
          visible
          onClose={() => setPrintClientId(null)}
          clientId={printClientId}
          oliveType={oliveType}
          defaultKind="card"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bgMesh: {
    position: 'absolute',
    top: 120,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.7,
  },
  body: { flex: 1, paddingHorizontal: spacing.page },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: spacing.md,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  searchIcon: { marginLeft: 10 },
  search: {
    flex: 1,
    fontSize: 15,
    fontFamily: font.semiBold,
    paddingVertical: 14,
  },
  jumpBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { marginTop: 48 },
  list: { paddingBottom: 118 },
  fabOuter: {
    position: 'absolute',
    bottom: 28,
    left: spacing.page,
    right: spacing.page,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  fab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  fabLabel: { fontSize: 17, fontFamily: font.extraBold, color: '#fff' },
});
