import { MonetizationProductType } from '@prisma/client';
import {
  batchResolveAdServeLocationContexts,
  overlayBusinessCardWithLocation,
  resolveAdDestinationLocationId,
} from './ad-serving-location.util';

describe('ad-serving-location.util', () => {
  const serveCity = 'city-c1';
  const businessId = 'biz-1';

  const l1 = {
    id: 'loc-l1',
    businessId,
    cityId: serveCity,
    address: 'Branch L1',
    latitude: null,
    longitude: null,
    phone: '+1',
    whatsapp: null,
    instagram: null,
    website: null,
    workHours: null,
    isPrimary: true,
    createdAt: new Date('2026-01-02'),
  };
  const l2 = {
    ...l1,
    id: 'loc-l2',
    address: 'Branch L2',
    isPrimary: false,
    createdAt: new Date('2026-01-03'),
  };
  const lOtherCity = {
    ...l1,
    id: 'loc-astana',
    cityId: 'city-c2',
    address: 'Astana only',
  };

  const locationById = new Map([
    [l1.id, l1],
    [l2.id, l2],
    [lOtherCity.id, lOtherCity],
  ]);
  const cityContext = new Map([[businessId, l1.id]]);

  it('resolveAdDestinationLocationId — explicit destination wins', () => {
    const id = resolveAdDestinationLocationId({
      campaign: {
        id: 'c1',
        businessId,
        cityId: serveCity,
        targetBusinessLocationId: null,
        destinationBusinessLocationId: l2.id,
        promotionId: null,
        productType: MonetizationProductType.FEATURED_BUSINESS,
      },
      serveCityId: serveCity,
      locationById,
      cityContextByBusinessId: cityContext,
      promotion: null,
    });
    expect(id).toBe(l2.id);
  });

  it('resolveAdDestinationLocationId — target used when destination null', () => {
    const id = resolveAdDestinationLocationId({
      campaign: {
        id: 'c1',
        businessId,
        cityId: serveCity,
        targetBusinessLocationId: l1.id,
        destinationBusinessLocationId: null,
        promotionId: null,
        productType: MonetizationProductType.FEATURED_BUSINESS,
      },
      serveCityId: serveCity,
      locationById,
      cityContextByBusinessId: cityContext,
      promotion: null,
    });
    expect(id).toBe(l1.id);
  });

  it('resolveAdDestinationLocationId — brand-level uses city context', () => {
    const id = resolveAdDestinationLocationId({
      campaign: {
        id: 'c1',
        businessId,
        cityId: serveCity,
        targetBusinessLocationId: null,
        destinationBusinessLocationId: null,
        promotionId: null,
        productType: MonetizationProductType.FEATURED_BUSINESS,
      },
      serveCityId: serveCity,
      locationById,
      cityContextByBusinessId: cityContext,
      promotion: null,
    });
    expect(id).toBe(l1.id);
  });

  it('overlayBusinessCardWithLocation — applies branch physical fields', () => {
    const business = {
      id: businessId,
      title: 'Biz',
      slug: 'biz',
      cityId: serveCity,
      address: 'Legacy HQ',
      latitude: null,
      longitude: null,
      phone: 'legacy',
      whatsapp: null,
      instagram: null,
      website: null,
      workHours: null,
    };
    const out = overlayBusinessCardWithLocation(business, l2);
    expect(out.address).toBe('Branch L2');
    expect(out.phone).toBe('+1');
  });

  it('batchResolve — excludes targeted branch in wrong serve city', async () => {
    const prisma = {
      businessLocation: {
        findMany: jest.fn().mockResolvedValue([l1]),
      },
      promotion: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const map = await batchResolveAdServeLocationContexts(prisma as never, serveCity, [
      {
        id: 'camp-target',
        businessId,
        cityId: serveCity,
        targetBusinessLocationId: lOtherCity.id,
        destinationBusinessLocationId: null,
        promotionId: null,
        productType: MonetizationProductType.FEATURED_BUSINESS,
      },
    ]);
    expect(map.get('camp-target')).toEqual({ excluded: true });
  });
});
