import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, radius, typography, font } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  accentColor?: string;
};

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
  accentColor,
}: Props) {
  const c = useThemeColors();
  const primary = accentColor ?? c.primary;
  const primaryDark = accentColor ?? c.primaryDark;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.base,
          styles.clip,
          (pressed || disabled) && { opacity: 0.88, transform: [{ scale: 0.985 }] },
          style,
        ]}
      >
        <LinearGradient
          colors={[primary, primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {loading ? (
            <ActivityIndicator color={c.white} />
          ) : (
            <Text style={[styles.label, { color: c.white }]}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && {
          backgroundColor: c.surface,
          borderWidth: 1.5,
          borderColor: c.borderStrong,
        },
        variant === 'ghost' && { backgroundColor: c.primarySoft },
        variant === 'danger' && { backgroundColor: c.dangerBg, borderWidth: 1, borderColor: c.danger },
        (pressed || disabled) && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' && { color: c.text },
            variant === 'ghost' && { color: c.primary },
            variant === 'danger' && { color: c.danger },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    overflow: 'hidden',
  },
  clip: { padding: 0 },
  gradientFill: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  label: { ...typography.body, fontFamily: font.extraBold, fontSize: 16 },
});
