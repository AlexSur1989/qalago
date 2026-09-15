import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(rootDir, 'tool/string_key_map.json'), 'utf8'));
const skip = new Set(['app/terms/page.tsx', 'app/privacy/page.tsx', 'app/account-deletion/page.tsx']);

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patch(content) {
  let c = content;
  const entries = Object.entries(map)
    .filter(([ru]) => !ru.includes('${') && ru.length >= 2)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [ru, key] of entries) {
    c = c.replace(new RegExp(`>\\s*${escRe(ru)}\\s*<`, 'g'), `>{ui.${key}}<`);
    c = c.replace(new RegExp(`\\(\\s*${escRe(ru)}\\s*\\)`, 'g'), `(ui.${key})`);
  }
  return c;
}

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
}

const files = [];
walk(path.join(rootDir, 'app'), files);
walk(path.join(rootDir, 'components'), files);

for (const abs of files) {
  const rel = path.relative(rootDir, abs).replace(/\\/g, '/');
  if (skip.has(rel)) continue;
  const raw = fs.readFileSync(abs, 'utf8');
  const next = patch(raw);
  if (next === raw) continue;
  let c = next;
  if (!c.includes('useUi') && c.includes('{ui.')) {
    if (c.includes("'use client'")) {
      c = c.replace(
        /^(['"]use client['"];?\s*\n)/,
        `$1import { useUi } from '@/components/locale-provider';\n`,
      );
    } else {
      c = `import { useUi } from '@/components/locale-provider';\n` + c;
    }
    c = c.replace(/export default function (\w+)/, 'export default function $1');
    if (!c.includes('const ui = useUi()')) {
      c = c.replace(/export default function \w+\([^)]*\)\s*\{/, (m) => `${m}\n  const ui = useUi();\n`);
    }
  }
  fs.writeFileSync(abs, c, 'utf8');
  console.log('jsx', rel);
}
