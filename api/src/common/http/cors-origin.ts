/**
 * CORS / Socket.IO origin allowlist for Oilix (LAN mill deployments).
 * Allows configured origins plus common private-network browser origins
 * so WebSocket does not stay red when CORS_ORIGIN omits a port variant.
 */

function isPrivateHostname(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  ) {
    return true;
  }
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function listConfiguredCorsOrigins(): string[] {
  return (
    process.env.CORS_ORIGIN?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? []
  );
}

export function defaultDevCorsOrigins(): string[] {
  const host = process.env.PUBLIC_HOST?.trim() || '192.168.1.249';
  return [
    'http://localhost:3000',
    'http://localhost:8081',
    'exp://localhost:8081',
    `http://${host}`,
    `http://${host}:3000`,
    `http://${host}:8081`,
    `exp://${host}:8081`,
  ];
}

/** Nest enableCors / Socket.IO cors `origin` option. */
export function corsOriginOption():
  | boolean
  | string[]
  | ((
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void) {
  const configured = listConfiguredCorsOrigins();
  const allowAll = configured.includes('*');
  const extras = defaultDevCorsOrigins();
  const allowed = new Set(
    allowAll ? [] : [...configured, ...(configured.length ? extras : extras)],
  );

  return (origin, callback) => {
    // Same-origin / native / server-to-server
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowAll) {
      callback(null, true);
      return;
    }
    if (allowed.has(origin)) {
      callback(null, true);
      return;
    }
    try {
      const { hostname } = new URL(origin);
      // LAN mills: allow any private-network browser origin
      if (isPrivateHostname(hostname)) {
        callback(null, true);
        return;
      }
    } catch {
      /* ignore */
    }
    callback(null, false);
  };
}
