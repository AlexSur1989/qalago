const SESSION_STATE_KEY = 'qalago_apple_oauth_state';
const SESSION_NONCE_HASH_KEY = 'qalago_apple_oauth_nonce_hash';

export function generateRandomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createAppleAuthSession(): Promise<{
  state: string;
  rawNonce: string;
  nonceHash: string;
}> {
  const state = generateRandomToken();
  const rawNonce = generateRandomToken();
  const nonceHash = await sha256Hex(rawNonce);
  return { state, rawNonce, nonceHash };
}

export function persistAppleAuthSession(state: string, nonceHash: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_STATE_KEY, state);
  sessionStorage.setItem(SESSION_NONCE_HASH_KEY, nonceHash);
}

export function readAppleAuthSession(): { state: string | null; nonceHash: string | null } {
  if (typeof sessionStorage === 'undefined') {
    return { state: null, nonceHash: null };
  }
  return {
    state: sessionStorage.getItem(SESSION_STATE_KEY),
    nonceHash: sessionStorage.getItem(SESSION_NONCE_HASH_KEY),
  };
}

export function clearAppleAuthSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_STATE_KEY);
  sessionStorage.removeItem(SESSION_NONCE_HASH_KEY);
}

function decodeBase64Url(value: string): string {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid identity token');
  }
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeBase64Url(payload);
  return JSON.parse(json) as Record<string, unknown>;
}

export function verifyAppleIdentityTokenNonce(
  identityToken: string,
  expectedNonceHash: string,
): boolean {
  const payload = decodeJwtPayload(identityToken);
  return typeof payload.nonce === 'string' && payload.nonce === expectedNonceHash;
}
