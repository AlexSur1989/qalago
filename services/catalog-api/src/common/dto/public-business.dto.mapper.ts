/**
 * KZ-C.3 — explicit public business DTO mappers (guest/unauthenticated catalog).
 * Do not spread raw Prisma Business rows into public responses.
 */

import type { EffectivePhysicalDto } from '../../modules/businesses/business-effective-physical.util';
import type { PublicReviewDto } from './public-review.dto.mapper';

const INTERNAL_BUSINESS_SCALAR_KEYS = [
  'ownerId',
  'status',
  'isFeatured',
  'featuredSlot',
  'planTier',
  'planExpiresAt',
  'createdAt',
  'updatedAt',
] as const;

export type PublicCategoryRefDto = {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  nameRu?: string | null;
  nameKk?: string | null;
};

export type PublicReviewsPreviewBlockDto = {
  items: PublicReviewDto[];
  totalCount: number;
};

export type PublicPreviewListBlockDto = {
  items: unknown[];
  totalCount: number;
};

export type PublicBusinessDetailDto = PublicBusinessCardDto & {
  description: string | null;
  subcategories: unknown[];
  galleryPreview?: PublicPreviewListBlockDto;
  catalogPreview?: PublicPreviewListBlockDto;
  promotionsPreview?: PublicPreviewListBlockDto;
  reviewsPreview?: PublicReviewsPreviewBlockDto;
  effectivePhysical: EffectivePhysicalDto;
  effectiveMedia?: unknown;
  effectiveCatalog?: unknown;
  effectivePromotions?: unknown;
  activeLocationId?: string | null;
};

export type PublicBusinessCardDto = {
  id: string;
  categoryId?: string;
  title: string;
  slug: string;
  shortDesc?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  website?: string | null;
  coverImageUrl?: string | null;
  workHours?: Record<string, string> | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cityId?: string;
  locationId?: string | null;
  contextLocationId?: string | null;
  distanceMeters?: number | null;
  category?: PublicCategoryRefDto | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  businessSubcategories?: unknown[];
};

export type PublicBusinessSummaryDto = Pick<
  PublicBusinessCardDto,
  | 'id'
  | 'title'
  | 'slug'
  | 'phone'
  | 'whatsapp'
  | 'instagram'
  | 'website'
  | 'workHours'
  | 'coverImageUrl'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'contextLocationId'
>;

function num(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value != null && 'toNumber' in value) {
    return Number((value as { toNumber: () => number }).toNumber());
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function stripInternalBusinessScalars<T extends Record<string, unknown>>(
  row: T,
): Omit<T, (typeof INTERNAL_BUSINESS_SCALAR_KEYS)[number]> {
  const out = { ...row };
  for (const key of INTERNAL_BUSINESS_SCALAR_KEYS) {
    delete out[key];
  }
  return out as Omit<T, (typeof INTERNAL_BUSINESS_SCALAR_KEYS)[number]>;
}

export function toPublicBusinessSummaryDto(
  source: Record<string, unknown>,
): PublicBusinessSummaryDto {
  return {
    id: String(source.id),
    title: String(source.title ?? ''),
    slug: String(source.slug ?? ''),
    phone: (source.phone as string | null | undefined) ?? null,
    whatsapp: (source.whatsapp as string | null | undefined) ?? null,
    instagram: (source.instagram as string | null | undefined) ?? null,
    website: (source.website as string | null | undefined) ?? null,
    workHours: (source.workHours as Record<string, string> | null | undefined) ?? null,
    coverImageUrl: (source.coverImageUrl as string | null | undefined) ?? null,
    address: (source.address as string | null | undefined) ?? null,
    latitude: num(source.latitude),
    longitude: num(source.longitude),
    contextLocationId: (source.contextLocationId as string | null | undefined) ?? null,
  };
}

export function toPublicBusinessCardDto(source: Record<string, unknown>): PublicBusinessCardDto {
  const base = toPublicBusinessSummaryDto(source);
  const categoryRaw = source.category as Record<string, unknown> | null | undefined;
  const category: PublicCategoryRefDto | null = categoryRaw
    ? {
        id: String(categoryRaw.id),
        title: String(categoryRaw.title ?? ''),
        slug: String(categoryRaw.slug ?? ''),
        icon: (categoryRaw.icon as string | null | undefined) ?? null,
        nameRu: (categoryRaw.nameRu as string | null | undefined) ?? undefined,
        nameKk: (categoryRaw.nameKk as string | null | undefined) ?? undefined,
      }
    : null;

  return {
    ...base,
    categoryId: source.categoryId != null ? String(source.categoryId) : undefined,
    shortDesc: (source.shortDesc as string | null | undefined) ?? null,
    cityId: source.cityId != null ? String(source.cityId) : undefined,
    locationId: (source.locationId as string | null | undefined) ?? null,
    distanceMeters:
      source.distanceMeters != null ? num(source.distanceMeters) : undefined,
    category,
    averageRating:
      source.averageRating != null ? num(source.averageRating) : undefined,
    reviewCount:
      source.reviewCount != null ? num(source.reviewCount) : undefined,
    businessSubcategories: source.businessSubcategories as unknown[] | undefined,
  };
}

export function mapPublicBusinessListItems<T extends Record<string, unknown>>(
  items: readonly T[],
): PublicBusinessCardDto[] {
  return items.map((item) => toPublicBusinessCardDto(item));
}

/** Detail payload after previews/effective* blocks are attached. */
export function toPublicBusinessDetailDto(
  source: Record<string, unknown>,
): PublicBusinessDetailDto {
  const card = toPublicBusinessCardDto(source);
  const detail: PublicBusinessDetailDto = {
    ...card,
    description: (source.description as string | null | undefined) ?? null,
    subcategories: (source.subcategories as unknown[]) ?? [],
    coverImageUrl:
      (source.coverImageUrl as string | null | undefined) ?? card.coverImageUrl,
    galleryPreview: source.galleryPreview as PublicPreviewListBlockDto | undefined,
    catalogPreview: source.catalogPreview as PublicPreviewListBlockDto | undefined,
    promotionsPreview: source.promotionsPreview as PublicPreviewListBlockDto | undefined,
    reviewsPreview: source.reviewsPreview as PublicReviewsPreviewBlockDto | undefined,
    effectivePhysical: source.effectivePhysical as EffectivePhysicalDto,
    effectiveMedia: source.effectiveMedia,
    effectiveCatalog: source.effectiveCatalog,
    effectivePromotions: source.effectivePromotions,
    activeLocationId: (source.activeLocationId as string | null | undefined) ?? null,
    averageRating:
      source.averageRating != null
        ? num(source.averageRating)
        : card.averageRating,
    reviewCount:
      source.reviewCount != null ? num(source.reviewCount) : card.reviewCount,
  };
  return stripInternalBusinessScalars(detail) as PublicBusinessDetailDto;
}
