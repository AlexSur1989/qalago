import type { ManageMenuSection } from './api';

export function shouldShowSeeAll(totalCount: number, previewCount: number): boolean {
  return totalCount > previewCount;
}

export function menuSectionLabel(
  sectionId: string | null | undefined,
  sections: ManageMenuSection[],
): string {
  if (!sectionId || sectionId === 'uncategorized') return 'Без группы';
  return sections.find((section) => section.id === sectionId)?.title ?? 'Без группы';
}

export function hasMoreMenuPages(page: number, totalPages: number): boolean {
  return page < totalPages;
}
