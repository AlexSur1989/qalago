/** Normalized claims from a verified Google ID token — no library-specific types. */
export type VerifiedGoogleClaims = {
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
};

export type GoogleIdTokenVerifier = {
  verifyIdToken(idToken: string): Promise<VerifiedGoogleClaims>;
};

/** Normalized claims from a verified Apple identity token. */
export type VerifiedAppleClaims = {
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
};

export type AppleIdentityTokenVerifier = {
  verifyIdentityToken(identityToken: string): Promise<VerifiedAppleClaims>;
};

/** Provider-agnostic claims passed into shared social login flow. */
export type SocialLoginClaims = {
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
};
