import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import type { AuthoritativePrimaryPhysicalInput } from '../../common/utils/business-primary-location.util';
import { deriveUserAuthMethods } from '../../common/utils/auth-methods.util';

import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import {
  assertValidBusinessCoordinatePair,
  isOptionalBusinessCoordinatePairValid,
} from '../../common/utils/business-coordinates.util';
import { assertBusinessCoordinatesWithinCity } from '../../common/utils/city-geocoding-persistence.util';
import { patchTouchesBusinessToPrimaryContactSync } from '../../common/utils/business-primary-location.util';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';
import { toBusinessLocationResponse } from '../businesses/business-location.presenter';
import { resolveBusinessPrimaryCityId } from '../../common/utils/business-context-city.util';
import { loadPrimaryCityPresentationByBusinessId } from '../../common/utils/business-primary-city-presentation.util';
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
  AdminCreateBusinessDto,
  AdminPatchBusinessCatalogDto,
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

    private readonly primaryLocation: BusinessPrimaryLocationService,

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



    const [rawItems, total] = await Promise.all([

      this.prisma.business.findMany({

        where,

        include: {

          category: true,

          owner: { select: { id: true, phone: true, name: true } },

        },

        skip,

        take: limit,

        orderBy: { createdAt: 'desc' },

      }),

      this.prisma.business.count({ where }),

    ]);

    const primaryCityByBusinessId = await loadPrimaryCityPresentationByBusinessId(
      this.prisma,
      rawItems.map((row) => row.id),
    );

    const items = rawItems.map((row) => {
      const city = primaryCityByBusinessId.get(row.id);
      return {
        ...row,
        city: city ? { slug: city.slug, nameRu: city.nameRu } : null,
      };
    });



    return { items, meta: { page, limit, total } };

  }

  /** Stage 6.12A.7.8.6 — staff read-only catalog/promotion branch visibility. */
  async getBusinessContent(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        title: true,
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    await this.cityScope.assertBusinessInAdminScope(user, business.id);

    const primaryCityByBusinessId = await loadPrimaryCityPresentationByBusinessId(this.prisma, [
      businessId,
    ]);
    const primaryCity = primaryCityByBusinessId.get(businessId);

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
        city: primaryCity
          ? { slug: primaryCity.slug, nameRu: primaryCity.nameRu, nameKk: primaryCity.nameKk }
          : null,
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

    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, business.id);
    const fromStatus = business.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.business.update({
        where: { id },
        data: { status: dto.status },
      });
      if (fromStatus !== dto.status) {
        await this.auditLog.record({
          actor: user,
          action: AuditAction.BUSINESS_STATUS_UPDATE,
          resourceType: AuditResourceType.BUSINESS,
          resourceId: id,
          businessId: id,
          cityId: auditCityId ?? undefined,
          metadata: {
            source: 'admin_status',
            fromStatus,
            toStatus: dto.status,
          },
          tx,
        });
      }
      return row;
    });



    if (business.ownerId && dto.status === BusinessStatus.ACTIVE) {

      await this.notifications.create({

        userId: business.ownerId,

        type: NotificationType.BUSINESS_APPROVED,

        title: 'Заведение одобрено',

        body: `«${business.title}» опубликовано в каталоге`,

        targetType: NotificationTargetType.BUSINESS,

        targetId: business.id,

        payload: {
          businessId: business.id,
          businessName: business.title,
        },

      });

    } else if (business.ownerId && dto.status === BusinessStatus.BLOCKED) {

      await this.notifications.create({

        userId: business.ownerId,

        type: NotificationType.BUSINESS_BLOCKED,

        title: 'Заведение заблокировано',

        body: `«${business.title}» скрыто из каталога`,

        targetType: NotificationTargetType.BUSINESS,

        targetId: business.id,

        payload: {
          businessId: business.id,
          businessName: business.title,
        },

      });

    }



    return updated;

  }



  async updateBusinessFeatured(user: AuthUser, id: string, dto: UpdateBusinessFeaturedDto) {

    const business = await this.ensureBusiness(id);

    await this.cityScope.assertBusinessInAdminScope(user, business.id);

    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, business.id);

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.business.update({
        where: { id },
        data: {
          isFeatured: dto.isFeatured,
          featuredSlot: dto.featuredSlot,
        },
      });
      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_FEATURED_UPDATE,
        resourceType: AuditResourceType.BUSINESS,
        resourceId: id,
        businessId: id,
        cityId: auditCityId ?? undefined,
        metadata: {
          source: 'admin_featured',
          fromFeatured: business.isFeatured,
          toFeatured: dto.isFeatured,
          fromFeaturedSlot: business.featuredSlot,
          toFeaturedSlot: dto.featuredSlot ?? null,
        },
        tx,
      });
      return row;
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



    const rows = await this.prisma.review.findMany({

      where,

      include: {

        user: { select: { id: true, phone: true, name: true } },

        business: {

          select: { id: true, title: true },

        },

      },

      orderBy: { createdAt: 'desc' },

      take: limit,

    });

    const primaryCityByBusinessId = await loadPrimaryCityPresentationByBusinessId(
      this.prisma,
      rows.map((row) => row.business.id),
    );

    return rows.map((row) => {
      const city = primaryCityByBusinessId.get(row.business.id);
      return {
        ...row,
        business: {
          ...row.business,
          city: city ? { slug: city.slug, nameRu: city.nameRu } : null,
        },
      };
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

  /**
   * Staff catalog create — ownerless Business + one PRIMARY BusinessLocation (AOP.1).
   */
  async createStaffBusiness(actor: AuthUser, dto: AdminCreateBusinessDto) {
    const slug = dto.slug.trim().toLowerCase();
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException('Invalid business slug');
    }

    const slugTaken = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (slugTaken) {
      throw new ConflictException('Business slug already exists');
    }

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const loc = dto.initialLocation;
    await this.assertActiveCityId(loc.cityId);
    await this.cityScope.assertCityInAdminScope(actor, loc.cityId);

    if (!isOptionalBusinessCoordinatePairValid(loc.latitude, loc.longitude)) {
      throw new BadRequestException(
        'latitude and longitude must be provided together and form a valid coordinate pair',
      );
    }
    if (loc.latitude !== undefined && loc.longitude !== undefined) {
      assertValidBusinessCoordinatePair(loc.latitude, loc.longitude);
      await assertBusinessCoordinatesWithinCity(
        this.prisma,
        loc.cityId,
        loc.latitude,
        loc.longitude,
      );
    }

    await this.businessSubcategories.assertSubcategoriesForCategory(
      dto.categoryId,
      dto.subcategoryIds,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const { business, primaryLocation } = await this.primaryLocation.createBusinessWithInitialPrimary(
        tx,
        {
          brand: {
            title: dto.title.trim(),
            slug,
            categoryId: dto.categoryId,
            shortDesc: dto.shortDesc?.trim(),
            description: dto.description?.trim(),
            phone: dto.phone,
            whatsapp: dto.whatsapp,
            instagram: dto.instagram,
            website: dto.website,
            workHours: dto.workHours ?? undefined,
            ownerId: null,
            status: BusinessStatus.PENDING,
          },
          primaryPhysical: {
            cityId: loc.cityId,
            address: loc.address.trim(),
            latitude: (loc.latitude ?? null) as AuthoritativePrimaryPhysicalInput['latitude'],
            longitude: (loc.longitude ?? null) as AuthoritativePrimaryPhysicalInput['longitude'],
            locationSource: loc.locationSource ?? null,
            workHours: loc.workHours ?? dto.workHours ?? null,
            phone: loc.phone ?? dto.phone ?? null,
            whatsapp: loc.whatsapp ?? dto.whatsapp ?? null,
            instagram: loc.instagram ?? dto.instagram ?? null,
            website: loc.website ?? dto.website ?? null,
          },
        },
      );

      if (dto.subcategoryIds !== undefined) {
        await this.businessSubcategories.syncForBusinessInTx(
          tx,
          business.id,
          dto.categoryId,
          dto.subcategoryIds,
        );
      }

      await this.auditLog.record({
        actor,
        action: AuditAction.BUSINESS_CREATE,
        resourceType: AuditResourceType.BUSINESS,
        resourceId: business.id,
        businessId: business.id,
        cityId: primaryLocation.cityId,
        metadata: {
          slug: business.slug,
          title: business.title,
          categoryId: business.categoryId,
          ownerId: null,
          status: business.status,
          primaryLocationId: primaryLocation.id,
        },
        tx,
      });

      return { business, primaryLocation };
    });

    const subcategories = await this.businessSubcategories.listForBusiness(result.business.id);

    return {
      business: {
        id: result.business.id,
        title: result.business.title,
        slug: result.business.slug,
        status: result.business.status,
        ownerId: result.business.ownerId,
        categoryId: result.business.categoryId,
        shortDesc: result.business.shortDesc,
        description: result.business.description,
        phone: result.business.phone,
        whatsapp: result.business.whatsapp,
        instagram: result.business.instagram,
        website: result.business.website,
        workHours: result.business.workHours,
        createdAt: result.business.createdAt,
        updatedAt: result.business.updatedAt,
      },
      primaryLocation: toBusinessLocationResponse(result.primaryLocation),
      subcategories,
    };
  }

  async getBusinessDetail(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        category: { select: { id: true, title: true, slug: true } },
        owner: { select: { id: true, phone: true, name: true } },
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    await this.cityScope.assertBusinessInAdminScope(user, business.id);

    const primaryCityByBusinessId = await loadPrimaryCityPresentationByBusinessId(this.prisma, [
      businessId,
    ]);
    const primaryCity = primaryCityByBusinessId.get(businessId);
    const subcategories = await this.businessSubcategories.listForBusiness(businessId);

    return {
      id: business.id,
      title: business.title,
      slug: business.slug,
      status: business.status,
      ownerId: business.ownerId,
      owner: business.owner,
      category: business.category,
      shortDesc: business.shortDesc,
      description: business.description,
      phone: business.phone,
      whatsapp: business.whatsapp,
      instagram: business.instagram,
      website: business.website,
      workHours: business.workHours,
      planTier: business.planTier,
      isFeatured: business.isFeatured,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      city: primaryCity
        ? { slug: primaryCity.slug, nameRu: primaryCity.nameRu, nameKk: primaryCity.nameKk }
        : null,
      subcategories,
    };
  }

  async listBusinessLocations(user: AuthUser, businessId: string) {
    await this.ensureBusiness(businessId);
    await this.cityScope.assertBusinessInAdminScope(user, businessId);

    const items = await this.prisma.businessLocation.findMany({
      where: { businessId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return { items: items.map(toBusinessLocationResponse) };
  }

  async patchBusinessCatalog(user: AuthUser, businessId: string, dto: AdminPatchBusinessCatalogDto) {
    const business = await this.ensureBusiness(businessId);
    await this.cityScope.assertBusinessPrimaryLocationCityInAdminScope(user, businessId);

    const changedKeys = changedFieldsFromDto(dto as Record<string, unknown>);
    if (changedKeys.length === 0) {
      throw new BadRequestException('No catalog fields to update');
    }

    const syncContactsToPrimary = patchTouchesBusinessToPrimaryContactSync(changedKeys);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.business.update({
        where: { id: businessId },
        data: {
          title: dto.title?.trim(),
          shortDesc: dto.shortDesc?.trim(),
          description: dto.description?.trim(),
          phone: dto.phone,
          whatsapp: dto.whatsapp,
          instagram: dto.instagram,
          website: dto.website,
          workHours: dto.workHours,
        },
      });

      if (syncContactsToPrimary) {
        await this.primaryLocation.syncPrimaryFromBusinessRecord(tx, row);
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_PROFILE_UPDATE,
        resourceType: AuditResourceType.BUSINESS,
        resourceId: businessId,
        businessId,
        cityId: (await resolveBusinessPrimaryCityId(tx, businessId)) ?? undefined,
        metadata: { changedFields: changedKeys, source: 'admin_catalog_patch' },
        tx,
      });

      return row;
    });

    return this.getBusinessDetail(user, updated.id);
  }

  private async assertActiveCityId(cityId: string) {
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city || !city.isActive) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async updateBusinessTaxonomy(user: AuthUser, businessId: string, dto: UpdateBusinessTaxonomyDto) {
    const business = await this.ensureBusiness(businessId);
    await this.cityScope.assertBusinessInAdminScope(user, business.id);
    await this.cityScope.assertBusinessPrimaryLocationCityInAdminScope(user, businessId);

    const priorSubcategories = await this.businessSubcategories.listForBusiness(businessId);
    const fromCategoryId = business.categoryId;
    const fromSubcategoryIds = priorSubcategories.map((s) => s.id);

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

    const result = await this.businessSubcategories.listForBusiness(businessId);
    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, businessId);
    await this.auditLog.record({
      actor: user,
      action: AuditAction.BUSINESS_TAXONOMY_UPDATE,
      resourceType: AuditResourceType.BUSINESS,
      resourceId: businessId,
      businessId,
      cityId: auditCityId ?? undefined,
      metadata: {
        source: 'admin_taxonomy',
        fromCategoryId,
        toCategoryId: categoryId,
        fromSubcategoryIds,
        toSubcategoryIds: result.map((s) => s.id),
      },
    });

    return result;
  }

  private async ensureBusiness(id: string) {

    const b = await this.prisma.business.findUnique({ where: { id } });

    if (!b) throw new NotFoundException('Business not found');

    return b;

  }

}


