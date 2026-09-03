import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useThemeColors, useIsDark } from '@/lib/theme';

/**
 * Zone authentifiée — le Stack reste toujours monté.
 * Redirection uniquement quand la session est clairement absente.
 */
export default function AppLayout() {
  const phase = useAuth((s) => s.phase);
  const token = useAuth((s) => s.token);
  const c = useThemeColors();
  const isDark = useIsDark();

  if (phase === 'unauthenticated' || (phase === 'authenticated' && !token)) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
        animation: isDark ? 'fade' : 'slide_from_left',
      }}
    />
  );
}
