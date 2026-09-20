const REVIEW_TEXT_MAX_LENGTH = 2000;

/** Plain-text review body normalization (Stage 6.11D.2). */
export function normalizeReviewText(text?: string | null): string | null | undefined {
  if (text === undefined) return undefined;
  if (text === null) return null;
  const normalized = text.normalize('NFC').trim();
  if (!normalized.length) return null;
  return normalized.slice(0, REVIEW_TEXT_MAX_LENGTH);
}
