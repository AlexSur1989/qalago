import { describe, expect, it } from 'vitest';
import {
  REFRESH_COOKIE_NAME as ADMIN_COOKIE,
  persistRefreshToken as persistAdmin,
  type AuthCookieJar,
} from './auth-cookie';
import {
  REFRESH_COOKIE_NAME as BUSINESS_COOKIE,
  persistRefreshToken as persistBusiness,
} from '../../business-web/lib/auth-cookie';

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

describe('admin/business session isolation (BIZ.9 HOTFIX 7B)', () => {
  it('admin and business cookies coexist in separate jars', () => {
    const adminJar = createJar();
    const businessJar = createJar();
    persistAdmin(adminJar, 'token-admin', false);
    persistBusiness(businessJar, 'token-business', false);
    expect(adminJar.get(ADMIN_COOKIE)?.value).toBe('token-admin');
    expect(businessJar.get(BUSINESS_COOKIE)?.value).toBe('token-business');
    expect(adminJar.get(BUSINESS_COOKIE)).toBeUndefined();
    expect(businessJar.get(ADMIN_COOKIE)).toBeUndefined();
  });

  it('business login does not overwrite admin cookie in admin jar', () => {
    const adminJar = createJar();
    persistAdmin(adminJar, 'token-admin', false);
    expect(adminJar.get(ADMIN_COOKIE)?.value).toBe('token-admin');
  });
});
