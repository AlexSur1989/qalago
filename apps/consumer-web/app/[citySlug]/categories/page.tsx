import {
  permanentRedirectMisplacedLocalePath,
  permanentRedirectNeutralPublicPath,
} from '@/lib/locale-neutral-redirect';
import { isTopLevelLocaleSegment } from '@/lib/public-locale';

export default async function NeutralCityCategoriesRedirect({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectMisplacedLocalePath(citySlug, ['categories']);
  }
  await permanentRedirectNeutralPublicPath(`/${encodeURIComponent(citySlug)}/categories`);
}
