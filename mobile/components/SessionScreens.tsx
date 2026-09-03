import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors, radius, spacing, textRtl, typography, font } from '@/lib/theme';

/** Écran de chargement pendant la restauration / validation de session. */
export function SessionLoadingScreen({ message = 'جاري التحقق من الجلسة...' }: { message?: string }) {
  const c = useThemeColors();

  return (
    <View style={[styles.center, { backgroundColor: c.bg }]}>
      <ActivityIndicator size="large" color={c.primary} />
      <Text style={[styles.msg, textRtl, { color: c.textMuted }]}>{message}</Text>
    </View>
  );
}

/** Erreur réseau / boot — jamais d’écran blanc. */
export function SessionErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const c = useThemeColors();

  return (
    <View style={[styles.center, { backgroundColor: c.bg, paddingHorizontal: spacing.page }]}>
      <View style={[styles.iconWrap, { backgroundColor: c.dangerBg }]}>
        <Icon name="cloud-offline-outline" size={36} color={c.danger} />
      </View>
      <Text style={[styles.title, textRtl, { color: c.text }]}>تعذر استعادة الجلسة</Text>
      <Text style={[styles.msg, textRtl, { color: c.textMuted }]}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retry,
          { backgroundColor: c.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.retryText}>إعادة المحاولة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { ...typography.h1, fontSize: 20, textAlign: 'center' },
  msg: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24,
  },
  retry: {
    marginTop: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  retryText: { color: '#fff', fontFamily: font.bold, fontSize: 16 },
});
