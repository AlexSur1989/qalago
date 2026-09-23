import { BadRequestException } from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Organic events that may carry optional interaction branch context (A.8.5). */
export const ORGANIC_BRANCH_LOCATION_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.VIEW_BUSINESS,
  AnalyticsEventType.BUSINESS_IMPRESSION,
  AnalyticsEventType.SEARCH_RESULT_IMPRESSION,
  AnalyticsEventType.CALL_CLICK,
  AnalyticsEventType.WHATSAPP_CLICK,
  AnalyticsEventType.ROUTE_CLICK,
  AnalyticsEventType.WEBSITE_CLICK,
  AnalyticsEventType.INSTAGRAM_CLICK,
  AnalyticsEventType.PROMOTION_VIEW,
  AnalyticsEventType.CATALOG_ITEM_IMPRESSION,
  AnalyticsEventType.CATALOG_ITEM_VIEW,
]);

/** Business-grain / city-grain events — branch attribution not allowed. */
export const ORGANIC_BRANCH_LOCATION_FORBIDDEN_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.SEARCH_PERFORMED,
  AnalyticsEventType.FAVORITE_ADD,
  AnalyticsEventType.FAVORITE_REMOVE,
  AnalyticsEventType.REVIEWS_VIEW,
  AnalyticsEventType.REVIEW_CREATED,
]);

export async function resolveValidatedOrganicBusinessLocationId(
  prisma: PrismaService,
  businessId: string,
  businessLocationId: string,
): Promise<string> {
  const trimmed = businessLocationId.trim();
  const location = await prisma.businessLocation.findFirst({
    where: { id: trimmed, businessId },
    select: { id: true },
  });
  if (!location) {
    throw new BadRequestException('businessLocationId does not belong to business');
  }
  return location.id;
}

/**
 * Ad client events: only explicit campaign destination (not runtime PBA/city resolution).
 */
export async function resolveAdEventBusinessLocationId(
  prisma: PrismaService,
  campaign: { businessId: string; destinationBusinessLocationId: string | null },
): Promise<string | null> {
  if (!campaign.destinationBusinessLocationId) {
    return null;
  }
  const location = await prisma.businessLocation.findFirst({
    where: {
      id: campaign.destinationBusinessLocationId,
      businessId: campaign.businessId,
    },
    select: { id: true },
  });
  return location?.id ?? null;
}
