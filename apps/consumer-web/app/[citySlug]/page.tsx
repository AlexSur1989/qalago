import { isTopLevelLocaleSegment } from '@/lib/public-locale';
import {
  permanentRedirectLocaleRoot,
  permanentRedirectNeutralPublicPath,
  redirectIfCitySlugIsLocaleSegment,
} from '@/lib/locale-neutral-redirect';

export default async function NeutralCityHomeRedirect({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectLocaleRoot(citySlug);
  }
  await redirectIfCitySlugIsLocaleSegment(citySlug);
  await permanentRedirectNeutralPublicPath(`/${encodeURIComponent(citySlug)}`);
}
