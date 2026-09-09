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
