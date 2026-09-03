import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { OLIVE_TYPES, type OliveTypeValue } from '@/lib/labels';
import { useThemeColors, useShadow, radius, typography, font } from '@/lib/theme';

type Props = {
  value: OliveTypeValue;
  onChange: (v: OliveTypeValue) => void;
};

export function OliveTypePicker({ value, onChange }: Props) {
  const c = useThemeColors();
  const shadow = useShadow();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: c.surface, borderColor: c.border },
        shadow.soft,
      ]}
    >
      {OLIVE_TYPES.map((t) => {
        const active = value === t.value;
        return (
          <Pressable
            key={t.value}
            onPress={() => onChange(t.value)}
            style={[
              styles.tab,
              active && {
                borderColor: t.color,
                backgroundColor: `${t.color}18`,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: active ? `${t.color}28` : c.bgElevated,
                  borderColor: active ? t.color : c.border,
                },
              ]}
            >
              <Icon name={t.icon} size={18} color={active ? t.color : c.textDim} />
            </View>
            <Text style={[styles.label, { color: active ? t.color : c.textMuted }]}>
              {t.label}
            </Text>
            {active ? <View style={[styles.dot, { backgroundColor: t.color }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 6,
    marginBottom: 14,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: { ...typography.caption, fontFamily: font.extraBold },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
