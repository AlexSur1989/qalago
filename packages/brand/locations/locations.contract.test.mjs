import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const css = readFileSync(join(root, 'backoffice-locations.css'), 'utf8');
const card = readFileSync(join(here, 'BackofficeBranchCard.tsx'), 'utf8');

if (!css.includes('.bo-branch-card')) throw new Error('branch card styles required');
if (!card.includes('BackofficeBadge')) throw new Error('primary uses UXA.7 badge');
if (/[\u{1F300}-\u{1FAFF}]/u.test(card + css)) throw new Error('emoji in locations');
console.log('locations.contract: ok');
