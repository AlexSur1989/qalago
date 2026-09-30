import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const typesSrc = readFileSync(join(here, 'types.ts'), 'utf8');
const pathsSrc = readFileSync(join(here, 'paths.ts'), 'utf8');
const qalaSrc = readFileSync(join(here, 'QalaIcon.tsx'), 'utf8');

const nameMatch = typesSrc.match(/export const QALA_BACKOFFICE_ICON_NAMES = \[([\s\S]*?)\] as const/);
if (!nameMatch) throw new Error('QALA_BACKOFFICE_ICON_NAMES not found');
const names = [...nameMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

for (const name of names) {
  const keyRe = new RegExp(`['"]?${name.replace(/-/g, '\\-')}['"]?:`);
  if (!keyRe.test(pathsSrc)) {
    throw new Error(`Missing ICON_PATHS entry for ${name}`);
  }
}

if (!qalaSrc.includes('stroke="currentColor"')) {
  throw new Error('QalaIcon must use currentColor stroke');
}

console.log(`icons.contract: ${names.length} icons registered`);
