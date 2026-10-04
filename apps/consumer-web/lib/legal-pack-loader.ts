import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { AppLocale } from './locale';
import { LEGAL_PACK_CONTENT_VERSION } from '@qalago/shared-types';

export type LegalPackPageKey =
  | 'privacy-policy'
  | 'terms-of-use'
  | 'personal-data-consent'
  | 'community-rules'
  | 'cookies-analytics'
  | 'business-terms'
  | 'public-offer'
  | 'advertising-rules';

const FILE_MAP: Record<
  LegalPackPageKey,
  { dir: 'public' | 'business'; base: string }
> = {
  'privacy-policy': { dir: 'public', base: 'privacy-policy' },
  'terms-of-use': { dir: 'public', base: 'terms-of-use' },
  'personal-data-consent': { dir: 'public', base: 'personal-data-consent' },
  'community-rules': { dir: 'public', base: 'community-rules' },
  'cookies-analytics': { dir: 'public', base: 'cookies-analytics' },
  'business-terms': { dir: 'business', base: 'business-terms' },
  'public-offer': { dir: 'business', base: 'public-offer' },
  'advertising-rules': { dir: 'business', base: 'advertising-rules' },
};

function resolveLegalPackRoot(): string {
  const candidates = [
    join(process.cwd(), 'docs', 'legal'),
    join(process.cwd(), '..', '..', 'docs', 'legal'),
  ];
  for (const path of candidates) {
    if (existsSync(join(path, '6.15L-legal-pack.md'))) {
      return path;
    }
  }
  throw new Error('Legal pack not found');
}

function localeSuffix(locale: AppLocale): 'ru' | 'kk' {
  return locale === 'kk' ? 'kk' : 'ru';
}

export function loadLegalPackBody(page: LegalPackPageKey, locale: AppLocale): string {
  const spec = FILE_MAP[page];
  const file = join(
    resolveLegalPackRoot(),
    spec.dir,
    `${spec.base}.${localeSuffix(locale)}.md`,
  );
  const raw = readFileSync(file, 'utf8');
  const parts = raw.split('\n---\n');
  return (parts.length >= 2 ? parts.slice(1).join('\n---\n') : raw).trim();
}

export function loadLegalPackTitle(page: LegalPackPageKey, locale: AppLocale): string {
  const spec = FILE_MAP[page];
  const file = join(
    resolveLegalPackRoot(),
    spec.dir,
    `${spec.base}.${localeSuffix(locale)}.md`,
  );
  const firstHeading = readFileSync(file, 'utf8')
    .split('\n')
    .find((line) => line.startsWith('# '));
  return firstHeading?.replace(/^#\s+/, '').trim() ?? 'QalaGo';
}

export function legalPackDocumentVersion(): string {
  return LEGAL_PACK_CONTENT_VERSION;
}
