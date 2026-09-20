import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BusinessPlanTier, BusinessStatus } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { ListBusinessesQueryDto } from './dto/business.dto';

describe('Stage 6.11C.5A geo hardening', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const category = { id: 'cat-1', title: 'Кафе', slug: 'cafe', icon: null };

  let prisma: {
    business: { findMany: jest.Mock; count: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let service: BusinessesService;

  beforeEach(() => {
    prisma = {
      business: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0n }]),
    };
    const subDeps = createMockSubcategoryDeps();
    service = new BusinessesService(
      prisma as unknown as PrismaService,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess()),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
    );
  });

  it('rejects partial latitude/longitude at service layer', async () => {
    await expect(
      service.findAll({ citySlug: 'uralsk', latitude: 51.2 } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('nearest path uses PostGIS query scoped to resolved cityId', async () => {
    prisma.$queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'b1', distance_meters: 120 }])
      .mockResolvedValueOnce([{ count: 1n }]);
    prisma.business.findMany.mockResolvedValue([
      {
        id: 'b1',
        title: 'Near',
        slug: 'near',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'A',
        latitude: 51.228,
        longitude: 51.387,
        status: BusinessStatus.ACTIVE,
        isFeatured: false,
        planTier: BusinessPlanTier.FREE,
        planExpiresAt: null,
        featuredSlot: null,
        category,
      },
    ]);

    await service.findAll({
      citySlug: 'uralsk',
      latitude: 51.2278,
      longitude: 51.3865,
      radiusKm: 3,
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    const rawArgs = prisma.$queryRaw.mock.calls[0]?.slice(1) ?? [];
    expect(JSON.stringify(rawArgs)).toContain('city-uralsk');
  });

  it('forMap with bbox uses PostGIS viewport path', async () => {
    prisma.$queryRaw = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: 0n }]);

    await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      minLat: 51.1,
      maxLat: 51.3,
      minLng: 51.2,
      maxLng: 51.5,
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('DTO rejects non-numeric latitude after transform', async () => {
    const dto = plainToInstance(ListBusinessesQueryDto, {
      citySlug: 'uralsk',
      latitude: 'not-a-number',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'latitude')).toBe(true);
  });
});
