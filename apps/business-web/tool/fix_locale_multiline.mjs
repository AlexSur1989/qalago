import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const localePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'locale.ts');
const lines = fs.readFileSync(localePath, 'utf8').split(/\r?\n/);
const out = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (!line.includes("'") || line.trim().endsWith("',") || line.trim().endsWith("';")) {
    out.push(line);
    continue;
  }
  // Unterminated single-quoted value (multiline from generator)
  while (i + 1 < lines.length && !line.includes("',") && !line.trim().endsWith("'")) {
    const next = lines[i + 1].trim();
    i += 1;
    line = `${line.trimEnd()} ${next}`;
  }
  out.push(line.replace(/\s+/g, ' '));
}
fs.writeFileSync(localePath, out.join('\n'));
console.log('merged multiline locale strings');
