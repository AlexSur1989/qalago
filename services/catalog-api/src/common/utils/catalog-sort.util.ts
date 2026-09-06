export type CatalogSortableItem = {
  id: string;
  sortOrder?: number | null;
  title?: string | null;
  createdAt?: Date | string;
  group?: {
    sortOrder?: number | null;
    title?: string | null;
  } | null;
};

export function compareCatalogItems(a: CatalogSortableItem, b: CatalogSortableItem): number {
  const groupSortA = a.group?.sortOrder ?? 999_999;
  const groupSortB = b.group?.sortOrder ?? 999_999;
  if (groupSortA !== groupSortB) return groupSortA - groupSortB;

  const groupTitleA = a.group?.title ?? '';
  const groupTitleB = b.group?.title ?? '';
  if (groupTitleA !== groupTitleB) {
    return groupTitleA.localeCompare(groupTitleB, 'ru');
  }

  const itemSortDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (itemSortDiff !== 0) return itemSortDiff;

  const titleDiff = (a.title ?? '').localeCompare(b.title ?? '', 'ru');
  if (titleDiff !== 0) return titleDiff;

  const aCreated =
    a.createdAt instanceof Date
      ? a.createdAt.getTime()
      : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
  const bCreated =
    b.createdAt instanceof Date
      ? b.createdAt.getTime()
      : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;
  if (aCreated !== bCreated) return aCreated - bCreated;

  return a.id.localeCompare(b.id);
}

export function sortCatalogItems<T extends CatalogSortableItem>(items: readonly T[]): T[] {
  return [...items].sort(compareCatalogItems);
}
