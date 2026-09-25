import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { rethrowLocationDeleteConflict } from '../../common/utils/branch-availability-management.util';
import {
  assertDeleteLocationAllowed,
  assertPrimaryInvariantForSecondaryMutation,
  countBusinessLocationPrimaryState,
  lockBusinessAggregateForUpdate,
} from '../../common/utils/business-location-invariant.util';
import { clearAdCampaignBranchReferencesBeforeDelete } from '../monetization/utils/campaign-location-context.util';
import { BusinessPermission, BusinessStatus, Prisma } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { getRequiredPermissionsForLocationPatch } from '../../common/utils/business-permission.util';
import {
  assertValidBusinessCoordinatePair,
  isOptionalBusinessCoordinatePairValid,
} from '../../common/utils/business-coordinates.util';
import { assertBusinessCoordinatesWithinCity } from '../../common/utils/city-geocoding-persistence.util';
import { PrismaService } from '../../prisma/prisma.service';
import { changedFieldsFromDto } from '../audit-log/audit-log.util';
import {
  toBusinessLocationResponse,
  toPublicBusinessLocationResponse,
} from './business-location.presenter';
import {
  CreateBusinessLocationDto,
  UpdateBusinessLocationDto,
} from './dto/business-location.dto';

@Injectable()
export class BusinessLocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly primaryLocation: BusinessPrimaryLocationService,
  ) {}

  /** Public read for ACTIVE businesses only (Stage 6.12A.6). */
  async listPublicLocations(businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, status: BusinessStatus.ACTIVE },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const items = await this.prisma.businessLocation.findMany({
      where: { businessId },
      include: {
        city: { select: { slug: true, nameRu: true, nameKk: true } },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return { items: items.map(toPublicBusinessLocationResponse) };
  }

  async listLocations(user: AuthUser, businessId: string) {
    await this.assertLocationReadAccess(user, businessId);
    const items = await this.prisma.businessLocation.findMany({
      where: { businessId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return { items: items.map(toBusinessLocationResponse) };
  }

  async getLocation(user: AuthUser, businessId: string, locationId: string) {
    await this.assertLocationReadAccess(user, businessId);
    const location = await this.findScopedLocation(businessId, locationId);
    return toBusinessLocationResponse(location);
  }

  async createLocation(user: AuthUser, businessId: string, dto: CreateBusinessLocationDto) {
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.BUSINESS_PROFILE_EDIT,
    );
    await this.assertBusinessExists(businessId);
    await this.assertActiveCity(dto.cityId);
    const { latitude, longitude } = await this.resolveCoordinatesForWrite(
      dto.cityId,
      dto.latitude,
      dto.longitude,
      null,
      null,
    );

    const created = await this.prisma.$transaction(async (tx) => {
      await lockBusinessAggregateForUpdate(tx, businessId);
      const counts = await countBusinessLocationPrimaryState(tx, businessId);
      const isFirstLocation = counts.locationCount === 0;
      if (!isFirstLocation) {
        assertPrimaryInvariantForSecondaryMutation(counts);
      }

      const row = await tx.businessLocation.create({
        data: {
          businessId,
          cityId: dto.cityId,
          address: dto.address.trim(),
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          locationSource: dto.locationSource ?? undefined,
          workHours: dto.workHours ?? undefined,
          phone: dto.phone ?? undefined,
          whatsapp: dto.whatsapp ?? undefined,
          instagram: dto.instagram ?? undefined,
          website: dto.website ?? undefined,
          isPrimary: isFirstLocation,
        },
      });

      if (isFirstLocation) {
        await this.primaryLocation.syncBusinessFromPrimaryLocationRecord(tx, row);
      }
      return row;
    });

    return toBusinessLocationResponse(created);
  }

  async updateLocation(
    user: AuthUser,
    businessId: string,
    locationId: string,
    dto: UpdateBusinessLocationDto,
  ) {
    const existing = await this.findScopedLocation(businessId, locationId);
    const requiredPermissions = getRequiredPermissionsForLocationPatch(
      dto as Record<string, unknown>,
    );
    for (const permission of requiredPermissions) {
      await this.businessAccess.assertBusinessPermission(user, businessId, permission);
    }

    const changedKeys = changedFieldsFromDto(dto as Record<string, unknown>);
    const effectiveCityId = dto.cityId ?? existing.cityId;
    if (dto.cityId !== undefined) {
      await this.assertActiveCity(dto.cityId);
    }

    const { latitude, longitude } = await this.resolveCoordinatesForWrite(
      effectiveCityId,
      dto.latitude,
      dto.longitude,
      existing.latitude != null ? Number(existing.latitude) : null,
      existing.longitude != null ? Number(existing.longitude) : null,
    );

    const syncBusiness =
      existing.isPrimary &&
      this.primaryLocation.shouldSyncBusinessAfterLocationPatch(changedKeys);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (syncBusiness) {
        await lockBusinessAggregateForUpdate(tx, businessId);
        const counts = await countBusinessLocationPrimaryState(tx, businessId);
        assertPrimaryInvariantForSecondaryMutation(counts);
      }
      const row = await tx.businessLocation.update({
        where: { id: locationId },
        data: {
          cityId: dto.cityId,
          address: dto.address?.trim(),
          latitude: latitude !== undefined ? latitude : undefined,
          longitude: longitude !== undefined ? longitude : undefined,
          locationSource: dto.locationSource,
          workHours: dto.workHours,
          phone: dto.phone,
          whatsapp: dto.whatsapp,
          instagram: dto.instagram,
          website: dto.website,
        },
      });
      if (syncBusiness) {
        await this.primaryLocation.syncBusinessFromPrimaryLocationRecord(tx, row);
      }
      return row;
    });

    return toBusinessLocationResponse(updated);
  }

  async deleteLocation(user: AuthUser, businessId: string, locationId: string) {
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.BUSINESS_PROFILE_EDIT,
    );
    const location = await this.findScopedLocation(businessId, locationId);

    await this.prisma.$transaction(async (tx) => {
      await lockBusinessAggregateForUpdate(tx, businessId);
      const counts = await countBusinessLocationPrimaryState(tx, businessId);
      assertDeleteLocationAllowed(counts, location);

      await clearAdCampaignBranchReferencesBeforeDelete(tx, businessId, locationId);
      try {
        await tx.businessLocation.delete({ where: { id: locationId } });
      } catch (error) {
        rethrowLocationDeleteConflict(error);
      }
    });
    return { success: true };
  }

  async setPrimaryLocation(user: AuthUser, businessId: string, locationId: string) {
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.BUSINESS_PROFILE_EDIT,
    );
    await this.findScopedLocation(businessId, locationId);

    const result = await this.prisma.$transaction(async (tx) => {
      await lockBusinessAggregateForUpdate(tx, businessId);
      const counts = await countBusinessLocationPrimaryState(tx, businessId);
      assertPrimaryInvariantForSecondaryMutation(counts);
      return this.primaryLocation.promoteLocationToPrimary(tx, businessId, locationId);
    });

    return toBusinessLocationResponse(result.location);
  }

  private async assertLocationReadAccess(user: AuthUser, businessId: string) {
    await this.businessAccess.resolveAccess(user, businessId);
  }

  private async assertBusinessExists(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  private async findScopedLocation(businessId: string, locationId: string) {
    const location = await this.prisma.businessLocation.findFirst({
      where: { id: locationId, businessId },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    return location;
  }

  private async assertActiveCity(cityId: string) {
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city || !city.isActive) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  private async resolveCoordinatesForWrite(
    cityId: string,
    dtoLat: number | undefined,
    dtoLng: number | undefined,
    existingLat: number | null,
    existingLng: number | null,
  ): Promise<{ latitude: number | null | undefined; longitude: number | null | undefined }> {
    if (dtoLat === undefined && dtoLng === undefined) {
      return { latitude: undefined, longitude: undefined };
    }

    const mergedLat = dtoLat !== undefined ? dtoLat : existingLat ?? undefined;
    const mergedLng = dtoLng !== undefined ? dtoLng : existingLng ?? undefined;

    if (!isOptionalBusinessCoordinatePairValid(mergedLat, mergedLng)) {
      throw new BadRequestException(
        'latitude and longitude must be provided together and form a valid coordinate pair',
      );
    }

    if (mergedLat === undefined && mergedLng === undefined) {
      return { latitude: null, longitude: null };
    }

    if (mergedLat !== undefined && mergedLng !== undefined) {
      assertValidBusinessCoordinatePair(mergedLat, mergedLng);
      await assertBusinessCoordinatesWithinCity(this.prisma, cityId, mergedLat, mergedLng);
      return { latitude: mergedLat, longitude: mergedLng };
    }

    return { latitude: undefined, longitude: undefined };
  }
}
