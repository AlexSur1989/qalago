import { ContentReportTargetType } from '@prisma/client';
import { resolveBusinessPrimaryCityId } from '../../common/utils/business-context-city.util';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Moderation target city for staff scope (A.9.4.5C): branch when known, else primary BL city.
 */
export async function resolveModerationTargetCityId(
  prisma: PrismaService,
  targetType: ContentReportTargetType,
  targetId: string,
): Promise<string | null> {
  switch (targetType) {
    case ContentReportTargetType.BUSINESS:
      return resolveBusinessPrimaryCityId(prisma, targetId);
    case ContentReportTargetType.REVIEW: {
      const row = await prisma.review.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      return row ? resolveBusinessPrimaryCityId(prisma, row.businessId) : null;
    }
    case ContentReportTargetType.PROMOTION: {
      const row = await prisma.promotion.findUnique({
        where: { id: targetId },
        select: { businessId: true },
      });
      return row ? resolveBusinessPrimaryCityId(prisma, row.businessId) : null;
    }
    case ContentReportTargetType.MEDIA: {
      const row = await prisma.businessImage.findUnique({
        where: { id: targetId },
        select: { businessId: true, locationId: true },
      });
      if (!row) return null;
      if (row.locationId) {
        const branch = await prisma.businessLocation.findFirst({
          where: { id: row.locationId, businessId: row.businessId },
          select: { cityId: true },
        });
        if (branch?.cityId) return branch.cityId;
      }
      return resolveBusinessPrimaryCityId(prisma, row.businessId);
    }
    case ContentReportTargetType.USER:
      return null;
    default:
      return null;
  }
}
