import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { BusinessStatus } from '@prisma/client';
import { AdminListBusinessesQueryDto } from '../admin/dto/admin.dto';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ListBusinessesQueryDto } from './dto/business.dto';
import { withBusinessListCount } from '../../test-utils/mock-business-catalog-prisma';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';

describe('MAP-SEC.C1 — public business visibility', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidUnknownValues: false,
  });

  async function validateListDto(query: Record<string, unknown>) {
    return validationPipe.transform(plainToInstance(ListBusinessesQueryDto, query), {
      type: 'query',
      metatype: ListBusinessesQueryDto,
    });
  }

  describe('ListBusinessesQueryDto (public)', () => {
    it('1–2 — omitted or ACTIVE accepted', async () => {
      await validateListDto({ citySlug: 'uralsk' });
      const dto = await validateListDto({ citySlug: 'uralsk', status: BusinessStatus.ACTIVE });
      expect(dto.status).toBe(BusinessStatus.ACTIVE);
    });

    it('3–4 — PENDING and BLOCKED rejected', async () => {
      await expect(
        validateListDto({ citySlug: 'uralsk', status: BusinessStatus.PENDING }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validateListDto({ citySlug: 'uralsk', status: BusinessStatus.BLOCKED }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('5 — invalid status rejected', async () => {
      await expect(
        validateListDto({ citySlug: 'uralsk', status: 'NOT_A_STATUS' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('BusinessesService.findAll defense in depth', () => {
    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
    } as unknown as CityScopeService;

    function buildService() {
      const prisma = {
        ...withBusinessListCount(
          {
            business: { findMany: jest.fn().mockResolvedValue([]) },
            businessLocation: { findMany: jest.fn().mockResolvedValue([]) },
          },
          0,
        ),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const subDeps = createMockSubcategoryDeps();
      const service = new BusinessesService(
        prisma,
        cityScope,
        asBusinessAccessService(createMockBusinessAccess()),
        { createActiveOwnerMembership: jest.fn() } as never,
        {} as PlanLimitsService,
        {} as BusinessPublicContentService,
        asAuditLogService(createMockAuditLog()),
        subDeps.businessSubcategories,
        subDeps.subcategories,
        {} as never,
        {} as never,
        { get: jest.fn() } as never,
        {} as never,
      );
      return { service, prisma };
    }

    it('10 — category path uses ACTIVE when status omitted', async () => {
      const { service, prisma } = buildService();
      await service.findAll({ citySlug: 'uralsk', categoryId: 'cat-1' });
      const where = (prisma.business.findMany as jest.Mock).mock.calls.at(-1)![0].where;
      expect(where.status).toBe(BusinessStatus.ACTIVE);
    });

    it('service rejects PENDING even if validation bypassed', async () => {
      const { service } = buildService();
      await expect(
        service.findAll({ citySlug: 'uralsk', status: BusinessStatus.PENDING }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('6–7 — forMap path rejects PENDING/BLOCKED', async () => {
      const { service } = buildService();
      const bbox = {
        forMap: true,
        minLat: 51.05,
        maxLat: 51.35,
        minLng: 51.15,
        maxLng: 51.55,
      };
      await expect(
        service.findAll({ citySlug: 'uralsk', ...bbox, status: BusinessStatus.PENDING }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.findAll({ citySlug: 'uralsk', ...bbox, status: BusinessStatus.BLOCKED }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('Public detail regression', () => {
    it('11 — findOne non-ACTIVE → 404', async () => {
      const prisma = {
        business: { findFirst: jest.fn().mockResolvedValue(null) },
        businessLocation: { findMany: jest.fn() },
      } as unknown as PrismaService;
      const subDeps = createMockSubcategoryDeps();
      const service = new BusinessesService(
        prisma,
        { resolveCityId: jest.fn() } as never,
        asBusinessAccessService(createMockBusinessAccess()),
        {} as never,
        {} as PlanLimitsService,
        {} as BusinessPublicContentService,
        asAuditLogService(createMockAuditLog()),
        subDeps.businessSubcategories,
        subDeps.subcategories,
        {} as never,
        {} as never,
        { get: jest.fn() } as never,
        {} as never,
      );
      await expect(service.findOne('pending-id')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.business.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pending-id', status: BusinessStatus.ACTIVE },
        }),
      );
    });
  });

  describe('AdminListBusinessesQueryDto (protected)', () => {
    it('13–14 — PENDING and BLOCKED still valid on admin DTO', async () => {
      const pending = await validationPipe.transform(
        plainToInstance(AdminListBusinessesQueryDto, { status: BusinessStatus.PENDING }),
        { type: 'query', metatype: AdminListBusinessesQueryDto },
      );
      expect(pending.status).toBe(BusinessStatus.PENDING);
      const blocked = await validationPipe.transform(
        plainToInstance(AdminListBusinessesQueryDto, { status: BusinessStatus.BLOCKED }),
        { type: 'query', metatype: AdminListBusinessesQueryDto },
      );
      expect(blocked.status).toBe(BusinessStatus.BLOCKED);
    });

  });
});
