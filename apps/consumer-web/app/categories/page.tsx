import { permanentRedirect } from 'next/navigation';
import { getPreferenceLocaleFromCookies } from '@/lib/locale-preference';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import { cityCategoriesPath } from '@/lib/routes';

export default async function LegacyCategoriesIndexPage() {
  const locale = await getPreferenceLocaleFromCookies();
  permanentRedirect(cityCategoriesPath(locale, DEFAULT_CITY_SLUG));
}
