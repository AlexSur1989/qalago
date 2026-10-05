/**
 * Append ConfigService + UploadReceiptService mocks to manual BusinessesService(...) calls
 * that end with `as never,\n    );` or `PrimaryLocationService(),\n    );` without MARK.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MARK = '/* businesses-svc-ctor-tail */';
const TAIL = `,
      ${MARK}
      { get: jest.fn() } as never,
      {} as never`;

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

function patch(content) {
  if (!content.includes('new BusinessesService(') || content.includes(MARK)) {
    return content;
  }
  let next = content;
  // review agg + single {} as never primary placeholder
  next = next.replace(
    /(asReviewAggregationService\([^)]*\),)\r?\n(\s+)\{\} as never,\r?\n(\2)\);/g,
    `$1\n$2{} as never,${TAIL}\n$3);`,
  );
  // two {} as never (review + primary)
  next = next.replace(
    /(\s+)\{\} as never,\r?\n(\1)\{\} as never,\r?\n(\1)\);/g,
    (m, indent, _i, close) => {
      const before = m.slice(0, 200);
      if (before.includes(MARK) || !before.includes('BusinessesService')) return m;
      return `${indent}{} as never,\n${indent}{} as never,${TAIL}\n${close});`;
    },
  );
  return next;
}

function patchOrderService(content) {
  if (!content.includes('new OrderService(')) return content;
  const OM = '/* order-svc-ctor-tail */';
  if (content.includes(OM)) return content;
  return content.replace(
    /new OrderService\(([\s\S]*?)(\r?\n\s+)\);(\r?\n\s+await|\r?\n\s+expect|\r?\n\s+return)/g,
    (full, body, indent, after) => {
      if (full.includes(OM)) return full;
      if (body.includes('assertPurchasesAllowed')) return full;
      return `new OrderService(${body}${indent}${OM}\n${indent}{ assertPurchasesAllowed: jest.fn() } as never,\n${indent});${after}`;
    },
  );
}

let changed = 0;
for (const file of walk(join(root, 'src'))) {
  let c = readFileSync(file, 'utf8');
  const b = c;
  c = patch(c);
  c = patchOrderService(c);
  if (c !== b) {
    writeFileSync(file, c);
    changed++;
    console.log('patched', file.replace(root, ''));
  }
}
console.log('done', changed);
