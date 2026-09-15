import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { scanHardcodedConsumerWebUi } from './hardcoded-ui-guard';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('consumer-web hardcoded UI guard', () => {
  it('has zero unexplained Cyrillic product strings outside locale dictionary', () => {
    const violations = scanHardcodedConsumerWebUi(rootDir);
    if (violations.length) {
      const sample = violations
        .slice(0, 20)
        .map((v) => `${v.file}:${v.line} ${v.text}`)
        .join('\n');
      expect.fail(`Found ${violations.length} violations:\n${sample}`);
    }
    expect(violations).toHaveLength(0);
  });
});
