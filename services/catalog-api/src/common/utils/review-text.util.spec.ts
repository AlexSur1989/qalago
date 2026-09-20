import { normalizeReviewText } from './review-text.util';

describe('normalizeReviewText', () => {
  it('trims and rejects whitespace-only', () => {
    expect(normalizeReviewText('  hello  ')).toBe('hello');
    expect(normalizeReviewText('   ')).toBeNull();
  });

  it('caps length at 2000', () => {
    expect(normalizeReviewText('a'.repeat(2500))?.length).toBe(2000);
  });
});
