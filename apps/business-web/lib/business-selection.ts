import type { MyBusinessItem } from './api';
import { SELECTED_BUSINESS_KEY } from './api';

/** Selection hint only — not authorization (BIZ.2 / BIZ.9 HOTFIX 2). */
export function readStoredSelectedBusinessId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_BUSINESS_KEY);
}

export function resolveSelectedMyBusinessItem(
  items: MyBusinessItem[],
  storedId: string | null | undefined,
): MyBusinessItem | null {
  if (items.length === 0) return null;
  const id = resolveSelectedBusinessId(items, storedId);
  return items.find((item) => item.business.id === id) ?? null;
}

/** Pick a business id from accessible items; ignores stale localStorage ids (BIZ.2). */
export function resolveSelectedBusinessId(
  items: MyBusinessItem[],
  storedId: string | null | undefined,
): string | null {
  if (items.length === 0) return null;
  const match = items.find((item) => item.business.id === storedId);
  return match?.business.id ?? items[0].business.id;
}

/** Same rule for BusinessRow lists (shell helper). */
export function resolveSelectedBusinessRowId(
  businesses: { id: string }[],
  storedId: string | null | undefined,
): string | null {
  if (businesses.length === 0) return null;
  const match = businesses.find((b) => b.id === storedId);
  return match?.id ?? businesses[0].id;
}

/** Resolve cabinet selection only after auth bootstrap is authoritative (BIZ.9 HOTFIX 3). */
export function resolveSelectedMyBusinessItemWhenReady(
  ready: boolean,
  items: MyBusinessItem[],
  storedId: string | null | undefined = readStoredSelectedBusinessId(),
): MyBusinessItem | null {
  if (!ready || items.length === 0) return null;
  return resolveSelectedMyBusinessItem(items, storedId);
}

/** Normalize `localStorage` only when `ready`; preserve stored id while `/my` is loading. */
export function syncSelectedBusinessStorageForMyItems(
  ready: boolean,
  items: MyBusinessItem[],
): void {
  if (typeof window === 'undefined') return;
  if (!ready) return;
  if (items.length === 0) {
    localStorage.removeItem(SELECTED_BUSINESS_KEY);
    return;
  }
  const id = resolveSelectedBusinessId(items, readStoredSelectedBusinessId());
  if (id) {
    localStorage.setItem(SELECTED_BUSINESS_KEY, id);
  } else {
    localStorage.removeItem(SELECTED_BUSINESS_KEY);
  }
}

/** Row-list variant for pages using `BusinessRow[]` without full `MyBusinessItem` context. */
export function syncSelectedBusinessStorageForRows(
  ready: boolean,
  businesses: { id: string }[],
): void {
  if (typeof window === 'undefined') return;
  if (!ready) return;
  if (businesses.length === 0) {
    localStorage.removeItem(SELECTED_BUSINESS_KEY);
    return;
  }
  const id = resolveSelectedBusinessRowId(businesses, readStoredSelectedBusinessId());
  if (id) {
    localStorage.setItem(SELECTED_BUSINESS_KEY, id);
  } else {
    localStorage.removeItem(SELECTED_BUSINESS_KEY);
  }
}
