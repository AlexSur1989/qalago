import { BadRequestException } from '@nestjs/common';
import { BusinessPermission } from '@prisma/client';
import { UpdateBusinessDto } from '../../modules/businesses/dto/business.dto';

export const ALL_BUSINESS_PERMISSIONS = Object.values(BusinessPermission);

export const PROFILE_FIELDS = new Set([
  'title',
  'shortDesc',
  'description',
  'address',
  'latitude',
  'longitude',
  'phone',
  'whatsapp',
  'instagram',
  'website',
  'coverImageUrl',
]);

export const HOURS_FIELDS = new Set(['workHours']);

export function normalizeBusinessPermissions(
  permissions: BusinessPermission[],
): BusinessPermission[] {
  const set = new Set(permissions);
  if (set.has(BusinessPermission.ANALYTICS_EXPORT)) {
    set.add(BusinessPermission.ANALYTICS_VIEW);
  }
  return [...set];
}

export function validatePermissionDependencies(permissions: BusinessPermission[]) {
  const normalized = normalizeBusinessPermissions(permissions);
  const invalid = permissions.filter((p) => !normalized.includes(p));
  if (invalid.length > 0) {
    throw new BadRequestException('Invalid permission dependencies');
  }
  if (
    permissions.includes(BusinessPermission.ANALYTICS_EXPORT) &&
    !permissions.includes(BusinessPermission.ANALYTICS_VIEW)
  ) {
    throw new BadRequestException('ANALYTICS_EXPORT requires ANALYTICS_VIEW');
  }
}

export function getRequiredPermissionsForPatch(dto: UpdateBusinessDto): BusinessPermission[] {
  const required = new Set<BusinessPermission>();
  for (const key of Object.keys(dto) as (keyof UpdateBusinessDto)[]) {
    if (dto[key] === undefined) continue;
    if (PROFILE_FIELDS.has(key)) {
      required.add(BusinessPermission.BUSINESS_PROFILE_EDIT);
    }
    if (HOURS_FIELDS.has(key)) {
      required.add(BusinessPermission.BUSINESS_HOURS_EDIT);
    }
    if (key === 'subcategoryIds') {
      required.add(BusinessPermission.BUSINESS_PROFILE_EDIT);
    }
  }
  return [...required];
}

export function ownerHasAllPermissions(): BusinessPermission[] {
  return ALL_BUSINESS_PERMISSIONS;
}
