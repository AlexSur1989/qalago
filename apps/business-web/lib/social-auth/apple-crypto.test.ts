import { describe, expect, it } from 'vitest';
import {
  createAppleAuthSession,
  decodeJwtPayload,
  sha256Hex,
  verifyAppleIdentityTokenNonce,
} from './apple-crypto';

describe('apple-crypto', () => {
  it('hashes nonce consistently', async () => {
    const hash = await sha256Hex('test-nonce');
    expect(hash).toHaveLength(64);
    expect(await sha256Hex('test-nonce')).toBe(hash);
  });

  it('creates state and nonce hash session values', async () => {
    const session = await createAppleAuthSession();
    expect(session.state.length).toBeGreaterThan(10);
    expect(session.rawNonce.length).toBeGreaterThan(10);
    expect(session.nonceHash).toBe(await sha256Hex(session.rawNonce));
  });

  it('verifies nonce claim in identity token payload', async () => {
    const rawNonce = 'nonce-123';
    const nonceHash = await sha256Hex(rawNonce);
    const payload = Buffer.from(JSON.stringify({ nonce: nonceHash }), 'utf8').toString(
      'base64url',
    );
    const token = `header.${payload}.sig`;
    expect(verifyAppleIdentityTokenNonce(token, nonceHash)).toBe(true);
    expect(verifyAppleIdentityTokenNonce(token, 'wrong')).toBe(false);
  });

  it('decodes jwt payload', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'apple-user' }), 'utf8').toString(
      'base64url',
    );
    expect(decodeJwtPayload(`h.${payload}.s`)).toEqual({ sub: 'apple-user' });
  });
});
