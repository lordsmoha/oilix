const DEFAULT_API = 'http://localhost:3001/api/v1';
const DEFAULT_API_PORT = '3001';

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

function stripApiSuffix(url: string): string {
  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

/**
 * Candidate Socket.IO origins (no /realtime suffix).
 * Tries page origin (Nginx) and direct API :3001 so realtime works even when
 * `/socket.io/` is not proxied to Nest.
 */
export function resolveRealtimeOriginCandidates(): string[] {
  const explicit = process.env.NEXT_PUBLIC_REALTIME_URL?.trim();
  if (explicit) return [explicit.replace(/\/$/, '')];

  if (typeof window === 'undefined') {
    const configured = normalizeApiUrl(
      process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API,
    );
    if (configured.startsWith('/')) return [];
    return [stripApiSuffix(configured)];
  }

  const { protocol, hostname, port, origin } = window.location;
  const configured = normalizeApiUrl(
    process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API,
  );
  const out: string[] = [];
  const add = (value: string) => {
    const v = value.replace(/\/$/, '');
    if (v && !out.includes(v)) out.push(v);
  };

  // 1) Absolute API host from env (e.g. http://192.168.1.249:3001)
  if (!configured.startsWith('/')) {
    try {
      add(new URL(configured).origin);
    } catch {
      add(stripApiSuffix(configured));
    }
  }

  // 2) Direct API port on current host — Nest serves /realtime here
  add(`${protocol}//${hostname}:${DEFAULT_API_PORT}`);

  // 3) Same origin (Nginx / Next rewrite) — only when not on bare Next :3000
  //    Next itself does not speak Socket.IO unless rewritten.
  if (port !== '3000') {
    add(origin);
  }

  // 4) Localhost API when browsing localhost Next
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    add(`http://127.0.0.1:${DEFAULT_API_PORT}`);
    add(`http://localhost:${DEFAULT_API_PORT}`);
  }

  return out;
}

/** Primary realtime origin (first candidate). */
export function resolveRealtimeOrigin(): string {
  const list = resolveRealtimeOriginCandidates();
  if (list.length) return list[0];
  if (typeof window !== 'undefined') return window.location.origin;
  return stripApiSuffix(DEFAULT_API);
}
