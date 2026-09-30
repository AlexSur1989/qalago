import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const css = readFileSync(join(root, 'backoffice-dashboards.css'), 'utf8');
const kpi = readFileSync(join(here, 'BackofficeKpiCard.tsx'), 'utf8');
const progress = readFileSync(join(here, 'BackofficeProgress.tsx'), 'utf8');

if (!css.includes('.bo-kpi-value')) throw new Error('kpi value styling required');
if (!kpi.includes('bo-kpi-label')) throw new Error('kpi label required');
if (!progress.includes('role="progressbar"')) throw new Error('progress a11y required');
if (/[\u{1F300}-\u{1FAFF}]/u.test(kpi + css)) throw new Error('emoji in dashboards');
console.log('dashboards.contract: ok');
