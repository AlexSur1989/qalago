import { cookies } from 'next/headers';
import { LOCALE_COOKIE_NAME, normalizeLocale, type AppLocale } from './locale';

export async function getServerLocale(): Promise<AppLocale> {
  const jar = await cookies();
  return normalizeLocale(jar.get(LOCALE_COOKIE_NAME)?.value);
}
