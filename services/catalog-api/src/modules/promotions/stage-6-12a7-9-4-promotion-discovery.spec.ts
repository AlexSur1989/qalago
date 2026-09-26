import { BusinessStatus, PromotionStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PromotionsService } from './promotions.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { asAuditLogService, createMockAuditLog } from '../../test-utils/mock-audit-log';
describe('Stage 6.12A.7.9.4 — branch-aware promotion discovery', () => {
  jest.setTimeout(90_000);
  const prisma = new PrismaClient();
  let skip = false;
  let uralskCityId = '';
  let aktobeCityId = '';
  let categoryId = '';
  let ownerId = '';
  const createdBusinessIds: string[] = [];

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'PromotionBranchAvailability'
        ) AS exists`;
      skip = !table[0]?.exists;
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const user = await prisma.user.findFirst({ select: { id: true } });
      if (!uralsk || !aktobe || !category || !user) skip = true;
      else {
        uralskCityId = uralsk.id;
        aktobeCityId = aktobe.id;
        categoryId = category.id;
        ownerId = user.id;
      }
    } catch {
      skip = true;
    }
  });

  afterEach(async () => {
    if (skip || createdBusinessIds.length === 0) return;
    await prisma.business.deleteMany({ where: { id: { in: createdBusinessIds } } });
    createdBusinessIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildPromotionsService(cityId: string) {
    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue(cityId),
    } as unknown as CityScopeService;
    const planLimits = {} as PlanLimitsService;
    const businessAccess = {
      hasBusinessPermission: jest.fn().mockResolvedValue(false),
    } as unknown as BusinessAccessService;
    return new PromotionsService(
      prisma as unknown as PrismaService,
      cityScope,
      planLimits,
      businessAccess,
      asAuditLogService(createMockAuditLog()),
    );
  }

  async function createCrossCityBrand() {
    const slug = `a794-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `PromoBrand ${slug}`,
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(business.id);

    const l1 = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: true,
      },
    });
    const l2 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: aktobeCityId,
        address: 'Aktobe branch',
        latitude: 50.283,
        longitude: 57.167,
        isPrimary: false,
      },
    });
    await setBranchGeography(l1.id, 51.2278, 51.3865);
    await setBranchGeography(l2.id, 50.283, 57.167);
    return { business, l1, l2 };
  }

  async function setBranchGeography(locationId: string, lat: number, lng: number) {
    await prisma.$executeRaw`
      UPDATE "BusinessLocation"
      SET latitude = ${lat}, longitude = ${lng},
          location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${locationId}
    `;
  }

  async function createActivePromotion(businessId: string, title: string) {
    return prisma.promotion.create({
      data: {
        businessId,
        title,
        status: PromotionStatus.ACTIVE,
        moderationHidden: false,
      },
    });
  }

  it('ALL: visible in each city with city contextLocationId', async () => {
    if (skip) return;
    const { business, l1, l2 } = await createCrossCityBrand();
    const promo = await createActivePromotion(business.id, `ALL-${randomBytes(3).toString('hex')}`);

    const oralService = buildPromotionsService(uralskCityId);
    const oral = await oralService.findAll({ citySlug: 'uralsk', limit: 100 });
    const oralRow = oral.items.find((p) => p.id === promo.id) as
      | { contextLocationId?: string | null }
      | undefined;
    expect(oralRow).toBeDefined();
    expect(oral.items.filter((p) => p.id === promo.id)).toHaveLength(1);
    expect(oralRow?.contextLocationId).toBe(l1.id);

    const aktobeService = buildPromotionsService(aktobeCityId);
    const aktobe = await aktobeService.findAll({ citySlug: 'aktobe', limit: 100 });
    const aktobeRow = aktobe.items.find((p) => p.id === promo.id) as
      | { contextLocationId?: string | null }
      | undefined;
    expect(aktobeRow?.contextLocationId).toBe(l2.id);
  });

  it('ALL: hidden in city with no branch despite parent Business.cityId', async () => {
    if (skip) return;
    const slug = `a794-phantom-${randomBytes(4).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `Phantom ${slug}`,
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(business.id);
    const l2 = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: aktobeCityId,
        isPrimary: true,
      },
    });
    await setBranchGeography(l2.id, 50.283, 57.167);
    const promo = await createActivePromotion(business.id, `PhantomALL-${randomBytes(2).toString('hex')}`);

    const oralService = buildPromotionsService(uralskCityId);
    expect(
      (await oralService.findAll({ citySlug: 'uralsk', limit: 100 })).items.some((p) => p.id === promo.id),
    ).toBe(false);

    const aktobeService = buildPromotionsService(aktobeCityId);
    expect(
      (await aktobeService.findAll({ citySlug: 'aktobe', limit: 100 })).items.some((p) => p.id === promo.id),
    ).toBe(true);
  });

  it('SELECTED L2 only: hidden Oral, visible Aktobe with L2 context', async () => {
    if (skip) return;
    const { business, l2 } = await createCrossCityBrand();
    const promo = await createActivePromotion(business.id, `SEL-${randomBytes(3).toString('hex')}`);
    await prisma.promotionBranchAvailability.create({
      data: { businessId: business.id, promotionId: promo.id, locationId: l2.id },
    });

    const oralService = buildPromotionsService(uralskCityId);
    expect(
      (await oralService.findAll({ citySlug: 'uralsk', limit: 100 })).items.some((p) => p.id === promo.id),
    ).toBe(false);

    const aktobeService = buildPromotionsService(aktobeCityId);
    const hit = await aktobeService.findAll({ citySlug: 'aktobe', limit: 100 });
    const row = hit.items.find((p) => p.id === promo.id) as
      | { contextLocationId?: string | null }
      | undefined;
    expect(hit.items.filter((p) => p.id === promo.id)).toHaveLength(1);
    expect(row?.contextLocationId).toBe(l2.id);
  });

  it('SELECTED: assigned non-primary wins over unassigned primary in same city', async () => {
    if (skip) return;
    const slug = `a794-sibling-${randomBytes(4).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `SiblingPromo ${slug}`,
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(business.id);
    const l1 = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: false,
      },
    });
    const l2 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'L2 primary unassigned',
        latitude: 51.228,
        longitude: 51.387,
        isPrimary: true,
      },
    });
    await setBranchGeography(l1.id, 51.2278, 51.3865);
    await setBranchGeography(l2.id, 51.228, 51.387);

    const promo = await createActivePromotion(business.id, `Sib-${randomBytes(2).toString('hex')}`);
    await prisma.promotionBranchAvailability.create({
      data: { businessId: business.id, promotionId: promo.id, locationId: l1.id },
    });

    const service = buildPromotionsService(uralskCityId);
    const row = (await service.findAll({ citySlug: 'uralsk', limit: 100 })).items.find(
      (p) => p.id === promo.id,
    ) as { contextLocationId?: string | null } | undefined;
    expect(row?.contextLocationId).toBe(l1.id);
    expect(row?.contextLocationId).not.toBe(l2.id);
  });

  it('PENDING business promotions excluded from city feed', async () => {
    if (skip) return;
    const { business, l1 } = await createCrossCityBrand();
    await prisma.business.update({
      where: { id: business.id },
      data: { status: BusinessStatus.PENDING },
    });
    const promo = await createActivePromotion(business.id, `Pending-${randomBytes(2).toString('hex')}`);

    const service = buildPromotionsService(uralskCityId);
    expect(
      (await service.findAll({ citySlug: 'uralsk', limit: 100 })).items.some((p) => p.id === promo.id),
    ).toBe(false);
    void l1;
  });
});
