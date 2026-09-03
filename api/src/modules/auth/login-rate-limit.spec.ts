import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  assertNotRateLimited,
  clearLoginAttempts,
  loginAttemptKey,
  recordFailedLogin,
  type AttemptBucket,
} from './login-rate-limit';

describe('login rate limit', () => {
  let store: Map<string, AttemptBucket>;

  beforeEach(() => {
    store = new Map();
  });

  it('keys by ip + normalized username', () => {
    expect(loginAttemptKey('Admin', '1.2.3.4')).toBe('1.2.3.4::admin');
    expect(loginAttemptKey('  X  ', undefined)).toBe('unknown::x');
  });

  it('allows attempts under the max', () => {
    const key = loginAttemptKey('u', 'ip');
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS - 1; i++) {
      recordFailedLogin(store, key, 1_000);
      expect(() => assertNotRateLimited(store, key, 1_000)).not.toThrow();
    }
  });

  it('blocks at max attempts within the window', () => {
    const key = loginAttemptKey('u', 'ip');
    const t0 = 10_000;
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      recordFailedLogin(store, key, t0);
    }
    expect(() => assertNotRateLimited(store, key, t0 + 1)).toThrow('LOGIN_RATE_LIMITED');
  });

  it('resets after the window expires', () => {
    const key = loginAttemptKey('u', 'ip');
    const t0 = 10_000;
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      recordFailedLogin(store, key, t0);
    }
    expect(() =>
      assertNotRateLimited(store, key, t0 + LOGIN_WINDOW_MS + 1),
    ).not.toThrow();
  });

  it('clears on successful login', () => {
    const key = loginAttemptKey('u', 'ip');
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      recordFailedLogin(store, key, 1_000);
    }
    clearLoginAttempts(store, key);
    expect(() => assertNotRateLimited(store, key, 1_000)).not.toThrow();
  });
});
