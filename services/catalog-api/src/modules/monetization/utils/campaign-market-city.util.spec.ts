import { MonetizationProductType } from '@prisma/client';
import {
  resolveCampaignMarketCityId,
  resolvePersistedOrderItemMarketCityId,
} from './campaign-market-city.util';

describe('resolveCampaignMarketCityId (A.9.4.1B / A.9.4.5B)', () => {
  const businessId = 'biz-cross';
  const cityA = 'city-a';
  const cityB = 'city-b';

  function db(overrides: {
    locations?: Array<{ id: string; businessId: string; cityId: string; isPrimary?: boolean; createdAt?: Date }>;
  }) {
    const rows = overrides.locations ?? [];
    return {
      businessLocation: {
        findFirst: jest.fn(async ({ where }: { where: { id?: string; businessId?: string; cityId?: string | { in: string[] } } }) => {
          if (where.id && where.businessId) {
            return rows.find((r) => r.id === where.id && r.businessId === where.businessId) ?? null;
          }
          if (where.businessId && where.cityId && typeof where.cityId === 'string') {
            return rows.find((r) => r.businessId === where.businessId && r.cityId === where.cityId) ?? null;
          }
          return null;
        }),
        findMany: jest.fn(async ({ where }: { where: { businessId: string } }) =>
          rows.filter((r) => r.businessId === where.businessId),
        ),
      },
    };
  }

  it('uses target BusinessLocation city (L2 → City B)', async () => {
    const prisma = db({
      locations: [
        { id: 'l1', businessId, cityId: cityA, isPrimary: true, createdAt: new Date(1) },
        { id: 'l2', businessId, cityId: cityB, isPrimary: false, createdAt: new Date(2) },
      ],
    });
    await expect(
      resolveCampaignMarketCityId(prisma as never, {
        businessId,
        targetBusinessLocationId: 'l2',
      }),
    ).resolves.toBe(cityB);
  });

  it('defaults to primary BL city when no explicit target', async () => {
    const prisma = db({
      locations: [
        { id: 'l1', businessId, cityId: cityA, isPrimary: true, createdAt: new Date(1) },
        { id: 'l2', businessId, cityId: cityB, isPrimary: false, createdAt: new Date(2) },
      ],
    });
    await expect(
      resolveCampaignMarketCityId(prisma as never, {
        businessId,
      }),
    ).resolves.toBe(cityA);
  });

  it('validates explicit city against branch presence', async () => {
    const prisma = db({
      locations: [{ id: 'l2', businessId, cityId: cityB, isPrimary: false, createdAt: new Date(1) }],
    });
    await expect(
      resolveCampaignMarketCityId(prisma as never, {
        businessId,
        explicitCityId: cityB,
      }),
    ).resolves.toBe(cityB);
  });

  it('rejects explicit city without eligible branch', async () => {
    const prisma = db({
      locations: [{ id: 'l1', businessId, cityId: cityA, isPrimary: true, createdAt: new Date(1) }],
    });
    await expect(
      resolveCampaignMarketCityId(prisma as never, {
        businessId,
        explicitCityId: cityB,
      }),
    ).rejects.toMatchObject({ response: { code: 'INVALID_CAMPAIGN_BRANCH' } });
  });

  it('fail-closed when no locations and no explicit city (no Business.cityId fallback)', async () => {
    const prisma = db({ locations: [] });
    await expect(
      resolveCampaignMarketCityId(prisma as never, {
        businessId,
      }),
    ).rejects.toMatchObject({ response: { code: 'CAMPAIGN_MARKET_CITY_UNRESOLVED' } });
  });

  it('resolvePersistedOrderItemMarketCityId uses persisted campaignCityId after primary promotion', async () => {
    const prisma = db({
      locations: [
        { id: 'l1', businessId, cityId: cityA, isPrimary: false, createdAt: new Date(1) },
        { id: 'l2', businessId, cityId: cityB, isPrimary: true, createdAt: new Date(2) },
      ],
    });
    await expect(
      resolvePersistedOrderItemMarketCityId(prisma as never, businessId, {
        campaignCityId: cityA,
        productType: MonetizationProductType.FEATURED_BUSINESS,
      }),
    ).resolves.toBe(cityA);
  });

  it('after promotion, new resolve without metadata follows new primary BL', async () => {
    const prisma = db({
      locations: [
        { id: 'l1', businessId, cityId: cityA, isPrimary: false, createdAt: new Date(1) },
        { id: 'l2', businessId, cityId: cityB, isPrimary: true, createdAt: new Date(2) },
      ],
    });
    await expect(
      resolveCampaignMarketCityId(prisma as never, { businessId }),
    ).resolves.toBe(cityB);
  });
});
