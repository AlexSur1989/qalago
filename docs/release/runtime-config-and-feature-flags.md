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
