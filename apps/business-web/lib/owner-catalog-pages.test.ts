import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = join(process.cwd(), 'app');

function readPage(relative: string): string {
  return readFileSync(join(appRoot, relative), 'utf8');
}

describe('business catalog & promotion edit parity (6.10C.1)', () => {
  it('menu page wires edit PATCH and CATALOG_EDIT gating', () => {
    const src = readPage('business/[id]/menu/page.tsx');
    expect(src).toContain('updateMenuItem');
    expect(src).toContain('buildServiceItemUpdateBody');
    expect(src).toContain('BusinessPermission.CATALOG_EDIT');
    expect(src).toContain('serviceItemEditAction');
    expect(src).toContain('deleteMenuItem');
    expect(src).toContain('createMenuItem');
    expect(src).toContain('BranchAvailabilityField');
    expect(src).toContain('listManageServiceItems');
    expect(src).toContain('branchAvailability');
  });

  it('profile page uses localized subcategory display helper', () => {
    const src = readPage('business/[id]/page.tsx');
    expect(src).toContain('subcategoryDisplayName');
    expect(src).not.toMatch(/\{sub\.nameRu\}/);
  });

  it('promotions page wires edit PATCH and PROMOTIONS_EDIT gating', () => {
    const src = readPage('business/[id]/promotions/page.tsx');
    expect(src).toContain('updatePromotion');
    expect(src).toContain('buildPromotionUpdateBody');
    expect(src).toContain('BusinessPermission.PROMOTIONS_EDIT');
    expect(src).toContain('promotionEditAction');
    expect(src).toContain('deletePromotion');
    expect(src).not.toMatch(/\/ad-campaigns|AdCampaign/);
    expect(src).toContain('parseApiError');
    expect(src).toContain('BranchAvailabilityField');
    expect(src).toContain('branchAvailability');
  });
});
