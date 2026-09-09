import { createHash } from 'crypto';

/** Conservative text normalization for duplicate detection (no transliteration). */
export function normalizeApplicationText(value: string): string {
  return value
    .trim()
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('und');
}

/** Server-generated dedupe fingerprint: cityId + normalized title + normalized address. */
export function buildApplicationDedupeKey(
  cityId: string,
  title: string,
  address: string,
): string {
  const payload = [
    cityId,
    normalizeApplicationText(title),
    normalizeApplicationText(address),
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}

/** Compare application fields against an existing business record. */
export function businessMatchesApplicationDedupe(
  business: { cityId: string; title: string; address: string },
  cityId: string,
  title: string,
  address: string,
): boolean {
  if (business.cityId !== cityId) return false;
  return (
    normalizeApplicationText(business.title) === normalizeApplicationText(title) &&
    normalizeApplicationText(business.address) === normalizeApplicationText(address)
  );
}
