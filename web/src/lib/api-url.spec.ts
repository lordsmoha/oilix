import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';
import {
  normalizeApiUrl,
  resolveApiBaseUrl,
  resolveRealtimeOrigin,
} from './api-url.ts';

describe('normalizeApiUrl', () => {
  it('keeps relative /api/v1', () => {
    assert.equal(normalizeApiUrl('/api/v1'), '/api/v1');
  });

  it('adds http:// when scheme is missing (common deploy mistake)', () => {
    assert.equal(
      normalizeApiUrl('192.168.1.249/api/v1'),
      'http://192.168.1.249/api/v1',
    );
  });

  it('keeps full http URL', () => {
    assert.equal(
      normalizeApiUrl('http://192.168.1.249/api/v1'),
      'http://192.168.1.249/api/v1',
    );
  });
});

describe('resolveApiBaseUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  function mockLocation(hostname: string, port = '', protocol = 'http:') {
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          hostname,
          port,
          origin: `${protocol}//${hostname}${port ? `:${port}` : ''}`,
        },
      },
      writable: true,
      configurable: true,
    });
  }

  it('uses configured URL on localhost dev', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
    mockLocation('localhost', '3000');
    assert.equal(resolveApiBaseUrl(), 'http://localhost:3001/api/v1');
  });

  it('uses relative /api/v1 on LAN when env matches host (Nginx)', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://192.168.1.249/api/v1';
    mockLocation('192.168.1.249');
    assert.equal(resolveApiBaseUrl(), '/api/v1');
  });

  it('normalizes bare host env then uses relative /api/v1 on LAN', () => {
    process.env.NEXT_PUBLIC_API_URL = '192.168.1.249/api/v1';
    mockLocation('192.168.1.249');
    assert.equal(resolveApiBaseUrl(), '/api/v1');
  });

  it('uses relative /api/v1 when env is localhost but page is LAN', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
    mockLocation('192.168.1.249');
    assert.equal(resolveApiBaseUrl(), '/api/v1');
  });

  it('prefers relative env as-is', () => {
    process.env.NEXT_PUBLIC_API_URL = '/api/v1';
    mockLocation('192.168.1.249');
    assert.equal(resolveApiBaseUrl(), '/api/v1');
  });

  it('resolves realtime origin from relative api base', () => {
    process.env.NEXT_PUBLIC_API_URL = '/api/v1';
    mockLocation('192.168.1.249');
    assert.equal(resolveRealtimeOrigin(), 'http://192.168.1.249');
  });
});
