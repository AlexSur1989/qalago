import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { isStaffRole } from '@qalago/shared-types';
import {
  AuditAction,
  AuditResourceType,
  BusinessStatus,
  BusinessPlanTier,
  NotificationTargetType,
  NotificationType,
  Prisma,
  UserRole,
} from '@prisma/client';

import { AuthUser } from '../../common/types/jwt-payload.type';
import { deriveUserAuthMethods } from '../../common/utils/auth-methods.util';

import { CityScopeService } from '../../common/services/city-scope.service';
import { resolveBusinessPrimaryCityId } from '../../common/utils/business-context-city.util';
import { SystemAccessService } from '../../common/services/system-access.service';

import { PrismaService } from '../../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import { CategoriesService } from '../categories/categories.service';
import { SubcategoriesService } from '../categories/subcategories.service';
import { BusinessSubcategoryService } from '../businesses/business-subcategory.service';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from '../categories/dto/subcategory.dto';

import { CitiesService } from '../cities/cities.service';

import { GeoService } from '../geo/geo.service';

import { PlansService } from '../plans/plans.service';

import { AuditLogService } from '../audit-log/audit-log.service';
import { StaffStepUpService } from '../../common/services/staff-step-up.service';
import { staffForbidden, StaffAuthErrorCode } from '../../common/errors/staff-auth.errors';
import { JwtPayload } from '../../common/types/jwt-payload.type';

import { CreateCityDto, UpdateCityDto } from '../cities/dto/city.dto';

import {
  buildAdminBranchScope,
  groupAssignmentLocationIds,
  type AdminBranchLocationRow,
} from './admin-branch-content-scope.util';

