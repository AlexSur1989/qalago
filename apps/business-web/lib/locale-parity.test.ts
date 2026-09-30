import { describe, expect, it } from 'vitest';
import { UI_LABELS } from './locale';

describe('Business Web locale key parity (UXA.12)', () => {
  it('RU and KK UI_LABELS expose the same keys', () => {
    const ruKeys = Object.keys(UI_LABELS.ru).sort();
    const kkKeys = Object.keys(UI_LABELS.kk).sort();
    expect(kkKeys).toEqual(ruKeys);
  });
});
