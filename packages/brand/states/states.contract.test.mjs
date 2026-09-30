import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}]/u;

const required = [
  'BackofficeAlert.tsx',
  'BackofficeEmptyState.tsx',
  'BackofficeLoadingState.tsx',
  'BackofficeSkeleton.tsx',
  'BackofficeErrorState.tsx',
  'BackofficeAccessDenied.tsx',
  'BackofficeFeatureUnavailable.tsx',
  'BackofficeNotFoundState.tsx',
];

const iconComponents = new Set([
  'BackofficeAlert.tsx',
  'BackofficeEmptyState.tsx',
  'BackofficeErrorState.tsx',
  'BackofficeAccessDenied.tsx',
  'BackofficeFeatureUnavailable.tsx',
  'BackofficeNotFoundState.tsx',
]);

for (const file of required) {
  const src = readFileSync(join(here, file), 'utf8');
  if (EMOJI_RE.test(src)) throw new Error(`emoji in ${file}`);
  if (iconComponents.has(file) && !src.includes('QalaIcon')) {
    throw new Error(`${file} must use QalaIcon`);
  }
}

const alertSrc = readFileSync(join(here, 'BackofficeAlert.tsx'), 'utf8');
if (!alertSrc.includes("role={ALERT_ROLE[variant]}")) {
  throw new Error('BackofficeAlert must set role by variant');
}

const denied = readFileSync(join(here, 'BackofficeAccessDenied.tsx'), 'utf8');
const feature = readFileSync(join(here, 'BackofficeFeatureUnavailable.tsx'), 'utf8');
if (denied.includes('BackofficeFeatureUnavailable') || feature.includes('BackofficeAccessDenied')) {
  throw new Error('access denied and feature unavailable must stay distinct');
}

console.log(`states.contract: ${required.length} primitives ok`);
