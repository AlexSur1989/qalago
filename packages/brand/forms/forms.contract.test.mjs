import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const css = readFileSync(join(root, 'backoffice-forms.css'), 'utf8');
const field = readFileSync(join(here, 'BackofficeField.tsx'), 'utf8');
const controls = readFileSync(join(here, 'BackofficeControls.tsx'), 'utf8');
const sw = readFileSync(join(here, 'BackofficeSwitch.tsx'), 'utf8');

if (!css.includes('.bo-control--invalid')) throw new Error('invalid control state required');
if (!controls.includes('aria-invalid')) throw new Error('controls must set aria-invalid');
if (!field.includes('invalid')) throw new Error('field must expose invalid to control');
if (!field.includes('bo-field-error')) throw new Error('field error styling');
if (!sw.includes('role="switch"')) throw new Error('switch semantics');
if (!sw.includes('aria-checked')) throw new Error('switch aria-checked');
if (/[\u{1F300}-\u{1FAFF}]/u.test(field + controls + sw)) throw new Error('emoji in forms');
console.log('forms.contract: ok');
