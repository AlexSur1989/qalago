import { Decimal } from '@prisma/client/runtime/library';
import { deterministicPrimaryLocationId } from './business-primary-location.util';
import {
  BusinessLocationSeedInvariantError,
  upsertSeedBusinessWithPrimaryMirrorInTx,
} from './business-primary-location-aggregate.util';

describe('business-primary-location-aggregate.util (Stage 6.12A.9.4.3C)', () => {
  const primaryPhysical = {
    cityId: 'city-1',
    address: 'Seed addr 1',
    latitude: new Decimal(51.2278),
    longitude: new Decimal(51.3865),
    locationSource: null,
    workHours: null,
    phone: '+77001112233',
    whatsapp: null,
    instagram: null,
    website: null,
  };

  function buildTx(state: {
    business?: { id: string; slug: string };
    primaries: Array<{ id: string; businessId: string; isPrimary: boolean }>;
  }) {
    const businessId = state.business?.id ?? 'biz-seed-1';
    const primaryId = deterministicPrimaryLocationId(businessId);

    return {
      business: {
        upsert: jest.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
          if (!state.business) {
            state.business = { id: businessId, slug: create.slug as string };
            return { id: businessId, slug: create.slug, ...create };
          }
          return { id: businessId, slug: state.business.slug, ...update };
        }),
        update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const cityConnect = data.city as { connect?: { id?: string } } | undefined;
          return {
            id: businessId,
            slug: state.business!.slug,
            cityId: cityConnect?.connect?.id ?? primaryPhysical.cityId,
            address: data.address ?? primaryPhysical.address,
            latitude: data.latitude ?? primaryPhysical.latitude,
            longitude: data.longitude ?? primaryPhysical.longitude,
            locationSource: data.locationSource ?? null,
          };
        }),
      },
      businessLocation: {
        findMany: jest.fn(async () =>
          state.primaries.map((p) => ({
            ...p,
            cityId: primaryPhysical.cityId,
            address: primaryPhysical.address,
            latitude: primaryPhysical.latitude,
            longitude: primaryPhysical.longitude,
            locationSource: null,
            workHours: null,
            phone: primaryPhysical.phone,
            whatsapp: null,
            instagram: null,
            website: null,
          })),
        ),
        create: jest.fn(async () => {
          const row = {
            id: primaryId,
            businessId,
            isPrimary: true,
            cityId: primaryPhysical.cityId,
            address: primaryPhysical.address,
            latitude: primaryPhysical.latitude,
            longitude: primaryPhysical.longitude,
            locationSource: null,
            workHours: null,
            phone: primaryPhysical.phone,
            whatsapp: null,
            instagram: null,
            website: null,
          };
          state.primaries = [row];
          return row;
        }),
        update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = {
            id: primaryId,
            businessId,
            isPrimary: true,
            cityId: primaryPhysical.cityId,
            address: data.address ?? primaryPhysical.address,
            latitude: data.latitude ?? primaryPhysical.latitude,
            longitude: data.longitude ?? primaryPhysical.longitude,
            locationSource: data.locationSource ?? null,
            workHours: null,
            phone: data.phone ?? primaryPhysical.phone,
            whatsapp: null,
            instagram: null,
            website: null,
          };
          state.primaries = [row];
          return row;
        }),
      },
    };
  }

  it('upsertSeedBusinessWithPrimaryMirror creates one primary on first run', async () => {
    const state = { primaries: [] as Array<{ id: string; businessId: string; isPrimary: boolean }> };
    const tx = buildTx(state);

    await upsertSeedBusinessWithPrimaryMirrorInTx(tx as never, {
      where: { slug: 'seed-slug' },
      brandCreate: { title: 'Seed Biz', categoryId: 'cat', ownerId: 'owner', status: 'ACTIVE' },
      brandUpdate: { title: 'Seed Biz' },
      primaryPhysical,
    });

    expect(tx.businessLocation.create).toHaveBeenCalledTimes(1);
    expect(state.primaries).toHaveLength(1);
    expect(tx.business.update).toHaveBeenCalled();
  });

  it('upsertSeedBusinessWithPrimaryMirror updates existing primary on second run', async () => {
    const state = {
      business: { id: 'biz-seed-1', slug: 'seed-slug' },
      primaries: [{ id: deterministicPrimaryLocationId('biz-seed-1'), businessId: 'biz-seed-1', isPrimary: true }],
    };
    const tx = buildTx(state);

    const changedPhysical = {
      ...primaryPhysical,
      address: 'Seed addr 2',
    };

    await upsertSeedBusinessWithPrimaryMirrorInTx(tx as never, {
      where: { slug: 'seed-slug' },
      brandCreate: { title: 'Seed Biz', categoryId: 'cat', ownerId: 'owner', status: 'ACTIVE' },
      brandUpdate: { title: 'Seed Biz' },
      primaryPhysical: changedPhysical,
    });

    expect(tx.businessLocation.create).not.toHaveBeenCalled();
    expect(tx.businessLocation.update).toHaveBeenCalledTimes(1);
    expect(state.primaries).toHaveLength(1);
  });

  it('upsertSeedBusinessWithPrimaryMirror fails on multi-primary corruption', async () => {
    const state = {
      business: { id: 'biz-seed-1', slug: 'seed-slug' },
      primaries: [
        { id: 'bl-a', businessId: 'biz-seed-1', isPrimary: true },
        { id: 'bl-b', businessId: 'biz-seed-1', isPrimary: true },
      ],
    };
    const tx = buildTx(state);

    await expect(
      upsertSeedBusinessWithPrimaryMirrorInTx(tx as never, {
        where: { slug: 'seed-slug' },
        brandCreate: { title: 'Seed Biz', categoryId: 'cat', ownerId: 'owner', status: 'ACTIVE' },
        brandUpdate: { title: 'Seed Biz' },
        primaryPhysical,
      }),
    ).rejects.toBeInstanceOf(BusinessLocationSeedInvariantError);
  });
});
