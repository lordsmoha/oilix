const KEY = 'oilix_device_installation_id';

export function getOrCreateInstallationId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function suggestedDeviceName(): string {
  if (typeof window === 'undefined') return 'Oilix';
  const host = window.location.hostname || 'Oilix';
  return `Oilix · ${host}`.slice(0, 80);
}
