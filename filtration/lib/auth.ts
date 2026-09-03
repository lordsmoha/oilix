import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { API_URL } from './api';

const TOKEN_KEY = 'oilix_filtration_token';
const USER_KEY = 'oilix_filtration_user';
const ME_TIMEOUT_MS = 12_000;

export type AuthUser = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  roleAr: string;
  permissions: string[];
};

export type SessionPhase = 'booting' | 'authenticated' | 'unauthenticated' | 'error';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  phase: SessionPhase;
  bootError: string | null;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  clearSession: (options?: { notifyServer?: boolean }) => Promise<void>;
  hydrate: () => Promise<void>;
  hasPermission: (p: string) => boolean;
};

async function fetchMe(token: string): Promise<AuthUser> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ME_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    return (await res.json()) as AuthUser;
  } finally {
    clearTimeout(timer);
  }
}

async function notifyLogout(token: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    }).catch(() => undefined);
    clearTimeout(timer);
  } catch {
    /* ignore */
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,
  phase: 'booting',
  bootError: null,
  async setSession(token, user) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, hydrated: true, phase: 'authenticated', bootError: null });
  },
  async clearSession(options) {
    const token = get().token;
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({ token: null, user: null, hydrated: true, phase: 'unauthenticated', bootError: null });
    if (options?.notifyServer && token) await notifyLogout(token);
  },
  async hydrate() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (!token) {
        set({
          token: null,
          user: null,
          hydrated: true,
          phase: 'unauthenticated',
          bootError: null,
        });
        return;
      }
      try {
        const user = await fetchMe(token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        set({
          token,
          user,
          hydrated: true,
          phase: 'authenticated',
          bootError: null,
        });
      } catch (err) {
        const status =
          err instanceof Error && err.message.startsWith('http_')
            ? Number(err.message.slice(5))
            : 0;
        if (status === 401 || status === 403) {
          await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          set({
            token: null,
            user: null,
            hydrated: true,
            phase: 'unauthenticated',
            bootError: null,
          });
          return;
        }
        // Network / server error: keep cached user so the app remains usable offline.
        const cached = raw ? (JSON.parse(raw) as AuthUser) : null;
        set({
          token,
          user: cached,
          hydrated: true,
          phase: cached ? 'authenticated' : 'error',
          bootError: cached
            ? null
            : 'تعذر التحقق من الجلسة. تحقق من الشبكة ثم أعد المحاولة.',
        });
      }
    } catch {
      set({
        token: null,
        user: null,
        hydrated: true,
        phase: 'unauthenticated',
        bootError: null,
      });
    }
  },
  hasPermission(p) {
    const u = get().user;
    return u?.role === 'ADMIN' || (u?.permissions?.includes(p) ?? false);
  },
}));
