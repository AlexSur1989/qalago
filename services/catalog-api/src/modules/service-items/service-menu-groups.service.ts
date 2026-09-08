import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResourceType } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';
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
    private readonly auditLog: AuditLogService,
  ) {}

  async create(user: AuthUser, dto: CreateServiceMenuGroupDto) {
    await this.menuAccess.assertCanManage(user, dto.businessId);
    const group = await this.prisma.serviceMenuGroup.create({
      data: {
        businessId: dto.businessId,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.auditLog.recordBusinessAction(user, dto.businessId, {
      action: AuditAction.CATALOG_SECTION_CREATE,
      resourceType: AuditResourceType.SERVICE_MENU_GROUP,
      resourceId: group.id,
      metadata: { title: dto.title },
    });
    return group;
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceMenuGroupDto) {
    const group = await this.prisma.serviceMenuGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Menu group not found');
    await this.menuAccess.assertCanManage(user, group.businessId);

    const updated = await this.prisma.serviceMenuGroup.update({
      where: { id },
      data: dto,
    });
    await this.auditLog.recordBusinessAction(user, group.businessId, {
      action: AuditAction.CATALOG_SECTION_UPDATE,
      resourceType: AuditResourceType.SERVICE_MENU_GROUP,
      resourceId: id,
      metadata: { changedFields: changedFieldsFromDto(dto as Record<string, unknown>) },
    });
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    const group = await this.prisma.serviceMenuGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Menu group not found');
    await this.menuAccess.assertCanManage(user, group.businessId);
    await this.prisma.serviceMenuGroup.delete({ where: { id } });
    await this.auditLog.recordBusinessAction(user, group.businessId, {
      action: AuditAction.CATALOG_SECTION_DELETE,
      resourceType: AuditResourceType.SERVICE_MENU_GROUP,
      resourceId: id,
    });
    return { success: true };
  }
}
