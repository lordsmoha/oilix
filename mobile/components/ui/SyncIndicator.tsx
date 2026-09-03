import { StyleSheet, Text, View } from 'react-native';
import { useRealtime } from '@/components/RealtimeProvider';
import { useThemeColors, radius, spacing, typography } from '@/lib/theme';

const LABELS = {
  connected: 'متصل',
  connecting: 'اتصال…',
  disconnected: 'مزامنة دورية',
} as const;

type Props = { light?: boolean };

export function SyncIndicator({ light }: Props) {
  const { status, syncing } = useRealtime();
  const c = useThemeColors();

  const dotColor =
    status === 'connected' ? '#4ade80' : status === 'connecting' ? '#fbbf24' : '#f87171';

  return (
    <View
      style={[
        styles.wrap,
        light
          ? {
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderColor: 'rgba(255,255,255,0.22)',
            }
          : { backgroundColor: c.surface, borderColor: c.border },
        syncing && { borderColor: light ? '#fff' : c.primary },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: light ? 'rgba(255,255,255,0.9)' : c.textMuted }]}>
        {syncing ? 'مزامنة…' : LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { ...typography.micro, fontSize: 10 },
});
