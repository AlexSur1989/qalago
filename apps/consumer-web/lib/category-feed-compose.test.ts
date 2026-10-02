import { describe, expect, it } from 'vitest';
import { parseAdServeItem } from './ads-api';
import {
  CATEGORY_BOOST_INSERT_AFTER_ORGANIC,
  composeCategoryOrganicListWithBoost,
  preserveCategoryOrganicPage,
  splitCategoryServeAds,
} from './category-feed-compose';

function ad(code: string, businessId: string, campaign = 'c') {
  return parseAdServeItem({
    campaignId: campaign,
    placementId: 'p1',
    placementCode: code,
    business: { id: businessId, slug: businessId, title: businessId },
  })!;
}

describe('category-feed-compose (6.13M.6)', () => {
  const organic = [
    { id: 'o1' },
    { id: 'o2' },
    { id: 'o3' },
    { id: 'o4' },
    { id: 'o5' },
  ];

  it('preserves organic page size without ads', () => {
    expect(preserveCategoryOrganicPage(organic)).toHaveLength(5);
    const entries = composeCategoryOrganicListWithBoost(organic, [], []);
    expect(entries.filter((e) => e.kind === 'organic')).toHaveLength(5);
  });

  it('organic order unchanged with TOP and BOOST', () => {
    const entries = composeCategoryOrganicListWithBoost(
      organic,
      [ad('CATEGORY_BOOST', 'boost-biz')],
      [ad('CATEGORY_TOP', 'top-biz')],
    );
    const ids = entries.filter((e) => e.kind === 'organic').map((e) => e.business.id);
    expect(ids).toEqual(['o1', 'o2', 'o3', 'o4', 'o5']);
  });

  it('inserts BOOST inline after default organic count', () => {
    const boost = ad('CATEGORY_BOOST', 'boost-biz');
    const entries = composeCategoryOrganicListWithBoost(organic, [boost], []);
    const boostIndex = entries.findIndex((e) => e.kind === 'boost');
    expect(boostIndex).toBe(CATEGORY_BOOST_INSERT_AFTER_ORGANIC);
    expect(entries[boostIndex]).toMatchObject({
      kind: 'boost',
      ad: { placementCode: 'CATEGORY_BOOST' },
    });
    expect(entries.filter((e) => e.kind === 'organic')).toHaveLength(5);
  });

  it('TOP split keeps placement codes separate', () => {
    const top = [ad('CATEGORY_TOP', 'a')];
    const boost = [ad('CATEGORY_BOOST', 'b')];
    const split = splitCategoryServeAds(top, boost);
    expect(split.topItems[0]?.placementCode).toBe('CATEGORY_TOP');
    expect(split.boostItems[0]?.placementCode).toBe('CATEGORY_BOOST');
  });

  it('suppresses BOOST when same business as TOP', () => {
    const same = 'dup';
    const split = splitCategoryServeAds(
      [ad('CATEGORY_TOP', same)],
      [ad('CATEGORY_BOOST', same)],
    );
    expect(split.boostItems).toHaveLength(0);
  });

  it('suppresses inline BOOST when business already in organic page', () => {
    const entries = composeCategoryOrganicListWithBoost(
      organic,
      [ad('CATEGORY_BOOST', 'o3')],
      [],
    );
    expect(entries.some((e) => e.kind === 'boost')).toBe(false);
    expect(entries).toHaveLength(5);
  });

  it('places BOOST after short organic lists at end', () => {
    const short = [{ id: 'o1' }, { id: 'o2' }];
    const entries = composeCategoryOrganicListWithBoost(
      short,
      [ad('CATEGORY_BOOST', 'boost-biz')],
      [],
    );
    expect(entries.at(-1)?.kind).toBe('boost');
    expect(entries.filter((e) => e.kind === 'organic')).toHaveLength(2);
  });

  it('omits inline BOOST when organic list is empty', () => {
    const entries = composeCategoryOrganicListWithBoost([], [ad('CATEGORY_BOOST', 'b')], []);
    expect(entries).toHaveLength(0);
  });
});
