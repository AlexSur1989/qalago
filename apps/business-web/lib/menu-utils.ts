import type { ManageMenuSection } from './api';
import type { AppLocale } from './locale';
import { menuUncategorizedLabel } from './presentation';

export function shouldShowSeeAll(totalCount: number, previewCount: number): boolean {
  return totalCount > previewCount;
}

export function menuSectionLabel(
  locale: AppLocale,
  sectionId: string | null | undefined,
  sections: ManageMenuSection[],
): string {
  if (!sectionId || sectionId === 'uncategorized') return menuUncategorizedLabel(locale);
  return sections.find((section) => section.id === sectionId)?.title ?? menuUncategorizedLabel(locale);
}

export function hasMoreMenuPages(page: number, totalPages: number): boolean {
  return page < totalPages;
}
