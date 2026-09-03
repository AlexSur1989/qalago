import { createHash } from 'crypto';

describe('AuthService OTP hash', () => {
  it('hashes codes consistently', () => {
    const hash = (code: string) => createHash('sha256').update(code).digest('hex');
    expect(hash('1234')).toHaveLength(64);
    expect(hash('1234')).toBe(hash('1234'));
    expect(hash('1234')).not.toBe(hash('5678'));
  });
});
