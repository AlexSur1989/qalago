import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_BYTE_LENGTH = 32;

export function generateInviteToken(): string {
  return randomBytes(TOKEN_BYTE_LENGTH).toString('base64url');
}

export function hashInviteToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export function inviteTokensMatch(rawToken: string, storedHash: string): boolean {
  const computed = hashInviteToken(rawToken);
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(storedHash, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
