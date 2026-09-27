/** Canonical Android applicationId (F.6). */
export const QALAGO_ANDROID_PACKAGE_NAME = 'kz.qalago.qalago_mobile';

/** Canonical iOS bundle identifier (F.6). */
export const QALAGO_IOS_BUNDLE_ID = 'kz.qalago.qalagoMobile';

const ANDROID_FINGERPRINT_ENV = 'QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS';
const APPLE_TEAM_ID_ENV = 'QALAGO_APPLE_TEAM_ID';

/** SHA-256 cert fingerprint: 32 colon-separated octets. */
const SHA256_FINGERPRINT_RE = /^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/;

/** Apple Team ID (10 alphanumeric). */
const APPLE_TEAM_ID_RE = /^[A-Z0-9]{10}$/;

export type ParsedAndroidFingerprints =
  | { ok: true; fingerprints: string[] }
  | { ok: false; reason: 'missing' | 'malformed' };

export type ParsedAppleTeamId =
  | { ok: true; teamId: string }
  | { ok: false; reason: 'missing' | 'malformed' };

function normalizeFingerprint(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (!SHA256_FINGERPRINT_RE.test(trimmed)) return null;
  return trimmed;
}

export function parseAndroidSha256FingerprintsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ParsedAndroidFingerprints {
  const raw = env[ANDROID_FINGERPRINT_ENV]?.trim();
  if (!raw) return { ok: false, reason: 'missing' };

  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return { ok: false, reason: 'missing' };

  const fingerprints: string[] = [];
  for (const part of parts) {
    const normalized = normalizeFingerprint(part);
    if (!normalized) return { ok: false, reason: 'malformed' };
    if (!fingerprints.includes(normalized)) {
      fingerprints.push(normalized);
    }
  }
  return { ok: true, fingerprints };
}

export function parseAppleTeamIdFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ParsedAppleTeamId {
  const raw = env[APPLE_TEAM_ID_ENV]?.trim().toUpperCase();
  if (!raw) return { ok: false, reason: 'missing' };
  if (!APPLE_TEAM_ID_RE.test(raw)) return { ok: false, reason: 'malformed' };
  return { ok: true, teamId: raw };
}

export type AssetLinksStatement = {
  relation: string[];
  target: {
    namespace: 'android_app';
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
};

export function buildAssetLinksJson(env: NodeJS.ProcessEnv = process.env): AssetLinksStatement[] {
  const parsed = parseAndroidSha256FingerprintsFromEnv(env);
  if (!parsed.ok) return [];

  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: QALAGO_ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: parsed.fingerprints,
      },
    },
  ];
}

export type AppleAppSiteAssociation = {
  applinks: {
    apps: string[];
    details: Array<{
      appID: string;
      paths: string[];
    }>;
  };
};

/** Canonical F.6 public URL space for Universal Links. */
export const AASA_ASSOCIATED_PATHS = ['/ru/*', '/kk/*'] as const;

export function buildAppleAppSiteAssociation(
  env: NodeJS.ProcessEnv = process.env,
): AppleAppSiteAssociation | null {
  const parsed = parseAppleTeamIdFromEnv(env);
  if (!parsed.ok) return null;

  return {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${parsed.teamId}.${QALAGO_IOS_BUNDLE_ID}`,
          paths: [...AASA_ASSOCIATED_PATHS],
        },
      ],
    },
  };
}

export const APP_ASSOCIATION_ENV_DOCS = {
  androidFingerprints: ANDROID_FINGERPRINT_ENV,
  appleTeamId: APPLE_TEAM_ID_ENV,
} as const;
