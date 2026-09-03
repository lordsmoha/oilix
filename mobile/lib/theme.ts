import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { font } from './fonts';
import { useThemeStore, type ThemeMode } from './theme-store';

export { font };

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  primaryGlow: string;
  gold: string;
  goldMuted: string;
  danger: string;
  dangerBg: string;
  success: string;
  white: string;
  overlay: string;
  headerGradient: readonly [string, string, string];
  loginGradient: readonly [string, string, string, string];
  inputBg: string;
  shadowColor: string;
  meshA: string;
  meshB: string;
};

/** Identité « pressoir premium » — vert forêt profond + or chaud + brume sauge */
export const lightColors: ThemeColors = {
  bg: '#eef3ef',
  bgElevated: '#f7faf8',
  surface: '#ffffff',
  surfaceHover: '#f0f5f2',
  border: 'rgba(18, 42, 30, 0.1)',
  borderStrong: 'rgba(18, 42, 30, 0.18)',
  text: '#0b1611',
  textMuted: '#3a4d43',
  textDim: '#6a7b72',
  primary: '#1b5e3b',
  primaryDark: '#13402a',
  primarySoft: 'rgba(27, 94, 59, 0.1)',
  primaryGlow: 'rgba(27, 94, 59, 0.22)',
  gold: '#b8860b',
  goldMuted: 'rgba(184, 134, 11, 0.14)',
  danger: '#c62828',
  dangerBg: 'rgba(198, 40, 40, 0.08)',
  success: '#2e7d4f',
  white: '#ffffff',
  overlay: 'rgba(8, 16, 12, 0.45)',
  headerGradient: ['#1b5e3b', '#1a6b45', '#0f3d2a'] as const,
  loginGradient: ['#0f3d2a', '#1b5e3b', '#246b48', '#13402a'] as const,
  inputBg: '#f7faf8',
  shadowColor: '#0b1611',
  meshA: 'rgba(27, 94, 59, 0.08)',
  meshB: 'rgba(184, 134, 11, 0.06)',
};

export const darkColors: ThemeColors = {
  bg: '#080c0a',
  bgElevated: '#101612',
  surface: '#151c18',
  surfaceHover: '#1c2520',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  text: '#f2f6f3',
  textMuted: '#a3b0a8',
  textDim: '#6d7a72',
  primary: '#3dcf8e',
  primaryDark: '#1e7a52',
  primarySoft: 'rgba(61, 207, 142, 0.14)',
  primaryGlow: 'rgba(61, 207, 142, 0.28)',
  gold: '#d4a853',
  goldMuted: 'rgba(212, 168, 83, 0.18)',
  danger: '#ef6b6b',
  dangerBg: 'rgba(239, 107, 107, 0.12)',
  success: '#4ade80',
  white: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.55)',
  headerGradient: ['#0a1612', '#0f3d2e', '#0c1210'] as const,
  loginGradient: ['#050806', '#0a1612', '#0f3d2e', '#08140f'] as const,
  inputBg: '#101612',
  shadowColor: '#000000',
  meshA: 'rgba(61, 207, 142, 0.08)',
  meshB: 'rgba(212, 168, 83, 0.06)',
};

export function getColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export function useThemeColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  return getColors(mode);
}

export function useIsDark(): boolean {
  return useThemeStore((s) => s.mode === 'dark');
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  page: 20,
  card: 18,
  section: 24,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
};

/** Typo Cairo — alignée web (éviter fontWeight + famille named weight sur Android). */
export const typography = {
  hero: { fontSize: 34, fontFamily: font.black, letterSpacing: -0.6 },
  brand: { fontSize: 40, fontFamily: font.black, letterSpacing: 1.5 },
  h1: { fontSize: 22, fontFamily: font.extraBold, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontFamily: font.bold },
  body: { fontSize: 15, fontFamily: font.semiBold },
  caption: { fontSize: 12, fontFamily: font.semiBold },
  micro: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.5 },
};

export function useShadow() {
  const isDark = useIsDark();
  const colors = useThemeColors();
  return {
    card: Platform.select<ViewStyle>({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.4 : 0.1,
        shadowRadius: 18,
      },
      android: { elevation: isDark ? 8 : 4 },
      default: {},
    }),
    soft: Platform.select<ViewStyle>({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
    fab: Platform.select<ViewStyle>({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      default: {},
    }),
    glow: Platform.select<ViewStyle>({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  };
}

/** @deprecated use useThemeColors() */
export const colors = lightColors;

export const layout = {
  screenPadding: spacing.page,
  maxContentWidth: 480,
};

export function oliveTheme(type: string) {
  const map: Record<string, { main: string; soft: string; glow: string }> = {
    GREEN: { main: '#2f9e6a', soft: 'rgba(47, 158, 106, 0.14)', glow: 'rgba(47, 158, 106, 0.35)' },
    ZBOUCH: { main: '#3b82f6', soft: 'rgba(59, 130, 246, 0.14)', glow: 'rgba(59, 130, 246, 0.35)' },
    RIPE: { main: '#e11d48', soft: 'rgba(225, 29, 72, 0.12)', glow: 'rgba(225, 29, 72, 0.32)' },
  };
  return map[type] ?? map.GREEN;
}

export const textRtl: TextStyle = { writingDirection: 'rtl', textAlign: 'right' };
