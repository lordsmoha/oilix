import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

/** Mode clair par défaut ; le mode sombre n'est appliqué que si l'utilisateur l'a choisi (persisté). */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'oilix-theme' },
  ),
);

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = localStorage.getItem('oilix-theme');
    if (!raw) return 'light';
    const parsed = JSON.parse(raw) as { state?: { mode?: ThemeMode } };
    return parsed?.state?.mode === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
