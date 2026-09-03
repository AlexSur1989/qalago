import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEditorialDraft } from './content';

test('buildEditorialDraft creates markdown with featured picks', () => {
  const draft = buildEditorialDraft({
    cityName: 'Уральск',
    citySlug: 'uralsk',
    businesses: [
      {
        id: 'b1',
        title: 'Coffee House',
        isFeatured: true,
        category: { title: 'Еда', slug: 'food' },
      },
      {
        id: 'b2',
        title: 'Bar 51',
        category: { title: 'Бары', slug: 'bars' },
      },
    ],
    limit: 2,
  });

  assert.match(draft.title, /Уральск/);
  assert.match(draft.bodyMarkdown, /Coffee House/);
  assert.deepEqual(draft.businessIds, ['b1', 'b2']);
});

test('buildEditorialDraft filters by topic', () => {
  const draft = buildEditorialDraft({
    cityName: 'Уральск',
    citySlug: 'uralsk',
    topic: 'food',
    businesses: [
      {
        id: 'b1',
        title: 'Coffee House',
        category: { title: 'Еда', slug: 'food' },
      },
      {
        id: 'b2',
        title: 'Bar 51',
        category: { title: 'Бары', slug: 'bars' },
      },
    ],
  });

  assert.match(draft.title, /поесть/i);
  assert.deepEqual(draft.businessIds, ['b1']);
});
