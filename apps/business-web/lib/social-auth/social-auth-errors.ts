import type { AppLocale } from '@/lib/locale';
import { mapSocialAuthErrorMessage } from '@/lib/presentation';

export class SocialSignInCancelled extends Error {
  constructor() {
    super('Social sign-in cancelled');
    this.name = 'SocialSignInCancelled';
  }
}

export class SocialSignInNoToken extends Error {
  constructor() {
    super('Social sign-in missing token');
    this.name = 'SocialSignInNoToken';
  }
}

export class SocialSignInStateMismatch extends Error {
  constructor() {
    super('Social sign-in state mismatch');
    this.name = 'SocialSignInStateMismatch';
  }
}

export class SocialSignInNonceMismatch extends Error {
  constructor() {
    super('Social sign-in nonce mismatch');
    this.name = 'SocialSignInNonceMismatch';
  }
}

/** User-facing message. Empty string means silent (cancellation). */
export function mapSocialAuthError(
  locale: AppLocale,
  error: unknown,
  providerLabel: string,
): string {
  if (error instanceof SocialSignInCancelled) {
    return '';
  }
  return mapSocialAuthErrorMessage(locale, error, providerLabel);
}
