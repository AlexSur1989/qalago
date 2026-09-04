import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { BusinessStatus, BusinessPlanTier, NotificationType, Prisma, UserRole } from '@prisma/client';

import { AuthUser } from '../../common/types/jwt-payload.type';

import { CityScopeService } from '../../common/services/city-scope.service';

import { PrismaService } from '../../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import { CategoriesService } from '../categories/categories.service';

import { CitiesService } from '../cities/cities.service';

import { GeoService } from '../geo/geo.service';

import { PlansService } from '../plans/plans.service';

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



  listUsers() {

    return this.prisma.user.findMany({

      select: {

        id: true,

        phone: true,

        name: true,

        role: true,

        isActive: true,

        createdAt: true,

        managedCityId: true,

        managedCity: { select: { id: true, slug: true, nameRu: true } },

      },

      orderBy: { createdAt: 'desc' },

      take: 100,

    });

  }



  updateUserRole(id: string, dto: UpdateUserRoleDto) {

    return this.prisma.user.update({

      where: { id },

      data: {

        role: dto.role,

        managedCityId:

          dto.role === UserRole.CITY_ADMIN ? dto.managedCityId ?? null : null,

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

  async createCity(dto: CreateCityDto) {
    const city = await this.cities.create(dto);
    await this.categories.bootstrapCityCategories(city.id);
    return city;
  }

  updateCity(id: string, dto: UpdateCityDto) {
    return this.cities.update(id, dto);
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


