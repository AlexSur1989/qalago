import { describe, expect, it } from 'vitest';
import { config } from '../middleware';

describe('F.4 hotfix favicon routing', () => {
  it('middleware matches favicon and public routes', () => {
    expect(config.matcher).toContain('/favicon.ico');
    const matchers = config.matcher as string[];
    expect(matchers.some((m) => m.includes('_next/static'))).toBe(true);
  });
});