import {

  AdminListBusinessesQueryDto,
  AdminListReviewsQueryDto,
  UpdateBusinessFeaturedDto,

  UpdateBusinessPlanDto,
  UpdateBusinessStatusDto,

  UpdateCategoryCityOrderDto,
  UpdateCategoryCityVisibilityDto,
  UpdateBusinessTaxonomyDto,
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

    private readonly subcategories: SubcategoriesService,

    private readonly businessSubcategories: BusinessSubcategoryService,

    private readonly staffStepUp: StaffStepUpService,

  ) {}



  async listBusinesses(user: AuthUser, query: AdminListBusinessesQueryDto) {

    const page = query.page ?? 1;

    const limit = query.limit ?? 50;

    const skip = (page - 1) * limit;



    const where: Prisma.BusinessWhereInput = {};

    if (query.status) where.status = query.status;



    const scopedCityId = await this.cityScope.resolveAdminCityId(user, query.citySlug);

    if (scopedCityId) {
      Object.assign(where, this.cityScope.buildAdminBusinessScopeWhere(scopedCityId));
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

  /** Stage 6.12A.7.8.6 — staff read-only catalog/promotion branch visibility. */
  async getBusinessContent(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        title: true,
        cityId: true,
        city: { select: { slug: true, nameRu: true, nameKk: true } },
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    await this.cityScope.assertBusinessInAdminScope(user, business.id);

    const [serviceItems, promotions, itemAssignments, promoAssignments] = await Promise.all([
      this.prisma.serviceItem.findMany({
        where: { businessId },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        include: {
          group: { select: { id: true, title: true, sortOrder: true } },
        },
      }),
      this.prisma.promotion.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceItemBranchAvailability.findMany({
        where: { businessId },
        select: { serviceItemId: true, locationId: true },
      }),
      this.prisma.promotionBranchAvailability.findMany({
        where: { businessId },
        select: { promotionId: true, locationId: true },
      }),
    ]);

    const locationIds = new Set<string>();
    for (const row of itemAssignments) {
      locationIds.add(row.locationId);
    }
    for (const row of promoAssignments) {
      locationIds.add(row.locationId);
    }

    const locations =
      locationIds.size === 0
        ? []
        : await this.prisma.businessLocation.findMany({
            where: { businessId, id: { in: [...locationIds] } },
            include: { city: { select: { nameRu: true, nameKk: true } } },
          });

    const locationById = new Map<string, AdminBranchLocationRow>(
      locations.map((loc) => [loc.id, loc]),
    );

    const itemLocations = groupAssignmentLocationIds(
      itemAssignments,
      (r) => r.serviceItemId,
      (r) => r.locationId,
    );
    const promoLocations = groupAssignmentLocationIds(
      promoAssignments,
      (r) => r.promotionId,
      (r) => r.locationId,
    );

    return {
      business: {
        id: business.id,
        title: business.title,
        city: business.city,
      },
      serviceItems: serviceItems.map((item) => ({
        id: item.id,
        title: item.title,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
        section: item.group
          ? {
              id: item.group.id,
              title: item.group.title,
              sortOrder: item.group.sortOrder,
            }
          : null,
        branchScope: buildAdminBranchScope(itemLocations.get(item.id) ?? [], locationById),
      })),
      promotions: promotions.map((promo) => ({
        id: promo.id,
        title: promo.title,
        status: promo.status,
        startDate: promo.startDate,
        endDate: promo.endDate,
        moderationHidden: promo.moderationHidden,
        branchScope: buildAdminBranchScope(promoLocations.get(promo.id) ?? [], locationById),
      })),
    };
  }

  async updateBusinessStatus(user: AuthUser, id: string, dto: UpdateBusinessStatusDto) {

    const business = await this.ensureBusiness(id);

    await this.cityScope.assertBusinessInAdminScope(user, business.id);



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

        targetType: NotificationTargetType.BUSINESS,

        targetId: business.id,

      });

    } else if (business.ownerId && dto.status === BusinessStatus.BLOCKED) {

      await this.notifications.create({

        userId: business.ownerId,

        type: NotificationType.BUSINESS_BLOCKED,

        title: 'Заведение заблокировано',

        body: `«${business.title}» скрыто из каталога`,

        targetType: NotificationTargetType.BUSINESS,

        targetId: business.id,

      });

    }



    return updated;

  }



  async updateBusinessFeatured(user: AuthUser, id: string, dto: UpdateBusinessFeaturedDto) {

    const business = await this.ensureBusiness(id);

    await this.cityScope.assertBusinessInAdminScope(user, business.id);



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

    await this.cityScope.assertBusinessInAdminScope(user, business.id);

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
    this.staffStepUp.assertRecentStepUp(actor as AuthUser & JwtPayload);

    if (actor.id === id) {
      throw staffForbidden(
        StaffAuthErrorCode.STAFF_SELF_ROLE_CHANGE_FORBIDDEN,
        'Cannot change your own system role',
      );
    }

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (isStaffRole(dto.role) || isStaffRole(target.role)) {
      throw staffForbidden(
        StaffAuthErrorCode.STAFF_PERMISSION_DENIED,
        'Staff roles must be changed via /admin/staff',
      );
    }

    if (dto.role !== UserRole.USER && dto.role !== UserRole.BUSINESS) {
      throw staffForbidden(
        StaffAuthErrorCode.STAFF_PERMISSION_DENIED,
        'Legacy role endpoint only supports USER or BUSINESS',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.staffAccess.updateMany({
        where: { userId: id },
        data: { isActive: false, disabledAt: new Date() },
      });
      await tx.staffCityScope.deleteMany({ where: { userId: id } });

      const updated = await tx.user.update({
        where: { id },
        data: {
          role: dto.role,
          managedCityId: null,
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
          newManagedCityId: null,
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

      where.business = this.cityScope.buildAdminBusinessScopeWhere(scopedCityId);

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

      include: { business: { select: { title: true } } },

    });

    if (!review) throw new NotFoundException('Review not found');

    await this.cityScope.assertBusinessInAdminScope(user, review.businessId);

    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, review.businessId);
    await this.auditLog.record({
      actor: user,
      action: AuditAction.REVIEW_DELETE,
      resourceType: AuditResourceType.REVIEW,
      resourceId: id,
      cityId: auditCityId ?? undefined,
      metadata: {
        businessId: review.businessId,
        source: 'admin_hard_delete',
      },
    });

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

  listSubcategories(_user: AuthUser, categoryId: string) {
    return this.subcategories.listAdminByCategory(categoryId);
  }

  createSubcategory(user: AuthUser, dto: CreateSubcategoryDto) {
    return this.subcategories.create(user, dto);
  }

  updateSubcategory(user: AuthUser, id: string, dto: UpdateSubcategoryDto) {
    return this.subcategories.update(user, id, dto);
  }

  deactivateSubcategory(user: AuthUser, id: string) {
    return this.subcategories.deactivate(user, id);
  }

  deleteSubcategory(user: AuthUser, id: string) {
    return this.subcategories.remove(user, id);
  }

  async updateBusinessTaxonomy(user: AuthUser, businessId: string, dto: UpdateBusinessTaxonomyDto) {
    this.systemAccess.assertGlobalAdmin(user);
    const business = await this.ensureBusiness(businessId);

    let categoryId = business.categoryId;
    if (dto.categoryId && dto.categoryId !== business.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      categoryId = dto.categoryId;
      await this.prisma.business.update({
        where: { id: businessId },
        data: { categoryId },
      });
    }

    if (dto.subcategoryIds !== undefined) {
      await this.businessSubcategories.syncForBusiness(
        businessId,
        categoryId,
        dto.subcategoryIds,
      );
    } else if (dto.categoryId) {
      await this.businessSubcategories.reconcileAfterCategoryChange(businessId, categoryId);
    }

    return this.businessSubcategories.listForBusiness(businessId);
  }

  private async ensureBusiness(id: string) {

    const b = await this.prisma.business.findUnique({ where: { id } });

    if (!b) throw new NotFoundException('Business not found');

    return b;

  }

}


