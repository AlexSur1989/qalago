# Stage 6.8C — Release Architecture Foundation

**Baseline:** `f780cb7` (6.8B)  
**Date:** 2026-09-12

## Pre-implementation audit (summary)

| Area | Before 6.8C |
|------|-------------|
| Flutter version | `pubspec.yaml` **1.0.0+1** (canonical) |
| Android | `versionCode` / `versionName` from Flutter Gradle plugin |
| iOS | `MARKETING_VERSION` 1.0 in Xcode project; build from Flutter |
| API | URI prefix **`/api/v1`** |
| Remote config | **None** |
| Maintenance / forced update | **None** |
| Feature flags | Scattered env/dart-define only |
| Environments | `NODE_ENV` + implicit local URLs in Flutter |

## Implemented

- **Shared types:** `AppPlatform`, `UpdateMode`, `QalagoEnvironment`, `AppConfigResponseDto`, `FEATURE_FLAG_KEYS`.
- **Backend:** `GET /app-config`, `GET /version`, Prisma `AppReleaseSettings`, `FeatureFlagDefinition`, `CityFeatureFlagOverride`.
- **Semver + update mode** utilities with tests.
- **Maintenance guard** (exempt: health, version, app-config, auth refresh/logout).
- **Admin APIs:** `PATCH /admin/release/settings`, `/admin/release/feature-flags`, `/admin/release/cities/:cityId/feature-flags` (SUPER_ADMIN global; city-scoped for CITY_ADMIN).
- **Audit:** `RELEASE_CONFIG_UPDATE` on mutations.
- **`QALAGO_ENV`:** LOCAL / STAGING / PRODUCTION (production startup requires `PRODUCTION` when `NODE_ENV=production`).
- **Flutter:** config fetch + cache TTL 15m, maintenance/required/optional UX, client metadata headers, release build guards for DEV login.

## Feature flag precedence

1. Global default (`FeatureFlagDefinition.globalEnabled` or safe default)
2. Platform override (`androidEnabled` / `iosEnabled`) when `platform` query set
3. City override (`CityFeatureFlagOverride`) when `citySlug` resolves

Google/Apple flags additionally AND backend `GOOGLE_AUTH_ENABLED` / `APPLE_AUTH_ENABLED` (default OFF until 6.8D).

## Deferred

- **6.8D:** OAuth rollout using prepared flags.
- **6.9:** Legal/store listing copy.
- **7.x:** Real hostnames, VPS, store API rollout metrics, admin UI for release settings (API-only MVP).

## Verdict

**STAGE 6.8C PASSED — RELEASE ARCHITECTURE FOUNDATION READY** (local; no VPS/store publish).
