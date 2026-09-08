import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResourceType } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { sortCatalogItems } from '../../common/utils/catalog-sort.util';
import { sliceToPublicLimit } from '../../common/utils/plan-entitlements.util';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';
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
    private readonly planLimits: PlanLimitsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findByBusiness(query: ListServiceItemsQueryDto) {
    const items = await this.prisma.serviceItem.findMany({
      where: {
        businessId: query.businessId,
        isActive: true,
        OR: [{ groupId: null }, { group: { isActive: true } }],
      },
      include: {
        group: { select: { id: true, title: true, sortOrder: true } },
      },
    });
    const ctx = await this.planLimits.getBusinessPlanContext(query.businessId);
    const sorted = sortCatalogItems(items);
    return sliceToPublicLimit(sorted, ctx.limits.maxServiceItems);
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
    const item = await this.prisma.serviceItem.create({
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
    await this.auditLog.recordBusinessAction(user, dto.businessId, {
      action: AuditAction.CATALOG_ITEM_CREATE,
      resourceType: AuditResourceType.SERVICE_ITEM,
      resourceId: item.id,
      metadata: { title: dto.title },
    });
    return item;
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceItemDto) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Service item not found');
    await this.menuAccess.assertCanManage(user, item.businessId);

    if (dto.groupId) {
      await this.menuAccess.assertGroupForBusiness(dto.groupId, item.businessId);
    }

    const { groupId, ...rest } = dto;
    const updated = await this.prisma.serviceItem.update({
      where: { id },
      data: {
        ...rest,
        ...(groupId !== undefined ? { groupId } : {}),
      },
    });
    await this.auditLog.recordBusinessAction(user, item.businessId, {
      action: AuditAction.CATALOG_ITEM_UPDATE,
      resourceType: AuditResourceType.SERVICE_ITEM,
      resourceId: id,
      metadata: { changedFields: changedFieldsFromDto(dto as Record<string, unknown>) },
    });
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Service item not found');
    await this.menuAccess.assertCanManage(user, item.businessId);
    await this.prisma.serviceItem.delete({ where: { id } });
    await this.auditLog.recordBusinessAction(user, item.businessId, {
      action: AuditAction.CATALOG_ITEM_DELETE,
      resourceType: AuditResourceType.SERVICE_ITEM,
      resourceId: id,
    });
    return { success: true };
  }
}
