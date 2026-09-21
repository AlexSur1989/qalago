import { permanentRedirect } from 'next/navigation';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import { cityHomePath } from '@/lib/routes';

/** Permanent redirect: MVP default city landing (no geolocation). */
export default function RootPage() {
  permanentRedirect(cityHomePath(DEFAULT_CITY_SLUG));
}
