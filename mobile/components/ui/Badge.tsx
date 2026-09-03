import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useThemeColors, radius, font, typography } from '@/lib/theme';

type Tone = 'neutral' | 'primary' | 'gold' | 'success' | 'danger' | 'accent';

type Props = {
  label: string;
  tone?: Tone;
  accent?: string;
  style?: ViewStyle;
};

export function Badge({ label, tone = 'neutral', accent, style }: Props) {
  const c = useThemeColors();
  const palette: Record<Tone, { bg: string; fg: string; border: string }> = {
    neutral: { bg: c.bgElevated, fg: c.textMuted, border: c.border },
    primary: { bg: c.primarySoft, fg: c.primary, border: `${c.primary}33` },
    gold: { bg: c.goldMuted, fg: c.gold, border: `${c.gold}44` },
    success: { bg: 'rgba(46,125,79,0.12)', fg: c.success, border: `${c.success}33` },
    danger: { bg: c.dangerBg, fg: c.danger, border: `${c.danger}33` },
    accent: {
      bg: accent ? `${accent}18` : c.primarySoft,
      fg: accent ?? c.primary,
      border: accent ? `${accent}33` : `${c.primary}33`,
    },
  };
  const p = palette[tone];

  return (
    <View style={[styles.badge, { backgroundColor: p.bg, borderColor: p.border }, style]}>
      <Text style={[styles.text, { color: p.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { ...typography.micro, fontFamily: font.bold, fontSize: 11 },
});
