import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceItemDto,
  ListServiceItemsQueryDto,
  UpdateServiceItemDto,
} from './dto/service-item.dto';
import { MenuAccessService } from './menu-access.service';

@Injectable()
export class ServiceItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuAccess: MenuAccessService,
  ) {}

  findByBusiness(query: ListServiceItemsQueryDto) {
    return this.prisma.serviceItem.findMany({
      where: { businessId: query.businessId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async findForManage(user: AuthUser, businessId: string) {
    await this.menuAccess.assertCanManage(user, businessId);
    return this.prisma.serviceItem.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async create(user: AuthUser, dto: CreateServiceItemDto) {
    await this.menuAccess.assertCanManage(user, dto.businessId);
    if (dto.groupId) {
      await this.menuAccess.assertGroupForBusiness(dto.groupId, dto.businessId);
    }
    return this.prisma.serviceItem.create({
      data: {
        businessId: dto.businessId,
        groupId: dto.groupId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceItemDto) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Service item not found');
    await this.menuAccess.assertCanManage(user, item.businessId);

    if (dto.groupId) {
      await this.menuAccess.assertGroupForBusiness(dto.groupId, item.businessId);
    }

    const { groupId, ...rest } = dto;
    return this.prisma.serviceItem.update({
      where: { id },
      data: {
        ...rest,
        ...(groupId !== undefined ? { groupId } : {}),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Service item not found');
    await this.menuAccess.assertCanManage(user, item.businessId);
    await this.prisma.serviceItem.delete({ where: { id } });
    return { success: true };
  }
}
