import { describe, expect, it } from 'vitest';
import { config } from '../middleware';

describe('F.4 hotfix favicon routing', () => {
  it('middleware matches only /favicon.ico', () => {
    expect(config.matcher).toBe('/favicon.ico');
  });
});
