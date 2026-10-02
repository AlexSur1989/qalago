import {
  HomeSectionPlatform,
  HOME_SECTION_CANONICAL_FALLBACK,
  normalizePublicHomeSections,
  type PublicHomeSectionDto,
} from '@qalago/shared-types';
import { getApiBaseUrl } from './public-config';

const API_BASE = getApiBaseUrl();

/** @deprecated Use HOME_SECTION_CANONICAL_FALLBACK from @qalago/shared-types */
export const HOME_SECTION_CONFIG_FALLBACK = HOME_SECTION_CANONICAL_FALLBACK;

/** Admin-controlled layout — always fresh (no long ISR) so config changes apply on refresh. */
export async function fetchPublicHomeSections(
  citySlug: string,
  platform: HomeSectionPlatform = HomeSectionPlatform.WEB,
): Promise<PublicHomeSectionDto[]> {
  const url = `${API_BASE}/home/sections?citySlug=${encodeURIComponent(citySlug)}&platform=${encodeURIComponent(platform)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Home sections fetch failed: ${res.status}`);
  }
  const rows = (await res.json()) as PublicHomeSectionDto[];
  return normalizePublicHomeSections(rows);
}

/** Safe fetch for home layout — never throws. */
export async function fetchPublicHomeSectionsSafe(
  citySlug: string,
): Promise<{ ok: true; sections: PublicHomeSectionDto[] } | { ok: false }> {
  try {
    const sections = await fetchPublicHomeSections(citySlug, HomeSectionPlatform.WEB);
    return { ok: true, sections };
  } catch {
    return { ok: false };
  }
}

export { HOME_SECTION_CANONICAL_FALLBACK, normalizePublicHomeSections };

export function orderedSectionTypes(sections: PublicHomeSectionDto[]) {
  return normalizePublicHomeSections(sections).map((s) => s.type);
}
