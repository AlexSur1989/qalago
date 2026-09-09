import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessMembershipRole, BusinessPermission, UserRole } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CityScopeService } from './city-scope.service';
import { BusinessMembershipService } from './business-membership.service';
import { ALL_BUSINESS_PERMISSIONS, ownerHasAllPermissions } from '../utils/business-permission.util';
import { isGlobalAdmin } from '../utils/system-access.util';

export type BusinessAccessRecord = {
  id: string;
  ownerId: string | null;
  cityId: string;
  categoryId: string;
};

export type BusinessAccessRole = 'SUPER_ADMIN' | 'ADMIN' | 'CITY_ADMIN' | 'OWNER' | 'MANAGER';

export type ResolvedBusinessAccess = {
  business: BusinessAccessRecord;
  accessRole: BusinessAccessRole;
  permissions: BusinessPermission[];
};

/**
 * Stage 5M.2 — centralized business authorization.
 *
 * SUPER_ADMIN / ADMIN: global, all permissions
 * CITY_ADMIN: managed city, all permissions
 * OWNER: ACTIVE OWNER membership, or legacy ownerId when no membership row exists
 * MANAGER: ACTIVE membership + explicit permissions only
 */
@Injectable()
export class BusinessAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly membership: BusinessMembershipService,
  ) {}

  async resolveAccess(user: AuthUser, businessId: string): Promise<ResolvedBusinessAccess> {
    const business = await this.loadBusiness(businessId);

    if (isGlobalAdmin(user)) {
      return {
        business,
        accessRole: user.role === UserRole.SUPER_ADMIN ? 'SUPER_ADMIN' : 'ADMIN',
        permissions: ownerHasAllPermissions(),
      };
    }

    if (user.role === UserRole.CITY_ADMIN) {
      await this.cityScope.assertBusinessInAdminScope(user, business.cityId);
      return {
        business,
        accessRole: 'CITY_ADMIN',
        permissions: ownerHasAllPermissions(),
      };
    }

    if (await this.membership.hasActiveOwnerAccess(user.id, business.id, business.ownerId)) {
      return {
        business,
        accessRole: 'OWNER',
        permissions: ownerHasAllPermissions(),
      };
    }

    const managerMembership = await this.membership.getActiveMembership(user.id, business.id);
    if (
      managerMembership?.role === BusinessMembershipRole.MANAGER &&
      managerMembership.status === 'ACTIVE'
    ) {
      return {
        business,
        accessRole: 'MANAGER',
        permissions: managerMembership.permissions ?? [],
      };
    }

    throw new ForbiddenException('Not allowed to access this business');
  }

  async assertOwner(user: AuthUser, businessId: string): Promise<BusinessAccessRecord> {
    const access = await this.resolveAccess(user, businessId);
    if (
      access.accessRole !== 'OWNER' &&
      access.accessRole !== 'ADMIN' &&
      access.accessRole !== 'SUPER_ADMIN' &&
      access.accessRole !== 'CITY_ADMIN'
    ) {
      throw new ForbiddenException('Owner access required');
    }
    return access.business;
  }

  async assertBusinessPermission(
    user: AuthUser,
    businessId: string,
    permission: BusinessPermission,
  ): Promise<BusinessAccessRecord> {
    const access = await this.resolveAccess(user, businessId);
    if (!access.permissions.includes(permission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return access.business;
  }

  /** Owner-level legacy alias — managers are denied. */
  async assertCanManageBusiness(
    user: AuthUser,
    businessId: string,
  ): Promise<BusinessAccessRecord> {
    return this.assertOwner(user, businessId);
  }

  async assertCanViewBusinessAnalytics(
    user: AuthUser,
    businessId: string,
  ): Promise<BusinessAccessRecord> {
    return this.assertBusinessPermission(user, businessId, BusinessPermission.ANALYTICS_VIEW);
  }

  async hasBusinessPermission(
    user: AuthUser,
    businessId: string,
    permission: BusinessPermission,
  ): Promise<boolean> {
    try {
      await this.assertBusinessPermission(user, businessId, permission);
      return true;
    } catch {
      return false;
    }
  }

  private async loadBusiness(businessId: string): Promise<BusinessAccessRecord> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, cityId: true, categoryId: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}

export { ALL_BUSINESS_PERMISSIONS };
