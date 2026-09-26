/**
 * Fix broken indentation after cityId line removal in spec business.create blocks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

for (const file of walk(srcRoot)) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;
  c = c.replace(/\n(ownerId:|phone:|status:)/g, '\n        $1');
  if (c !== orig) {
    fs.writeFileSync(file, c, 'utf8');
    console.log('indent', path.relative(srcRoot, file));
  }
}
