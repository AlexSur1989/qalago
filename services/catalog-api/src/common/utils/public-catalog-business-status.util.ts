import { BadRequestException } from '@nestjs/common';
import { BusinessStatus } from '@prisma/client';

/** Public GET /businesses — only ACTIVE (or omitted) status is allowed. */
export function isPublicCatalogBusinessStatusAllowed(
  status?: BusinessStatus | null,
): boolean {
  return status == null || status === BusinessStatus.ACTIVE;
}

export function assertPublicCatalogBusinessStatus(
  status?: BusinessStatus,
): BusinessStatus {
  if (!isPublicCatalogBusinessStatusAllowed(status)) {
    throw new BadRequestException(
      'Public catalog accepts only ACTIVE businesses; omit status or use status=ACTIVE',
    );
  }
  return BusinessStatus.ACTIVE;
}
