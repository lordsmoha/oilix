import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { router } from 'expo-router';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useThemeColors, useShadow, radius, spacing, textRtl, typography } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  accent?: string;
};

export function SubHeader({ title, subtitle, accent }: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const shadow = useShadow();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 10,
          borderBottomColor: c.border,
          backgroundColor: c.surface,
        },
        shadow.soft,
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        style={[styles.back, { backgroundColor: c.bgElevated, borderColor: c.border }]}
        hitSlop={12}
      >
        <Icon name="arrow-forward" size={22} color={c.text} />
      </Pressable>
      <View style={styles.textBlock}>
        <Text style={[styles.title, textRtl, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, textRtl, { color: c.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ThemeToggle />
      {accent ? <View style={[styles.dot, { backgroundColor: accent }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    gap: 12,
    marginBottom: 4,
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  textBlock: { flex: 1 },
  title: { ...typography.h1, fontSize: 20 },
  subtitle: { ...typography.caption, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
