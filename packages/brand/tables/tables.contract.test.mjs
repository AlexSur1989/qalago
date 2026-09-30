import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const css = readFileSync(join(root, 'backoffice-tables.css'), 'utf8');
const search = readFileSync(join(here, 'BackofficeSearchField.tsx'), 'utf8');
const pagination = readFileSync(join(here, 'BackofficePagination.tsx'), 'utf8');
const table = readFileSync(join(here, 'BackofficeTable.tsx'), 'utf8');

if (!css.includes('.bo-table--compact')) throw new Error('missing compact density');
if (!search.includes('type="search"')) throw new Error('search field must use search input');
if (!search.includes('QalaIcon name="search"')) throw new Error('search icon required');
if (/[\u{1F300}-\u{1FAFF}]/u.test(search + pagination + table))
  throw new Error('emoji in table components');
if (!pagination.includes('chevron-left')) throw new Error('pagination uses UXA.3 chevrons');
if (!table.includes('scope={scope}')) throw new Error('table headers need scope col');
console.log('tables.contract: ok');
