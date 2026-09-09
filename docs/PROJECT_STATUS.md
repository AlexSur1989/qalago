# QalaGo — Project Status

**Last updated:** 2026-09-09  
**Stable checkpoint:** `stage-5n-checkpoint` @ `c74c142` — Stage 5N architecture accepted (5N.5)  
**Latest QA:** Stage 5N.QA runtime pass with 1 P1 fix (permission error sanitization); manual browser QA **PARTIAL**

---

## Completed stages (through 5M.4)

| Stage | Commit(s) | Summary |
|-------|-----------|---------|
| 5L | `f128613` | RBAC audit, gap matrix |
| 5M.0 | `b0f1f96` | CITY_ADMIN scope, upload auth, AI service token |
| 5M.1 | `0c8f6fe` | `BusinessMembership` foundation, dual-read `ownerId` |
| 5M.2 | `1dd77cc` | Manager permissions, team API, invitations |
| 5M.2.1 | `471f17f` | PostgreSQL migration/runtime verification, RolesGuard fix |
| 5M.3 | `051f2a4`, `2bacbb3` | AuditLog foundation, admin/owner read APIs, wired mutations |
| 5M.4 | `1f726b5` | SUPER_ADMIN governance; ADMIN operational-only; role-change SUPER_ADMIN-only |
| 5N.0 | `c051fbd` | Business registration audit/design |
| 5N.1 | `44596c9` | BusinessApplication backend, admin moderation API, ownerId fix |
| 5N.2 | `7a1ed6e` | BusinessOwnershipClaim backend, manual verification, plan preservation |
| 5N.3 | `00b6953` | Admin Web moderation UI for applications + ownership claims |
| 5N.4 | `aac46fa` | Flutter + Business Web client onboarding (applications + claims) |
| 5N.5 | `c74c142` | Legacy cutover, rate limits, session cleanup, PAYMENTS_VIEW RBAC, 393 backend tests |
| 5N.QA | pending | Runtime E2E API QA + HTTP smoke; P1 fix generic permission denial; browser UI PARTIAL |

**Not started:** Stage 6 (release readiness)  
**Deferred:** `MODERATOR`, document KYC, automatic phone ownership verification

---

## Monorepo layout

```text
QalaGo/
├── apps/
│   ├── mobile/          Flutter — consumer + membership-aware owner
│   ├── admin-web/       Next.js — moderation + /audit-logs
│   └── business-web/    Next.js — owner cabinet, team UI, team history
├── services/
│   ├── catalog-api/     NestJS + Prisma + PostgreSQL (port 3002)
│   └── ai-orchestrator/ NestJS AI proxy (port 3004)
├── packages/            shared-types, api-client, ai-core, …
├── infra/               Docker Compose, env templates
├── docs/                architecture, contracts, changelog
└── scripts/dev/         local setup, start-all
```

---

## Database (Prisma)

**15 migrations applied** (latest: `20260909110100_stage_5n2_ownership_claim`):

1. `20260905120000_monetization_campaign_architecture`
2. `20260906000000_business_plan_tier_stage_4c`
3. `20260906030000_stage_5c_analytics_events`
4. `20260907120000_stage_5h_traffic_source`
5. `20260907180000_stage_5i_search_query`
6. `20260907200000_stage_5j_audience_geography`
7. `20260908140000_stage_5m1_business_membership`
8. `20260908160000_stage_5m2_business_permissions`
9. `20260908180000_stage_5m3_audit_log`
10. `20260908190000_stage_5m4_super_admin`
11. `20260908190001_stage_5m4_super_admin_migrate`

**Migration note (5M.4):** existing `ADMIN` users were migrated to `SUPER_ADMIN` to preserve privilege.

Use **migrations**, not `db push`, for normal workflow:

```powershell
cd services/catalog-api
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue  # if stale shell override
npx prisma validate
npx prisma migrate deploy
npx prisma migrate status
```

**Windows pitfall:** PowerShell `$env:DATABASE_URL` overrides `.env`. Check with `Get-ChildItem Env:DATABASE_URL`. Clear stale values before Prisma commands.

**Local dev:** native PostgreSQL on `localhost:5432` works. Docker Compose exists but Docker is optional on current dev machine.

---

## Authorization model (two dimensions)

### System role — `User.role`

`USER` | `BUSINESS` | `CITY_ADMIN` | `ADMIN` | `SUPER_ADMIN`

**Governance (5M.4):**
- **SUPER_ADMIN** — system role authority (role changes, cities, category create/delete)
- **ADMIN** — global operational admin (moderation, payments, audit read); **cannot** change system roles
- **CITY_ADMIN** — `managedCityId` scope only
- Self role-change denied; last-SUPER_ADMIN demotion blocked

Legacy `BUSINESS` remains. A `USER` may legitimately be OWNER of one business and MANAGER of another.

### Business role — `BusinessMembership.role`

`OWNER` | `MANAGER` (not values of `UserRole`)

### Membership status

`INVITED` | `ACTIVE` | `SUSPENDED` | `REVOKED` — only **ACTIVE** grants access.

### Business permissions — `BusinessPermission` (10 values)

`BUSINESS_PROFILE_EDIT`, `BUSINESS_HOURS_EDIT`, `CATALOG_EDIT`, `PHOTOS_EDIT`, `PROMOTIONS_EDIT`, `REVIEWS_REPLY`, `ANALYTICS_VIEW`, `ANALYTICS_EXPORT`, `ADS_MANAGE`, `PAYMENTS_VIEW`

