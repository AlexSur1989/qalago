import { buildSafePublicQueryString } from '@/lib/locale-path';
import {
  permanentRedirectMisplacedLocalePath,
  permanentRedirectNeutralPublicPath,
} from '@/lib/locale-neutral-redirect';
import { isTopLevelLocaleSegment } from '@/lib/public-locale';

export default async function NeutralSubcategoryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string; categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { citySlug, categorySlug, subcategorySlug } = await params;
  const query = buildSafePublicQueryString(await searchParams);
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectMisplacedLocalePath(citySlug, [categorySlug, subcategorySlug]);
  }
  await permanentRedirectNeutralPublicPath(
    `/${encodeURIComponent(citySlug)}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subcategorySlug)}`,
    query,
  );
}
