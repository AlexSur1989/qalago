import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { scanHardcodedConsumerWebUi } from './hardcoded-ui-guard';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('consumer-web hardcoded UI guard', () => {
  it('keeps check_hardcoded_ui_strings.mjs dictionary list in sync with TS guard', () => {
    const scriptPath = path.join(rootDir, 'tool/check_hardcoded_ui_strings.mjs');
    const script = fs.readFileSync(scriptPath, 'utf8');
    for (const dict of [
      'locale.ts',
      'legal-ui.ts',
      'help-ui.ts',
      'localized-content.ts',
      'metadata-copy.ts',
      'page-metadata.ts',
    ]) {
      expect(script, `missing ${dict} in check_hardcoded_ui_strings.mjs`).toContain(`'${dict}'`);
    }
  });

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
