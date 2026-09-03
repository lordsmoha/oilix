import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatNum } from '@/lib/api';
import { useThemeColors, useShadow, radius, textRtl, typography, font } from '@/lib/theme';

type Props = {
  reference: number;
  date: string;
  time: string;
  weightKg: number;
  bagCount: number;
  adhlefCount: number;
  capacity: number | null;
  userName: string;
  accent: string;
};

export function WeighingCard({
  reference,
  date,
  time,
  weightKg,
  bagCount,
  adhlefCount,
  capacity,
  userName,
  accent,
}: Props) {
  const c = useThemeColors();
  const shadow = useShadow();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
        shadow.card,
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.header}>
        <View style={[styles.refBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}44` }]}>
          <Text style={[styles.ref, { color: accent }]}>#{reference}</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={[styles.date, { color: c.textMuted }]}>{date}</Text>
          <Text style={[styles.time, { color: c.textDim }]}>{time}</Text>
        </View>
      </View>

      <View style={styles.weightHero}>
        <Text style={[styles.weightValue, { color: accent }]}>{formatNum(weightKg)}</Text>
        <Text style={[styles.weightUnit, { color: c.textMuted }]}>كغ</Text>
      </View>

      <View style={styles.grid}>
        <Mini icon="bag-outline" label="أكياس" value={String(bagCount)} />
        <Mini icon="layers-outline" label="ضلف" value={String(adhlefCount)} />
        <Mini icon="beaker-outline" label="سعة" value={capacity != null ? formatNum(capacity) : '—'} />
      </View>

      <View style={[styles.userRow, { borderTopColor: c.border }]}>
        <Icon name="person-circle-outline" size={16} color={c.textDim} />
        <Text style={[styles.user, textRtl, { color: c.textMuted }]}>{userName}</Text>
      </View>
    </View>
  );
}

function Mini({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  const c = useThemeColors();

  return (
    <View style={[styles.mini, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
      <Icon name={icon} size={14} color={c.textDim} />
      <Text style={[styles.miniLabel, { color: c.textDim }]}>{label}</Text>
      <Text style={[styles.miniValue, { color: c.text }]}>{value}</Text>
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
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  refBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  ref: { fontFamily: font.black, fontSize: 14 },
  dateBlock: { alignItems: 'flex-start' },
  date: { ...typography.caption },
  time: { ...typography.micro, marginTop: 2 },
  weightHero: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  weightValue: { fontSize: 40, fontFamily: font.black, letterSpacing: -1 },
  weightUnit: { ...typography.caption, fontFamily: font.bold },
  grid: { flexDirection: 'row-reverse', gap: 8 },
  mini: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  miniLabel: { ...typography.micro },
  miniValue: { fontSize: 15, fontFamily: font.extraBold },
  userRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  user: { ...typography.caption },
});
