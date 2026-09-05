import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { applyPublicServiceMenuLimit } from '../../common/utils/plan-entitlements.util';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
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
