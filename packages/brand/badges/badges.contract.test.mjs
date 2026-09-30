import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'BackofficeBadge.tsx'), 'utf8');
if (/[\u{1F300}-\u{1FAFF}]/u.test(src)) throw new Error('emoji in BackofficeBadge');
if (!src.includes('QalaIcon')) throw new Error('BackofficeBadge must use QalaIcon');
console.log('badges.contract: ok');
