import axios from 'axios';
import { router } from 'expo-router';
import { API_URL, CLIENT_SOURCE_HEADER, MOBILE_SOURCE } from './api-config';
import { useAuth } from './auth';

export { API_URL, CLIENT_SOURCE_HEADER, MOBILE_SOURCE } from './api-config';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    [CLIENT_SOURCE_HEADER]: MOBILE_SOURCE,
  },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const url = String(err.config?.url ?? '');
    const isAuthCall =
      url.includes('/auth/login') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/me');

    // Ne pas naviguer pendant le boot (navigateur peut être en cours d’init)
    if (status === 401 && !isAuthCall) {
      const { phase } = useAuth.getState();
      if (phase === 'authenticated') {
        await useAuth.getState().clearSession();
        // Différer pour éviter "navigate before Root Layout"
        setTimeout(() => {
          try {
            router.replace('/');
          } catch {
            /* ignore */
          }
        }, 0);
      }
    }
    return Promise.reject(err);
  },
);

/** Message d’erreur lisible pour l’écran de connexion. */
export function getLoginErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return 'اسم المستخدم أو كلمة المرور غير صحيحة';
  }

  if (!err.response) {
    if (err.code === 'ECONNABORTED') {
      return 'انتهت مهلة الاتصال بالخادم';
    }
    return `تعذر الاتصال بالخادم\n${API_URL}`;
  }

  if (err.response.status === 401 || err.response.status === 403) {
    return 'اسم المستخدم أو كلمة المرور غير صحيحة';
  }

  return `خطأ من الخادم (${err.response.status})`;
}

export function formatNum(n: number) {
  return new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: 1 }).format(n);
}
