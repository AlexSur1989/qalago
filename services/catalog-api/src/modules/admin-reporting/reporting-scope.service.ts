import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';

export type ReportScope = {
  /** null = all cities allowed for this actor */
  cityIds: string[] | null;
  businessId?: string;
};

export type ReportScopeFilters = {
  cityId?: string;
  citySlug?: string;
  businessId?: string;
};

@Injectable()
export class ReportingScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
  ) {}

  async resolveScope(user: AuthUser, filters: ReportScopeFilters): Promise<ReportScope> {
    let businessId = filters.businessId;

    if (businessId) {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, cityId: true },
      });
      if (!business) {
        throw new NotFoundException('Business not found');
      }
      await this.cityScope.assertBusinessInAdminScope(user, business.id);
      if (user.role === UserRole.CITY_ADMIN) {
        const cityIds = await this.cityScope.getCityAdminScopeCityIds(user.id);
        return { cityIds, businessId };
      }
      return { cityIds: filters.cityId ? [business.cityId] : null, businessId };
    }

    if (user.role === UserRole.CITY_ADMIN) {
      const cityIds = await this.cityScope.getCityAdminScopeCityIds(user.id);
      if (!cityIds.length) {
        throw new ForbiddenException('City admin has no assigned city');
      }
      if (filters.cityId) {
        if (!cityIds.includes(filters.cityId)) {
          throw new ForbiddenException('Not allowed to access this city');
        }
        return { cityIds: [filters.cityId] };
      }
      if (filters.citySlug) {
        const requestedId = await this.cityScope.resolveCityId({ citySlug: filters.citySlug });
        if (!cityIds.includes(requestedId)) {
          throw new ForbiddenException('Not allowed to access this city');
        }
        return { cityIds: [requestedId] };
      }
      return { cityIds };
    }

    if (filters.cityId) {
      await this.cityScope.assertCityInAdminScope(user, filters.cityId);
      return { cityIds: [filters.cityId] };
    }
    if (filters.citySlug) {
      const cityId = await this.cityScope.resolveCityId({ citySlug: filters.citySlug });
      await this.cityScope.assertCityInAdminScope(user, cityId);
      return { cityIds: [cityId] };
    }

    return { cityIds: null };
  }

  businessCityWhere(scope: ReportScope): { cityId?: { in: string[] }; id?: string } {
    const where: { cityId?: { in: string[] }; id?: string } = {};
    if (scope.cityIds?.length) {
      where.cityId = { in: scope.cityIds };
    }
    if (scope.businessId) {
      where.id = scope.businessId;
    }
    return where;
  }

  orderCityWhere(scope: ReportScope): { business?: { cityId?: { in: string[] }; id?: string } } {
    const business = this.businessCityWhere(scope);
    if (!Object.keys(business).length) {
      return {};
    }
    return { business };
  }
}
