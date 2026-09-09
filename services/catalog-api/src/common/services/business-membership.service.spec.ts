import {
  BusinessMembershipRole,
  BusinessMembershipStatus,
} from '@prisma/client';
import { BusinessMembershipService } from './business-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('BusinessMembershipService.hasActiveOwnerAccess (Stage 5N.1)', () => {
  const auditLog = createMockAuditLog();

  function createService(getMembership: jest.Mock) {
    const prisma = {} as PrismaService;
    const planLimits = { assertCanAddManager: jest.fn().mockResolvedValue(undefined) };
    const service = new BusinessMembershipService(
      prisma,
      asAuditLogService(auditLog),
      planLimits as never,
    );
    jest.spyOn(service, 'getMembership').mockImplementation(getMembership);
    return service;
  }

  it('allows legacy ownerId when no membership row exists', async () => {
    const service = createService(jest.fn().mockResolvedValue(null));
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(true);
  });

  it('allows ACTIVE OWNER membership even without ownerId', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', null)).resolves.toBe(true);
  });

  it('denies REVOKED OWNER even when ownerId matches', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.REVOKED,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(false);
  });

  it('denies SUSPENDED OWNER even when ownerId matches', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.SUSPENDED,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(false);
  });

  it('denies ACTIVE MANAGER even when ownerId matches', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.MANAGER,
        status: BusinessMembershipStatus.ACTIVE,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(false);
  });
});
