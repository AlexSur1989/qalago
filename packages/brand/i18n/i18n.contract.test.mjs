import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'backoffice-i18n.css'), 'utf8');

if (!css.includes('overflow-wrap')) throw new Error('i18n wrap rules');
if (css.includes('word-break: break-all')) throw new Error('avoid break-all on labels');
console.log('i18n.contract: ok');
