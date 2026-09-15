import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileL10n = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../mobile/lib/l10n',
);

function parseArb(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const obj = JSON.parse(raw);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@') || typeof v !== 'string') continue;
    out[k] = v;
  }
  return out;
}

const ru = parseArb(path.join(mobileL10n, 'app_ru.arb'));
const kk = parseArb(path.join(mobileL10n, 'app_kk.arb'));

const valueMap = new Map();
for (const key of Object.keys(ru)) {
  if (!kk[key]) continue;
  valueMap.set(ru[key], kk[key]);
}

export { valueMap };

if (process.argv[1]?.includes('build_ru_kk_map')) {
  console.log('pairs', valueMap.size);
}
