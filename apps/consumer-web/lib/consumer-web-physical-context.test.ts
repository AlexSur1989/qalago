import { describe, expect, it } from 'vitest';
import { buildBusinessDetailRequestPath, type BusinessSummaryDto } from './catalog-api';
import { detailPhysicalAddress } from './business-detail-display';
import {
  discoveryBusinessDetailHref,
  temporaryBusinessDetailPath,
  toPublicBusinessCard,
} from './public-business';

describe('A.9.3.4 Consumer Web physical context', () => {
  it('A — DTO mapping preserves contextLocationId=L2', () => {
    const card = toPublicBusinessCard({
      id: 'b1',
      title: 'T',
      slug: 't',
      address: 'Branch L2 street',
      contextLocationId: 'loc-l2',
    });
    expect(card.contextLocationId).toBe('loc-l2');
  });

  it('B — card mapping null when context absent', () => {
    const card = toPublicBusinessCard({
      id: 'b1',
      title: 'T',
      slug: 't',
      address: 'Primary',
    });
    expect(card.contextLocationId).toBeNull();
  });

  it('C — temporaryBusinessDetailPath with L2', () => {
    expect(temporaryBusinessDetailPath('biz-1', 'loc-l2')).toBe(
      '/businesses/biz-1?locationId=loc-l2',
    );
  });

  it('D — temporaryBusinessDetailPath without context', () => {
    expect(temporaryBusinessDetailPath('biz-1')).toBe('/businesses/biz-1');
    expect(temporaryBusinessDetailPath('biz-1', null)).toBe('/businesses/biz-1');
    expect(temporaryBusinessDetailPath('biz-1', '  ')).toBe('/businesses/biz-1');
  });

  it('E — discovery card L2 href uses F.4 canonical path', () => {
    const href = discoveryBusinessDetailHref('uralsk', {
      id: 'b1',
      slug: 'brand-slug',
      title: 'T',
      address: 'A',
      shortDesc: null,
      coverImageUrl: null,
      categoryLabel: null,
      averageRating: null,
      reviewCount: 0,
      contextLocationId: 'loc-l2',
    });
    expect(href).toBe('/uralsk/business/brand-slug?locationId=loc-l2');
  });

  it('F — detail API path with L2', () => {
    expect(buildBusinessDetailRequestPath('b1', 'loc-l2')).toBe(
      '/businesses/b1?locationId=loc-l2',
    );
  });

  it('G — detail API path without locationId', () => {
    expect(buildBusinessDetailRequestPath('b1')).toBe('/businesses/b1');
  });

  it('H — cache wrapper arity: distinct locationId are distinct call identities', () => {
    const keys = (id: string, locationId?: string | null) =>
      `${id}|${locationId?.trim() || ''}`;
    expect(keys('b1', 'loc-l1')).not.toBe(keys('b1', 'loc-l2'));
    expect(keys('b1', null)).toBe(keys('b1', undefined));
    expect(keys('b1', null)).not.toBe(keys('b1', 'loc-l2'));
  });

  it('I — detail physical address from effectivePhysical', () => {
    const l1: BusinessSummaryDto = {
      id: 'b1',
      title: 'T',
      slug: 't',
      address: 'Primary top',
      effectivePhysical: {
        locationId: 'loc-l1',
        isPrimary: true,
        cityId: 'c1',
        address: 'Primary effective',
        latitude: null,
        longitude: null,
        phone: null,
        whatsapp: null,
        instagram: null,
        website: null,
        workHours: null,
      },
    };
    const l2: BusinessSummaryDto = {
      ...l1,
      address: 'Primary top',
      effectivePhysical: {
        ...l1.effectivePhysical!,
        locationId: 'loc-l2',
        isPrimary: false,
        address: 'Secondary effective',
      },
    };
    expect(detailPhysicalAddress(l1)).toBe('Primary effective');
    expect(detailPhysicalAddress(l2)).toBe('Secondary effective');
  });

  it('L — one Business id remains one card with branch context', () => {
    const card = toPublicBusinessCard({
      id: 'same-biz',
      title: 'Brand',
      slug: 'brand',
      address: 'L2 addr',
      contextLocationId: 'loc-l2',
    });
    expect(card.id).toBe('same-biz');
    expect(card.contextLocationId).toBe('loc-l2');
  });
});
