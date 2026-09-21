import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE_REVALIDATE_SECONDS,
  REVALIDATE_CATEGORIES_SECONDS,
} from './cache-policy';

describe('cache-policy', () => {
  it('exposes positive revalidate constants', () => {
    expect(DEFAULT_PAGE_REVALIDATE_SECONDS).toBeGreaterThan(0);
    expect(REVALIDATE_CATEGORIES_SECONDS).toBeGreaterThan(0);
  });
});
