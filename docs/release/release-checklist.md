# QalaGo release checklist (local / prep)

## Pre-release

- [ ] `npm run test` / catalog-api Jest green
- [ ] `npm run build` affected workspaces
- [ ] `flutter analyze` / targeted `flutter test`
- [ ] Review Prisma migrations (additive, backup plan)
- [ ] Set `AppReleaseSettings` min/latest versions
- [ ] Feature flags reviewed (kill switches OFF unless intended)
- [ ] `docs/changelog.md` updated
- [ ] Security regression (6.8B): no localStorage auth, DEV login prod gate

## Deploy order

1. **Database:** migrate (expand-only when possible)
2. **Backend:** deploy compatible API (supports old mobile)
3. **Web:** admin/business artifacts
4. **Mobile:** store upload later; staged rollout 5→25→50→100%

## Smoke

- [ ] `/api/v1/health`, `/api/v1/version`, `/api/v1/app-config`
- [ ] Auth refresh/login
- [ ] Critical catalog read paths

## Post-release monitoring

- 5xx rate, auth failures, payment errors (when live), crash reports

## Rollback criteria

- Sustained 5xx on core APIs
- Auth/session widespread failure
- Data corruption signal → forward fix preferred over DB restore

See `migrations-and-rollback.md`.
