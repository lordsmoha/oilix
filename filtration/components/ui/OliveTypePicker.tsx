import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { OLIVE_TYPES, type OliveTypeValue } from '@/lib/labels';
import { useThemeColors, useShadow, radius, typography, font } from '@/lib/theme';

type Props = {
  value: OliveTypeValue;
  onChange: (v: OliveTypeValue) => void;
};

/** Même principe que l’app mobile — sélecteur de type d’olives. */
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
            <Text style={styles.emoji}>{t.emoji}</Text>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: active ? `${t.color}28` : c.bgElevated,
                  borderColor: active ? t.color : c.border,
                },
              ]}
            >
              <Icon name={t.icon} size={16} color={active ? t.color : c.textDim} />
            </View>
            <Text style={[styles.label, { color: active ? t.color : c.textMuted }]} numberOfLines={1}>
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
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  emoji: { fontSize: 18, lineHeight: 22 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: { ...typography.caption, fontFamily: font.extraBold, fontSize: 11 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
