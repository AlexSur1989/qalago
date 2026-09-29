import { describe, expect, it, vi } from 'vitest';
import { loadCanonicalBusinessUser } from './business-auth-session';

describe('business-auth-session (BIZ.2)', () => {
  it('loadCanonicalBusinessUser returns user from getMe', async () => {
    const getMe = vi.fn().mockResolvedValue({
      id: 'u1',
      name: 'Owner',
      role: 'USER',
      phone: '+7700',
    });
    const result = await loadCanonicalBusinessUser('tok', getMe);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe('u1');
      expect(getMe).toHaveBeenCalledWith('tok');
    }
  });

  it('loadCanonicalBusinessUser fails closed when getMe fails', async () => {
    const getMe = vi.fn().mockRejectedValue(new Error('401'));
    const result = await loadCanonicalBusinessUser('tok', getMe);
    expect(result).toEqual({ ok: false, reason: 'me_failed' });
  });
});
