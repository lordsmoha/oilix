import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors, useIsDark, radius } from '@/lib/theme';
import { useThemeStore } from '@/lib/theme-store';

type Props = {
  size?: number;
  light?: boolean;
};

export function ThemeToggle({ size = 20, light }: Props) {
  const c = useThemeColors();
  const isDark = useIsDark();
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.btn,
        light
          ? {
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderColor: 'rgba(255,255,255,0.22)',
            }
          : { backgroundColor: c.surface, borderColor: c.borderStrong },
      ]}
      accessibilityLabel={
        isDark ? 'العودة إلى الوضع الفاتح (الافتراضي)' : 'تفعيل الوضع الداكن (اختياري)'
      }
    >
      <Icon name={isDark ? 'sunny' : 'moon'} size={size} color={light ? '#fbbf24' : c.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
