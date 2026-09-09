import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessStatus,
  BusinessPlanTier,
  NotificationType,
  Prisma,
  UserRole,
} from '@prisma/client';

import { AuthUser } from '../../common/types/jwt-payload.type';
import { deriveUserAuthMethods } from '../../common/utils/auth-methods.util';

import { CityScopeService } from '../../common/services/city-scope.service';
import { SystemAccessService } from '../../common/services/system-access.service';

import { PrismaService } from '../../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import { CategoriesService } from '../categories/categories.service';

import { CitiesService } from '../cities/cities.service';

import { GeoService } from '../geo/geo.service';

import { PlansService } from '../plans/plans.service';

import { AuditLogService } from '../audit-log/audit-log.service';

import { CreateCityDto, UpdateCityDto } from '../cities/dto/city.dto';

import {

  AdminListBusinessesQueryDto,
  AdminListReviewsQueryDto,
  UpdateBusinessFeaturedDto,

  UpdateBusinessPlanDto,
  UpdateBusinessStatusDto,

  UpdateCategoryCityOrderDto,
  UpdateCategoryCityVisibilityDto,
  UpdateUserRoleDto,

} from './dto/admin.dto';



@Injectable()

export class AdminService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly cityScope: CityScopeService,

    private readonly notifications: NotificationsService,

    private readonly categories: CategoriesService,

    private readonly cities: CitiesService,

    private readonly geo: GeoService,

    private readonly plans: PlansService,

    private readonly auditLog: AuditLogService,

    private readonly systemAccess: SystemAccessService,

  ) {}



  async listBusinesses(user: AuthUser, query: AdminListBusinessesQueryDto) {

    const page = query.page ?? 1;

    const limit = query.limit ?? 50;

    const skip = (page - 1) * limit;



    const where: Prisma.BusinessWhereInput = {};

    if (query.status) where.status = query.status;



    const scopedCityId = await this.cityScope.resolveAdminCityId(user, query.citySlug);

    if (scopedCityId) {

      where.cityId = scopedCityId;

    }



    const [items, total] = await Promise.all([

      this.prisma.business.findMany({

        where,

        include: {

          category: true,

          owner: { select: { id: true, phone: true, name: true } },

          city: { select: { slug: true, nameRu: true } },

        },

        skip,

        take: limit,

        orderBy: { createdAt: 'desc' },

      }),

      this.prisma.business.count({ where }),

    ]);



    return { items, meta: { page, limit, total } };

  }



  async updateBusinessStatus(user: AuthUser, id: string, dto: UpdateBusinessStatusDto) {

    const business = await this.ensureBusiness(id);

    await this.cityScope.assertBusinessInAdminScope(user, business.cityId);



    const updated = await this.prisma.business.update({

      where: { id },

      data: { status: dto.status },

    });



    if (business.ownerId && dto.status === BusinessStatus.ACTIVE) {

      await this.notifications.create({

        userId: business.ownerId,

        type: NotificationType.BUSINESS_APPROVED,

        title: 'Заведение одобрено',

        body: `«${business.title}» опубликовано в каталоге`,

      });

    } else if (business.ownerId && dto.status === BusinessStatus.BLOCKED) {

      await this.notifications.create({

        userId: business.ownerId,

        type: NotificationType.BUSINESS_BLOCKED,

        title: 'Заведение заблокировано',

        body: `«${business.title}» скрыто из каталога`,

      });

    }



    return updated;

  }



  async updateBusinessFeatured(user: AuthUser, id: string, dto: UpdateBusinessFeaturedDto) {

    const business = await this.ensureBusiness(id);

    await this.cityScope.assertBusinessInAdminScope(user, business.cityId);



    return this.prisma.business.update({

      where: { id },

      data: {

        isFeatured: dto.isFeatured,

        featuredSlot: dto.featuredSlot,

      },

    });

  }



  async updateBusinessPlan(user: AuthUser, id: string, dto: UpdateBusinessPlanDto) {

    const business = await this.ensureBusiness(id);

    await this.cityScope.assertBusinessInAdminScope(user, business.cityId);

    return this.plans.adminSetTier(user, id, dto.tier);

  }



  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        managedCityId: true,
        managedCity: { select: { id: true, slug: true, nameRu: true } },
        authIdentities: { select: { provider: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return users.map(({ authIdentities, ...user }) => ({
      ...user,
      authMethods: deriveUserAuthMethods(user.phone, authIdentities),
    }));
  }



  async updateUserRole(actor: AuthUser, id: string, dto: UpdateUserRoleDto) {
    this.systemAccess.assertSuperAdmin(actor);

    if (actor.id === id) {
      throw new ForbiddenException('Cannot change your own system role');
    }

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === UserRole.SUPER_ADMIN && dto.role !== UserRole.SUPER_ADMIN) {
      await this.systemAccess.assertCanDemoteSuperAdmin(target.id);
    }

    let managedCityId: string | null = null;
    if (dto.role === UserRole.CITY_ADMIN) {
      managedCityId = await this.systemAccess.validateCityAdminAssignment(dto.managedCityId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          role: dto.role,
          managedCityId,
        },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          managedCityId: true,
          managedCity: { select: { id: true, slug: true, nameRu: true } },
        },
      });

      await this.auditLog.record({
        actor,
        action: AuditAction.USER_ROLE_CHANGE,
        resourceType: AuditResourceType.USER,
        resourceId: id,
        targetUserId: id,
        metadata: {
          oldRole: target.role,
          newRole: dto.role,
          oldManagedCityId: target.managedCityId,
          newManagedCityId: managedCityId,
        },
        tx,
      });

      return updated;
    });
  }



  async listReviews(user: AuthUser, query: AdminListReviewsQueryDto) {

    const limit = query.limit ?? 50;

    const where: Prisma.ReviewWhereInput = {};

    const scopedCityId = await this.cityScope.resolveAdminCityId(user, query.citySlug);

    if (scopedCityId) {

      where.business = { cityId: scopedCityId };

    }



    return this.prisma.review.findMany({

      where,

      include: {

        user: { select: { id: true, phone: true, name: true } },

        business: {

          select: { id: true, title: true, city: { select: { slug: true, nameRu: true } } },

        },

      },

      orderBy: { createdAt: 'desc' },

      take: limit,

    });

  }



  async deleteReview(user: AuthUser, id: string) {

    const review = await this.prisma.review.findUnique({

      where: { id },

      include: { business: { select: { cityId: true, title: true } } },

    });

    if (!review) throw new NotFoundException('Review not found');

    await this.cityScope.assertBusinessInAdminScope(user, review.business.cityId);

    await this.prisma.review.delete({ where: { id } });

    return { success: true, businessTitle: review.business.title };

  }

  listCategories(user: AuthUser, citySlug?: string) {
    return this.categories.findAllForAdmin(citySlug);
  }

  async updateCategoryCityOrder(
    user: AuthUser,
    categoryId: string,
    dto: UpdateCategoryCityOrderDto,
  ) {
    if (user.role === UserRole.CITY_ADMIN) {
      const managedCityId = await this.cityScope.resolveAdminCityId(user);
      const targetCityId = await this.cityScope.resolveCityId({ citySlug: dto.citySlug });
      if (managedCityId && managedCityId !== targetCityId) {
        throw new ForbiddenException('Not allowed to manage categories in this city');
      }
    }

    return this.categories.upsertCityOrder(categoryId, dto.citySlug, dto.sortOrder);
  }

  async updateCategoryCityVisibility(
    user: AuthUser,
    categoryId: string,
    dto: UpdateCategoryCityVisibilityDto,
  ) {
    if (user.role === UserRole.CITY_ADMIN) {
      const managedCityId = await this.cityScope.resolveAdminCityId(user);
      const targetCityId = await this.cityScope.resolveCityId({ citySlug: dto.citySlug });
      if (managedCityId && managedCityId !== targetCityId) {
        throw new ForbiddenException('Not allowed to manage categories in this city');
      }
    }

    return this.categories.setCityVisibility(categoryId, dto.citySlug, dto.isHidden);
  }

  listCitiesAdmin() {
    return this.cities.findAllAdmin();
  }

  async createCity(actor: AuthUser, dto: CreateCityDto) {
    const city = await this.cities.create(dto);
    await this.categories.bootstrapCityCategories(city.id);
    await this.auditLog.record({
      actor,
      action: AuditAction.CITY_CREATE,
      resourceType: AuditResourceType.CITY,
      resourceId: city.id,
      cityId: city.id,
      metadata: {
        slug: city.slug,
        launchStatus: city.launchStatus,
      },
    });
    return city;
  }

  async updateCity(actor: AuthUser, id: string, dto: UpdateCityDto) {
    const existing = await this.prisma.city.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('City not found');
    }

    const city = await this.cities.update(id, dto);

    const launchChanged =
      dto.launchStatus !== undefined && dto.launchStatus !== existing.launchStatus;

    await this.auditLog.record({
      actor,
      action: launchChanged ? AuditAction.CITY_LAUNCH_STATUS_CHANGE : AuditAction.CITY_UPDATE,
      resourceType: AuditResourceType.CITY,
      resourceId: id,
      cityId: id,
      metadata: {
        changedFields: Object.keys(dto).filter((k) => (dto as Record<string, unknown>)[k] !== undefined),
        ...(launchChanged
          ? { oldLaunchStatus: existing.launchStatus, newLaunchStatus: dto.launchStatus }
          : {}),
      },
    });

    return city;
  }

  searchGeoPlaces(query: string, country = 'kz') {
    return this.geo.searchCities(query, country);
  }

  private async ensureBusiness(id: string) {

    const b = await this.prisma.business.findUnique({ where: { id } });

    if (!b) throw new NotFoundException('Business not found');

    return b;

  }

}


