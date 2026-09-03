import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useThemeColors, useShadow, radius, textRtl, typography } from '@/lib/theme';

type Props = {
  icon?: IconName;
  title: string;
  message?: string;
};

export function EmptyState({ icon = 'people-outline', title, message }: Props) {
  const c = useThemeColors();
  const shadow = useShadow();

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: c.surface, borderColor: c.border },
          shadow.soft,
        ]}
      >
        <View style={[styles.innerRing, { borderColor: c.primarySoft }]}>
          <Icon name={icon} size={42} color={c.primary} />
        </View>
      </View>
      <Text style={[styles.title, textRtl, { color: c.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, textRtl, { color: c.textMuted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 28 },
  iconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  innerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  title: { ...typography.h1, fontSize: 20 },
  message: { ...typography.body, marginTop: 10, textAlign: 'center', lineHeight: 24 },
});
