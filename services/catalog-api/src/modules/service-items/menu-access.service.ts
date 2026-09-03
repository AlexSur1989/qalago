import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanManage(user: AuthUser, businessId: string) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) return;
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId !== user.id) {
      throw new ForbiddenException('Not business owner');
    }
  }

  async assertGroupForBusiness(groupId: string, businessId: string) {
    const group = await this.prisma.serviceMenuGroup.findFirst({
      where: { id: groupId, businessId },
    });
    if (!group) throw new NotFoundException('Menu group not found');
    return group;
  }
}
