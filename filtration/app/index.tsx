import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { api, getLoginErrorMessage } from '@/lib/api';
import { useAuth, type AuthUser } from '@/lib/auth';
import { useThemeColors, useIsDark, useShadow, radius, spacing, textRtl, typography, font } from '@/lib/theme';

export default function LoginScreen() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const shadow = useShadow();
  const { token, hydrated, setSession } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hydrated && token) router.replace('/(app)/board');
  }, [hydrated, token]);

  if (!hydrated) {
    return (
      <Screen padded={false} edges={[]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
          <Text style={[styles.hint, textRtl]}>جاري التحميل…</Text>
        </View>
      </Screen>
    );
  }

  async function onLogin() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        username: username.trim(),
        password,
      });
      if (
        data.user.role !== 'ADMIN' &&
        !data.user.permissions?.includes('FILTRATION_READ')
      ) {
        setError('ليس لديك صلاحية تطبيق التصفية');
        return;
      }
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
      <View style={styles.themeCorner}>
        <ThemeToggle light />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <View style={[styles.logo, shadow.glow]}>
            <Icon name="water" size={40} color={c.gold} />
          </View>
          <Text style={styles.brand}>Oilix</Text>
          <Text style={[styles.sub, textRtl]}>تصفية الزيت</Text>
          <Text style={[styles.hint, textRtl]}>إدارة عمليات التصفية · مزامنة فورية</Text>
        </View>

        <View
          style={[
            styles.form,
            {
              backgroundColor: isDark ? 'rgba(21,28,24,0.92)' : 'rgba(255,255,255,0.96)',
              borderColor: c.border,
            },
            shadow.card,
          ]}
        >
          <Text style={[styles.formTitle, textRtl, { color: c.text }]}>تسجيل الدخول</Text>
          <Input
            label="اسم المستخدم"
            icon="person-outline"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Input
            label="كلمة المرور"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? (
            <Text style={[styles.error, textRtl, { color: c.danger }]}>{error}</Text>
          ) : null}
          <Button label="دخول" onPress={() => void onLogin()} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeCorner: { position: 'absolute', top: 52, left: spacing.page, zIndex: 10 },
  flex: { flex: 1, justifyContent: 'space-between', paddingTop: 88, paddingBottom: 28 },
  hero: { alignItems: 'center', paddingHorizontal: spacing.xl },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.4)',
  },
  brand: { ...typography.brand, color: '#fff', fontSize: 36 },
  sub: { ...typography.h1, color: '#fff', marginTop: 6 },
  hint: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  form: {
    marginHorizontal: spacing.page,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  formTitle: { ...typography.h1, marginBottom: spacing.lg },
  error: { ...typography.caption, marginBottom: 12, fontFamily: font.bold },
});
