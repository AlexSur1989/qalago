import { permanentRedirect } from 'next/navigation';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import { cityCategoriesPath } from '@/lib/routes';

export default function LegacyCategoriesIndexPage() {
  permanentRedirect(cityCategoriesPath(DEFAULT_CITY_SLUG));
}
