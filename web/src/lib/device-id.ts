const KEY = 'oilix_device_installation_id';

/** Works on HTTP LAN (crypto.randomUUID needs secure context / HTTPS). */
function createId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `oilix-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateInstallationId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = createId();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function suggestedDeviceName(): string {
  if (typeof window === 'undefined') return 'Oilix';
  const host = window.location.hostname || 'Oilix';
  return `Oilix · ${host}`.slice(0, 80);
}
