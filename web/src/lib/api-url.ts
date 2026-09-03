const DEFAULT_API = 'http://localhost:3001/api/v1';

function isLocalDev(hostname: string, port: string): boolean {
  return (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    (port === '3000' || port === '')
  );
}

/**
 * Normalize NEXT_PUBLIC_API_URL from common misconfigurations.
 * e.g. "192.168.1.249/api/v1" (missing scheme) → "http://192.168.1.249/api/v1"
 */
export function normalizeApiUrl(raw: string): string {
  const value = raw.trim().replace(/\/$/, '');
  if (!value) return DEFAULT_API;

  // Already relative (Nginx same-origin) — preferred
  if (value.startsWith('/')) return value || '/api/v1';

  // Missing scheme: "192.168.1.249/api/v1" or "192.168.1.249:3001/api/v1"
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return `http://${value}`;
  }

  return value;
}

/**
 * Resolve API base URL for the current runtime.
 *
 * - Local dev (Next :3000 → API :3001): absolute URL from env.
 * - LAN / production behind Nginx on the same host: relative `/api/v1`
 *   (same-origin — no CORS, works even if env was built with localhost).
 */
export function resolveApiBaseUrl(): string {
  const configured = normalizeApiUrl(
    process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API,
  );

  if (typeof window === 'undefined') return configured;

  // Relative path works everywhere on the same host
  if (configured.startsWith('/')) return configured;

  const { hostname, port, origin } = window.location;

  if (isLocalDev(hostname, port)) return configured;

  try {
    const apiUrl = new URL(configured, origin);
    // Same host behind reverse proxy → relative path avoids CORS entirely
    if (apiUrl.hostname === hostname) {
      const path = apiUrl.pathname.replace(/\/$/, '') || '/api/v1';
      return path;
    }
    // Env still points at localhost but page is opened via LAN IP
    if (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1') {
      return '/api/v1';
    }
  } catch {
    return configured;
  }

  return configured;
}

/** Realtime/socket origin (no /api/v1 suffix). */
export function resolveRealtimeOrigin(): string {
  const base = resolveApiBaseUrl();
  if (base.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return base.replace(/\/api\/v1\/?$/, '');
}
