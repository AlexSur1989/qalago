import { buildSafePublicQueryString } from '@/lib/locale-path';
import {
  permanentRedirectMisplacedLocalePath,
  permanentRedirectNeutralPublicPath,
} from '@/lib/locale-neutral-redirect';
import { isTopLevelLocaleSegment } from '@/lib/public-locale';

export default async function NeutralCitySearchRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { citySlug } = await params;
  const sp = await searchParams;
  const query = buildSafePublicQueryString(sp);
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectMisplacedLocalePath(citySlug, ['search']);
  }
  await permanentRedirectNeutralPublicPath(`/${encodeURIComponent(citySlug)}/search`, query);
}
