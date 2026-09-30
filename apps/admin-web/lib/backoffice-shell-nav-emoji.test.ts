import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(process.cwd(), '../..');

/** Narrow scope: authenticated shell/nav sources only (UXA.3). */
const SCAN_FILES = [
  'apps/admin-web/components/admin-shell.tsx',
  'apps/admin-web/lib/admin-shell-icons.ts',
  'apps/business-web/components/business-shell.tsx',
  'apps/business-web/lib/business-access.ts',
];

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
const UNICODE_NAV_GLYPHS_RE = /[☰×«»]/g;

describe('backoffice shell/nav emoji audit (UXA.3)', () => {
  for (const rel of SCAN_FILES) {
    it(`contains no emoji or unicode nav glyphs in ${rel}`, () => {
      const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
      const emojiHits = src.match(EMOJI_RE) ?? [];
      const glyphHits = src.match(UNICODE_NAV_GLYPHS_RE) ?? [];
      expect(emojiHits, `emoji in ${rel}: ${emojiHits.join(', ')}`).toEqual([]);
      expect(glyphHits, `unicode glyphs in ${rel}: ${glyphHits.join(', ')}`).toEqual([]);
    });
  }
});
