import { describe, expect, it } from 'vitest';
import {
  LEGACY_REFRESH_COOKIE_NAME,
  LEGACY_REFRESH_COOKIE_PATH,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  clearAppRefreshCookie,
  clearLegacyRefreshCookie,
  persistRefreshToken,
  type AuthCookieJar,
} from './auth-cookie';

function createJar(): AuthCookieJar & { dump: () => Map<string, string> } {
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
      const path = String(options.path ?? '/');
      store.set(key(name, path), value);
    },
    delete(options) {
      store.delete(key(options.name, options.path));
    },
    dump: () => store,
  };
}

describe('admin auth-cookie (BIZ.9 HOTFIX 7B)', () => {
  it('uses scoped admin cookie name and path', () => {
    expect(REFRESH_COOKIE_NAME).toBe('qalago_admin_refresh');
    expect(REFRESH_COOKIE_PATH).toBe('/api/auth/admin');
  });

  it('persistRefreshToken sets admin cookie and clears legacy', () => {
    const jar = createJar();
    jar.set(LEGACY_REFRESH_COOKIE_NAME, 'legacy', { path: LEGACY_REFRESH_COOKIE_PATH });
    persistRefreshToken(jar, 'admin-token', false);
    expect(jar.get(REFRESH_COOKIE_NAME)?.value).toBe('admin-token');
    expect(jar.get(LEGACY_REFRESH_COOKIE_NAME)).toBeUndefined();
  });

  it('clearAppRefreshCookie deletes with explicit path', () => {
    const jar = createJar();
    persistRefreshToken(jar, 't1', false);
    clearAppRefreshCookie(jar);
    expect(jar.get(REFRESH_COOKIE_NAME)).toBeUndefined();
  });
});
