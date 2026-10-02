import type { AdServeItemDto } from './ads-types';

export function collectPaidBusinessIds(items: Iterable<AdServeItemDto>): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    const id = item.business?.id;
    if (id) ids.add(id);
  }
  return ids;
}

/** Skip duplicate card directly under sponsored block (mobile parity). */
export function categoryAllPlacesAfterSponsored<T extends { id: string }>(
  allPlaces: T[],
  sponsoredBusinessIdsInOrder: Iterable<string>,
): T[] {
  if (!allPlaces.length) return allPlaces;
  const sponsored = [...sponsoredBusinessIdsInOrder];
  if (!sponsored.length) return allPlaces;
  const lastSponsoredId = sponsored[sponsored.length - 1];
  if (allPlaces[0]?.id !== lastSponsoredId) return allPlaces;
  return allPlaces.slice(1);
}

export function filterOrganicByPaidIds<T extends { id: string }>(
  items: T[],
  paidIds: Set<string>,
): T[] {
  return items.filter((b) => !paidIds.has(b.id));
}
