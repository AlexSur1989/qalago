const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export function isAllowedGoogleIssuer(issuer: string | undefined): boolean {
  return issuer != null && GOOGLE_ISSUERS.has(issuer);
}

export function collectGoogleClientIds(input: {
  android?: string | null;
  ios?: string | null;
  web?: string | null;
}): string[] {
  return [input.android, input.ios, input.web]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));
}
