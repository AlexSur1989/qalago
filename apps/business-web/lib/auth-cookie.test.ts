import { describe, expect, it } from 'vitest';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  persistRefreshToken,
  clearAppRefreshCookie,
  type AuthCookieJar,
} from './auth-cookie';

function createJar(): AuthCookieJar {
  const store = new Map<string, string>();
  const key = (name: string, path: string) => `${name}@${path}`;
  return {
    get(name) {
      for (const [k, v] of store) {
        if (k.startsWith(`${name}@`)) return { value: v };
      }
      return undefined;
    },
    set(name, value, options) {
      store.set(key(name, String(options.path ?? '/')), value);
    },
    delete(options) {
      store.delete(key(options.name, options.path));
    },
  };
}

describe('business auth-cookie (BIZ.9 HOTFIX 7B)', () => {
  it('uses scoped business cookie name and path', () => {
    expect(REFRESH_COOKIE_NAME).toBe('qalago_business_refresh');
    expect(REFRESH_COOKIE_PATH).toBe('/api/auth/business');
  });

  it('persistRefreshToken sets business cookie only', () => {
    const jar = createJar();
    persistRefreshToken(jar, 'biz-token', false);
    expect(jar.get(REFRESH_COOKIE_NAME)?.value).toBe('biz-token');
  });

  it('clearAppRefreshCookie removes business cookie with path', () => {
    const jar = createJar();
    persistRefreshToken(jar, 'biz-token', false);
    clearAppRefreshCookie(jar);
    expect(jar.get(REFRESH_COOKIE_NAME)).toBeUndefined();
  });
});
