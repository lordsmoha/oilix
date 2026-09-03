import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Redirect, router } from 'expo-router';
import { api, getLoginErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SessionLoadingScreen } from '@/components/SessionScreens';
import { useThemeColors, useIsDark, useShadow, radius, spacing, textRtl, typography, font } from '@/lib/theme';
import type { AuthUser } from '@/lib/types';

export default function LoginScreen() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const shadow = useShadow();
  const phase = useAuth((s) => s.phase);
  const token = useAuth((s) => s.token);
  const setSession = useAuth((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pendant boot / erreur : overlay root déjà visible — placeholder local
  if (phase === 'booting' || phase === 'error') {
    return <SessionLoadingScreen />;
  }

  if (phase === 'authenticated' && token) {
    return <Redirect href="/(app)/board" />;
  }

  async function onLogin() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        username: username.trim(),
        password,
      });
      await setSession(data.accessToken, data.user);
      router.replace('/(app)/board');
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen padded={false} edges={[]}>
      <LinearGradient colors={[...c.loginGradient]} style={StyleSheet.absoluteFill} />
      <View style={styles.meshA} />
      <View style={styles.meshB} />

      <View style={styles.themeCorner}>
        <ThemeToggle light />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <View style={[styles.logoRing, shadow.glow]}>
            <View style={styles.logoInner}>
              <Icon name="nutrition" size={44} color={c.gold} />
            </View>
          </View>
          <Text style={styles.brand}>Oilix</Text>
          <Text style={[styles.tagline, textRtl]}>
            منصة استقبال الزيتون للميدان
          </Text>
          <Text style={[styles.subTag, textRtl]}>إدارة المعصرة · وزنات · مزامنة فورية</Text>

          <View style={styles.pills}>
            <Tag icon="leaf" text="أخضر" />
            <Tag icon="water" text="زبوش" />
            <Tag icon="moon" text="طايب" />
          </View>
        </View>

        <View
          style={[
            styles.form,
            {
              backgroundColor: isDark ? 'rgba(21,28,24,0.92)' : 'rgba(255,255,255,0.96)',
              borderColor: isDark ? c.border : 'rgba(255,255,255,0.5)',
            },
            shadow.card,
          ]}
        >
          <Text style={[styles.formTitle, textRtl, { color: c.text }]}>تسجيل الدخول</Text>
          <Text style={[styles.formHint, textRtl, { color: c.textDim }]}>
            أدخل بيانات حسابك للمتابعة
          </Text>
          <Input
            label="اسم المستخدم"
            icon="person-outline"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="كلمة المرور"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: c.dangerBg }]}>
              <Icon name="alert-circle" size={18} color={c.danger} />
              <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
            </View>
          ) : null}
          <Button label="دخول" onPress={() => void onLogin()} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Tag({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.tag}>
      <Icon name={icon} size={14} color="#fff" />
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meshA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(212,168,83,0.12)',
    top: '12%',
    right: -60,
  },
  meshB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: '28%',
    left: -50,
  },
  themeCorner: {
    position: 'absolute',
    top: 52,
    left: spacing.page,
    zIndex: 10,
  },
  flex: { flex: 1, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 28 },
  hero: { alignItems: 'center', paddingHorizontal: spacing.xl },
  logoRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(212,168,83,0.45)',
    padding: 6,
    marginBottom: spacing.lg,
  },
  logoInner: {
    flex: 1,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...typography.brand, color: '#fff' },
  tagline: {
    ...typography.body,
    marginTop: 10,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: font.bold,
  },
  subTag: {
    ...typography.caption,
    marginTop: 6,
    color: 'rgba(255,255,255,0.65)',
  },
  pills: { flexDirection: 'row-reverse', gap: 10, marginTop: spacing.xl },
  tag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tagText: { ...typography.caption, color: '#fff', fontFamily: font.bold },
  form: {
    marginHorizontal: spacing.page,
    borderRadius: radius.xl,
    padding: spacing.xl + 4,
    borderWidth: 1,
  },
  formTitle: { ...typography.h1, marginBottom: 4 },
  formHint: { ...typography.caption, marginBottom: spacing.lg },
  errorBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 14,
  },
  errorText: { ...typography.caption, flex: 1, textAlign: 'right' },
});
