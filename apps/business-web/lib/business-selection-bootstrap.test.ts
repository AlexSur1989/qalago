import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessPermission } from './business-access';
import { SELECTED_BUSINESS_KEY } from './api';
import {
  readStoredSelectedBusinessId,
  resolveSelectedMyBusinessItemWhenReady,
  syncSelectedBusinessStorageForMyItems,
  syncSelectedBusinessStorageForRows,
} from './business-selection';

function makeItem(id: string, title: string, permissions: string[] = []) {
  return {
    business: { id, title, status: 'ACTIVE' as const, address: '1' },
    access: {
      role: permissions.length ? ('MANAGER' as const) : ('OWNER' as const),
      permissions,
    },
  };
}

describe('business selection bootstrap (BIZ.9 HOTFIX 3)', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  const aktobe = makeItem('b-aktobe', 'Aktobe Coffee Lab');
  const barCode = makeItem('b-bar', 'Bar Code 51');
  const catalogLab = makeItem('b-aktobe', 'Aktobe Coffee Lab', [BusinessPermission.CATALOG_EDIT]);
  const analyticsBar = makeItem('b-bar', 'Bar Code 51', [BusinessPermission.ANALYTICS_VIEW]);

  it('preserves valid stored id while ready=false and items=[] (bootstrap loading)', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    syncSelectedBusinessStorageForMyItems(false, []);
    expect(readStoredSelectedBusinessId()).toBe('b-bar');
    expect(resolveSelectedMyBusinessItemWhenReady(false, [])).toBeNull();
  });

  it('after ready=true restores stored business from /my items', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    syncSelectedBusinessStorageForMyItems(false, []);
    const items = [aktobe, barCode];
    syncSelectedBusinessStorageForMyItems(true, items);
    const selected = resolveSelectedMyBusinessItemWhenReady(true, items);
    expect(selected?.business.id).toBe('b-bar');
    expect(readStoredSelectedBusinessId()).toBe('b-bar');
  });

  it('simulates switch A → B → reload: B preserved through empty items phase', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-aktobe');
    syncSelectedBusinessStorageForMyItems(true, [aktobe, barCode]);

    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    syncSelectedBusinessStorageForMyItems(false, []);
    expect(readStoredSelectedBusinessId()).toBe('b-bar');

    syncSelectedBusinessStorageForMyItems(true, [aktobe, barCode]);
    expect(resolveSelectedMyBusinessItemWhenReady(true, [aktobe, barCode])?.business.title).toBe(
      'Bar Code 51',
    );
  });

  it('ready=true + items=[] clears selection key (no cabinet businesses)', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    syncSelectedBusinessStorageForMyItems(true, []);
    expect(readStoredSelectedBusinessId()).toBeNull();
  });

  it('stale stored id normalizes to first accessible when ready', () => {
    store.set(SELECTED_BUSINESS_KEY, 'revoked-id');
    syncSelectedBusinessStorageForMyItems(true, [aktobe, barCode]);
    expect(readStoredSelectedBusinessId()).toBe('b-aktobe');
    expect(resolveSelectedMyBusinessItemWhenReady(true, [aktobe, barCode])?.business.id).toBe(
      'b-aktobe',
    );
  });

  it('F5 on non-first business preserves selection after bootstrap sequence', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    syncSelectedBusinessStorageForMyItems(false, []);
    syncSelectedBusinessStorageForMyItems(true, [aktobe, barCode]);
    expect(readStoredSelectedBusinessId()).toBe('b-bar');
    expect(resolveSelectedMyBusinessItemWhenReady(true, [aktobe, barCode])?.business.id).toBe(
      'b-bar',
    );
  });

  it('OWNER with many businesses: row sync matches my-items sync', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    const rows = [aktobe.business, barCode.business];
    syncSelectedBusinessStorageForRows(false, []);
    expect(readStoredSelectedBusinessId()).toBe('b-bar');
    syncSelectedBusinessStorageForRows(true, rows);
    expect(readStoredSelectedBusinessId()).toBe('b-bar');
  });

  it('MANAGER switch preserves id and distinct access payloads', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    syncSelectedBusinessStorageForMyItems(true, [catalogLab, analyticsBar]);
    const selected = resolveSelectedMyBusinessItemWhenReady(true, [catalogLab, analyticsBar]);
    expect(selected?.business.id).toBe('b-bar');
    expect(selected?.access.permissions).toContain(BusinessPermission.ANALYTICS_VIEW);
    expect(selected?.access.permissions).not.toContain(BusinessPermission.CATALOG_EDIT);

    store.set(SELECTED_BUSINESS_KEY, 'b-aktobe');
    syncSelectedBusinessStorageForMyItems(true, [catalogLab, analyticsBar]);
    const switched = resolveSelectedMyBusinessItemWhenReady(true, [catalogLab, analyticsBar]);
    expect(switched?.access.permissions).toContain(BusinessPermission.CATALOG_EDIT);
  });

  it('does not resolve permissioned selection from items[0] before ready', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    const items = [catalogLab, analyticsBar];
    expect(resolveSelectedMyBusinessItemWhenReady(false, items)).toBeNull();
  });

  it('revoked selected business falls back after ready refresh excludes it', () => {
    store.set(SELECTED_BUSINESS_KEY, 'b-bar');
    syncSelectedBusinessStorageForMyItems(true, [aktobe]);
    expect(readStoredSelectedBusinessId()).toBe('b-aktobe');
  });
});
