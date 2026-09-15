import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const localePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'locale.ts');
let s = fs.readFileSync(localePath, 'utf8');
s = s.replace(/^(\s+)([0-9][^\s:]*):/gm, (_, ind, key) => `${ind}'${key}':`);
s = s.replace(
  /(_vip___d83c5c: ')([\s\S]*?)(')/g,
  (_, a, body, c) => `${a}${body.replace(/\s+/g, ' ').trim()}${c}`,
);
fs.writeFileSync(localePath, s);
console.log('locale.ts syntax fixed');
