import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessLocationService } from './business-location.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { specCreateInitialPrimary, testPrimaryPhysical, createTestBusinessWithPrimary } from './business-with-primary.test-fixture';

describe('Stage 6.12A.6 — public BusinessLocation read', () => {
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let fixtureOwnerId = '';
  let uralskCityId = '';
  let aktobeCityId = '';
  let categoryId = '';
  const createdBusinessIds: string[] = [];

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !table[0]?.exists;
      const user = await prisma.user.findFirst({ select: { id: true } });
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!user || !uralsk || !aktobe || !category) skip = true;
      else {
        fixtureOwnerId = user.id;
        uralskCityId = uralsk.id;
        aktobeCityId = aktobe.id;
        categoryId = category.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    for (const id of createdBusinessIds) {
      await prisma.businessLocation.deleteMany({ where: { businessId: id } }).catch(() => undefined);
      await prisma.business.delete({ where: { id } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  function buildService(ownerId = fixtureOwnerId) {
    return new BusinessLocationService(
      prisma as unknown as PrismaService,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
      primaryLocation,
    );
  }

  async function createActiveBusiness(prefix: string) {
    const slug = `${prefix}-${randomBytes(5).toString('hex')}`;
    const { business } = await createTestBusinessWithPrimary(prisma, {
      brand: {
        title: `A12A6 ${prefix}`,
        slug,
        categoryId,
        phone: '+77001111111',
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
      primaryPhysical: testPrimaryPhysical(uralskCityId, 'Test address', { phone: '+77001111111' }),
    });
    createdBusinessIds.push(business.id);
    return business;
  }

  const owner = () =>
    ({ id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS }) as const;

  it('lists public locations for guest without auth fields', async () => {
    if (skip) return;
    const business = await createActiveBusiness('pub');
    const svc = buildService();
    const res = await svc.listPublicLocations(business.id);
    expect(res.items).toHaveLength(1);
    const loc = res.items[0];
    expect(loc.isPrimary).toBe(true);
    expect(loc.businessId).toBe(business.id);
    expect(loc.city.slug).toBe('uralsk');
    expect(loc.phone).toBeTruthy();
    expect(loc).not.toHaveProperty('createdAt');
    expect(loc).not.toHaveProperty('locationSource');
  });

  it('returns multiple cross-city locations with primary first', async () => {
    if (skip) return;
    const business = await createActiveBusiness('multi');
    const svc = buildService();
    await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Aktobe branch',
      latitude: 50.2839,
      longitude: 57.167,
      phone: '+77002222222',
    });
    const res = await svc.listPublicLocations(business.id);
    expect(res.items.length).toBeGreaterThanOrEqual(2);
    expect(res.items[0]?.isPrimary).toBe(true);
    const secondary = res.items.find((i) => !i.isPrimary);
    expect(secondary?.city.slug).toBe('aktobe');
  });

  it('404 for unknown business', async () => {
    if (skip) return;
    const svc = buildService();
    await expect(svc.listPublicLocations('nonexistent-business-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('management create still requires membership', async () => {
    if (skip) return;
    const business = await createActiveBusiness('authz');
    const svc = buildService();
    await expect(
      svc.createLocation(
        { id: 'stranger-user-id', sub: 'stranger-user-id', phone: '+7', role: UserRole.BUSINESS },
        business.id,
        {
          cityId: uralskCityId,
          address: 'x',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
