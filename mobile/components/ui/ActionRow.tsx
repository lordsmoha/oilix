import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useThemeColors, radius, spacing, textRtl, typography, font } from '@/lib/theme';

type Props = {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accent?: string;
};

export function ActionRow({ icon, title, subtitle, onPress, disabled, loading, accent }: Props) {
  const c = useThemeColors();
  const color = accent ?? c.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.border,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}18`, borderColor: `${color}33` }]}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Icon name={icon} size={20} color={color} />
        )}
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, textRtl, { color: c.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, textRtl, { color: c.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Icon name="chevron-back" size={18} color={c.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: { flex: 1 },
  title: { ...typography.body, fontFamily: font.bold },
  subtitle: { ...typography.caption, marginTop: 3 },
});
