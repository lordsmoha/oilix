import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatNum } from '@/lib/api';
import { oliveMeta, type OliveTypeValue } from '@/lib/labels';
import { useThemeColors, useShadow, radius, textRtl, typography, font } from '@/lib/theme';
import type { ClientBoardRow } from '@/lib/types';

type Props = {
  item: ClientBoardRow;
  oliveType: OliveTypeValue;
  highlighted?: boolean;
  dimmed?: boolean;
  onPress: () => void;
};

export function ClientCard({ item, oliveType, highlighted, dimmed, onPress }: Props) {
  const c = useThemeColors();
  const shadow = useShadow();
  const accent = oliveMeta(oliveType).color;
  const name = `${item.firstName} ${item.lastName}`.trim();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: highlighted ? c.gold : c.border,
        },
        highlighted && { backgroundColor: c.goldMuted, borderWidth: 2 },
        dimmed && styles.dimmed,
        pressed && styles.pressed,
        shadow.card,
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: accent }]} />

      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: `${accent}20`, borderColor: `${accent}44` }]}>
          <Text style={[styles.avatarText, { color: accent }]}>{item.clientNumber}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, textRtl, { color: c.text }]} numberOfLines={1}>
            {name}
          </Text>
          {item.phone ? (
            <View style={styles.phoneRow}>
              <Icon name="call-outline" size={12} color={c.textDim} />
              <Text style={[styles.phone, { color: c.textMuted }]}>{item.phone}</Text>
            </View>
          ) : null}
          {item.notes?.trim() ? (
            <Text style={[styles.notes, textRtl, { color: c.textMuted }]} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: `${accent}18`, borderColor: `${accent}33` }]}>
          <Text style={[styles.badgeText, { color: accent }]}>{item.entryCount}</Text>
          <Text style={[styles.badgeSub, { color: c.textDim }]}>وزنة</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatPill icon="scale-outline" label="الوزن" value={`${formatNum(item.totalWeightKg)}`} unit="كغ" accent={accent} />
        <StatPill icon="bag-outline" label="أكياس" value={String(item.bagCount)} accent={accent} />
        <StatPill icon="layers-outline" label="ضلف" value={String(item.adhlefCount)} accent={accent} />
        <StatPill icon="beaker-outline" label="سعة" value={formatNum(item.capacity)} accent={accent} />
      </View>

      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <Text style={[styles.footerText, { color: accent }]}>إضافة تصفية</Text>
        <Icon name="add-circle" size={22} color={accent} />
      </View>
    </Pressable>
  );
}

function StatPill({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  accent: string;
}) {
  const c = useThemeColors();

  return (
    <View style={[styles.pill, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
      <Icon name={icon} size={14} color={accent} />
      <Text style={[styles.pillLabel, { color: c.textDim }]}>{label}</Text>
      <View style={styles.pillValueRow}>
        <Text style={[styles.pillValue, { color: c.text }]}>{value}</Text>
        {unit ? <Text style={[styles.pillUnit, { color: c.textMuted }]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
  },
  dimmed: { opacity: 0.38 },
  pressed: { transform: [{ scale: 0.985 }] },
  top: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarText: { fontSize: 16, fontFamily: font.black },
  info: { flex: 1, minWidth: 0 },
  name: { ...typography.h2, fontSize: 16 },
  phoneRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
  phone: { ...typography.caption },
  notes: { ...typography.caption, marginTop: 4, opacity: 0.9 },
  badge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 48,
  },
  badgeText: { fontSize: 16, fontFamily: font.black },
  badgeSub: { ...typography.micro, marginTop: 2 },
  stats: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  pill: {
    width: '47%',
    flexGrow: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  pillLabel: { ...typography.micro },
  pillValueRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4 },
  pillValue: { fontSize: 16, fontFamily: font.extraBold },
  pillUnit: { ...typography.micro },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: { ...typography.caption, fontFamily: font.extraBold },
});
