import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'useDebouncedValue.ts'), 'utf8');
if (!src.includes('delayMs = 300')) throw new Error('useDebouncedValue default must be 300ms');
console.log('useDebouncedValue.contract: ok');
