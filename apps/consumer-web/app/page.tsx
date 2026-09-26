import { permanentRedirect } from 'next/navigation';
import { getPreferenceLocaleFromCookies } from '@/lib/locale-preference';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import { cityHomePath } from '@/lib/routes';

/** Permanent redirect: default city landing with locale preference (no geolocation). */
export default async function RootPage() {
  const locale = await getPreferenceLocaleFromCookies();
  permanentRedirect(cityHomePath(locale, DEFAULT_CITY_SLUG));
}
