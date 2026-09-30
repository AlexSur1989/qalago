# Runtime config & feature flags

## Authority

- **`GET /api/v1/app-config`** (public, no secrets)
- **`GET /api/v1/version`** — service metadata

Query params: `platform`, `appVersion`, `buildNumber`, `citySlug`.

## Update modes

| State | Rule |
|-------|------|
| NONE | installed ≥ latest (and build if configured) |
| OPTIONAL | minimum ≤ installed < latest |
| REQUIRED | installed < minimum (or build below minimum) |

## Maintenance

- `AppReleaseSettings.maintenanceEnabled` + localized RU/KK messages.
- Exempt routes: health, version, app-config, auth refresh/logout.
- Clients cannot disable via headers/query.

## Feature flags

Defined keys in `@qalago/shared-types` `FEATURE_FLAG_KEYS`.

**Safe defaults** (code): core browse ON; `adsPurchaseEnabled`, `googleAuthEnabled`, `appleAuthEnabled` OFF.

**Precedence:** platform override → city override → global (city wins over platform when both set).

## Flutter cache

- TTL **15 minutes** in SharedPreferences.
- On fetch failure: use cache if fresh; else bundled safe defaults — **no forced maintenance/update** on network error.

## Admin mutation

- Global release settings + global flags: **SUPER_ADMIN**
- City flag overrides: **CITY_ADMIN** (own city) or **SUPER_ADMIN**
- Audited via `RELEASE_CONFIG_UPDATE`

## Platform business features (BIZ.9 HOTFIX 5B)

Global **Business Web product** toggles stored in `FeatureFlagDefinition` (same table as release flags; **not** merged into mobile `GET /app-config` resolver or city overrides).

| Endpoint | Auth | Notes |
|----------|------|--------|
| `GET /api/v1/platform-features` | Public | `{ platformFeatures, configRevision }` |
| `GET /api/v1/admin/platform-features` | SUPER_ADMIN (write UI), ADMIN read-only | Same DTO |
| `PATCH /api/v1/admin/platform-features` | **SUPER_ADMIN only** | Body `{ businessTeamEnabled?: boolean }` |

**Live in 5B:** `businessTeamEnabled` (default **false**). When false: Business Web Team UI hidden; Team APIs return **403** `BUSINESS_TEAM_DISABLED`; invitation accept blocked. **Does not** revoke existing MANAGER memberships.

**Separate:** Admin Web compile-time `NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM` (catalog team panel) — orthogonal to runtime flag.
