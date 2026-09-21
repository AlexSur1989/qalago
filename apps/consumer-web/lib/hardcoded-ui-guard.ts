import fs from 'node:fs';
import path from 'node:path';

const CYRILLIC = /[\u0400-\u04FF]/;

/** Product UI strings must live in lib/locale.ts only. */
const DICTIONARY_FILES = new Set([
  'locale.ts',
  'localized-content.ts',
  'metadata-copy.ts',
  'page-metadata.ts',
]);

const SCAN_ROOTS = ['app', 'components', 'lib'];

const SKIP_DIR_NAMES = new Set(['node_modules', '.next', 'dist']);

const ALLOWLIST_LINE_PATTERNS: RegExp[] = [
  /nameRu/,
  /nameKk/,
  /displayName/,
  /categoryDisplayName/,
  /subcategoryDisplayName/,
  /UI_LABELS/,
  /siteMetadataForLocale/,
  /hardcoded-ui-guard/,
  /locale-client/,
  /locale-server/,
  /locale\.test/,
  /i18n\.test/,
  /home-categories\.test/,
  /^\s*\/\//,
  /^\s*\*/,
  /eslint-disable/,
];

export type HardcodedUiViolation = {
  file: string;
  line: number;
  text: string;
};

function isDictionaryFile(relativePath: string): boolean {
  const base = path.basename(relativePath);
  return DICTIONARY_FILES.has(base);
}

function lineAllowed(line: string): boolean {
  return ALLOWLIST_LINE_PATTERNS.some((re) => re.test(line));
}

function scanFile(absPath: string, rootDir: string): HardcodedUiViolation[] {
  const relative = path.relative(rootDir, absPath).replace(/\\/g, '/');
  if (isDictionaryFile(relative)) return [];

  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations: HardcodedUiViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!CYRILLIC.test(line)) continue;
    if (lineAllowed(line)) continue;

    const stringLiterals = line.match(/(['"`])((?:\\.|(?!\1).)*)\1/g);
    if (!stringLiterals?.length) {
      violations.push({ file: relative, line: i + 1, text: line.trim() });
      continue;
    }
    for (const lit of stringLiterals) {
      if (CYRILLIC.test(lit) && !lineAllowed(lit)) {
        violations.push({ file: relative, line: i + 1, text: line.trim() });
        break;
      }
    }
  }
  return violations;
}

function walkDir(dir: string, rootDir: string, out: HardcodedUiViolation[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      walkDir(path.join(dir, entry.name), rootDir, out);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    if (/\.(test|spec)\.(tsx?|jsx?)$/.test(entry.name)) continue;
    out.push(...scanFile(path.join(dir, entry.name), rootDir));
  }
}

export function scanHardcodedConsumerWebUi(rootDir: string): HardcodedUiViolation[] {
  const violations: HardcodedUiViolation[] = [];
  for (const rel of SCAN_ROOTS) {
    walkDir(path.join(rootDir, rel), rootDir, violations);
  }
  return violations;
}
