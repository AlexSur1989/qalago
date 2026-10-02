import type { AdServeItemDto } from './ads-types';

/** Mirrors mobile `collectPaidBusinessIds` for organic dedupe. */
export function collectPaidBusinessIds(items: AdServeItemDto[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    const id = item.business?.id?.trim();
    if (id) ids.add(id);
  }
  return ids;
}
