/** Short-lived access token — memory only (never localStorage). */
let accessToken: string | null = null;

export function getWebAccessToken(): string | null {
  return accessToken;
}

export function setWebAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearWebAccessToken(): void {
  accessToken = null;
}
