# Versioning & API compatibility

## Mobile

- Canonical: **`MAJOR.MINOR.PATCH+BUILD`** in `apps/mobile/pubspec.yaml` (currently `1.0.0+1`).
- **BUILD** monotonic for store uploads.
- Android/iOS derive from Flutter build.

## Backend

- Public REST prefix: **`/api/v1`**.
- **Backward-compatible:** optional fields, new endpoints, tolerant enum handling.
- **Breaking:** new `/api/v2` or documented deprecation window — never silent semantic changes.

## Independent releases

- Backend may deploy without forcing immediate mobile store update.
- Mobile below `minimumVersion` → **REQUIRED** update (UI + safe API degradation).
- Backend must still validate dangerous operations for unsupported clients where feasible.

## Forced updates

- Use `minimumVersion` / `minimumBuild` only for security or true incompatibility.
- Do not use maintenance mode as a substitute.

## Deprecation (lightweight)

- Mark endpoint/field deprecated in `api-contracts.md` with target removal release.
- Monitor usage via client metadata headers before removal.
