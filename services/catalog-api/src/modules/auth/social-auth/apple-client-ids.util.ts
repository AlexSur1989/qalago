export const APPLE_ISSUER = 'https://appleid.apple.com';

export function collectAppleClientIds(input: {
  ios?: string | null;
  web?: string | null;
}): string[] {
  return [input.ios, input.web]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));
}
