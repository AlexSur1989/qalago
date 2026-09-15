import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(rootDir, 'tool/string_key_map.json');
const stringToKey = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const targets = ['app', 'components'];
const skipFiles = new Set(['app/terms/page.tsx', 'app/privacy/page.tsx']);
const dict = new Set(['locale.ts', 'presentation.ts']);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(rel) {
  if (skipFiles.has(rel)) return false;
  const abs = path.join(rootDir, rel);
  let content = fs.readFileSync(abs, 'utf8');
  let changed = false;

  const entries = Object.entries(stringToKey).sort((a, b) => b[0].length - a[0].length);
  for (const [ru, key] of entries) {
    if (!content.includes(ru)) continue;
    const patterns = [
      new RegExp(`'${escapeRe(ru.replace(/'/g, "\\'"))}'`, 'g'),
      new RegExp(`"${escapeRe(ru.replace(/"/g, '\\"'))}"`, 'g'),
      new RegExp(`\`${escapeRe(ru)}\``, 'g'),
    ];
    for (const re of patterns) {
      if (re.test(content)) {
        content = content.replace(re, `{ui.${key}}`);
        changed = true;
      }
    }
  }

  if (!changed) return false;

  const isClient = content.includes("'use client'") || content.includes('"use client"');
  const needsHook = content.includes('{ui.') && !content.includes('useUi()');
  if (needsHook && isClient) {
    if (!content.includes("from '@/components/locale-provider'")) {
      content = content.replace(
        /^(['"]use client['"];?\s*\n)/,
        `$1import { useUi } from '@/components/locale-provider';\n`,
      );
      if (!content.includes("from '@/components/locale-provider'")) {
        content = `import { useUi } from '@/components/locale-provider';\n` + content;
      }
    }
    content = content.replace(
      /export default function (\w+)\([^)]*\)\s*\{/,
      (m, name) => `${m}\n  const ui = useUi();\n`,
    );
    content = content.replace(
      /export function (\w+)\([^)]*\)\s*\{/,
      (m) => {
        if (m.includes('useUi')) return m;
        return `${m}\n  const ui = useUi();\n`;
      },
    );
  }

  fs.writeFileSync(abs, content, 'utf8');
  return true;
}

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) {
      const rel = path.relative(rootDir, p).replace(/\\/g, '/');
      if (dict.has(path.basename(rel))) continue;
      out.push(rel);
    }
  }
}

const files = [];
for (const t of targets) walk(path.join(rootDir, t), files);

let n = 0;
for (const rel of files) {
  if (processFile(rel)) {
    n++;
    console.log('updated', rel);
  }
}
console.log('Updated files:', n);
