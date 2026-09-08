import { ForbiddenException } from '@nestjs/common';
import { BusinessPermission, UserRole } from '@prisma/client';
import { AuthUser } from '../common/types/jwt-payload.type';
import { ownerHasAllPermissions } from '../common/utils/business-permission.util';
import { isGlobalAdmin } from '../common/utils/system-access.util';

const DEFAULT_BUSINESS = {
  id: 'business-1',
  ownerId: 'owner-1',
  cityId: 'city-uralsk',
  categoryId: 'cat-1',
};

export type MockBusinessAccessOptions = {
  ownerId?: string;
  managerPermissions?: BusinessPermission[];
};

/** Lightweight BusinessAccessService mock for unit tests (Stage 5M.2). */
export type MockBusinessAccess = {
  assertCanManageBusiness: jest.Mock;
  assertOwner: jest.Mock;
  assertBusinessPermission: jest.Mock;
  assertCanViewBusinessAnalytics: jest.Mock;
  resolveAccess: jest.Mock;
  hasBusinessPermission: jest.Mock;
};

function isPrivileged(user: AuthUser) {
  return isGlobalAdmin(user) || user.role === UserRole.CITY_ADMIN;
}

export function createMockBusinessAccess(options?: MockBusinessAccessOptions): MockBusinessAccess {
  const ownerId = options?.ownerId ?? DEFAULT_BUSINESS.ownerId;
  const managerPermissions = options?.managerPermissions ?? [];

  const resolveAccess = jest.fn(async (user: AuthUser, businessId: string) => {
    if (isPrivileged(user)) {
      return {
        business: { ...DEFAULT_BUSINESS, ownerId, id: businessId },
        accessRole:
          user.role === UserRole.SUPER_ADMIN
            ? 'SUPER_ADMIN'
            : user.role === UserRole.ADMIN
              ? 'ADMIN'
              : 'CITY_ADMIN',
        permissions: ownerHasAllPermissions(),
      };
    }
    if (user.role === UserRole.BUSINESS && user.id === ownerId) {
      return {
        business: { ...DEFAULT_BUSINESS, ownerId, id: businessId },
        accessRole: 'OWNER',
        permissions: ownerHasAllPermissions(),
      };
    }
    if (user.id === 'manager-1') {
      return {
        business: { ...DEFAULT_BUSINESS, ownerId, id: businessId },
        accessRole: 'MANAGER',
        permissions: managerPermissions,
      };
    }
    throw new ForbiddenException('Not allowed to access this business');
  });

  const assertOwner = jest.fn(async (user: AuthUser, businessId: string) => {
    const access = await resolveAccess(user, businessId);
    if (access.accessRole !== 'OWNER' && access.accessRole !== 'ADMIN' && access.accessRole !== 'SUPER_ADMIN' && access.accessRole !== 'CITY_ADMIN') {
      throw new ForbiddenException('Owner access required');
    }
    return access.business;
  });

  const assertBusinessPermission = jest.fn(
    async (user: AuthUser, businessId: string, permission: BusinessPermission) => {
      const access = await resolveAccess(user, businessId);
      if (!access.permissions.includes(permission)) {
        throw new ForbiddenException(`Missing permission: ${permission}`);
      }
      return access.business;
    },
  );

  const assertCanManageBusiness = jest.fn((user: AuthUser, businessId: string) =>
    assertOwner(user, businessId),
  );

  const assertCanViewBusinessAnalytics = jest.fn((user: AuthUser, businessId: string) =>
    assertBusinessPermission(user, businessId, BusinessPermission.ANALYTICS_VIEW),
  );

  const hasBusinessPermission = jest.fn(
    async (user: AuthUser, businessId: string, permission: BusinessPermission) => {
      try {
        await assertBusinessPermission(user, businessId, permission);
        return true;
      } catch {
        return false;
      }
    },
  );

  return {
    assertCanManageBusiness,
    assertOwner,
    assertBusinessPermission,
    assertCanViewBusinessAnalytics,
    resolveAccess,
    hasBusinessPermission,
  };
}

export function asBusinessAccessService(mock: MockBusinessAccess) {
  return mock as unknown as import('../common/services/business-access.service').BusinessAccessService;
}
