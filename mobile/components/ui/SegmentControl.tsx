import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors, radius, typography, font } from '@/lib/theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function SegmentControl<T extends string>({ options, value, onChange }: Props<T>) {
  const c = useThemeColors();

  return (
    <View style={[styles.wrap, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.item,
              active && { backgroundColor: c.primary },
            ]}
          >
            <Text style={[styles.text, { color: active ? c.white : c.textMuted }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    borderRadius: radius.md,
    padding: 5,
    marginBottom: 18,
    borderWidth: 1.5,
  },
  item: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  text: { ...typography.caption, fontFamily: font.extraBold, fontSize: 13 },
});
