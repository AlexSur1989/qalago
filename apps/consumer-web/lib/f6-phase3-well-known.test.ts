import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildAppleAppSiteAssociation,
  buildAssetLinksJson,
  parseAndroidSha256FingerprintsFromEnv,
  parseAppleTeamIdFromEnv,
  QALAGO_ANDROID_PACKAGE_NAME,
  QALAGO_IOS_BUNDLE_ID,
} from './app-association-config';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from './middleware-public-locale-redirect';
import { isWellKnownAssociationPath } from './well-known-path';
import {
  appleAppSiteAssociationResponse,
  assetLinksResponseBody,
  WELL_KNOWN_JSON_CONTENT_TYPE,
} from './well-known-response';

const SAMPLE_FINGERPRINT =
  '14:6D:E9:83:C5:73:06:50:D8:EE:B9:93:2F:41:88:73:65:F7:65:B1:26:94:2F:1B:2F:52:B9:EC:83:C6:D1:AA';
const SAMPLE_FINGERPRINT_2 =
  'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99';

function redirectTarget(pathname: string, cookie?: string): string | null {
  const decision = resolveMiddlewareLocaleRedirect(
    pathname,
    new URLSearchParams(),
    cookie ?? null,
  );
  if (decision.kind !== 'permanent') return null;
  return joinRedirectTarget(decision.pathname, decision.search);
}

describe('F.6 Phase 3 well-known paths', () => {
  describe('path detection', () => {
    it('matches association root files', () => {
      expect(isWellKnownAssociationPath('/.well-known/assetlinks.json')).toBe(true);
      expect(isWellKnownAssociationPath('/.well-known/apple-app-site-association')).toBe(
        true,
      );
    });

    it('does not match unrelated dot paths', () => {
      expect(isWellKnownAssociationPath('/.env')).toBe(false);
      expect(isWellKnownAssociationPath('/uralsk')).toBe(false);
    });
  });

  describe('middleware bypass (F.5 regression guard)', () => {
    it('A — well-known paths do not locale-redirect', () => {
      expect(redirectTarget('/.well-known/assetlinks.json')).toBeNull();
      expect(redirectTarget('/.well-known/apple-app-site-association')).toBeNull();
    });

    it('B — no /ru or /kk prefix via redirect matrix', () => {
      const paths = [
        '/.well-known/assetlinks.json',
        '/.well-known/apple-app-site-association',
      ];
      for (const path of paths) {
        const target = redirectTarget(path, 'qalago_locale=kk');
        expect(target).toBeNull();
      }
    });

    it('C — neutral public route still redirects', () => {
      expect(redirectTarget('/uralsk')).toBe('/kk/uralsk');
    });

    it('D — RU/KK canonical routes unchanged', () => {
      expect(resolveMiddlewareLocaleRedirect('/ru/uralsk', new URLSearchParams(), null)).toMatchObject({
        kind: 'none',
        routeLocale: 'ru',
      });
      expect(resolveMiddlewareLocaleRedirect('/kk/aktobe', new URLSearchParams(), null)).toMatchObject({
        kind: 'none',
        routeLocale: 'kk',
      });
    });
  });

  describe('assetlinks configuration', () => {
    const envKeys = ['QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS', 'QALAGO_APPLE_TEAM_ID'];

    beforeEach(() => {
      for (const key of envKeys) delete process.env[key];
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('F — missing config returns empty association array', () => {
      expect(buildAssetLinksJson({})).toEqual([]);
      expect(JSON.parse(assetLinksResponseBody({}))).toEqual([]);
    });

    it('E — configured output has package, relation, fingerprints', () => {
      vi.stubEnv('QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS', SAMPLE_FINGERPRINT);
      const json = buildAssetLinksJson();
      expect(json).toHaveLength(1);
      expect(json[0]?.relation).toEqual(['delegate_permission/common.handle_all_urls']);
      expect(json[0]?.target.package_name).toBe(QALAGO_ANDROID_PACKAGE_NAME);
      expect(json[0]?.target.sha256_cert_fingerprints).toEqual([SAMPLE_FINGERPRINT]);
    });

    it('supports multiple comma-separated fingerprints', () => {
      vi.stubEnv(
        'QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS',
        `${SAMPLE_FINGERPRINT},${SAMPLE_FINGERPRINT_2}`,
      );
      const parsed = parseAndroidSha256FingerprintsFromEnv();
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.fingerprints).toHaveLength(2);
      }
    });

    it('F — malformed fingerprint fails closed (no association output)', () => {
      vi.stubEnv('QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS', 'not-a-fingerprint');
      expect(parseAndroidSha256FingerprintsFromEnv().ok).toBe(false);
      expect(buildAssetLinksJson()).toEqual([]);
    });

    it('I — content type constant is application/json', () => {
      expect(WELL_KNOWN_JSON_CONTENT_TYPE).toBe('application/json');
    });
  });

  describe('AASA configuration', () => {
    beforeEach(() => {
      delete process.env.QALAGO_APPLE_TEAM_ID;
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('H — missing Team ID returns empty details with 404', () => {
      const res = appleAppSiteAssociationResponse({});
      expect(res.status).toBe(404);
      const body = JSON.parse(res.body);
      expect(body.applinks.details).toEqual([]);
    });

    it('G — configured AASA uses Team ID + bundle and ru/kk paths', () => {
      vi.stubEnv('QALAGO_APPLE_TEAM_ID', 'AB12CD34EF');
      const aasa = buildAppleAppSiteAssociation();
      expect(aasa).not.toBeNull();
      expect(aasa?.applinks.details[0]?.appID).toBe(
        `AB12CD34EF.${QALAGO_IOS_BUNDLE_ID}`,
      );
      expect(aasa?.applinks.details[0]?.paths).toEqual(['/ru/*', '/kk/*']);
    });

    it('H — malformed Team ID fails closed', () => {
      vi.stubEnv('QALAGO_APPLE_TEAM_ID', 'bad-team');
      expect(parseAppleTeamIdFromEnv().ok).toBe(false);
      expect(buildAppleAppSiteAssociation()).toBeNull();
      expect(appleAppSiteAssociationResponse().status).toBe(404);
    });
  });

  describe('security', () => {
    it('J — env parser ignores unrelated keys (no query injection surface in builders)', () => {
      const env = {
        QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS: SAMPLE_FINGERPRINT,
        MALICIOUS_QUERY: 'TEAM123456',
      };
      expect(buildAssetLinksJson(env)[0]?.target.package_name).toBe(
        QALAGO_ANDROID_PACKAGE_NAME,
      );
      expect(buildAppleAppSiteAssociation(env)).toBeNull();
    });
  });
});
