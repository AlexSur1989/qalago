import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CityScopeService } from './city-scope.service';
import { BusinessMembershipService } from './business-membership.service';

export type BusinessAccessRecord = {
  id: string;
  ownerId: string | null;
  cityId: string;
  categoryId: string;
};

/**
 * Stage 5M.0 — centralized business resource access for legacy RBAC.
 *
 * ADMIN: global
 * CITY_ADMIN: managedCityId only
 * BUSINESS / USER: legacy ownerId OR ACTIVE OWNER membership (dual-read)
 * MANAGER membership: denied in Stage 5M.1
 */
@Injectable()
export class BusinessAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly membership: BusinessMembershipService,
  ) {}

  async assertCanManageBusiness(
    user: AuthUser,
    businessId: string,
  ): Promise<BusinessAccessRecord> {
    const business = await this.loadBusiness(businessId);
    await this.assertManage(user, business);
    return business;
  }

  async assertCanViewBusinessAnalytics(
    user: AuthUser,
    businessId: string,
  ): Promise<BusinessAccessRecord> {
    return this.assertCanManageBusiness(user, businessId);
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

  private async assertManage(user: AuthUser, business: BusinessAccessRecord) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.CITY_ADMIN) {
      await this.cityScope.assertBusinessInAdminScope(user, business.cityId);
      return;
    }

    if (
      await this.membership.hasActiveOwnerAccess(user.id, business.id, business.ownerId)
    ) {
      return;
    }

    throw new ForbiddenException('Not allowed to manage this business');
  }
}
