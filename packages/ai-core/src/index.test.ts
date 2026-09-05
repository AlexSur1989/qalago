import test from 'node:test';
import assert from 'node:assert/strict';
import { toRecommendationItems } from './index';

test('toRecommendationItems uses neutral reason without isFeatured', () => {
  const items = toRecommendationItems(
    [{ id: 'b1', title: 'Cafe', isFeatured: true, category: { title: 'Еда' } }],
    5,
  );
  assert.equal(items[0].businessId, 'b1');
  assert.equal(items[0].reason, 'Популярное: Cafe');
});
