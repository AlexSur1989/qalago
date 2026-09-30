/**
 * Run from apps/business-web: node tool/check_hardcoded_ui_strings.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CYRILLIC = /[\u0400-\u04FF]/;
const DICTIONARY_FILES = new Set(['locale.ts', 'presentation.ts', 'owner-visual-copy.ts']);
const SCAN_ROOTS = ['app', 'components', 'lib'];
const SKIP_DIR_NAMES = new Set(['node_modules', '.next', 'dist']);
const ALLOWLIST_FILES = new Set([
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/account-deletion/page.tsx',
]);
const ALLOWLIST_LINE_PATTERNS = [
  /UI_LABELS/,
  /presentation\./,
  /hardcoded-ui-guard/,
  /locale-client/,
  /locale-server/,
  /locale-provider/,
  /locale-switcher/,
  /i18n\.test/,
  /hardcoded-ui-guard\.test/,
  /^\s*\/\//,
  /^\s*\*/,
  /eslint-disable/,
];

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function lineAllowed(line, relative) {
  if (ALLOWLIST_FILES.has(relative)) return true;
  if (/\bui\.|\bUI_LABELS\b|owner-visual-copy|ownerVisualCopy/.test(line)) return true;
  return ALLOWLIST_LINE_PATTERNS.some((re) => re.test(line));
}

function scanFile(absPath, root) {
  const relative = path.relative(root, absPath).replace(/\\/g, '/');
  if (DICTIONARY_FILES.has(path.basename(relative)) || ALLOWLIST_FILES.has(relative)) return [];

  const lines = fs.readFileSync(absPath, 'utf8').split(/\r?\n/);
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!CYRILLIC.test(line) || lineAllowed(line, relative)) continue;
    const stringLiterals = line.match(/(['"`])((?:\\.|(?!\1).)*)\1/g);
    if (!stringLiterals?.length) {
      violations.push({ file: relative, line: i + 1, text: line.trim() });
      continue;
    }
    for (const lit of stringLiterals) {
      if (CYRILLIC.test(lit) && !lineAllowed(lit, relative)) {
        violations.push({ file: relative, line: i + 1, text: line.trim() });
        break;
      }
    }
  }
  return violations;
}

function walkDir(dir, root, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      walkDir(path.join(dir, entry.name), root, out);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    if (/\.(test|spec)\.(tsx?|jsx?)$/.test(entry.name)) continue;
    out.push(...scanFile(path.join(dir, entry.name), root));
  }
}

const violations = [];
for (const rel of SCAN_ROOTS) {
  walkDir(path.join(rootDir, rel), rootDir, violations);
}

if (violations.length === 0) {
  console.log('OK: no suspicious hardcoded Cyrillic UI strings.');
  process.exit(0);
}

console.log(`Found ${violations.length} potential hardcoded UI strings:`);
for (const v of violations.slice(0, 200)) {
  console.log(`${v.file}:${v.line} ${v.text}`);
}
process.exit(1);
