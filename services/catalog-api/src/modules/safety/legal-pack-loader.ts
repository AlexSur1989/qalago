import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ALL_LEGAL_DOCUMENT_TYPES,
  LEGAL_PACK_CONTENT_VERSION,
  type LegalDocumentTypeSlug,
} from '@qalago/shared-types';
import { LegalLocale } from '@prisma/client';

const LOCALE_SUFFIX: Record<LegalLocale, 'ru' | 'kk'> = {
  RU: 'ru',
  KK: 'kk',
};

const FILE_BY_TYPE: Record<
  LegalDocumentTypeSlug,
  { publicDir: 'public' | 'business'; baseName: string }
> = {
  TERMS_OF_SERVICE: { publicDir: 'public', baseName: 'terms-of-use' },
  PRIVACY_POLICY: { publicDir: 'public', baseName: 'privacy-policy' },
  COMMUNITY_GUIDELINES: { publicDir: 'public', baseName: 'community-rules' },
  PERSONAL_DATA_CONSENT: { publicDir: 'public', baseName: 'personal-data-consent' },
  BUSINESS_TERMS: { publicDir: 'business', baseName: 'business-terms' },
  PUBLIC_OFFER: { publicDir: 'business', baseName: 'public-offer' },
  ADVERTISING_TERMS: { publicDir: 'business', baseName: 'advertising-rules' },
};

export function resolveLegalPackRoot(): string {
  const candidates = [
    join(process.cwd(), 'docs', 'legal'),
    join(process.cwd(), '..', '..', 'docs', 'legal'),
    join(__dirname, '..', '..', '..', '..', '..', 'docs', 'legal'),
  ];
  for (const path of candidates) {
    if (existsSync(join(path, '6.15L-legal-pack.md'))) {
      return path;
    }
  }
  throw new Error('Legal pack root not found (docs/legal)');
}

export function legalPackMarkdownPath(
  type: LegalDocumentTypeSlug,
  locale: LegalLocale,
): string {
  const spec = FILE_BY_TYPE[type];
  const suffix = LOCALE_SUFFIX[locale];
  return join(resolveLegalPackRoot(), spec.publicDir, `${spec.baseName}.${suffix}.md`);
}

export function loadLegalPackMarkdown(type: LegalDocumentTypeSlug, locale: LegalLocale): string {
  const raw = readFileSync(legalPackMarkdownPath(type, locale), 'utf8');
  return stripLegalPackFrontMatter(raw);
}

export function loadLegalPackDocument(
  type: LegalDocumentTypeSlug,
  locale: LegalLocale,
): { title: string; content: string } {
  const raw = readFileSync(legalPackMarkdownPath(type, locale), 'utf8');
  return {
    title: extractLegalPackTitle(raw),
    content: stripLegalPackFrontMatter(raw),
  };
}

export function extractLegalPackTitle(markdown: string): string {
  const line = markdown.split('\n').find((l) => l.startsWith('# '));
  return line?.replace(/^#\s+/, '').trim() ?? 'QalaGo Legal Document';
}

/** Body for DB/API: skip title + metadata block before first `---` separator. */
export function stripLegalPackFrontMatter(markdown: string): string {
  const parts = markdown.split('\n---\n');
  if (parts.length >= 2) {
    return parts.slice(1).join('\n---\n').trim();
  }
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## '));
  return (start >= 0 ? lines.slice(start) : lines).join('\n').trim();
}

export function legalPackSeedVersion(): string {
  return LEGAL_PACK_CONTENT_VERSION;
}

export function allLegalPackSeedTypes(): LegalDocumentTypeSlug[] {
  return [...ALL_LEGAL_DOCUMENT_TYPES];
}
