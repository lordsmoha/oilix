import axios from 'axios';
import { useAuthStore } from '@/lib/auth-store';
import { useSeasonStore } from '@/lib/season-store';
import { getOrCreateInstallationId, suggestedDeviceName } from '@/lib/device-id';
import { useWorkspaceStore } from '@/lib/workspace-store';
import { resolveApiBaseUrl } from '@/lib/api-url';

export const VIEW_SEASON_HEADER = 'x-view-season-id';

export const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/access-denied')
  );
}

function clearClientAuth() {
  localStorage.removeItem('oilix_token');
  localStorage.removeItem('oilix_user');
  // Keep Zustand persist in sync — clearing only oilix_token caused an infinite
  // reload loop (store still had token → notifications refetch → 401 → reload).
  useAuthStore.setState({ token: null, user: null });
}

let handlingUnauthorized = false;

api.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseUrl();
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token ?? localStorage.getItem('oilix_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const viewSeasonId = useSeasonStore.getState().viewSeasonId;
    if (viewSeasonId) {
      config.headers[VIEW_SEASON_HEADER] = viewSeasonId;
    } else if (config.headers[VIEW_SEASON_HEADER]) {
      delete config.headers[VIEW_SEASON_HEADER];
    }

    const installationId = getOrCreateInstallationId();
    if (installationId) {
      config.headers['X-Device-Installation-Id'] = installationId;
      config.headers['X-Device-Name'] = suggestedDeviceName();
    }
    const workspace = useWorkspaceStore.getState().workspace;
    if (workspace) config.headers['X-Oilix-Workspace'] = workspace;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Never hard-reload on public pages — that caused a Turbopack ChunkLoadError storm.
      if (!handlingUnauthorized && !isPublicPath(path)) {
        handlingUnauthorized = true;
        clearClientAuth();
        window.location.replace('/');
      } else if (!handlingUnauthorized) {
        clearClientAuth();
      }
    }
    if (err.response?.status === 403 && typeof window !== 'undefined') {
      const msg = err.response?.data?.message;
      if (typeof msg === 'string') {
        import('sonner').then(({ toast }) => toast.error(msg));
      }
    }
    return Promise.reject(err);
  },
);

export type Paginated<T> = {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};
