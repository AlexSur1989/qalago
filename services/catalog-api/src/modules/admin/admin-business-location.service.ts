import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResourceType } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { resolveBusinessPrimaryCityId } from '../../common/utils/business-context-city.util';
import { BusinessLocationService } from '../businesses/business-location.service';
import {
  CreateBusinessLocationDto,
  UpdateBusinessLocationDto,
} from '../businesses/dto/business-location.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';

@Injectable()
export class AdminBusinessLocationService {
  constructor(
    private readonly cityScope: CityScopeService,
    private readonly locations: BusinessLocationService,
    private readonly auditLog: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  async list(staff: AuthUser, businessId: string) {
    await this.cityScope.assertBusinessInAdminScope(staff, businessId);
    return this.locations.listLocationsForAdmin(businessId);
  }

  async create(staff: AuthUser, businessId: string, dto: CreateBusinessLocationDto) {
    await this.cityScope.assertBusinessInAdminScope(staff, businessId);
    await this.cityScope.assertCityInAdminScope(staff, dto.cityId);
    const created = await this.locations.createLocationForAdmin(businessId, dto);
    await this.auditLog.record({
      actor: staff,
      action: AuditAction.BUSINESS_PROFILE_UPDATE,
      resourceType: AuditResourceType.BUSINESS,
      resourceId: businessId,
      businessId,
      cityId: dto.cityId,
      metadata: { source: 'admin_location_create', locationId: created.id },
    });
    return created;
  }

  async update(
    staff: AuthUser,
    businessId: string,
    locationId: string,
    dto: UpdateBusinessLocationDto,
  ) {
    await this.cityScope.assertBusinessInAdminScope(staff, businessId);
    const existing = await this.prisma.businessLocation.findFirst({
      where: { id: locationId, businessId },
    });
    if (!existing) {
      throw new NotFoundException('Location not found');
    }
    const targetCityId = dto.cityId ?? existing.cityId;
    await this.cityScope.assertCityInAdminScope(staff, targetCityId);
    if (existing.isPrimary) {
      await this.cityScope.assertBusinessPrimaryLocationCityInAdminScope(staff, businessId);
    }

    const updated = await this.locations.updateLocationForAdmin(businessId, locationId, dto);
    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, businessId);
    await this.auditLog.record({
      actor: staff,
      action: AuditAction.BUSINESS_PROFILE_UPDATE,
      resourceType: AuditResourceType.BUSINESS,
      resourceId: locationId,
      businessId,
      cityId: auditCityId ?? undefined,
      metadata: {
        source: 'admin_location_update',
        changedFields: changedFieldsFromDto(dto as Record<string, unknown>),
      },
    });
    return updated;
  }

  async setPrimary(staff: AuthUser, businessId: string, locationId: string) {
    await this.cityScope.assertBusinessInAdminScope(staff, businessId);
    const target = await this.prisma.businessLocation.findFirst({
      where: { id: locationId, businessId },
    });
    if (!target) {
      throw new NotFoundException('Location not found');
    }
    await this.cityScope.assertCityInAdminScope(staff, target.cityId);

    const updated = await this.locations.setPrimaryLocationForAdmin(businessId, locationId);
    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, businessId);
    await this.auditLog.record({
      actor: staff,
      action: AuditAction.BUSINESS_PROFILE_UPDATE,
      resourceType: AuditResourceType.BUSINESS,
      resourceId: locationId,
      businessId,
      cityId: auditCityId ?? undefined,
      metadata: { source: 'admin_location_set_primary', locationId },
    });
    return updated;
  }

  async remove(staff: AuthUser, businessId: string, locationId: string) {
    await this.cityScope.assertBusinessInAdminScope(staff, businessId);
    const target = await this.prisma.businessLocation.findFirst({
      where: { id: locationId, businessId },
    });
    if (!target) {
      throw new NotFoundException('Location not found');
    }
    await this.cityScope.assertCityInAdminScope(staff, target.cityId);

    const result = await this.locations.deleteLocationForAdmin(businessId, locationId);
    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, businessId);
    await this.auditLog.record({
      actor: staff,
      action: AuditAction.BUSINESS_PROFILE_UPDATE,
      resourceType: AuditResourceType.BUSINESS,
      resourceId: locationId,
      businessId,
      cityId: auditCityId ?? undefined,
      metadata: { source: 'admin_location_delete', locationId },
    });
    return result;
  }
}
