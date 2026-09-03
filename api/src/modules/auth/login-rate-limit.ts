/**
 * In-memory login attempt limiter (per process).
 * Key = `${ip}::${username}` — extractable for unit tests without Nest DI.
 */

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 8;

export type AttemptBucket = { count: number; resetAt: number };

export function loginAttemptKey(username: string, ip?: string) {
  return `${(ip || 'unknown').trim()}::${username.trim().toLowerCase()}`;
}

export function assertNotRateLimited(
  store: Map<string, AttemptBucket>,
  key: string,
  now = Date.now(),
): void {
  const bucket = store.get(key);
  if (!bucket) return;
  if (now > bucket.resetAt) {
    store.delete(key);
    return;
  }
  if (bucket.count >= LOGIN_MAX_ATTEMPTS) {
    const err = new Error('LOGIN_RATE_LIMITED');
    (err as Error & { status: number }).status = 429;
    throw err;
  }
}

export function recordFailedLogin(
  store: Map<string, AttemptBucket>,
  key: string,
  now = Date.now(),
  windowMs = LOGIN_WINDOW_MS,
): void {
  const bucket = store.get(key);
  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

export function clearLoginAttempts(store: Map<string, AttemptBucket>, key: string): void {
  store.delete(key);
}
