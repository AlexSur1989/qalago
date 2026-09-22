import { sliceToPublicLimit } from '../../common/utils/plan-entitlements.util';
import { PUBLIC_CATALOG_PREVIEW_LIMIT } from '../../common/constants/public-preview.constants';
import type { PublicCatalogItem } from './business-public-content.service';

export type BranchAssignmentRef = { locationId: string };

export type EffectiveCatalogDto = {
  activeLocationId: string | null;
  sections: Array<{ id: string; title: string; sortOrder: number }>;
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    price: string | null;
    imageUrl: string | null;
    sortOrder: number;
    sectionId: string | null;
    section: {
      id: string;
      title: string;
      sortOrder: number;
    } | null;
  }>;
  totalCount: number;
};

/** Zero assignments = all branches; otherwise must include active location. */
export function isCatalogEntityEligibleAtLocation(
  assignments: readonly BranchAssignmentRef[],
  activeLocationId: string | null,
): boolean {
  if (activeLocationId == null) {
    return true;
  }
  if (assignments.length === 0) {
    return true;
  }
  return assignments.some((row) => row.locationId === activeLocationId);
}

export function buildEffectiveCatalogDto(
  activeLocationId: string | null,
  publishedItems: PublicCatalogItem[],
  allSections: Array<{ id: string; title: string; sortOrder: number; isActive: boolean }>,
  serializeItem: (item: PublicCatalogItem) => EffectiveCatalogDto['items'][number],
): EffectiveCatalogDto {
  const sectionIds = new Set(
    publishedItems.map((item) => item.groupId).filter((id): id is string => Boolean(id)),
  );
  const sections = allSections
    .filter((section) => section.isActive && sectionIds.has(section.id))
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ru') || a.id.localeCompare(b.id),
    )
    .map(({ id, title, sortOrder }) => ({ id, title, sortOrder }));

  const previewItems = sliceToPublicLimit(publishedItems, PUBLIC_CATALOG_PREVIEW_LIMIT);

  return {
    activeLocationId,
    sections,
    items: previewItems.map(serializeItem),
    totalCount: publishedItems.length,
  };
}
