import { buildSafePublicQueryString } from '@/lib/locale-path';
import {
  permanentRedirectMisplacedLocalePath,
  permanentRedirectNeutralPublicPath,
} from '@/lib/locale-neutral-redirect';
import { isTopLevelLocaleSegment } from '@/lib/public-locale';

export default async function NeutralCategoryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { citySlug, categorySlug } = await params;
  const query = buildSafePublicQueryString(await searchParams);
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectMisplacedLocalePath(citySlug, [categorySlug]);
  }
  await permanentRedirectNeutralPublicPath(
    `/${encodeURIComponent(citySlug)}/${encodeURIComponent(categorySlug)}`,
    query,
  );
}
