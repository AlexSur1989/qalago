import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BranchAvailabilityMode } from '../../common/dto/branch-availability.dto';
import { BusinessLocationDeleteBlockedCode } from '../../common/utils/branch-availability-management.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PrismaClient, PromotionStatus, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { asAuditLogService, createMockAuditLog } from '../../test-utils/mock-audit-log';
import { BusinessLocationService } from '../businesses/business-location.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { asBusinessAccessService, createMockBusinessAccess } from '../../test-utils/mock-business-access';
import { PrismaService } from '../../prisma/prisma.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PromotionsService } from '../promotions/promotions.service';
import { MenuAccessService } from './menu-access.service';
import { ServiceItemsService } from './service-items.service';

describe('Stage 6.12A.7.8.2 — branch availability management', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityId = '';
  let categoryId = '';
  let ownerId = '';

  const ownerUser = {
    sub: 'owner-a782',
    id: 'owner-a782',
    role: UserRole.BUSINESS,
  } as AuthUser;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ n: number }>>`
        SELECT COUNT(*)::int AS n FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ServiceItemBranchAvailability'`;
      if ((table[0]?.n ?? 0) === 0) {
        skip = true;
        return;
      }
      const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const user = await prisma.user.findFirst({ select: { id: true } });
      if (!city || !category || !user) skip = true;
      else {
        cityId = city.id;
        categoryId = category.id;
        ownerId = user.id;
        ownerUser.sub = user.id;
        ownerUser.id = user.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildServiceItemService(businessOwnerId = ownerId) {
    const businessAccess = asBusinessAccessService(
      createMockBusinessAccess({ ownerId: businessOwnerId }),
    );
    const menuAccess = new MenuAccessService(businessAccess, prisma as unknown as PrismaService);
    const planLimits = {
      assertCanAddServiceItem: jest.fn().mockResolvedValue(undefined),
    } as unknown as PlanLimitsService;
    return new ServiceItemsService(
      prisma as unknown as PrismaService,
      menuAccess,
      planLimits,
      asAuditLogService(createMockAuditLog()),
      { get: jest.fn().mockReturnValue('./uploads') } as never,
      { createReceipt: jest.fn(), assertValidReceipt: jest.fn() } as never,
    );
  }

  function buildPromotionService(businessOwnerId = ownerId) {
    const businessAccess = asBusinessAccessService(
      createMockBusinessAccess({ ownerId: businessOwnerId }),
    );
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        limits: { maxPromotionDurationDays: 30, maxActivePromotions: 10 },
      }),
      assertCanCreatePromotion: jest.fn().mockResolvedValue(undefined),
      resolvePromotionDates: jest.fn().mockReturnValue({ startDate: null, endDate: null }),
    } as unknown as PlanLimitsService;
    return new PromotionsService(
      prisma as unknown as PrismaService,
      {} as CityScopeService,
      planLimits,
      businessAccess,
      asAuditLogService(createMockAuditLog()),
    );
  }

  function buildLocationService(businessOwnerId = ownerId) {
    return new BusinessLocationService(
      prisma as unknown as PrismaService,
      asBusinessAccessService(createMockBusinessAccess({ ownerId: businessOwnerId })),
      new BusinessPrimaryLocationService(),
    );
  }

  async function createFixtureBusiness(extraLocations = 2) {
    const slug = `a782-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'A782 fixture',
        slug,
        categoryId,
        status: 'ACTIVE',
        ownerId,
        locations: {
          create: [
            { cityId, address: 'L1', isPrimary: true },
            ...Array.from({ length: extraLocations }, (_, i) => ({
              cityId,
              address: `L${i + 2}`,
              isPrimary: false,
            })),
          ],
        },
      },
      include: { locations: { orderBy: { address: 'asc' } } },
    });
    return { business, slug, locations: business.locations };
  }

  describe('ServiceItem management', () => {
    it('A — legacy create without branchAvailability → ALL / zero assignments', async () => {
      if (skip) return;
      const { business, slug } = await createFixtureBusiness(0);
      try {
        const service = buildServiceItemService();
        const item = await service.create(ownerUser, {
          businessId: business.id,
          title: 'Legacy item',
        });
        expect(item.branchAvailability).toEqual({ mode: BranchAvailabilityMode.ALL, locationIds: [] });
        const count = await prisma.serviceItemBranchAvailability.count({
          where: { serviceItemId: item.id },
        });
        expect(count).toBe(0);
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });

    it('B — create ALL → zero assignments', async () => {
      if (skip) return;
      const { business, slug } = await createFixtureBusiness(0);
      try {
        const service = buildServiceItemService();
        const item = await service.create(ownerUser, {
          businessId: business.id,
          title: 'All branches',
          branchAvailability: { mode: BranchAvailabilityMode.ALL, locationIds: [] },
        });
        expect(item.branchAvailability.mode).toBe(BranchAvailabilityMode.ALL);
        expect(
          await prisma.serviceItemBranchAvailability.count({ where: { serviceItemId: item.id } }),
        ).toBe(0);
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });

    it('C/D — create SELECTED one or two locations', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(2);
      const l1 = locations.find((l) => l.address === 'L1')!.id;
      const l3 = locations.find((l) => l.address === 'L3')!.id;
      try {
        const service = buildServiceItemService();
        const one = await service.create(ownerUser, {
          businessId: business.id,
          title: 'L1 only',
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l1] },
        });
        expect(one.branchAvailability).toEqual({
          mode: BranchAvailabilityMode.SELECTED,
          locationIds: [l1],
        });

        const two = await service.create(ownerUser, {
          businessId: business.id,
          title: 'L1+L3',
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l3, l1] },
        });
        expect(two.branchAvailability.locationIds).toEqual([l1, l3].sort());
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });

    it('E — SELECTED empty rejected', async () => {
      if (skip) return;
      const { business, slug } = await createFixtureBusiness(0);
      try {
        const service = buildServiceItemService();
        await expect(
          service.create(ownerUser, {
            businessId: business.id,
            title: 'Bad',
            branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [] },
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });

    it('F/G — foreign and missing location rejected', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(1);
      const other = await createFixtureBusiness(0);
      const l1 = locations[0]!.id;
      try {
        const service = buildServiceItemService();
        await expect(
          service.create(ownerUser, {
            businessId: business.id,
            title: 'Foreign',
            branchAvailability: {
              mode: BranchAvailabilityMode.SELECTED,
              locationIds: [other.locations[0]!.id],
            },
          }),
        ).rejects.toBeInstanceOf(BadRequestException);

        await expect(
          service.create(ownerUser, {
            businessId: business.id,
            title: 'Missing',
            branchAvailability: {
              mode: BranchAvailabilityMode.SELECTED,
              locationIds: ['cmissinglocation000000000000'],
            },
          }),
        ).rejects.toBeInstanceOf(NotFoundException);
      } finally {
        await prisma.business.deleteMany({ where: { slug: { in: [slug, other.slug] } } });
      }
    });

    it('I/J/K/L — update transitions and PATCH omission preserves assignments', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(2);
      const l1 = locations.find((l) => l.address === 'L1')!.id;
      const l2 = locations.find((l) => l.address === 'L2')!.id;
      const l3 = locations.find((l) => l.address === 'L3')!.id;
      try {
        const service = buildServiceItemService();
        const item = await service.create(ownerUser, {
          businessId: business.id,
          title: 'Transition item',
          branchAvailability: { mode: BranchAvailabilityMode.ALL, locationIds: [] },
        });

        const toSelected = await service.update(ownerUser, item.id, {
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l1] },
        });
        expect(toSelected.branchAvailability).toEqual({
          mode: BranchAvailabilityMode.SELECTED,
          locationIds: [l1],
        });

        const swap = await service.update(ownerUser, item.id, {
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l2, l3] },
        });
        expect(swap.branchAvailability.locationIds).toEqual([l2, l3].sort());

        const toAll = await service.update(ownerUser, item.id, {
          branchAvailability: { mode: BranchAvailabilityMode.ALL, locationIds: [] },
        });
        expect(toAll.branchAvailability.mode).toBe(BranchAvailabilityMode.ALL);
        expect(
          await prisma.serviceItemBranchAvailability.count({ where: { serviceItemId: item.id } }),
        ).toBe(0);

        await service.update(ownerUser, item.id, {
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l1] },
        });
        const titleOnly = await service.update(ownerUser, item.id, { title: 'Renamed only' });
        expect(titleOnly.branchAvailability).toEqual({
          mode: BranchAvailabilityMode.SELECTED,
          locationIds: [l1],
        });
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });

    it('M — failed assignment update does not partially mutate entity', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(0);
      const l1 = locations[0]!.id;
      try {
        const service = buildServiceItemService();
        const item = await service.create(ownerUser, {
          businessId: business.id,
          title: 'Before fail',
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l1] },
        });

        await expect(
          service.update(ownerUser, item.id, {
            title: 'Should not stick',
            branchAvailability: {
              mode: BranchAvailabilityMode.SELECTED,
              locationIds: ['cmissinglocation000000000000'],
            },
          }),
        ).rejects.toBeInstanceOf(NotFoundException);

        const row = await prisma.serviceItem.findUniqueOrThrow({ where: { id: item.id } });
        expect(row.title).toBe('Before fail');
        expect(
          await prisma.serviceItemBranchAvailability.count({ where: { serviceItemId: item.id } }),
        ).toBe(1);
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });

    it('N — manage list returns deterministic branchAvailability', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(2);
      const l3 = locations.find((l) => l.address === 'L3')!.id;
      const l2 = locations.find((l) => l.address === 'L2')!.id;
      try {
        const service = buildServiceItemService();
        await service.create(ownerUser, {
          businessId: business.id,
          title: 'Listed',
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l3, l2] },
        });
        const items = await service.findForManage(ownerUser, business.id);
        const listed = items.find((i) => i.title === 'Listed');
        expect(listed?.branchAvailability.locationIds).toEqual([l2, l3].sort());
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });
  });

  describe('Promotion management', () => {
    it('create/update/read with branchAvailability and lifecycle unchanged', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(2);
      const l1 = locations.find((l) => l.address === 'L1')!.id;
      const l2 = locations.find((l) => l.address === 'L2')!.id;
      try {
        const service = buildPromotionService();
        const legacy = await service.create(ownerUser, {
          businessId: business.id,
          title: 'Legacy promo',
        });
        expect(legacy.branchAvailability.mode).toBe(BranchAvailabilityMode.ALL);
        expect(legacy.status).toBe(PromotionStatus.ACTIVE);

        const selected = await service.create(ownerUser, {
          businessId: business.id,
          title: 'Branch promo',
          status: PromotionStatus.DRAFT,
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l1, l2] },
        });
        expect(selected.branchAvailability.locationIds).toEqual([l1, l2].sort());

        const patched = await service.update(ownerUser, selected.id, { title: 'Branch promo v2' });
        expect(patched.branchAvailability.locationIds).toEqual([l1, l2].sort());
        expect(patched.title).toBe('Branch promo v2');

        const toAll = await service.update(ownerUser, selected.id, {
          branchAvailability: { mode: BranchAvailabilityMode.ALL, locationIds: [] },
        });
        expect(toAll.branchAvailability.mode).toBe(BranchAvailabilityMode.ALL);
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });
  });

  describe('BusinessLocation delete contract', () => {
    it('blocks delete when catalog/promotion assignments exist', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(1);
      const l2 = locations.find((l) => l.address === 'L2')!.id;
      try {
        const itemService = buildServiceItemService();
        const promoService = buildPromotionService();
        const locationService = buildLocationService();

        await itemService.create(ownerUser, {
          businessId: business.id,
          title: 'Blocks delete',
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l2] },
        });

        await expect(
          locationService.deleteLocation(ownerUser, business.id, l2),
        ).rejects.toMatchObject({
          response: { code: BusinessLocationDeleteBlockedCode },
        });

        await prisma.serviceItemBranchAvailability.deleteMany({
          where: { businessId: business.id },
        });

        await promoService.create(ownerUser, {
          businessId: business.id,
          title: 'Promo block',
          branchAvailability: { mode: BranchAvailabilityMode.SELECTED, locationIds: [l2] },
        });

        await expect(
          locationService.deleteLocation(ownerUser, business.id, l2),
        ).rejects.toBeInstanceOf(ConflictException);
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });

    it('allows delete when no assignments reference the branch', async () => {
      if (skip) return;
      const { business, slug, locations } = await createFixtureBusiness(1);
      const l2 = locations.find((l) => l.address === 'L2')!.id;
      try {
        const locationService = buildLocationService();
        await expect(
          locationService.deleteLocation(ownerUser, business.id, l2),
        ).resolves.toEqual({ success: true });
        const gone = await prisma.businessLocation.findUnique({ where: { id: l2 } });
        expect(gone).toBeNull();
      } finally {
        await prisma.business.deleteMany({ where: { slug } });
      }
    });
  });
});
