import { AuthUser, ownerApi } from '@/lib/api';
import {
  clearAppleAuthSession,
  readAppleAuthSession,
  verifyAppleIdentityTokenNonce,
} from './apple-crypto';
import {
  SocialSignInCancelled,
  SocialSignInNoToken,
  SocialSignInNonceMismatch,
  SocialSignInStateMismatch,
} from './social-auth-errors';

export type SocialAuthExchangeResult = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

export async function exchangeGoogleIdToken(idToken: string): Promise<SocialAuthExchangeResult> {
  const trimmed = idToken.trim();
  if (!trimmed) {
    throw new SocialSignInNoToken();
  }
  return ownerApi.signInWithGoogle(trimmed);
}

export type AppleAuthorizationResponse = {
  authorization?: {
    id_token?: string;
    state?: string;
  };
  error?: string;
};

export function validateAppleAuthorization(
  response: AppleAuthorizationResponse,
): string {
  if (response.error === 'popup_closed_by_user') {
    throw new SocialSignInCancelled();
  }

  const identityToken = response.authorization?.id_token?.trim();
  if (!identityToken) {
    throw new SocialSignInNoToken();
  }

  const { state: expectedState, nonceHash } = readAppleAuthSession();
  const responseState = response.authorization?.state;
  if (!expectedState || !responseState || responseState !== expectedState) {
    clearAppleAuthSession();
    throw new SocialSignInStateMismatch();
  }

  if (!nonceHash || !verifyAppleIdentityTokenNonce(identityToken, nonceHash)) {
    clearAppleAuthSession();
    throw new SocialSignInNonceMismatch();
  }

  clearAppleAuthSession();
  return identityToken;
}

export async function exchangeAppleAuthorization(
  response: AppleAuthorizationResponse,
): Promise<SocialAuthExchangeResult> {
  const identityToken = validateAppleAuthorization(response);
  return ownerApi.signInWithApple(identityToken);
}
