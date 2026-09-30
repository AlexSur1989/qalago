import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'QalaIcon.tsx'), 'utf8');

if (!src.includes('aria-hidden={decorative ? true : undefined}')) {
  throw new Error('QalaIcon must support decorative aria-hidden');
}
if (!src.includes("focusable={decorative ? 'false' : undefined}")) {
  throw new Error('QalaIcon must set focusable=false when decorative');
}
if (!src.includes('--icon-size-md')) {
  throw new Error('QalaIcon must support md (20px) size token');
}

console.log('QalaIcon.a11y.contract: ok');
