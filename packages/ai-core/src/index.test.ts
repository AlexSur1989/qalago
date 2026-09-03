import test from 'node:test';
import assert from 'node:assert/strict';
import { toRecommendationItems } from './index';

test('toRecommendationItems maps featured businesses', () => {
  const items = toRecommendationItems(
    [{ id: 'b1', title: 'Cafe', isFeatured: true, category: { title: 'Еда' } }],
    5,
  );
  assert.equal(items[0].businessId, 'b1');
  assert.match(items[0].reason, /VIP/);
});
