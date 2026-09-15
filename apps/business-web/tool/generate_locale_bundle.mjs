/**
 * Generates lib/locale.ts keys from Cyrillic literals + ARB kk value map.
 * Run: node tool/generate_locale_bundle.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mobileL10n = path.resolve(rootDir, '../mobile/lib/l10n');

function parseArb(file) {
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@') || typeof v !== 'string') continue;
    out[k] = v;
  }
  return out;
}

const ruArb = parseArb(path.join(mobileL10n, 'app_ru.arb'));
const kkArb = parseArb(path.join(mobileL10n, 'app_kk.arb'));
const ruToKk = new Map();
for (const key of Object.keys(ruArb)) {
  if (kkArb[key]) ruToKk.set(ruArb[key], kkArb[key]);
}

const CYR = /[\u0400-\u04FF]/;
const roots = ['app', 'components', 'lib'];
const skip = new Set(['node_modules', '.next', 'dist']);
const dict = new Set(['locale.ts', 'presentation.ts']);
const ALLOW_FILES = new Set(['app/terms/page.tsx', 'app/privacy/page.tsx']);

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
      out.push({ abs: p, rel });
    }
  }
}

const files = [];
for (const r of roots) walk(path.join(rootDir, r), files);

/** @type {Map<string, { key: string, ru: string }>} */
const byRu = new Map();

function slugKey(ru) {
  const base = ru
    .replace(/\$\{[^}]+\}/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('_')
    .toLowerCase();
  const hash = crypto.createHash('md5').update(ru).digest('hex').slice(0, 6);
  const safe = base.replace(/[^a-z0-9_]/g, '') || 'text';
  return `${safe}_${hash}`;
}

function addRu(ru) {
  if (!CYR.test(ru) || ru.length < 2) return;
  if (!byRu.has(ru)) {
    let key = slugKey(ru);
    const used = new Set([...byRu.values()].map((v) => v.key));
    while (used.has(key)) key = `${key}_x`;
    byRu.set(ru, { key, ru });
  }
}

function collectFromFile(rel, content) {
  if (ALLOW_FILES.has(rel)) return;
  const re = /(['"`])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(content))) {
    addRu(m[2]);
  }
  const jsxRe = />([^<{][^<]*[\u0400-\u04FF][^<]*)</g;
  let j;
  while ((j = jsxRe.exec(content))) {
    const text = j[1].trim();
    if (text.includes('{') || text.includes('`') || text.includes('(') || text.length > 120) {
      continue;
    }
    addRu(text);
  }
}

for (const { abs, rel } of files) {
  collectFromFile(rel, fs.readFileSync(abs, 'utf8'));
}

/** Manual semantic overrides aligned with Flutter ARB */
const SEMANTIC = {
  'Обзор': 'ownerNavOverview',
  'Статистика': 'ownerNavAnalytics',
  'Реклама и продвижение': 'ownerNavPromote',
  'Сообщения': 'ownerNavMessages',
  'Тариф': 'ownerNavPlan',
  'Команда': 'ownerNavTeam',
  'Настройки': 'ownerNavSettings',
  'Помощь': 'ownerNavHelp',
  'Мой бизнес': 'ownerMgmtMyBusiness',
  'Товары и услуги': 'ownerPermissionCatalogEdit',
  'Акции': 'ownerMgmtPromotions',
  'Русский': 'localeRu',
  'Қазақша': 'localeKk',
  'Свернуть меню': 'shellCollapseMenu',
  'Выйти': 'shellLogout',
  'скоро': 'shellSoonBadge',
  'Обновлено:': 'legalUpdatedLabel',
  'Политика конфиденциальности': 'legalPrivacyLink',
  'Условия использования': 'legalTermsLink',
  'Удаление аккаунта': 'legalAccountDeletionLink',
  'Production URL:': 'legalProductionUrlNote',
  'Черновик на основе фактического поведения приложения. Требуется проверка юриста перед публикацией в production.':
    'legalDraftNotice',
};

for (const [ru, semantic] of Object.entries(SEMANTIC)) {
  if (byRu.has(ru)) byRu.get(ru).key = semantic;
}

const entries = [...byRu.values()].sort((a, b) => a.key.localeCompare(b.key));

function kkFor(ru) {
  if (ruToKk.has(ru)) return ruToKk.get(ru);
  // partial template: keep same structure, translate known substrings
  let kk = ru;
  for (const [r, k] of ruToKk) {
    if (r.length > 8 && kk.includes(r)) kk = kk.split(r).join(k);
  }
  return kk;
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const ruLines = entries.map((e) => `    ${e.key}: '${esc(e.ru)}',`).join('\n');
const kkLines = entries.map((e) => `    ${e.key}: '${esc(kkFor(e.ru))}',`).join('\n');
const typeKeys = entries.map((e) => `  ${e.key}: string;`).join('\n');

const header = `export type AppLocale = 'ru' | 'kk';

export const LOCALE_COOKIE_NAME = 'qalago_locale';

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (value === 'kk' || value?.startsWith('kk')) return 'kk';
  if (value === 'ru' || value?.startsWith('ru')) return 'ru';
  return 'ru';
}

export type UiLabels = {
  siteTitle: string;
  siteDescription: string;
  languageSwitcherAria: string;
  localeRu: string;
  localeKk: string;
${typeKeys}
};

export const UI_LABELS: Record<AppLocale, UiLabels> = {
  ru: {
    siteTitle: 'QalaGo Business',
    siteDescription: 'Кабинет бизнеса — управление заведением в QalaGo',
    languageSwitcherAria: 'Язык интерфейса',
    localeRu: 'Русский',
    localeKk: 'Қазақша',
${ruLines}
  },
  kk: {
    siteTitle: 'QalaGo Business',
    siteDescription: 'Бизнес кабинеті — QalaGo-да мекемені басқару',
    languageSwitcherAria: 'Интерфейс тілі',
    localeRu: 'Русский',
    localeKk: 'Қазақша',
${kkLines}
  },
};

export function siteMetadataForLocale(locale: AppLocale): { title: string; description: string } {
  const labels = UI_LABELS[locale];
  return { title: labels.siteTitle, description: labels.siteDescription };
}

/** Interpolate {name} placeholders in UI strings. */
export function formatUi(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\\{(\\w+)\\}/g, (_, k) => String(vars[k] ?? ''));
}
`;

fs.writeFileSync(path.join(rootDir, 'lib/locale.ts'), header, 'utf8');
fs.writeFileSync(
  path.join(rootDir, 'tool/string_key_map.json'),
  JSON.stringify(Object.fromEntries([...byRu.entries()].map(([ru, v]) => [ru, v.key])), null, 2),
  'utf8',
);
console.log('Generated locale.ts with', entries.length, 'UI keys');
