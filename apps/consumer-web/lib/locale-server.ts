import { cookies } from 'next/headers';
import { normalizeLocale, type AppLocale } from './locale';

export async function getServerLocale(): Promise<AppLocale> {
  const jar = await cookies();
  return normalizeLocale(jar.get('qalago_locale')?.value);
}
