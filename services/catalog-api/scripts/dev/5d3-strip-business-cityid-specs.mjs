/**
 * 5D3: remove top-level Business.cityId from prisma/tx.business.create({ data: { ... } }).
 * Preserves nested BusinessLocation cityId (e.g. locations.create).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, '../../src');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

function stripTopLevelCityIdInBusinessCreateBlocks(content) {
  const marker = /(?:prisma|tx)\.business\.create\(\{/g;
  let match;
  let result = content;
  const edits = [];

  while ((match = marker.exec(content)) !== null) {
    const start = match.index;
    const dataMatch = /data:\s*\{/.exec(content.slice(start, start + 800));
    if (!dataMatch) continue;
    const dataOpen = start + dataMatch.index + dataMatch[0].length - 1;
    let depth = 0;
    let i = dataOpen;
    for (; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    const block = content.slice(dataOpen, i);
    const lines = block.split('\n');
    let lineDepth = 0;
    const newLines = [];
    for (const line of lines) {
      const opens = (line.match(/\{/g) ?? []).length;
      const closes = (line.match(/\}/g) ?? []).length;
      const atDataTop =
        lineDepth === 1 &&
        (/^\s*cityId:\s*.+,?\s*$/.test(line) || /^\s*cityId,\s*$/.test(line));
      if (!atDataTop) newLines.push(line);
      lineDepth += opens - closes;
    }
    const newBlock = newLines.join('\n');
    if (newBlock !== block) {
      edits.push({ dataOpen, end: i, newBlock });
    }
  }

  if (edits.length === 0) return content;
  edits.sort((a, b) => b.dataOpen - a.dataOpen);
  result = content;
  for (const { dataOpen, end, newBlock } of edits) {
    result = result.slice(0, dataOpen) + newBlock + result.slice(end);
  }
  return result;
}

let changed = 0;
for (const file of walk(srcRoot)) {
  const orig = fs.readFileSync(file, 'utf8');
  const c = stripTopLevelCityIdInBusinessCreateBlocks(orig);
  if (c !== orig) {
    fs.writeFileSync(file, c, 'utf8');
    changed += 1;
    console.log('updated', path.relative(srcRoot, file));
  }
}
console.log(`5d3 strip done: ${changed} files`);
