import type { AppLocale } from '@/lib/locale';

export function cityDisplayName(
  city: { nameRu: string; nameKk?: string | null },
  locale: AppLocale,
): string {
  const ru = city.nameRu.trim();
  const kk = city.nameKk?.trim();
  if (locale === 'kk') return kk || ru;
  return ru;
}
