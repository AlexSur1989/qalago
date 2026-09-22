/** Public effective media (Stage 6.12A.7.7.3). Single resolver for detail + /photos. */

export type EffectiveMediaImageScope = 'brand' | 'branch';

export type VisibleBusinessImageRow = {
  id: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: Date;
  locationId: string | null;
};

export type PublicEffectiveMediaItem = {
  id: string;
  imageUrl: string;
  sortOrder: number;
  locationId: string | null;
  scope: EffectiveMediaImageScope;
};

export type EffectiveMediaDto = {
  activeLocationId: string | null;
  coverImageUrl: string | null;
  galleryPreview: {
    items: PublicEffectiveMediaItem[];
    totalCount: number;
  };
};

export type EffectivePublicMediaMode = 'business_wide' | 'active_location';

function compareBusinessImages(
  a: VisibleBusinessImageRow,
  b: VisibleBusinessImageRow,
): number {
  return (
    a.sortOrder - b.sortOrder ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

/** Moderation must be applied before rows reach this helper. */
export function selectEligibleVisibleImages(
  images: VisibleBusinessImageRow[],
  activeLocationId: string | null,
  mode: EffectivePublicMediaMode,
): VisibleBusinessImageRow[] {
  if (mode === 'business_wide') {
    return [...images].sort(compareBusinessImages);
  }

  const branch = activeLocationId
    ? images.filter((row) => row.locationId === activeLocationId).sort(compareBusinessImages)
    : [];
  const brand = images.filter((row) => row.locationId === null).sort(compareBusinessImages);

  if (!activeLocationId) {
    return brand;
  }

  return [...branch, ...brand];
}

export function toPublicEffectiveMediaItem(
  row: VisibleBusinessImageRow,
  activeLocationId: string | null,
  mode: EffectivePublicMediaMode,
): PublicEffectiveMediaItem {
  const scope: EffectiveMediaImageScope =
    mode === 'active_location'
      ? row.locationId === activeLocationId
        ? 'branch'
        : 'brand'
      : row.locationId
        ? 'branch'
        : 'brand';

  return {
    id: row.id,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    locationId: row.locationId,
    scope,
  };
}

/**
 * Cover for effectiveMedia (read-only; never writes Business.coverImageUrl).
 * Uses moderated + scope-eligible ordering before plan cap.
 */
export function resolveEffectiveMediaCoverUrl(
  brandCoverImageUrl: string | null,
  eligibleOrdered: VisibleBusinessImageRow[],
  activeLocationId: string | null,
): string | null {
  const branch = activeLocationId
    ? eligibleOrdered.filter((row) => row.locationId === activeLocationId)
    : [];
  if (branch.length > 0) {
    return branch[0]!.imageUrl;
  }

  const brandImages = eligibleOrdered.filter((row) => row.locationId === null);
  const brandUrls = new Set(brandImages.map((row) => row.imageUrl));
  if (brandCoverImageUrl && brandUrls.has(brandCoverImageUrl)) {
    return brandCoverImageUrl;
  }
  return brandImages[0]?.imageUrl ?? null;
}

export function buildEffectiveMediaDto(
  eligibleOrdered: VisibleBusinessImageRow[],
  activeLocationId: string | null,
  brandCoverImageUrl: string | null,
  publishedAfterPlanCap: VisibleBusinessImageRow[],
  previewItems: VisibleBusinessImageRow[],
): EffectiveMediaDto {
  return {
    activeLocationId,
    coverImageUrl: resolveEffectiveMediaCoverUrl(
      brandCoverImageUrl,
      eligibleOrdered,
      activeLocationId,
    ),
    galleryPreview: {
      items: previewItems.map((row) =>
        toPublicEffectiveMediaItem(row, activeLocationId, 'active_location'),
      ),
      totalCount: publishedAfterPlanCap.length,
    },
  };
}
