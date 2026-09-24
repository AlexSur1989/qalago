import { MonetizationProductType } from '@prisma/client';
import { resolveCampaignMarketCityId } from './campaign-market-city.util';

describe('resolveCampaignMarketCityId (A.9.4.1B)', () => {
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
        parentBusinessCityId: cityA,
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
        parentBusinessCityId: cityA,
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
        parentBusinessCityId: cityA,
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
        parentBusinessCityId: cityA,
        explicitCityId: cityB,
      }),
    ).rejects.toMatchObject({ response: { code: 'INVALID_CAMPAIGN_BRANCH' } });
  });

  it('falls back to parent Business.cityId when no locations', async () => {
    const prisma = db({ locations: [] });
    await expect(
      resolveCampaignMarketCityId(prisma as never, {
        businessId,
        parentBusinessCityId: cityA,
      }),
    ).resolves.toBe(cityA);
  });
});
