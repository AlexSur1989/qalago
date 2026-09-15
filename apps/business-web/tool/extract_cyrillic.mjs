import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['app', 'components', 'lib'];
const skip = new Set(['node_modules', '.next', 'dist']);
const dict = new Set(['locale.ts', 'presentation.ts']);
const CYR = /[\u0400-\u04FF]/;

function walk(d, out) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (skip.has(e.name)) continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.(test|spec)\.(tsx?|jsx?)$/.test(e.name)) {
      const rel = path.relative(rootDir, p).replace(/\\/g, '/');
      if (dict.has(path.basename(rel))) continue;
      out.push(p);
    }
  }
}

const files = [];
for (const r of roots) walk(path.join(rootDir, r), files);

const strings = new Map();
for (const f of files) {
  const rel = path.relative(rootDir, f).replace(/\\/g, '/');
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!CYR.test(line)) return;
    const re = /(['"`])((?:\\.|(?!\1).)*)\1/g;
    let m;
    while ((m = re.exec(line))) {
      if (CYR.test(m[2]) && m[2].length < 200) {
        const key = m[2];
        if (!strings.has(key)) strings.set(key, []);
        strings.get(key).push(`${rel}:${i + 1}`);
      }
    }
  });
}

console.log('unique', strings.size);
for (const [s, locs] of [...strings.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(locs.length, JSON.stringify(s).slice(0, 120));
}
