import Constants from 'expo-constants';

export const CLIENT_SOURCE_HEADER = 'x-client-source';
export const MOBILE_SOURCE = 'mobile';

export function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const fromExtra = (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, '');

  return 'http://192.168.1.249/api/v1';
}

export const API_URL = resolveApiUrl();
