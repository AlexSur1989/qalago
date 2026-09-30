import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'backoffice-a11y.css'), 'utf8');
const skip = readFileSync(join(here, 'BackofficeSkipLink.tsx'), 'utf8');
const hook = readFileSync(join(here, 'useShellDrawerA11y.ts'), 'utf8');
const confirm = readFileSync(join(here, '..', 'confirm', 'BackofficeConfirmDialog.tsx'), 'utf8');
const switchSrc = readFileSync(join(here, '..', 'forms', 'BackofficeSwitch.tsx'), 'utf8');
const progress = readFileSync(join(here, '..', 'dashboards', 'BackofficeProgress.tsx'), 'utf8');
const th = readFileSync(join(here, '..', 'tables', 'BackofficeTable.tsx'), 'utf8');

if (!css.includes('.bo-skip-link:focus')) throw new Error('skip link focus visibility');
if (!skip.includes('bo-skip-link')) throw new Error('skip link component');
if (!hook.includes('inert')) throw new Error('drawer inert main');
if (!confirm.includes('aria-labelledby')) throw new Error('confirm labelled');
if (!switchSrc.includes('role="switch"')) throw new Error('switch role');
if (!progress.includes('role="progressbar"')) throw new Error('progressbar');
if (!th.includes("scope = 'col'")) throw new Error('table header scope');
console.log('accessibility.contract: ok');
