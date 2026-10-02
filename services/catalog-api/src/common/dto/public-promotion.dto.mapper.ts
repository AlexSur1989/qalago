/**
 * KZ-C.3 — public promotion feed/detail DTOs.
 */

import { toPublicBusinessSummaryDto } from './public-business.dto.mapper';

export type PublicPromotionItemDto = {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discountText: string | null;
  startDate: Date | null;
  endDate: Date | null;
  contextLocationId?: string | null;
  business?: ReturnType<typeof toPublicBusinessSummaryDto>;
};

type PromotionRow = Record<string, unknown> & {
  id: string;
  businessId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountText?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  business?: Record<string, unknown>;
  contextLocationId?: string | null;
};

export function toPublicPromotionItemDto(row: PromotionRow): PublicPromotionItemDto {
  const dto: PublicPromotionItemDto = {
    id: row.id,
    businessId: row.businessId,
    title: row.title,
    description: row.description ?? null,
    imageUrl: row.imageUrl ?? null,
    discountText: row.discountText ?? null,
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
  };
  if (row.contextLocationId != null) {
    dto.contextLocationId = row.contextLocationId;
  }
  if (row.business) {
    dto.business = toPublicBusinessSummaryDto(row.business);
  }
  return dto;
}

export function mapPublicPromotionItems(
  items: readonly (PromotionRow | Record<string, unknown>)[],
): PublicPromotionItemDto[] {
  return items.map((row) => toPublicPromotionItemDto(row as PromotionRow));
}
