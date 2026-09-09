import { generateInviteToken, hashInviteToken, inviteTokensMatch } from './invite-token.util';

describe('invite-token.util', () => {
  it('generates high-entropy tokens', () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a.length).toBeGreaterThan(20);
    expect(a).not.toBe(b);
  });

  it('hashes token deterministically', () => {
    const token = generateInviteToken();
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
  });

  it('matches valid token against hash', () => {
    const token = generateInviteToken();
    const hash = hashInviteToken(token);
    expect(inviteTokensMatch(token, hash)).toBe(true);
    expect(inviteTokensMatch(`${token}x`, hash)).toBe(false);
  });
});
