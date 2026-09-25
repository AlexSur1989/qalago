import { BusinessStatus } from '@prisma/client';
import {
  assertVisibilitySyncBusinessUpdateData,
  FORBIDDEN_VISIBILITY_SYNC_BUSINESS_GEO_KEYS,
  planVisibilitySyncUpdates,
} from './sync-businesses-visibility.util';

describe('sync-businesses-visibility (A.9.4.4A)', () => {
  const city = { id: 'city-1', slug: 'uralsk', nameRu: 'Уральск' };
  const cityById = new Map([[city.id, city]]);

  it('plans status activation only for non-ACTIVE businesses', () => {
    const plan = planVisibilitySyncUpdates(
      [
        {
          id: 'b1',
          title: 'Active Biz',
          slug: 'active',
          status: BusinessStatus.ACTIVE,
          cityId: city.id,
        },
        {
          id: 'b2',
          title: 'Pending Biz',
          slug: 'pending',
          status: BusinessStatus.PENDING,
          cityId: city.id,
        },
      ],
      cityById,
    );

    expect(plan.activated).toBe(1);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0]!.businessId).toBe('b2');
    expect(plan.updates[0]!.data).toEqual({ status: BusinessStatus.ACTIVE });
  });

  it('does not plan geo fields when business would have been geocoded under legacy script', () => {
    const plan = planVisibilitySyncUpdates(
      [
        {
          id: 'b-null-coords',
          title: 'No coords legacy row',
          slug: 'no-coords',
          status: BusinessStatus.PENDING,
          cityId: city.id,
        },
      ],
      cityById,
    );

    expect(plan.updates).toHaveLength(1);
    const data = plan.updates[0]!.data;
    for (const key of FORBIDDEN_VISIBILITY_SYNC_BUSINESS_GEO_KEYS) {
      expect(data).not.toHaveProperty(key);
    }
    assertVisibilitySyncBusinessUpdateData(data);
  });

  it('assertVisibilitySyncBusinessUpdateData rejects geo writes', () => {
    expect(() =>
      assertVisibilitySyncBusinessUpdateData({
        status: BusinessStatus.ACTIVE,
        latitude: 51.2,
      }),
    ).toThrow(/must not write Business\.latitude/);

    expect(() =>
      assertVisibilitySyncBusinessUpdateData({
        longitude: 51.3,
      }),
    ).toThrow(/must not write Business\.longitude/);
  });

  it('skips businesses with unknown cityId', () => {
    const plan = planVisibilitySyncUpdates(
      [
        {
          id: 'b-x',
          title: 'X',
          slug: 'orphan',
          status: BusinessStatus.PENDING,
          cityId: 'missing-city',
        },
      ],
      cityById,
    );

    expect(plan.updates).toHaveLength(0);
    expect(plan.skippedUnknownCitySlugs).toEqual(['orphan']);
  });
});
