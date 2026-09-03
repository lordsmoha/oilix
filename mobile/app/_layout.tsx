import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { RealtimeProvider } from '@/components/RealtimeProvider';
import { SessionErrorScreen, SessionLoadingScreen } from '@/components/SessionScreens';
import { useAuth } from '@/lib/auth';
import { cairoFontMap } from '@/lib/fonts';
import { useThemeColors, useIsDark } from '@/lib/theme';

const qc = new QueryClient();

function ThemedStack() {
  const c = useThemeColors();
  const isDark = useIsDark();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: c.bg },
          headerShown: false,
        }}
      />
    </>
  );
}

/**
 * Overlay session — le Stack Expo Router doit TOUJOURS être monté au 1er rendu.
 * Ne jamais remplacer le navigateur par un écran de chargement (sinon :
 * "Attempted to navigate before mounting the Root Layout").
 */
function SessionOverlay() {
  const phase = useAuth((s) => s.phase);
  const bootError = useAuth((s) => s.bootError);
  const hydrate = useAuth((s) => s.hydrate);
  const c = useThemeColors();

  if (phase === 'booting') {
    return (
      <View style={[styles.overlay, { backgroundColor: c.bg }]} pointerEvents="auto">
        <SessionLoadingScreen />
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.overlay, { backgroundColor: c.bg }]} pointerEvents="auto">
        <SessionErrorScreen
          message={bootError || 'تعذر التحقق من الجلسة.'}
          onRetry={() => void hydrate()}
        />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    void Font.loadAsync(cairoFontMap).catch(() => undefined);
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <QueryClientProvider client={qc}>
          <RealtimeProvider>
            <ThemedStack />
            <SessionOverlay />
          </RealtimeProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
});
