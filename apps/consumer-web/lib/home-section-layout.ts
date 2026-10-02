import { HomeSectionType, type PublicHomeSectionDto } from '@qalago/shared-types';
import {
  fetchPublicHomeSectionsSafe,
  HOME_SECTION_CANONICAL_FALLBACK,
  normalizePublicHomeSections,
  orderedSectionTypes,
} from './home-sections-api';

export type HomeSectionLayoutResult = {
  sections: PublicHomeSectionDto[];
  usedConfigFallback: boolean;
};

export async function resolveHomeSectionLayout(citySlug: string): Promise<HomeSectionLayoutResult> {
  const result = await fetchPublicHomeSectionsSafe(citySlug);
  if (!result.ok) {
    return {
      sections: normalizePublicHomeSections(HOME_SECTION_CANONICAL_FALLBACK),
      usedConfigFallback: true,
    };
  }
  const sections = normalizePublicHomeSections(result.sections);
  if (sections.length === 0) {
    return {
      sections: normalizePublicHomeSections(HOME_SECTION_CANONICAL_FALLBACK),
      usedConfigFallback: true,
    };
  }
  return { sections, usedConfigFallback: false };
}

export function sectionTypesFromLayout(layout: HomeSectionLayoutResult): HomeSectionType[] {
  return orderedSectionTypes(layout.sections);
}

export function layoutIncludes(type: HomeSectionType, layout: HomeSectionLayoutResult): boolean {
  return layout.sections.some((s) => s.type === type);
}
