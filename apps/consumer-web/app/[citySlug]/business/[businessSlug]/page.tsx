import { buildSafePublicQueryString } from '@/lib/locale-path';
import {
  permanentRedirectMisplacedLocalePath,
  permanentRedirectNeutralPublicPath,
} from '@/lib/locale-neutral-redirect';
import { isTopLevelLocaleSegment } from '@/lib/public-locale';

export default async function NeutralBusinessRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string; businessSlug: string }>;
  searchParams: Promise<{ locationId?: string | string[] }>;
}) {
  const { citySlug, businessSlug } = await params;
  const query = buildSafePublicQueryString(await searchParams);
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectMisplacedLocalePath(citySlug, ['business', businessSlug]);
  }
  await permanentRedirectNeutralPublicPath(
    `/${encodeURIComponent(citySlug)}/business/${encodeURIComponent(businessSlug)}`,
    query,
  );
}
