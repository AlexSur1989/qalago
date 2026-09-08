import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../common/types/jwt-payload.type';

const DEFAULT_BUSINESS = {
  id: 'business-1',
  ownerId: 'owner-1',
  cityId: 'city-uralsk',
  categoryId: 'cat-1',
};

/** Lightweight BusinessAccessService mock for unit tests (Stage 5M.0). */
export type MockBusinessAccess = {
  assertCanManageBusiness: jest.Mock;
  assertCanViewBusinessAnalytics: jest.Mock;
};

export function createMockBusinessAccess(options?: { ownerId?: string }): MockBusinessAccess {
  const ownerId = options?.ownerId ?? DEFAULT_BUSINESS.ownerId;

  const assertCanManageBusiness = jest.fn(async (user: AuthUser, businessId: string) => {
    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) {
      return { ...DEFAULT_BUSINESS, ownerId, id: businessId };
    }
    if (user.role === UserRole.BUSINESS && user.id === ownerId) {
      return { ...DEFAULT_BUSINESS, ownerId, id: businessId };
    }
    throw new ForbiddenException('Not allowed to manage this business');
  });

  const assertCanViewBusinessAnalytics = jest.fn((user: AuthUser, businessId: string) =>
    assertCanManageBusiness(user, businessId),
  );

  return {
    assertCanManageBusiness,
    assertCanViewBusinessAnalytics,
  };
}

export function asBusinessAccessService(mock: MockBusinessAccess) {
  return mock as unknown as import('../common/services/business-access.service').BusinessAccessService;
}
