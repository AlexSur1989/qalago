import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditResourceType, ServiceItem } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { sortCatalogItems } from '../../common/utils/catalog-sort.util';
import { sliceToPublicLimit } from '../../common/utils/plan-entitlements.util';
import {
  encodeBranchAvailabilityFromLocationIds,
  replaceServiceItemBranchAssignments,
} from '../../common/utils/branch-availability-management.util';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';
import {
  CreateServiceItemDto,
  ListServiceItemsQueryDto,
  UpdateServiceItemDto,
} from './dto/service-item.dto';
import { normalizeOptionalLocaleText } from '../../common/localized-content';
import { MenuAccessService } from './menu-access.service';
import { validateOwnedMediaUrlWrite } from '../../common/media-upload/media-upload-write.util';
import { UploadReceiptService } from '../../common/media-upload/upload-receipt.service';

type ManageServiceItem = ServiceItem & {
  branchAvailability: ReturnType<typeof encodeBranchAvailabilityFromLocationIds>;
};

@Injectable()
export class ServiceItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuAccess: MenuAccessService,
    private readonly planLimits: PlanLimitsService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
    private readonly uploadReceipts: UploadReceiptService,
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
    const items = await this.prisma.serviceItem.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return this.attachBranchAvailability(items);
  }

  async create(user: AuthUser, dto: CreateServiceItemDto) {
    await this.menuAccess.assertCanManage(user, dto.businessId);
    await this.planLimits.assertCanAddServiceItem(dto.businessId);
    if (dto.groupId) {
      await this.menuAccess.assertGroupForBusiness(dto.groupId, dto.businessId);
    }
    const { branchAvailability, uploadToken, ...itemFields } = dto;
    if (itemFields.imageUrl) {
      validateOwnedMediaUrlWrite(
        this.config,
        this.uploadReceipts,
        user,
        itemFields.imageUrl,
        uploadToken,
        { kind: 'business', businessId: dto.businessId },
      );
    }

    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.serviceItem.create({
        data: {
          businessId: itemFields.businessId,
          groupId: itemFields.groupId,
          title: itemFields.title.trim(),
          titleKk: normalizeOptionalLocaleText(itemFields.titleKk),
          description: normalizeOptionalLocaleText(itemFields.description),
          descriptionKk: normalizeOptionalLocaleText(itemFields.descriptionKk),
          price: itemFields.price,
          imageUrl: itemFields.imageUrl,
          sortOrder: itemFields.sortOrder ?? 0,
        },
      });
      if (branchAvailability) {
        await replaceServiceItemBranchAssignments(
          tx,
          dto.businessId,
          created.id,
          branchAvailability,
        );
      }
      return created;
    });

    await this.auditLog.recordBusinessAction(user, dto.businessId, {
      action: AuditAction.CATALOG_ITEM_CREATE,
      resourceType: AuditResourceType.SERVICE_ITEM,
      resourceId: item.id,
      metadata: { title: dto.title },
    });
    return this.attachBranchAvailabilityOne(item);
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceItemDto) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Service item not found');
    await this.menuAccess.assertCanManage(user, item.businessId);

    if (dto.groupId) {
      await this.menuAccess.assertGroupForBusiness(dto.groupId, item.businessId);
    }

    const { groupId, title, titleKk, description, descriptionKk, branchAvailability, ...rest } =
      dto;

    const { uploadToken, ...restWithoutToken } = rest;
    if (restWithoutToken.imageUrl !== undefined && restWithoutToken.imageUrl !== '') {
      validateOwnedMediaUrlWrite(
        this.config,
        this.uploadReceipts,
        user,
        restWithoutToken.imageUrl,
        uploadToken,
        { kind: 'business', businessId: item.businessId },
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.serviceItem.update({
        where: { id },
        data: {
          ...restWithoutToken,
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(titleKk !== undefined ? { titleKk: normalizeOptionalLocaleText(titleKk) } : {}),
          ...(description !== undefined
            ? { description: normalizeOptionalLocaleText(description) }
            : {}),
          ...(descriptionKk !== undefined
            ? { descriptionKk: normalizeOptionalLocaleText(descriptionKk) }
            : {}),
          ...(groupId !== undefined ? { groupId } : {}),
        },
      });
      if (branchAvailability !== undefined) {
        await replaceServiceItemBranchAssignments(
          tx,
          item.businessId,
          id,
          branchAvailability,
        );
      }
      return row;
    });

    await this.auditLog.recordBusinessAction(user, item.businessId, {
      action: AuditAction.CATALOG_ITEM_UPDATE,
      resourceType: AuditResourceType.SERVICE_ITEM,
      resourceId: id,
      metadata: { changedFields: changedFieldsFromDto(dto as Record<string, unknown>) },
    });
    return this.attachBranchAvailabilityOne(updated);
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

  private async attachBranchAvailability(items: ServiceItem[]): Promise<ManageServiceItem[]> {
    if (items.length === 0) return [];
    const ids = items.map((i) => i.id);
    const rows = await this.prisma.serviceItemBranchAvailability.findMany({
      where: { serviceItemId: { in: ids } },
      select: { serviceItemId: true, locationId: true },
      orderBy: [{ serviceItemId: 'asc' }, { locationId: 'asc' }],
    });
    const byItem = new Map<string, string[]>();
    for (const row of rows) {
      const bucket = byItem.get(row.serviceItemId) ?? [];
      bucket.push(row.locationId);
      byItem.set(row.serviceItemId, bucket);
    }
    return items.map((item) => ({
      ...item,
      branchAvailability: encodeBranchAvailabilityFromLocationIds(byItem.get(item.id) ?? []),
    }));
  }

  private async attachBranchAvailabilityOne(item: ServiceItem): Promise<ManageServiceItem> {
    const [withAvailability] = await this.attachBranchAvailability([item]);
    return withAvailability!;
  }
}
