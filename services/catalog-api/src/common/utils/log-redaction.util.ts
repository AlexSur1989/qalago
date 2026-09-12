const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'idtoken',
  'id_token',
  'identitytoken',
  'identity_token',
  'otp',
  'code',
  'password',
  'secret',
  'apikey',
  'api_key',
  'database_url',
  'jwt_secret',
  'qalago_internal_service_token',
]);

const REDACTED = '[REDACTED]';

export function redactSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/-/g, '_');
  return SENSITIVE_KEYS.has(normalized);
}

export function redactHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    out[key] = redactSensitiveKey(key) ? REDACTED : value;
  }
  return out;
}

export function redactObjectShallow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = redactSensitiveKey(key) ? REDACTED : value;
  }
  return out;
}
