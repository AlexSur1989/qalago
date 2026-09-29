import { describe, expect, it } from 'vitest';
import { hasBusinessCabinetAccess } from './business-cabinet-access';

const ownerItem = {
  business: { id: 'b1', title: 'Cafe', status: 'ACTIVE', address: 'A' },
  access: { role: 'OWNER' as const, permissions: [] },
};

describe('hasBusinessCabinetAccess (BIZ.2)', () => {
  it('denies when no user', () => {
    expect(hasBusinessCabinetAccess(null, [ownerItem])).toBe(false);
  });

  it('denies ADMIN with zero businesses', () => {
    expect(
      hasBusinessCabinetAccess({ id: 'a1', role: 'ADMIN', name: null, phone: null }, []),
    ).toBe(false);
  });

  it('denies CITY_ADMIN with zero businesses', () => {
    expect(
      hasBusinessCabinetAccess(
        { id: 'c1', role: 'CITY_ADMIN', name: null, phone: null },
        [],
      ),
    ).toBe(false);
  });

  it('denies SUPER_ADMIN with zero businesses', () => {
    expect(
      hasBusinessCabinetAccess(
        { id: 's1', role: 'SUPER_ADMIN', name: null, phone: null },
        [],
      ),
    ).toBe(false);
  });

  it('denies legacy BUSINESS role with zero businesses', () => {
    expect(
      hasBusinessCabinetAccess({ id: 'b1', role: 'BUSINESS', name: null, phone: null }, []),
    ).toBe(false);
  });

  it('allows USER with OWNER membership item', () => {
    expect(
      hasBusinessCabinetAccess({ id: 'u1', role: 'USER', name: null, phone: null }, [ownerItem]),
    ).toBe(true);
  });

  it('allows MANAGER with membership item', () => {
    expect(
      hasBusinessCabinetAccess(
        { id: 'm1', role: 'USER', name: null, phone: null },
        [{ ...ownerItem, access: { role: 'MANAGER', permissions: ['CATALOG_EDIT'] } }],
      ),
    ).toBe(true);
  });
});
