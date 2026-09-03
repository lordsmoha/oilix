import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RealtimeProvider } from '@/lib/realtime';
import { useAuth } from '@/lib/auth';
import { cairoFontMap } from '@/lib/fonts';
import { useThemeColors, useIsDark } from '@/lib/theme';

const qc = new QueryClient();
const BOOT_MAX_MS = 800;

export default function RootLayout() {
  const hydrate = useAuth((s) => s.hydrate);
  const hydrated = useAuth((s) => s.hydrated);
  const [bootForced, setBootForced] = useState(false);
  const c = useThemeColors();
  const isDark = useIsDark();

  useEffect(() => {
    void hydrate();
    void Font.loadAsync(cairoFontMap).catch(() => undefined);
    const t = setTimeout(() => {
      const state = useAuth.getState();
      if (!state.hydrated) {
        useAuth.setState({
          hydrated: true,
          phase: state.token ? 'authenticated' : 'unauthenticated',
        });
      }
      setBootForced(true);
    }, BOOT_MAX_MS);
    return () => clearTimeout(t);
  }, [hydrate]);

  if (!(hydrated || bootForced)) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <RealtimeProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
        </RealtimeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
