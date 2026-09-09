/** Normalize Apple email_verified claim (boolean or string). */
export function normalizeAppleEmailVerified(value: unknown): boolean | undefined {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

export function isApplePrivateRelayEmail(email: string | undefined): boolean {
  return email != null && email.toLowerCase().endsWith('@privaterelay.appleid.com');
}
