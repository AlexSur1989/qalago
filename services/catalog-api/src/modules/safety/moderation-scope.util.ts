import { ContentReportTargetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export async function resolveModerationTargetCityId(
  prisma: PrismaService,
  targetType: ContentReportTargetType,
  targetId: string,
): Promise<string | null> {
  switch (targetType) {
    case ContentReportTargetType.BUSINESS: {
      const row = await prisma.business.findUnique({
        where: { id: targetId },
        select: { cityId: true },
      });
      return row?.cityId ?? null;
    }
    case ContentReportTargetType.REVIEW: {
      const row = await prisma.review.findUnique({
        where: { id: targetId },
        select: { business: { select: { cityId: true } } },
      });
      return row?.business.cityId ?? null;
    }
    case ContentReportTargetType.PROMOTION: {
      const row = await prisma.promotion.findUnique({
        where: { id: targetId },
        select: { business: { select: { cityId: true } } },
      });
      return row?.business.cityId ?? null;
    }
    case ContentReportTargetType.MEDIA: {
      const row = await prisma.businessImage.findUnique({
        where: { id: targetId },
        select: { business: { select: { cityId: true } } },
      });
      return row?.business.cityId ?? null;
    }
    case ContentReportTargetType.USER:
      return null;
    default:
      return null;
  }
}
