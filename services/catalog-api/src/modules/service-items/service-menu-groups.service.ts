import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceMenuGroupDto,
  UpdateServiceMenuGroupDto,
} from './dto/service-menu-group.dto';
import { MenuAccessService } from './menu-access.service';

@Injectable()
export class ServiceMenuGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuAccess: MenuAccessService,
  ) {}

  async create(user: AuthUser, dto: CreateServiceMenuGroupDto) {
    await this.menuAccess.assertCanManage(user, dto.businessId);
    return this.prisma.serviceMenuGroup.create({
      data: {
        businessId: dto.businessId,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceMenuGroupDto) {
    const group = await this.prisma.serviceMenuGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Menu group not found');
    await this.menuAccess.assertCanManage(user, group.businessId);

    return this.prisma.serviceMenuGroup.update({
      where: { id },
      data: dto,
    });
  }

  async remove(user: AuthUser, id: string) {
    const group = await this.prisma.serviceMenuGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Menu group not found');
    await this.menuAccess.assertCanManage(user, group.businessId);
    await this.prisma.serviceMenuGroup.delete({ where: { id } });
    return { success: true };
  }
}
