import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fix(content) {
  let prev;
  do {
    prev = content;
    content = content.replace(/: \{ui\.(\w+)\}/g, ': ui.$1');
    content = content.replace(/= \{ui\.(\w+)\}/g, '= ui.$1');
    content = content.replace(/\(\{ui\.(\w+)\}\)/g, '(ui.$1)');
    content = content.replace(/\? \{ui\.(\w+)\}/g, '? ui.$1');
    content = content.replace(/, \{ui\.(\w+)\}/g, ', ui.$1');
    content = content.replace(/field\(\{ui\.(\w+)\}/g, 'field(ui.$1');
    content = content.replace(/area\(\{ui\.(\w+)\}/g, 'area(ui.$1');
    content = content.replace(/\{ui\.(\w+)\} : \{ui\.(\w+)\}/g, 'ui.$1 : ui.$2');
    content = content.replace(/return \{ui\.(\w+)\}/g, 'return ui.$1');
    content = content.replace(/\|\| \{ui\.(\w+)\}/g, '|| ui.$1');
    content = content.replace(/\?\?[\s\r\n]*\{ui\.(\w+)\}/g, '?? ui.$1');
    content = content.replace(/\{\{ui\.(\w+)\}\}/g, '{ui.$1}');
    content = content.replace(/setError\(\s*\{ui\.(\w+)\}/g, 'setError(ui.$1');
    content = content.replace(/&& \{ui\.(\w+)\}/g, '&& ui.$1');
  } while (content !== prev);
  return content;
}

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
}

const files = [];
walk(path.join(rootDir, 'app'), files);
walk(path.join(rootDir, 'components'), files);

for (const abs of files) {
  const raw = fs.readFileSync(abs, 'utf8');
  if (!raw.includes('{ui.')) continue;
  const next = fix(raw);
  if (next !== raw) {
    fs.writeFileSync(abs, next, 'utf8');
    console.log('fixed', path.relative(rootDir, abs));
  }
}
