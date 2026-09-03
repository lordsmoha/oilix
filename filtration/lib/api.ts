import axios from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAuth } from './auth';

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const fromExtra = (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, '');
  return 'http://192.168.1.249/api/v1';
}

export const API_URL = resolveApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-client-source': 'mobile',
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
    if (status === 401 && !url.includes('/auth/login')) {
      await useAuth.getState().clearSession();
      router.replace('/');
    }
    return Promise.reject(err);
  },
);

export function getLoginErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'اسم المستخدم أو كلمة المرور غير صحيحة';
  if (!err.response) return `تعذر الاتصال بالخادم\n${API_URL}`;
  if (err.response.status === 401 || err.response.status === 403) {
    return 'اسم المستخدم أو كلمة المرور غير صحيحة';
  }
  return `خطأ من الخادم (${err.response.status})`;
}

export function formatNum(n: number) {
  return new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: 2 }).format(n);
}

export type FiltrationRecord = {
  id: string;
  oliveType: 'GREEN' | 'ZBOUCH' | 'RIPE' | string;
  referenceNumber: number;
  zayatName: string;
  region: string;
  quantityL: string | number;
  khallaf: string | number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { username: string; firstName?: string | null };
  updatedBy?: { username: string; firstName?: string | null } | null;
};