**Effective access:** system auth ∩ ACTIVE membership ∩ permission ∩ plan entitlement.

**Legacy:** `Business.ownerId` still exists; OWNER recognized via legacy `ownerId` OR ACTIVE OWNER membership. New business creation writes both.

**JWT:** no permissions or memberships in token; DB read per request. Authorization changes apply on next request.

**RolesGuard (5M.2.1):** `USER` may pass `@Roles(BUSINESS)` routes; `BusinessAccessService` is authoritative.

---

## Team & invitations (5M.2)

- Team list, existing-user invite, unknown-phone invitation (`BusinessInvitation`)
- Permission update, suspend, restore, revoke
- Invite claim after authenticated matching phone (7-day expiry)
- Owner protection; no self-assignment
- **Business Web:** team management + «История изменений» (OWNER only)
- **Flutter:** owner team-management screen **deferred** (P2)

---

## AuditLog (5M.3)

Security/operational audit — **not** `AnalyticsEvent`, not consumer browsing.

| Field | Purpose |
|-------|---------|
| `actorUserId?`, `actorRole?` | Authenticated actor snapshot |
| `action`, `resourceType`, `resourceId?` | What happened |
| `businessId?`, `cityId?` | Scope from server resource |
| `targetUserId?`, `metadata?` | Safe structured details |
| `createdAt` | When |

**Read APIs:**
- `GET /admin/audit-logs` — SUPER_ADMIN/ADMIN global; CITY_ADMIN `managedCityId` only
- `GET /businesses/:id/team/audit` — OWNER only (team actions)

**Policy:** append-only; no backfill; retention TBD; metadata sanitizer strips secrets/phones/addresses.

**Transactional (same DB tx):** existing-user team invite, invitation accept, `USER_ROLE_CHANGE`, `PAYMENT_CONFIRM`, plan tier changes.

**Deferred actions:** `USER_STATUS_CHANGE`, `PAYMENT_REJECT`, `REVIEW_REPLY_UPDATE/DELETE` (no endpoints).

See [RBAC](./architecture/rbac.md), [API contracts](./architecture/api-contracts.md).

---

## Verified test baseline (5M.4)

| Suite | Result |
|-------|--------|
| catalog-api | **386/386** |
| business-web | **45/45** vitest + build pass |
| admin-web | **18/18** vitest + build pass |
| Flutter | **232 pass, 3 fail** (pre-existing `auth_session_test.dart`; +5 onboarding tests) |
| Flutter | **227 pass, 3 fail** (pre-existing `auth_session_test.dart`; unrelated to 5M.4) |

Run from repo root: `npm test`, `npm run build`. Flutter: `cd apps/mobile && flutter test && flutter analyze`.

**Manual API QA (5M.4.1):** SUPER_ADMIN/ADMIN/CITY_ADMIN role governance verified via dev-login API.

---

## Client features (accepted)

| Client | State |
|--------|-------|
| Mobile | Guest-first consumer; «Для бизнеса» onboarding; membership-aware owner cabinet; claim CTA on detail |
| Business Web | Onboarding (`/onboarding`), team management, permission-aware nav, team audit history (OWNER) |
| Admin Web | Moderation, `/business-requests` (applications + claims), monetization, users, `/audit-logs` |
| Flutter owner team UI | **Deferred** (P2) |
| Flutter AuditLog UI | **Not required** |

---

## Analytics (implemented)

5F tiered analytics · 5H traffic sources · 5I search queries · 5J audience geography · 5K CSV export · 5K.1 native Flutter share

Keep separate from AuditLog.

---

## Monetization (current)

Subscription tiers: `FREE` | `BASIC` | `PREMIUM` | `VIP` — see `PlanLimitsService` / `docs/product/business-tariffs.md`.

Campaign ads: orders, manual payment verification, creative moderation, fair rotation, VIP inventory. Subscription ≠ ad placement.

---

## AI security boundary

```text
client → catalog-api → ai-orchestrator
```

Internal header: `X-QalaGo-Service-Token` (`QALAGO_INTERNAL_SERVICE_TOKEN`). Never expose via frontend public env. Production fail-closed.

---

## Production safety checklist

| Setting | Production |
|---------|------------|
| `OTP_DEBUG` | `false` |
| `DEV_LOGIN_ENABLED` | `false` |
| `JWT_SECRET` | strong, min 32 chars |
| `QALAGO_INTERNAL_SERVICE_TOKEN` | configured |
| DB migrations | `prisma migrate deploy` |
| HTTPS | required |
| DB backups | before migrations |
| Internal tokens in browser/mobile | **never** |
| Production SMS OTP | pending |
| Stage 6 | not completed |

---

## Roadmap

| Priority | Item |
|----------|------|
| P1 | MODERATOR role |
| P1 | Audit retention/archival policy |
| P1 | Full manual UI QA |
| P2 | Flutter owner team-management screen |
| P2 | Richer audit filters/export |
| P2 | Production SMS OTP, rate limiting |
| — | **Stage 6** release readiness (deferred) |

---

## Canonical docs

- [Documentation index](./README.md)
- [Architecture overview](./architecture/overview.md)
- [RBAC](./architecture/rbac.md)
- [Business membership](./architecture/business-membership.md)
- [API contracts](./architecture/api-contracts.md)
- [Local setup](../scripts/dev/SETUP.md)
- [Deploy](./deploy.md)
- [Changelog](./changelog.md)
- [Stage 5L audit (historical)](./stage-5l-rbac-audit.md)
