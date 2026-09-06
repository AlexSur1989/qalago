import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  OWNER_CATALOG_DEFAULT_LIMIT,
  OWNER_CATALOG_MAX_LIMIT,
} from '../../common/constants/public-preview.constants';
import { sortCatalogItems } from '../../common/utils/catalog-sort.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { applyPublicServiceMenuLimit } from '../../common/utils/plan-entitlements.util';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ListManageMenuItemsQueryDto } from './dto/manage-menu-items.dto';
import { MenuAccessService } from './menu-access.service';

const itemOrderBy: Prisma.ServiceItemOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { title: 'asc' },
];

@Injectable()
export class ServiceMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuAccess: MenuAccessService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async findPublicMenu(businessId: string) {
    const menu = await this.buildMenu(businessId, false);
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    return applyPublicServiceMenuLimit(menu, ctx.limits.maxServiceItems);
  }

  async findManageMenu(user: AuthUser, businessId: string) {
    await this.menuAccess.assertCanManage(user, businessId);
    return this.buildMenu(businessId, true);
  }

  async findManageItemsPaginated(
    user: AuthUser,
    businessId: string,
    query: ListManageMenuItemsQueryDto,
  ) {
    await this.menuAccess.assertCanManage(user, businessId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? OWNER_CATALOG_DEFAULT_LIMIT, OWNER_CATALOG_MAX_LIMIT);

    const where: Prisma.ServiceItemWhereInput = { businessId };
    if (query.sectionId === 'uncategorized') {
      where.groupId = null;
    } else if (query.sectionId) {
      where.groupId = query.sectionId;
    }
    if (query.search?.trim()) {
      const needle = query.search.trim();
      where.OR = [
        { title: { contains: needle, mode: 'insensitive' } },
        { description: { contains: needle, mode: 'insensitive' } },
      ];
    }

    const [rawItems, total, sections] = await Promise.all([
      this.prisma.serviceItem.findMany({
        where,
        include: {
          group: {
            select: { id: true, title: true, sortOrder: true, isActive: true },
          },
        },
      }),
      this.prisma.serviceItem.count({ where }),
      this.prisma.serviceMenuGroup.findMany({
        where: { businessId },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        select: {
          id: true,
          title: true,
          sortOrder: true,
          isActive: true,
          _count: { select: { items: true } },
        },
      }),
    ]);

    const sorted = sortCatalogItems(rawItems);
    const skip = (page - 1) * limit;
    const items = sorted.slice(skip, skip + limit).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price != null ? item.price.toString() : null,
      imageUrl: item.imageUrl,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      sectionId: item.groupId,
      section: item.group
        ? {
            id: item.group.id,
            title: item.group.title,
            sortOrder: item.group.sortOrder,
            isActive: item.group.isActive,
          }
        : null,
    }));

    return {
      items,
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        isActive: section.isActive,
        itemCount: section._count.items,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  private async buildMenu(businessId: string, forManage: boolean) {
    const groups = await this.prisma.serviceMenuGroup.findMany({
      where: {
        businessId,
        ...(forManage ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      include: {
        items: {
          where: {
            ...(forManage ? {} : { isActive: true }),
          },
          orderBy: itemOrderBy,
        },
      },
    });

    const ungrouped = await this.prisma.serviceItem.findMany({
      where: {
        businessId,
        groupId: null,
        ...(forManage ? {} : { isActive: true }),
      },
      orderBy: itemOrderBy,
    });

    return { groups, ungrouped };
  }
}
