export type PresentationLocale = 'kk' | 'ru';

export function resolvePresentationLocale(
  hint: string | null | undefined,
): PresentationLocale {
  if (!hint) return 'kk';
  const lower = hint.trim().toLowerCase();
  if (lower.startsWith('kk')) return 'kk';
  if (lower.startsWith('ru')) return 'ru';
  return 'kk';
}
