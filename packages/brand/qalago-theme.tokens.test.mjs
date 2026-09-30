import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const dir = dirname(fileURLToPath(import.meta.url));
const theme = readFileSync(join(dir, 'qalago-theme.css'), 'utf8');

function mustInclude(tokenFragment) {
  assert.ok(
    theme.includes(tokenFragment),
    `Expected qalago-theme.css to include: ${tokenFragment}`,
  );
}

mustInclude('--color-brand-primary: #00a8d6');
mustInclude('--color-brand-accent: #f3a100');
mustInclude('--primary: var(--color-brand-primary)');
mustInclude('--accent: var(--color-brand-accent)');
mustInclude('--color-success:');
mustInclude('--color-warning:');
mustInclude('--color-danger:');
mustInclude('--color-info:');
mustInclude('--space-1: 4px');
mustInclude('--space-12: 48px');
mustInclude('--control-height-md: 40px');
mustInclude('--icon-size-md: 20px');
mustInclude('--icon-size-lg: 24px');
mustInclude('--sidebar-expanded: 260px');
mustInclude('--focus-ring-color:');
mustInclude('--transition-fast:');
mustInclude('--qz-gold: #fec50c');

console.log('qalago-theme.tokens.test.mjs: PASS');
