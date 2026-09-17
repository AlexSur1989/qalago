/** Stage 6.11B.1 — consumer catalog search query normalization (DB matching). */

export const CATALOG_SEARCH_MAX_LENGTH = 100;

/**
 * Trim, collapse internal whitespace; empty → null.
 * Preserves Unicode / Kazakh letters; no lowercasing (Prisma `mode: insensitive`).
 */
export function normalizeCatalogSearchQuery(raw?: string | null): string | null {
  if (raw == null) return null;
  const collapsed = raw.trim().replace(/\s+/g, ' ');
  if (collapsed.length === 0) return null;
  return collapsed;
}

export function catalogSearchNeedle(raw?: string | null): string | null {
  const normalized = normalizeCatalogSearchQuery(raw);
  if (!normalized) return null;
  return normalized.toLocaleLowerCase();
}

export function publicServiceItemMatchesCatalogSearch(
  item: {
    title: string;
    titleKk?: string | null;
    description?: string | null;
    descriptionKk?: string | null;
  },
  rawQuery?: string | null,
): boolean {
  const needle = catalogSearchNeedle(rawQuery);
  if (!needle) return true;
  const fields = [item.title, item.titleKk, item.description, item.descriptionKk];
  return fields.some((field) => field != null && field.toLocaleLowerCase().includes(needle));
}
