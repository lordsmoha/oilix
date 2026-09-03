import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useThemeColors } from '@/lib/theme';

export default function AppLayout() {
  const phase = useAuth((s) => s.phase);
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const c = useThemeColors();

  if (!hydrated || phase === 'booting') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (phase === 'unauthenticated' || !token) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
        animation: 'slide_from_left',
      }}
    />
  );
}
