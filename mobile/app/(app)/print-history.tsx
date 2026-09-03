import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PrintSheet } from '@/components/print/PrintSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SubHeader } from '@/components/ui/SubHeader';
import { listPrintHistory } from '@/lib/print/history';
import type { PrintHistoryItem } from '@/lib/print/types';
import { useThemeColors, useShadow, radius, spacing, textRtl, typography, font } from '@/lib/theme';

export default function PrintHistoryScreen() {
  const c = useThemeColors();
  const shadow = useShadow();
  const [items, setItems] = useState<PrintHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrintHistoryItem | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listPrintHistory());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <Screen padded={false} edges={[]}>
      <SubHeader title="سجل الطباعة" subtitle="إعادة طباعة وصل أو بطاقة سابقة" />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={c.primary} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor={c.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title="لا يوجد سجل طباعة"
              message="ستظهر هنا البطاقات والوصول بعد أول طباعة أو مشاركة"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  opacity: pressed ? 0.92 : 1,
                },
                shadow.soft,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: c.primarySoft }]}>
                <Icon
                  name={item.docKind === 'card' ? 'document-text-outline' : 'print'}
                  size={20}
                  color={c.primary}
                />
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, textRtl, { color: c.text }]}>{item.title}</Text>
                <Text style={[styles.sub, textRtl, { color: c.textMuted }]}>{item.subtitle}</Text>
                <Text style={[styles.date, { color: c.textDim }]}>
                  {new Date(item.createdAt).toLocaleString('ar-DZ')}
                </Text>
              </View>
              <Icon name="chevron-back" size={18} color={c.textDim} />
            </Pressable>
          )}
        />
      )}

      {selected ? (
        <PrintSheet
          visible
          onClose={() => setSelected(null)}
          clientId={selected.clientId}
          oliveType={selected.oliveType}
          initialDocument={selected.document}
          defaultKind={selected.docKind}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.page, paddingBottom: 40 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { ...typography.h2, fontSize: 15 },
  sub: { ...typography.caption, marginTop: 3 },
  date: { ...typography.micro, marginTop: 6, fontFamily: font.semiBold, textAlign: 'right' },
});
