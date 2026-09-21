import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

/** Public consumer surfaces — moderation-hidden rows are owner/admin only. */
export const PUBLIC_BUSINESS_IMAGE_WHERE = {
  moderationHidden: false,
} satisfies Prisma.BusinessImageWhereInput;

export type ListBusinessImagesScope = 'all' | 'brand';

export type ListBusinessImagesFilter = {
  scope?: ListBusinessImagesScope;
  locationId?: string;
};

export function buildBusinessImagesListWhere(
  businessId: string,
  filter: ListBusinessImagesFilter = {},
): Prisma.BusinessImageWhereInput {
  const trimmedLocationId = filter.locationId?.trim();
  if (trimmedLocationId) {
    if (filter.scope === 'brand') {
      throw new BadRequestException('Use either scope=brand or locationId, not both');
    }
    return { businessId, locationId: trimmedLocationId };
  }
  if (filter.scope === 'brand') {
    return { businessId, locationId: null };
  }
  return { businessId };
}

export async function resolveAttachLocationId(
  findLocation: (args: {
    where: { id: string; businessId: string };
    select: { id: true };
  }) => Promise<{ id: string } | null>,
  businessId: string,
  locationId?: string | null,
): Promise<string | null> {
  const trimmed = locationId?.trim();
  if (!trimmed) {
    return null;
  }
  const location = await findLocation({
    where: { id: trimmed, businessId },
    select: { id: true },
  });
  if (!location) {
    throw new BadRequestException('Business location not found for this business');
  }
  return location.id;
}

export function assertBrandCoverOnly(asCover: boolean, locationId: string | null): void {
  if (asCover && locationId) {
    throw new BadRequestException('Branch images cannot be set as business cover');
  }
}

export function assertImageEligibleForBrandCover(locationId: string | null): void {
  if (locationId) {
    throw new BadRequestException('Only shared brand images can be used as business cover');
  }
}
