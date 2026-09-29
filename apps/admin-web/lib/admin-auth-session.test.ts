import { describe, expect, it, vi } from 'vitest';
import { loadCanonicalAdminUser, normalizeAdminAuthUser } from './admin-auth-session';

describe('admin-auth-session (AOP.7H.3)', () => {
  it('normalizeAdminAuthUser copies managedCity.id to managedCityId once', () => {
    const raw = {
      id: 'u1',
      name: 'CA',
      role: 'CITY_ADMIN',
      managedCity: { id: 'city-uralsk', slug: 'uralsk', nameRu: 'Uralsk' },
    };
    const n = normalizeAdminAuthUser(raw);
    expect(n.managedCityId).toBe('city-uralsk');
    expect(n.managedCity?.slug).toBe('uralsk');
  });

  it('loadCanonicalAdminUser returns enriched CITY_ADMIN from getMe', async () => {
    const getMe = vi.fn().mockResolvedValue({
      id: 'u1',
      name: 'Uralsk CA',
      role: 'CITY_ADMIN',
      managedCity: { id: 'cmpn1wnp90000ult89ngnv1ym', slug: 'uralsk', nameRu: 'Uralsk' },
    });
    const result = await loadCanonicalAdminUser('tok', getMe);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.managedCityId).toBe('cmpn1wnp90000ult89ngnv1ym');
      expect(getMe).toHaveBeenCalledWith('tok');
    }
  });

  it('loadCanonicalAdminUser succeeds for ADMIN without managedCity', async () => {
    const getMe = vi.fn().mockResolvedValue({
      id: 'a1',
      name: 'Admin',
      role: 'ADMIN',
    });
    const result = await loadCanonicalAdminUser('tok', getMe);
    expect(result.ok).toBe(true);
  });

  it('loadCanonicalAdminUser succeeds for SUPER_ADMIN without managedCity', async () => {
    const getMe = vi.fn().mockResolvedValue({
      id: 's1',
      name: 'Super',
      role: 'SUPER_ADMIN',
    });
    const result = await loadCanonicalAdminUser('tok', getMe);
    expect(result.ok).toBe(true);
  });

  it('loadCanonicalAdminUser rejects non-admin role from getMe', async () => {
    const getMe = vi.fn().mockResolvedValue({
      id: 'x',
      name: 'User',
      role: 'USER',
    });
    const result = await loadCanonicalAdminUser('tok', getMe);
    expect(result).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('loadCanonicalAdminUser fails closed when getMe fails', async () => {
    const getMe = vi.fn().mockRejectedValue(new Error('401'));
    const result = await loadCanonicalAdminUser('tok', getMe);
    expect(result).toEqual({ ok: false, reason: 'me_failed' });
  });
});
