import { describe, expect, it } from 'vitest';
import type { AuthUser } from './api';

describe('AuthUser nullable phone contract', () => {
  it('accepts user without phone for social-only accounts', () => {
    const user: AuthUser = {
      id: 'u1',
      role: 'USER',
      name: 'Social User',
      phone: null,
      email: 'user@example.com',
    };
    expect(user.phone).toBeNull();
    expect(user.email).toBe('user@example.com');
  });

  it('accepts legacy phone user', () => {
    const user: AuthUser = {
      id: 'u2',
      role: 'USER',
      phone: '+77001234567',
    };
    expect(user.phone).toBe('+77001234567');
  });
});
