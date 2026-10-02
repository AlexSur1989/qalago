import type { HomeSectionPlatform, PublicHomeSectionDto } from '@qalago/shared-types';
import { getApiBaseUrl } from './public-config';

const API_BASE = getApiBaseUrl();

/** CW.3 public home section config (CW.4 will render from this). */
export async function fetchPublicHomeSections(
  citySlug: string,
  platform: HomeSectionPlatform,
): Promise<PublicHomeSectionDto[]> {
  const url = `${API_BASE}/home/sections?citySlug=${encodeURIComponent(citySlug)}&platform=${encodeURIComponent(platform)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Home sections fetch failed: ${res.status}`);
  }
  return res.json() as Promise<PublicHomeSectionDto[]>;
}
