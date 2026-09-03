import { Injectable, NotFoundException } from '@nestjs/common';

import { BusinessStatus, NotificationType, Prisma } from '@prisma/client';

import { AuthUser } from '../../common/types/jwt-payload.type';

import { CityScopeService } from '../../common/services/city-scope.service';

import { PrismaService } from '../../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import {

  AdminListBusinessesQueryDto,

  UpdateBusinessFeaturedDto,

  UpdateBusinessStatusDto,

  UpdateUserRoleDto,

} from './dto/admin.dto';



@Injectable()

export class AdminService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly cityScope: CityScopeService,

    private readonly notifications: NotificationsService,

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



  listUsers() {

    return this.prisma.user.findMany({

      select: {

        id: true,

        phone: true,

        name: true,

        role: true,

        isActive: true,

        createdAt: true,

      },

      orderBy: { createdAt: 'desc' },

      take: 100,

    });

  }



  updateUserRole(id: string, dto: UpdateUserRoleDto) {

    return this.prisma.user.update({

      where: { id },

      data: { role: dto.role },

      select: { id: true, phone: true, name: true, role: true },

    });

  }



  private async ensureBusiness(id: string) {

    const b = await this.prisma.business.findUnique({ where: { id } });

    if (!b) throw new NotFoundException('Business not found');

    return b;

  }

}


