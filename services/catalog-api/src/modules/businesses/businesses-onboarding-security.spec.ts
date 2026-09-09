import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('BusinessesService — onboarding security (Stage 5N.5)', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const membership = {
    createActiveOwnerMembership: jest.fn().mockResolvedValue({ id: 'mem-1' }),
  } as unknown as BusinessMembershipService;

  function createService() {
    const tx = {
      business: {
        create: jest.fn().mockResolvedValue({
          id: 'biz-new',
          ownerId: 'admin-1',
          title: 'Imported Cafe',
        }),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      category: { findUnique: jest.fn().mockResolvedValue({ id: 'cat-1' }) },
    } as unknown as PrismaService;

    const service = new BusinessesService(
      prisma,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess()),
      membership,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
    );

    return { service, tx };
  }

  it('denies direct create for USER', async () => {
    const { service } = createService();
    await expect(
      service.create(
        { id: 'u1', sub: 'u1', phone: '+7', role: UserRole.USER },
        { title: 'Cafe', categoryId: 'cat-1', citySlug: 'uralsk', address: 'A' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies direct create for legacy BUSINESS role', async () => {
    const { service } = createService();
    await expect(
      service.create(
        { id: 'u2', sub: 'u2', phone: '+7', role: UserRole.BUSINESS },
        { title: 'Cafe', categoryId: 'cat-1', citySlug: 'uralsk', address: 'A' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows direct create for platform ADMIN', async () => {
    const { service, tx } = createService();
    await service.create(
      { id: 'admin-1', sub: 'admin-1', phone: '+7', role: UserRole.ADMIN },
      { title: 'Imported Cafe', categoryId: 'cat-1', citySlug: 'uralsk', address: 'A' },
    );
    expect(tx.business.create).toHaveBeenCalled();
    expect(membership.createActiveOwnerMembership).toHaveBeenCalled();
  });
});
