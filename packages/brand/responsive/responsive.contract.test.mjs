import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'backoffice-responsive.css'), 'utf8');
const shell = readFileSync(join(here, '..', 'backoffice-shell.css'), 'utf8');
const dashboards = readFileSync(join(here, '..', 'backoffice-dashboards.css'), 'utf8');

if (!css.includes('max-width: 960px')) throw new Error('shell-aligned breakpoint required');
if (!css.includes('100dvh')) throw new Error('dynamic viewport height required');
if (!css.includes('.page-content--wide')) throw new Error('wide content utility required');
if (!shell.includes('max-width: 960px')) throw new Error('shell drawer breakpoint 960');
if (!dashboards.includes('max-width: 767px')) throw new Error('KPI single column mobile');
if (css.includes('72px') && css.match(/icon-rail|width:\s*72px/)) {
  throw new Error('deprecated mobile icon rail');
}
console.log('responsive.contract: ok');
