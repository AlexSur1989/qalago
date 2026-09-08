import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessPermission } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuAccessService {
  constructor(
    private readonly businessAccess: BusinessAccessService,
    private readonly prisma: PrismaService,
  ) {}
  async assertCanManage(user: AuthUser, businessId: string) {
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.CATALOG_EDIT,
    );
  }

  async assertGroupForBusiness(groupId: string, businessId: string) {
    const group = await this.prisma.serviceMenuGroup.findFirst({
      where: { id: groupId, businessId },
    });
    if (!group) throw new NotFoundException('Menu group not found');
    return group;
  }
}
