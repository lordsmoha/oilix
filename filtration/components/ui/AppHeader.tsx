import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/components/ui/Icon';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useThemeColors, useIsDark, radius, spacing, textRtl, typography, font } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  userName?: string;
  onLogout?: () => void;
  onHistory?: () => void;
  accent?: string;
};

export function AppHeader({ title, subtitle, userName, onLogout, onHistory, accent }: Props) {
  const c = useThemeColors();
  const isDark = useIsDark();
  const accentColor = accent ?? c.primary;
  const gradient = isDark
    ? c.headerGradient
    : ([accentColor, c.primaryDark, '#0f3d2a'] as const);

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.orbA} />
        <View style={styles.orbB} />

        <View style={styles.row}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="water" size={24} color={c.gold} />
            </View>
            <View>
              <Text style={styles.brandTitle}>Oilix</Text>
              {userName ? <Text style={styles.user}>{userName}</Text> : null}
            </View>
          </View>
          <View style={styles.actions}>
            <SyncIndicator light />
            <ThemeToggle light />
            {onHistory ? (
              <Pressable onPress={onHistory} style={styles.logout} hitSlop={12}>
                <Icon name="history" size={20} color="#fff" />
              </Pressable>
            ) : null}
            {onLogout ? (
              <Pressable onPress={onLogout} style={styles.logout} hitSlop={12}>
                <Icon name="log-out-outline" size={20} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={[styles.title, textRtl]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, textRtl]}>{subtitle}</Text> : null}

        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  gradient: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    left: -30,
  },
  orbB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212,168,83,0.12)',
    bottom: -20,
    right: -20,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  brandTitle: { fontSize: 18, fontFamily: font.black, letterSpacing: 1, color: '#fff' },
  user: { ...typography.caption, marginTop: 2, color: 'rgba(255,255,255,0.75)' },
  actions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  logout: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: { ...typography.hero, fontSize: 28, color: '#fff' },
  subtitle: {
    ...typography.body,
    marginTop: 6,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: font.semiBold,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 40,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    opacity: 0.9,
  },
});
