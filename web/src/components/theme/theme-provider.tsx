'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [mode]);

  return children;
}
