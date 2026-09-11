/**
 * Rejects obvious placeholder secrets in production. Does not log secret values.
 */
const PLACEHOLDER_SUBSTRINGS = [
  'change-me',
  'dev-secret',
  'test-secret',
  'dev-internal-service-token',
  'qalago-staging-jwt',
  'ci-test-secret',
] as const;

const EXACT_WEAK = new Set(['secret', 'password', 'example', 'test', 'dev']);

export function isWeakSecretValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return true;
  }
  if (trimmed.length < 32) {
    return true;
  }
  const lower = trimmed.toLowerCase();
  if (EXACT_WEAK.has(lower)) {
    return true;
  }
  return PLACEHOLDER_SUBSTRINGS.some((part) => lower.includes(part));
}

export function assertStrongSecret(label: string, value: string): void {
  if (isWeakSecretValue(value)) {
    throw new Error(`${label} must be a strong secret (min 32 chars, no known placeholders)`);
  }
}
