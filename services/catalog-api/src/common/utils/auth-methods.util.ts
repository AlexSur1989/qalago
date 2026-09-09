import { AuthProvider } from '@prisma/client';

export type UserAuthMethod = 'GOOGLE' | 'APPLE' | 'PHONE';

/**
 * Derives safe auth-method labels for admin/support display.
 * Does not expose providerUserId or raw identity data.
 *
 * PHONE is inferred only for legacy phone-only accounts (no AuthIdentity rows).
 * Users with social identities are not labeled PHONE even if User.phone is set.
 */
export function deriveUserAuthMethods(
  phone: string | null | undefined,
  identities: Array<{ provider: AuthProvider }>,
): UserAuthMethod[] {
  const methods = new Set<UserAuthMethod>();

  for (const identity of identities) {
    if (identity.provider === AuthProvider.GOOGLE) {
      methods.add('GOOGLE');
    }
    if (identity.provider === AuthProvider.APPLE) {
      methods.add('APPLE');
    }
  }

  const normalizedPhone = phone?.trim();
  if (
    identities.length === 0 &&
    normalizedPhone &&
    !normalizedPhone.startsWith('deleted:')
  ) {
    methods.add('PHONE');
  }

  return Array.from(methods).sort();
}
