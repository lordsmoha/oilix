import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { API_URL, CLIENT_SOURCE_HEADER, MOBILE_SOURCE } from './api-config';
import type { AuthUser } from './types';

/**
 * Session via AsyncStorage (fiable en APK).
 * SecureStore peut rester bloqué / ne jamais résoudre sur certains Android.
 */
const TOKEN_KEY = 'oilix_token';
const USER_KEY = 'oilix_user';

/** Délai max lecture stockage — au-delà on considère une panne locale. */
const STORAGE_TIMEOUT_MS = 3_000;
/** Délai max validation serveur `/auth/me`. */
const ME_TIMEOUT_MS = 12_000;

export type SessionPhase = 'booting' | 'authenticated' | 'unauthenticated' | 'error';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  /** true dès que le boot est terminé (succès ou erreur). */
  hydrated: boolean;
  phase: SessionPhase;
  bootError: string | null;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  clearSession: (options?: { notifyServer?: boolean }) => Promise<void>;
  hydrate: () => Promise<void>;
  hasPermission: (p: string) => boolean;
};

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function networkBootMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.message.includes('timeout')) {
      return 'انتهت مهلة الاتصال بالخادم أثناء التحقق من الجلسة.';
    }
    if (err.message === 'network') {
      return 'تعذر الاتصال بالخادم للتحقق من الجلسة. تحقق من الشبكة ثم أعد المحاولة.';
    }
    if (err.message.startsWith('http_')) {
      return `خطأ من الخادم أثناء التحقق من الجلسة (${err.message.slice(5)}).`;
    }
  }
  return 'حدث خطأ غير متوقع أثناء استعادة الجلسة.';
}

/** Validation session sans axios (évite cycles + interceptors 401). */
async function fetchMe(token: string): Promise<AuthUser> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ME_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        [CLIENT_SOURCE_HEADER]: MOBILE_SOURCE,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`http_${res.status}`);
    }
    return (await res.json()) as AuthUser;
  } catch (err) {
    if (err instanceof Error && (err.message.startsWith('http_') || err.name === 'AbortError')) {
      throw err;
    }
    throw new Error('network');
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
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        [CLIENT_SOURCE_HEADER]: MOBILE_SOURCE,
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
    set({
      token,
      user,
      hydrated: true,
      phase: 'authenticated',
      bootError: null,
    });
  },

  async clearSession(options) {
    const token = get().token;
    if (token && options?.notifyServer) {
      await notifyLogout(token);
    }
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({
      token: null,
      user: null,
      hydrated: true,
      phase: 'unauthenticated',
      bootError: null,
    });
  },

  async hydrate() {
    set({ phase: 'booting', bootError: null, hydrated: false });

    try {
      const [token, user] = await withTimeout(
        Promise.all([AsyncStorage.getItem(TOKEN_KEY), readJson<AuthUser>(USER_KEY)]),
        STORAGE_TIMEOUT_MS,
        'storage',
      );

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

      // Token en mémoire pour les interceptors, sans encore ouvrir l’app
      set({ token, user });

      try {
        const data = await fetchMe(token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data));
        set({
          token,
          user: data,
          hydrated: true,
          phase: 'authenticated',
          bootError: null,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        const unauthorized = msg === 'http_401' || msg === 'http_403';

        if (unauthorized) {
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

        // Réseau / serveur → écran d’erreur + réessai (garder le token local)
        set({
          token,
          user,
          hydrated: true,
          phase: 'error',
          bootError: networkBootMessage(err),
        });
      }
    } catch (err) {
      set({
        token: null,
        user: null,
        hydrated: true,
        phase: 'error',
        bootError: networkBootMessage(err),
      });
    }
  },

  hasPermission(p) {
    const u = get().user;
    return u?.role === 'ADMIN' || (u?.permissions?.includes(p) ?? false);
  },
}));
