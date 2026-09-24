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

/** Compare application fields against a BusinessLocation row (A.9.4.1B). */
export function businessLocationMatchesApplicationDedupe(
  location: { cityId: string; address: string },
  businessTitle: string,
  applicationCityId: string,
  title: string,
  address: string,
): boolean {
  if (location.cityId !== applicationCityId) return false;
  return (
    normalizeApplicationText(businessTitle) === normalizeApplicationText(title) &&
    normalizeApplicationText(location.address) === normalizeApplicationText(address)
  );
}

/**
 * @deprecated Use businessLocationMatchesApplicationDedupe — parent Business.cityId is not physical authority.
 */
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
