# Changelog — QalaGo

Все значимые продуктовые и технические нововведения фиксируются здесь.  
Формат: дата → что сделано → что заложить на будущее.

---

---

---

---

---

---

---

---

---

---

---

---

## 2026-09-10 — Stage 6.5.1: Analytics instrumentation completion

- Flutter: map impressions (`MapBusinessPreviewImpression`, list viewability), catalog (`TrackedCatalogItemCard`), reviews (`ReviewsViewTracker`, `REVIEW_CREATED` after API success).
- Search funnel: `discoverySurface=SEARCH_RESULTS` on open, `SEARCH_PERFORMED` from search UI, visitor/session on views.
- Backend: `AnalyticsBusinessVisitor` + `visitorType` on `VIEW_BUSINESS`; `VISITOR_TYPE` rollup dimension.
- Tests: full Flutter suite + search funnel / visitor-type backend specs.
- **Future:** Analytics 360 UI (6.6), `CATALOG_ITEM_ACTION` when UI adds meaningful actions.

## 2026-09-10 — Stage 6.5: Analytics data foundation

- Extended `AnalyticsEvent` (promotionId, catalogItemId, clientEventId, visitorHash, discoverySurface, platform, isInternal).
- Added `AnalyticsDailyMetric` + `AnalyticsDailyDimensionMetric` with timezone-aware rollup job.
- Organic ingest: whitelist, idempotency, internal-traffic exclusion, promotion/catalog validation.
- Fixed `popularTimes` to use `City.timezone` (not UTC).
- Flutter: visitor/session providers, impression tracking, promotionId on promotion views.
- Docs: `docs/analytics/stage-6-5-analytics-data-foundation.md`.
- **Future:** Analytics 360 UI (6.6), scheduled raw-event retention job, new/returning visitor dimension.

## 2026-09-10 — Stage 6.4: Subscription plan redesign

- **Сделано:** Canonical `PLAN_CATALOG` (FREE/BASIC/PREMIUM/VIP → Бесплатный/Бизнес/PRO/VIP); manager limits; review-reply entitlement; monthly ad bonus in catalog (display only); ad discount derived from catalog; consumer plan badge removed; Business/Admin/Flutter plan UX; docs + monthly ad bonus design note.
- **Политика:** subscription ≠ organic ranking; downgrade preserves content; no ad wallet ledger in 6.4.
- **На будущее:** Analytics 360 (6.5/6.6), monthly ad bonus accounting, extended styling UI.

## 2026-09-10 — Stage 6.3: Privacy, terms, account deletion & store compliance foundation

- **Сделано:** Public `/privacy`, `/terms`, `/account-deletion` (Business Web); Flutter/Business Web legal links and login consent; privacy data inventory; Google Play / Apple privacy drafts; store checklists; legal-review-required registry.
- **Политика:** тексты отражают фактическое поведение репозитория; placeholders для оператора/контактов; без вымышленных legal claims.
- **На будущее:** юридическая экспертиза, deploy qalago.kz, Apple revocation, in-app report review, kk translation.

## 2026-09-10 — Stage 6.2B7: Auth migration finalization

- **Сделано:** Social-first auth policy documented; OTP independently disableable (backend + Business Web client flag); production validation requires ≥1 auth method; admin `authMethods` visibility; JWT guard tests; auth collision/tombstone tests; all-auth-off UX; invitation rate-limit IP fix.
- **Политика:** Google/Apple primary; OTP transitional; no auto-linking; tombstones enforced; legacy phone invites require OTP path.
- **На будущее:** real provider E2E, Apple revocation, admin social login, distributed rate limits, provider linking UX.

## 2026-09-10 — Stage 6.2B6: Team invitations (email + secure token)

- **Сделано:** Email-based manager invitations with cryptographically secure one-time tokens; `tokenHash` only in DB; `POST /invitations/resolve` and `/invitations/accept`; Business Web team page (copy link) and `/invite/[token]` acceptance flow; legacy phone invitations preserved via `claimPendingInvitations`; 7-day TTL; login redirect preservation.
- **Политика:** token possession + authenticated user + explicit accept; invitation email — контекст доставки, не auth identity; без email auto-link.
- **На будущее:** transactional email provider, Flutter deep links, stricter optional email-match signal (non-blocking).

## 2026-09-10 — Stage 6.2B5: Business Web social authentication

- **Сделано:** Google/Apple login на Business Web; GIS + Apple JS; state/nonce; existing JWT session; OTP fallback.
- **На будущее:** real OAuth credentials, Apple revocation, httpOnly cookie hardening, B6 team invites.

## 2026-09-10 — Stage 6.2B4: Flutter social authentication

- **Сделано:** Google/Apple login на Flutter; provider gateways; `AuthRepository.signInWithGoogle/Apple`; credential-gated dart-define flags; OTP fallback; guest-first UX preserved.
- **На будущее:** real OAuth credentials, B5 Business Web, Apple revocation.

## 2026-09-10 — Stage 6.2B3: Apple backend authentication

- **Сделано:** `POST /auth/apple`; Apple JWKS verification via `jose`; `AppleIdentityTokenVerifierService`; shared `SocialAuthLoginService`; relay email support; partial AuthIdentity metadata updates; Apple production config validation; Google DI runtime fix.
- **На будущее:** B4 Flutter social UI, B5 Business Web, Apple token revocation (App Store compliance).

## 2026-09-09 — Stage 6.2B2: Google backend authentication

- **Сделано:** `POST /auth/google`; `google-auth-library` ID token verification; `GoogleAuthLoginService`; IP rate limiting; production Google client ID validation; tombstone/inactive-user enforcement; no email auto-link.
- **На будущее:** B3 Apple backend, B4 Flutter Google UI, B5 Business Web Google UI.

## 2026-09-09 — Stage 6.2B1: Social auth identity foundation

- **Сделано:** `AuthProvider` enum; `AuthIdentity` + `AuthIdentityTombstone` models; `User.phone` nullable; optional `User.email`; `AuthIdentityService`; account deletion tombstones external identities; JWT/AuthUser optional phone; feature flags `OTP_AUTH_ENABLED`, `GOOGLE_AUTH_ENABLED`, `APPLE_AUTH_ENABLED`; OTP routes gated when disabled; client null-safe phone display.
- **На будущее:** B2 Google verification, B3 Apple verification, B4–B5 client social login, B6 phone-based invitation redesign.

## 2026-09-09 — Stage 6.0.1: Production safety prerequisites

- **Сделано:** fail-closed CORS в production; OTP send/verify rate limiting (in-process, Redis-ready abstraction); mock plan checkout заблокирован в production (backend + Flutter + Business Web); production env validation (`JWT_SECRET`, `CORS_ORIGINS`, `OTP_DEBUG`, `DEV_LOGIN_ENABLED`); `DELETE /users/me` self-service account deletion (hybrid anonymize/deactivate); safe SUPER_ADMIN bootstrap script (`bootstrap:super-admin`); analytics ingest IP rate limit; permission error sanitization (`REVIEWS_REPLY`); deploy docs — **never seed production**.
- **На будущее (Stage 6.1+):** Redis-backed rate limits; real SMS; Android/iOS signing; S3 uploads; Nginx/TLS; store billing; privacy/terms legal text.

## 2026-09-09 — Hotfix: VIP creative moderation lifecycle sync

- **Сделано:** `POST /monetization/creatives/:id/submit` (`DRAFT`/`REJECTED` → `PENDING`, ADS_MANAGE); VIP campaign при оплате с `DRAFT` креативом → `SCHEDULED` (не `PENDING_MODERATION`); submit синхронизирует кампанию в `PENDING_MODERATION`; admin approve/reject только для `PENDING`; Business Web — «Отправить на модерацию», корректный «Фактический период»; Admin Web — подсказка для `DRAFT`; +11 backend tests (405 total).
- **На будущее:** submit из Flutter owner UI; data repair script для legacy `PENDING_MODERATION`+`DRAFT` пар.

## 2026-09-09 — Stage 5N.QA: Manual E2E verification (runtime)

- **Сделано:** runtime QA script `services/catalog-api/scripts/stage-5n-qa-runtime.mjs` + fixture audit `stage-5n-qa-fixtures.mjs`; DEV stack verified (API :3002, Admin :3001, Business :3003, Flutter :8080); HTTP smoke on all web apps; API paths for application/claim lifecycle, POST `/businesses` matrix, PAYMENTS_VIEW RBAC, CITY_ADMIN scope, stale moderation, rate limit 429, accountType attack; **P1 fix:** `BusinessAccessService.assertBusinessPermission` возвращает generic `Insufficient permissions` вместо `Missing permission: PAYMENTS_VIEW` (+1 regression test, backend 394/394).
- **Manual UI:** PARTIAL — browser automation недоступна в Cursor; Flutter/Admin/Business Web flows покрыты automated unit tests + API runtime; responsive/guest redirect/nav smoke не выполнялись в реальном браузере.
- **На будущее:** Playwright smoke для onboarding/plan RBAC; перезапуск API или отдельные QA phones между прогонами runtime script (in-memory rate limit).

## 2026-09-09 — Stage 5N.5: Business onboarding security hardening

- **Сделано:** `POST /businesses` закрыт для обычных пользователей (только ADMIN/SUPER_ADMIN import); `accountType=business` больше не повышает роль; удалены мёртвые client `createBusiness`; rate limits на create/submit applications и ownership claims (429, env-config); Flutter session cleanup через `userScopedCacheCleanupProvider` + auth-gated onboarding providers; PAYMENTS_VIEW RBAC на Business Web сохранён и расширен тестами; backend +7 тестов (393 total).
- **На будущее:** read-only plan limits endpoint для менеджеров каталога без PAYMENTS_VIEW; постепенный отказ от `@Roles(BUSINESS)` на контроллерах.

## 2026-09-09 — Business Web: plan page access (PAYMENTS_VIEW)

- **Сделано:** страница «Тариф» и связанные экраны проверяют `PAYMENTS_VIEW` перед запросом `/businesses/:id/plan`; пункт меню «Тариф» скрывается для менеджеров без права; вместо JSON-403 показывается понятное сообщение на русском; checkout тарифа доступен только владельцу.
- **На будущее:** отдельный read-only эндпоинт лимитов тарифа для менеджеров каталога/акций без доступа к платежам.

## 2026-09-09 — Stage 5N.4: Client business onboarding

**Added**
- Flutter: «Для бизнеса» profile section, `/business/start|search|apply|applications|claims`, claim CTA on business detail
- Business Web: `/onboarding/*` (search, apply, claims, applications), zero-business empty states
- Auth UX: removed account-type selector; login always as User (`accountType=user` internally)
- Onboarding uses `BusinessApplication` + `OwnershipClaim` APIs (no direct `POST /businesses` in new flows)

**Legacy preserved**
- `UserRole.BUSINESS`, `Business.ownerId`, backend `POST /businesses` unchanged
- Legacy BUSINESS users and repository helpers remain for compatibility

**Deferred**
- Stage 5N.5 verification/rate limits/cleanup; phone OTP auto-approval; document KYC

---

## 2026-09-09 — Stage 5N.3: Admin business request moderation UI

**Added**
- Admin Web «Заявки бизнеса»: `/business-requests/applications`, `/business-requests/claims` (+ detail routes)
- Paginated queues with status filters (default `PENDING`), city scope via shell picker (ADMIN/SUPER_ADMIN) or locked city (CITY_ADMIN)
- Approve/reject dialogs with Russian copy, rejection reason validation (3–500), 409 stale-state handling
- Pending count badges on nav + sub-tabs; vitest coverage for utils/API query mapping

**Not implemented**
- Consumer/business onboarding (5N.4), verification/rate limits (5N.5), dedicated admin business detail deep link

---

## 2026-09-09 — Stage 5N.2: Business ownership claim backend foundation

**Added**
- `BusinessOwnershipClaim` model + migrations (`PENDING/APPROVED/REJECTED/CANCELLED`)
- User API: `POST /businesses/:id/ownership-claims`, `GET /ownership-claims/my`, read, cancel
- Admin API: `/admin/ownership-claims/*` (list, approve, reject)
- Partial unique index: one PENDING claim per `(businessId, claimantUserId)`
- Approval transaction: ACTIVE OWNER membership; `ownerId` set only if null; plan/content preserved
- Audit actions: `BUSINESS_OWNERSHIP_CLAIM_SUBMIT/APPROVE/REJECT/CANCEL`
- MVP verification: `MANUAL` only (no phone auto-approval, no documents)

**Deferred**
- Admin Web UI (5N.3), client onboarding (5N.4), rate limiting (5N.5)

---

## 2026-09-09 — Stage 5N.1: Business application backend foundation

**Added**
- `BusinessApplication` model + migrations (`BusinessApplicationStatus`: DRAFT/PENDING/APPROVED/REJECTED/CANCELLED)
- User API: `/business-applications/*` (create, edit, submit, cancel)
- Admin API: `/admin/business-applications/*` (list, approve, reject)
- Dedupe fingerprint (`dedupeKey`) + partial unique index for active DRAFT/PENDING per applicant
- Approval transaction: Business + ACTIVE OWNER membership + `ownerId` + AuditLog; applicant stays `USER`
- Audit actions: `BUSINESS_APPLICATION_SUBMIT/APPROVE/REJECT/CANCEL`
- P0 fix: membership-authoritative owner access (revoked `ownerId` bypass closed)

**Legacy**
- `POST /businesses` marked deprecated; kept for Flutter/Business Web until Stage 5N.4

**Deferred**
- Ownership claims (5N.2), Admin moderation UI (5N.3), client onboarding (5N.4), rate limiting (5N.5)

---

## 2026-09-08 — Stage 5M.4.1: SUPER_ADMIN verification checkpoint

**Verified**
- Backend 346/346; 11 migrations; catalog-api restarted after schema change
- Manual API QA: SUPER_ADMIN role assignment, audit log, ADMIN denial, CITY_ADMIN scope, self-demotion block
- Git tag `stage-5m4-checkpoint` on `1f726b5` (+ docs commit if any)

**Known unrelated:** Flutter `auth_session_test.dart` (3 failures)

---

## 2026-09-08 — Stage 5M.4: SUPER_ADMIN system role governance

**Added**
- `UserRole.SUPER_ADMIN`; migrations `20260908190000_stage_5m4_super_admin` + `20260908190001_stage_5m4_super_admin_migrate`
- Existing `ADMIN` users migrated → `SUPER_ADMIN` (privilege preserved)
- `SystemAccessService` + `RolesGuard` hierarchy (SUPER_ADMIN inherits ADMIN ops, not vice versa)
- Role change: **SUPER_ADMIN only**; self-change denied; last-SUPER_ADMIN demotion blocked
- Governance: city create/update, global category create/delete → SUPER_ADMIN
- Operational ADMIN: moderation, payments, audit read, category update
- Dev seed: `+77000000001` SUPER_ADMIN, `+77000000005` ADMIN

**Deferred**
- MODERATOR role
- USER_STATUS_CHANGE endpoint

---

## 2026-09-08 — Documentation sync through Stage 5M.3

**Updated**
- `README.md`, `docs/PROJECT_STATUS.md`, `docs/README.md` — checkpoint `2bacbb3`, 9 migrations, 5M.3 complete
- `scripts/dev/SETUP.md`, `docs/deploy.md` — `migrate deploy` workflow, DATABASE_URL Windows pitfall, production safety
- `docs/stage-5l-rbac-audit.md` — marked HISTORICAL/SUPERSEDED
- `docs/architecture/business-membership.md` — AuditLog implemented; deferred items clarified

**Policy**
- Stage 6 not started; SUPER_ADMIN / MODERATOR not implemented
- No historic AuditLog backfill

---

## 2026-09-08 — Stage 5M.3: Audit log foundation

**Added**
- Prisma `AuditLog` model + migration `20260908180000_stage_5m3_audit_log` (9 migrations total)
- Central `AuditLogService` — server-side actor, role snapshot, safe metadata, transaction support
- Wired mutations: team, business profile/hours, catalog, photos, promotions, review replies, plans, ad orders/payments/creatives/campaigns, user role, cities, categories
- `GET /admin/audit-logs` (ADMIN global, CITY_ADMIN city-scoped)
- `GET /businesses/:id/team/audit` (OWNER only)
- Admin Web `/audit-logs`; Business Web team history block

**Policy**
- Append-only; no backfill of historic actions; retention TBD
- Not mixed with `AnalyticsEvent`; secrets/PII excluded from metadata
- Critical mutations (team invite existing user, role change, payment confirm, invitation accept) logged in same DB transaction where practical

**Deferred**
- `USER_STATUS_CHANGE` / `PAYMENT_REJECT` — no admin endpoints yet
- SUPER_ADMIN / MODERATOR roles

---

## 2026-09-08 — Stage 5M.2.1: Prisma & runtime verification

**Verified**
- Migration `20260908160000_stage_5m2_business_permissions` applied (8/8 migrations, DB up to date)
- Owner invariant: 17 businesses with ownerId → 17 ACTIVE OWNER memberships (0 missing)
- 44-scenario API runtime QA (owner/manager/invitations/cross-business/cross-city)
- Expired invitation not claimed; live permission grant/revoke without relogin

**Fix**
- `RolesGuard`: USER may reach `@Roles(BUSINESS…)` routes; `BusinessAccessService` enforces permissions
- `scripts/dev/SETUP.md`: document PowerShell `DATABASE_URL` shell override pitfall

**Root cause (Stage 5M.2 Prisma CLI failure)**
- `.env` was valid; stale `$env:DATABASE_URL` in PowerShell had leading `"` and overrode `.env`
- PostgreSQL: native local instance on `localhost:5432` (Docker not installed on dev machine)

**Manual UI QA:** Flutter/Business Web browser walkthrough not run; client unit tests + API QA executed.

---

## 2026-09-08 — Stage 5M.2: Business team & manager permissions

**Сделано**
- Prisma: `BusinessPermission` enum, `BusinessMembership.permissions[]`, `BusinessInvitation`
- Migration `20260908160000_stage_5m2_business_permissions`
- `BusinessAccessService`: `resolveAccess`, `assertOwner`, `assertBusinessPermission`; MANAGER granular access
- Field-level PATCH business authorization (profile vs hours)
- Team API: list / invite / update / revoke invitation
- Phone invitations: existing user → ACTIVE MANAGER; unknown → PENDING invite, claim on OTP login
- `GET /businesses/my`: `{ items: [{ business, access }] }` — OWNER + ACTIVE MANAGER
- Services wired: catalog, photos, promotions, reviews, analytics, export, ads, payments
- Shared types: `BusinessPermission` + RU labels
- Flutter: membership-based cabinet gate, permission-aware owner nav, tests
- Business Web: accessible-business gate, team UI «Сотрудники», permission nav, tests

**Инварианты**
- OWNER implicit all permissions; not stored
- Team management owner-only
- JWT без permissions
- Plan limits still server-side

**На будущее**
- Flutter owner team UI (optional P2)
- ~~Full AuditLog for team ops~~ → implemented in Stage 5M.3

---

## 2026-09-08 — Stage 5M.1: Business membership foundation

**Сделано**
- Prisma: `BusinessMembership` + enums `BusinessMembershipRole` / `BusinessMembershipStatus`
- Backfill: каждый `Business.ownerId != null` → ACTIVE OWNER membership
- `BusinessMembershipService` + dual-read в `BusinessAccessService`
- Создание бизнеса: транзакция ownerId + membership
- `GET /businesses/my`: legacy ownerId OR ACTIVE OWNER membership (dedupe)
- Seed: upsert membership для seeded owners
- Документация: `docs/architecture/business-membership.md`

**Инварианты**
- `UserRole` ≠ `BusinessMembershipRole`
- MANAGER в enum, но без прав в 5M.1
- JWT без membership claims

**На будущее (Stage 5M.2)**
- MANAGER permissions, invitations, team UI

---

## 2026-09-08 — Stage 5M.0: Authorization P0 hardening

**Сделано**
- `BusinessAccessService` — единая проверка ADMIN / CITY_ADMIN (managedCityId) / BUSINESS owner
- CITY_ADMIN scope на PATCH business, analytics/export, catalog, promotions, reviews reply, plans, uploads, monetization
- `POST /uploads` ограничен ролями BUSINESS / CITY_ADMIN / ADMIN
- AI: service token (`X-QalaGo-Service-Token`), proxy через catalog-api (`/ai/*`, `/admin/ai/*`)

**Инварианты**
- CITY_ADMIN не выходит за managedCityId
- Секрет сервиса не попадает в browser/mobile bundle

---

## 2026-09-08 — Stage 5L: RBAC & access control audit

**Сделано**
- Полный аудит текущих ролей, ownership, guards и client/server authorization
- Access matrix, gap matrix, migration strategy → `docs/stage-5l-rbac-audit.md`

**На будущее (Stage 5M)**
- BusinessMembership, fine-grained permissions, CITY_ADMIN scope fixes

---

## 2026-09-08 — Stage 5K.1: Flutter native analytics CSV share

**Сделано**
- Native Android/iOS: backend CSV → app temp file → system share sheet (`share_plus` + `path_provider`)
- Filename sanitization, temp cleanup, dismiss ≠ error UX
- Flutter Web regression preserved (browser download)

**На будущее**
- Optional native “save to Downloads” without share sheet (P2)

---

## 2026-09-08 — Stage 5K: VIP business analytics CSV export

**Сделано**
- `GET /analytics/business/:businessId/export` — VIP-only CSV from canonical dashboard builder
- Semicolon delimiter, UTF-8 BOM, formula-injection safe escaping
- Business Web + Flutter Owner: «Скачать CSV» with period selector

**На будущее**
- PDF export deferred; campaign analytics export deferred (P2)

---

## 2026-09-07 — Stage 5J: privacy-safe audience geography analytics

**Сделано**
- `AnalyticsEvent.audienceDistanceBucket` — coarse enum only (no raw GPS on server)
- Flutter computes bucket locally from actual user position + business coords; passive read (no new permission prompt)
- VIP dashboard: «Аудитория по расстоянию» with `MIN_AUDIENCE_GEOGRAPHY_SAMPLE = 10`
- Business Web + Flutter Owner parity; privacy explanation copy

**На будущее**
- Stage 6 remains deferred

---

## 2026-09-07 — DEV quick-login shortcuts for seed users

**Сделано**
- Flutter: панель «DEV: быстрый вход без SMS» на главной и экране входа (chips: Test User, Business Owner, Admin, City Admin)
- Admin Web + Business Web: кнопки быстрого dev-login на `/login`
- `start-all.ps1`: `DEV_LOGIN_ENABLED=true` для API, `NEXT_PUBLIC_QALAGO_DEV_LOGIN=true` для Admin/Business/Mobile

**На будущее**
- Убрать перед production; не включать флаги на staging/prod

---

## 2026-09-07 — Stage 5I: business search query analytics

**Сделано**
- `AnalyticsEvent.searchQuery` (nullable) on `VIEW_BUSINESS` when `trafficSource=SEARCH`
- Query normalization (trim, collapse spaces, lowercase, min 2 / max 100 chars)
- PREMIUM/VIP dashboard: top 10 queries, threshold count ≥ 3, `otherCount` bucket
- Flutter Search passes effective result-set query via `openBusiness(..., searchQuery:)`
- Business Web + Flutter owner: «По каким запросам вас находят»

**Privacy**
- Aggregate only; no user identity in owner API
- Low-frequency queries hidden below threshold (not exposed individually)

**DEFERRED**
- Audience geography analytics
- Query clustering / typo normalization

---

## 2026-09-07 — Stage 5H: real business traffic source attribution

**Сделано**
- `BusinessTrafficSource` enum on `AnalyticsEvent.trafficSource` (nullable, additive migration)
- `POST /analytics/events` accepts optional `trafficSource` on `VIEW_BUSINESS`
- PREMIUM/VIP dashboard aggregates organic `VIEW_BUSINESS` by source; legacy null → UNKNOWN
- Flutter consumer passes explicit source on every business-detail navigation
- Business Web + Flutter owner show «Источники просмотров» breakdown

**Semantics**
- One business open → one `VIEW_BUSINESS` with source metadata
- Paid ad tap: `AD_CARD_OPEN` (campaign) + `VIEW_BUSINESS source=AD` (business analytics) — not duplicate views
- `AD` in source breakdown = business opens from paid placements; campaign metrics remain separate

**DEFERRED**
- Search-query analytics (which search term)
- Consumer web attribution (enum ready for future web client)

---

## 2026-09-06 — Stage 5G.1: Flutter owner catalog pagination

**Сделано**
- Flutter Owner menu uses paginated `GET /service-menu/manage/:businessId/items`
- Server-side search, section filter, load-more (20/page), business switch reset
- Plan usage display from existing `businessPlanProvider`

**DEFERRED**
- Flutter owner full section CRUD (Business Web)

---

## 2026-09-06 — DEV login without SMS (development only)

**Сделано**
- `POST /auth/dev-login` — passwordless phone login when `DEV_LOGIN_ENABLED=true`; returns 404 when disabled
- Shared `completeLogin()` for OTP verify and DEV login (same JWT/session)
- Flutter: `QALAGO_DEV_LOGIN` dart-define + «Войти без SMS» button
- Business Web: `NEXT_PUBLIC_QALAGO_DEV_LOGIN` + equivalent button

**WARNING:** NEVER set `DEV_LOGIN_ENABLED=true` in production.

---

## 2026-09-06 — Stage 5G: scalable business catalog & gallery

**Сделано**
- Public `GET /businesses/:id` returns bounded previews (`galleryPreview`, `catalogPreview`, `promotionsPreview`, `reviewsPreview`) — fixed limits independent of plan
- New public endpoints: `GET /businesses/:id/catalog` (pagination, section filter, search), `GET /businesses/:id/photos` (pagination)
- Owner paginated management: `GET /service-menu/manage/:businessId/items`
- Catalog sections reuse `ServiceMenuGroup` + `ServiceItem.groupId` (nullable; delete group → SET NULL)
- Flutter consumer: detail previews, `/business/:id/catalog`, `/business/:id/photos`
- Business Web owner menu: pagination, search, section filter, group CRUD
- Flutter owner: section assignment on items (existing group dropdown)
- Backend regression tests for VIP-scale content vs bounded previews

**DEFERRED**
- Public consumer web (no app in repo) — backend contract ready
- Flutter owner full section CRUD (primary in Business Web)
- Thumbnail/CDN pipeline (document as P2 if absent)

**На будущее**
- Public web consumer catalog/gallery screens when consumer web app exists
- Optional catalog item detail / item-open analytics event

---

## 2026-09-06 — Stage 5F: business analytics parity (Web + Mobile Owner)

**Сделано**
- Backend: unified `GET /analytics/business/:id/dashboard` contract; plan entitlements as source of truth
- Tier windows: FREE/BASIC 30d, PREMIUM 90d, VIP 365d; locked metrics not returned in API
- FREE: views + daily view trend; BASIC+: customer actions; PREMIUM+: sources/conversion/comparison; VIP: popular times/benchmark/recommendations
- Business Web `/statistics`: tiered KPIs, locked sections, upgrade CTA → `/plan`, organic vs ad split
- Flutter Owner `/owner/analytics/:businessId`: same contract, drawer entry, business switch invalidation
- Tests: backend capabilities, web analytics-utils, Flutter owner analytics entitlement matrix

**Feature matrix (Stage 5F)**

| Feature | Backend | Web | Mobile |
|---------|---------|-----|--------|
| Views | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Actions | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| View/action trends | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Traffic sources | PARTIAL (deferred UI; no fake attribution) | IMPLEMENTED | IMPLEMENTED |
| Conversion | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Period comparison | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Popular times | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Category benchmark | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Recommendations | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Search queries | DEFERRED | DEFERRED | DEFERRED |
| Audience geography | DEFERRED | DEFERRED | DEFERRED |
| Ad campaign analytics | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |

**Заложить на будущее**
- Referrer/source tracking on organic events for multi-source breakdown
- Search-query and service-level analytics when event schema supports them
- Report export (VIP, platform-appropriate)

---

## 2026-09-06 — Stage 5E: guest, auth & profile polish

**Сделано**
- Login: KZ phone normalization, production copy, resend cooldown, guest CTA, no demo OTP UI
- Safe login redirect validation (`sanitizeLoginRedirect`) — blocks open redirects
- Session: logout → `/home`, user-scoped provider invalidation, 401 → guest mode
- City across login: preserve session city, sync to profile on login
- Profile guest: city picker, help/about; profile/city works for guest + auth
- Help: removed dev/placeholder contacts; permissions test accounts debug-only

**Заложить на будущее (Stage 6)**
- Real production SMS provider integration
- OTP rate limiting on backend
- Legal/privacy documents in About

---

## 2026-09-06 — Stage 5D: promotions, favorites & map

**Сделано**
- `/promotions`: city-scoped active feed, real expiry labels, differentiated empty/error states, client-side active guard
- Favorites: filter by selected city (client-side on complete user list), real «Недавние»/«По названию» sort, three empty states, BusinessCard + remove sync
- Map: city-wide businesses (`mapBusinessesProvider`, limit 100), marker preview sheet with «Подробнее», GPS/city camera fallback, OSM attribution, error banner without hiding map
- Backend: favorites response includes `business.city` for city filtering
- Tests: consumer_discovery_utils + promotions/favorites/map widget tests

**Заложить на будущее**
- Server-side favorites `citySlug` filter if user lists grow large
- Map pagination beyond 100 markers per city
- Map clustering if marker density becomes unusable

---

## 2026-09-06 — Stage 5C: consumer business detail

**Сделано**
- Business Detail: IA reorder (identity → actions → description → promotions → menu → hours → contacts → mini-map → gallery → reviews)
- Safe URL helpers: phone, WhatsApp (KZ 8→7), website, Instagram, route (coords or address)
- WEBSITE_CLICK / INSTAGRAM_CLICK organic analytics (Prisma enum + Flutter tracking)
- VIEW_BUSINESS once-per-open via initState guard
- Open/closed badge from workHours + city timezone (Asia/Oral UTC+5); hours hidden when absent
- Promotions: active filter, expiry label, PROMOTION_VIEW on tap
- Gallery fullscreen viewer; mini-map (flutter_map, OSM)
- No plan tier badges; «Нет отзывов» instead of fake rating; owner edit only for own business
- Public detail enforces plan limits via existing backend findOne (photos/promotions/menu)

**Заложить на будуще**
- Full IANA timezone library for multi-city expansion beyond KZ UTC+5
- Favorites city filter (Stage 5A P1)
- Similar businesses / booking (Stage 5D+)

---

## 2026-09-06 — Stage 5B: consumer categories, search & filters

**Сделано**
- Categories screen: title, city context, local category-name filter, explicit «Поиск заведений» CTA
- Category businesses: city-wide organic list (removed hidden 3 km default); city in app bar and section subtitle
- Search: radius filter (3/5/10/15 km + «Весь город»), category chips with clear, active filter summary + reset
- Deep links: `/search?q=&categoryId=&radiusKm=`; whole city omits geo params
- Search uses `BusinessCard`; result count from API meta; differentiated empty/error states
- Paid CATEGORY_TOP / CATEGORY_BOOST dedupe preserved; organic sort unchanged (no plan tier)
- Deferred: open-now, rating, promotion filters (no reliable backend support)
- Consumer tests expanded (search filters, category dedupe, guest search widgets)

**Заложить на будущее**
- Backend openNow / minRating / hasPromotion filters
- Category business counts without N+1
- Search debounce cancellation on dispose edge cases

---

## 2026-09-06 — Stage 5A: guest-first consumer Home & discovery

**Сделано**
- Guest-first routing: browse Home, categories, map, search, business, promotions без JWT
- «Продолжить как гость» → `/home` без demo auto-login
- Auth gates: favorites, review submit, profile edit, notifications, owner/admin routes
- Guest profile и favorites с CTA «Войти»
- API config через `--dart-define` (`QALAGO_API_BASE_URL`, `QALAGO_AI_BASE_URL`, `QALAGO_DEV_HOST`)
- Home: organic «Рекомендуем» + paid «Продвигаемые места»; dedupe HOME_FEATURED из organic
- Удалены consumer TOP/VIP organic copy и plan badges на organic cards
- Search geo parity: `nearbySearchPositionProvider`
- Bottom nav: no false tab highlight on search/business/promotions
- COMING_SOON badge «Скоро» в city picker
- Consumer tests (45 total)

**Заложить на будущее**
- Anonymous organic analytics (backend auth policy)
- Home dedupe across VIP/promotions paid slots
- Favorites city filter for authed users

---

## 2026-09-06 — Stage 4E: business owner experience unification

**Сделано**
- Единая IA кабинета: Обзор, Мой бизнес, Товары и услуги, Акции, Реклама и продвижение, Статистика, Тариф, Настройки
- business-web: обновлён dashboard (лимиты тарифа, кампании, быстрые действия), `/statistics`, hub «Мой бизнес», метки фото over-limit, лимиты меню, FAQ без legacy Pro/TOP
- Flutter owner: drawer «Обзор» + «Реклама и продвижение», plan usage на dashboard, VIP disclaimer, единые RU labels кампаний
- `lib/owner-utils.ts` + тесты: plan usage, VIP/moderation copy, photo publish state

**Заложить на будущее**
- Отдельная глобальная аналитика бизнеса beyond `/analytics/business/:id/summary`
- Business switcher в Flutter sub-screens (URL-bound routes)

---

## 2026-09-06 — Stage 4B.2: VIP inventory reservation + order validation

**Сделано**
- `HOME_VIP_BANNER`: capacity учитывает `ACTIVE`, `SCHEDULED`, `PENDING_MODERATION` (paid VIP на модерации резервирует слот)
- Остальные placements: capacity без изменений (`ACTIVE`, `SCHEDULED`)
- Order creation: `creativeId` обязателен для direct `VIP_BANNER` и пакетов с VIP (`MAX`, `NEW_PLACE`); `START` / `BUSINESS` без creative
- Provisioning VIP: всегда проверка availability + owned creative; `CREATIVE_REQUIRED` / `CREATIVE_NOT_OWNED`
- REJECTED creative → campaign `REJECTED` → слот освобождается (без refund-логики)
- Serve без изменений: только `ACTIVE` + approved creative
- Тесты `stage-4b2-vip-inventory.spec.ts`; DEV E2E `scripts/stage-4b2-e2e.ts`

**Заложить на будущее**
- Явная политика resubmit после REJECTED (edit creative → повторная модерация vs новый заказ)

---

## 2026-09-06 — Stage 4D: business-web monetization UI

**Сделано**
- `apps/business-web`: полный owner-flow монетизации — обзор, каталог продуктов/пакетов, VIP-креатив, checkout (manual payment), заказы и кампании с analytics
- Расширен `ownerApi`: product/campaign/creative endpoints, типы `MonetizationOrder.campaigns`, campaign analytics
- `lib/monetization-utils.ts` + vitest: owner-facing RU labels, formatters, `packageHasVip`
- Навигация: footer «Реклама и продвижение» → `/monetization`; plan label → «Тариф»; CTA «Продвинуть акцию» на promotions
- Цены только через `POST /monetization/quote`; без fake payment success

**Заложить на будущее**
- Online payment provider (Kaspi/Stripe) в checkout
- Owner pause/resume campaigns (сейчас только admin)

---

## 2026-09-06 — Stage 4B.1: package VIP creative activation

**Сделано**
- Package orders принимают `creativeId` / `promotionId` / `desiredStartAt` в metadata
- VIP_BANNER в MAX/NEW_PLACE: `PENDING_MODERATION` до одобрения linked creative; остальные items активируются сразу
- Duration на approval из `PromotionPackageItem` (NEW_PLACE VIP 7d vs order 14d)
- Idempotency: повторный provision/payment confirm не дублирует кампании; повторный approve не сдвигает даты
- Flutter: package → VIP creative → confirm; notice + CTA для пакетов с VIP
- Admin: VIP campaign/order — creative, moderation, requested vs actual start

**Заложить на будущее**
- Post-payment creative link API (если pay-first без creativeId)
- VIP inventory reservation во время moderation (сейчас PENDING_MODERATION не резервирует слот)

---

## 2026-09-06 — Stage 4C.1: subscription / organic visibility cleanup

**Сделано**
- `recommended()` cold start: organic title order, no `isFeatured` filter
- Public `GET /businesses?featured=true` ignored (legacy param deprecated)
- AI orchestrator + ai-core: neutral recommendation reasons, organic fallback
- Flutter fallback: no `featured: true`, no isFeatured-based reason
- Plan activation regression tests (no isFeatured/featuredSlot/AdCampaign)
- Deprecated `isFeatured` / `featuredSlot` documented in schema + api-contracts
- PostgreSQL backup procedure: `docs/infra/postgresql-backup.md`

**Заложить на будущее**
- Stage 4B.1 unchanged

---

## 2026-09-06 — Stage 4C.1: preserve content on downgrade / expiry

**Сделано**
- Удалён `archiveExcessPromotions` — downgrade/expiry больше не меняет status акций
- Entitlement layer: public API ограничивает photos, service menu, promotions по текущему тарифу; DB records сохраняются
- `GET /businesses/:id`, public menu, promotion feed/list — server-side caps
- Optional JWT на `@Public` routes для owner bypass в promotion list
- Owner plan API/UI: `entitlements` (total / published / overLimitNotice) — Flutter + business-web
- Tests: `plan-downgrade-entitlements.spec.ts`, расширен `plan-entitlements.util.spec.ts`

**Заложить на будущее**
- Stage 4B.1 без изменений

---

## 2026-09-06 — Этап 4C: FREE / BASIC / PREMIUM / VIP subscriptions

**Сделано**
- Prisma migration `20260906000000_business_plan_tier_stage_4c`: safe enum swap BASIC→FREE, PRO→PREMIUM, TOP_CITY→VIP; default `FREE`
- `PlanLimitsService` / `PLAN_CATALOG` — единый backend source of truth (цены, лимиты, ad discounts 0/5/10/15%)
- Backend enforcement: photos, service items, active promotions; expiry paid → FREE
- Organic ranking plan-neutral (`compareBusinessCatalogRank` = title; geo = distance + title)
- Subscription activation no longer sets `isFeatured` / `featuredSlot`; city promotion feed decoupled from plan tier
- Analytics tiers: BASIC (7d summary), EXTENDED (30d + trends), FULL (365d + trends)
- Flutter owner plan UI (4 tiers), badges, VIP disclaimer; `business_rank.dart` plan-neutral
- Admin + business-web plan selectors updated; `packages/shared-types` plan DTOs
- DEV seed: `qa-plan-free/basic/premium/vip` businesses
- Tests: backend 122, Flutter 36, admin vitest 10

**Checkpoint**
- Tag: `checkpoint-stage-4c-pre-migration`
- Pre-migration counts: `services/catalog-api/scripts/stage-4c-pre-migration-counts.json`

**Заложить на будущее**
- Stage 4B.1: package VIP creative linking; real payments; price editor

---

**Сделано**
- `apps/admin-web` — раздел «Монетизация»: обзор, заказы, оплаты, кампании, креативы, placements
- Manual payment confirm с idempotency (`alreadyPaid`), VIP preview, campaign pause/resume/cancel
- Read-only каталог цен и пакетов на странице placements
- Backend (без schema): `GET /admin/monetization/creatives`, `GET /admin/monetization/placements`, enriched admin order/payment responses
- Vitest: `monetization-utils.test.ts` (labels, formatters, action matrix)

**Сохранено без изменений**
- Prisma schema, payment gateway, consumer Flutter, owner monetization flow

**Заложить на будущее**
- Stage 4C: price editor; backend filters for campaign status; audit trail; campaign analytics charts

---

## 2026-09-05 — Этап 4A: Business monetization UI (owner)

**Сделано**
- Owner flow: «Продвинуть бизнес» → products/packages → quote → order → campaigns → analytics
- `features/owner/monetization/` — models, labels, formatters, providers, 8 screens
- `CatalogRepository` — monetization API methods (products, quote, orders, campaigns, creatives)
- Dashboard CTA + «Мои продвижения»; plan screen link to monetization
- VIP creative editor + preview (`VipBannerAd.previewMode`)
- Business switcher invalidates monetization providers
- 12 monetization unit tests (29 total Flutter tests)

**Сохранено без изменений**
- Backend schema, Stage 3B consumer ads, organic API, legacy plan mock-checkout

**Заложить на будущее**
- Stage 4B admin payment confirm UI; widget tests for promote flow screens

---

## 2026-09-05 — Этап 3C: Flutter cross-platform build & QA prep

**Сделано**
- Environment audit: Flutter 3.41.7, Dart 3.11.5; Android SDK/JDK absent on audit machine
- `docs/mobile/ANDROID_BUILD.md` — SDK setup, API matrix, build commands, DEV localhost notes
- `docs/mobile/IOS_BUILD_CHECKLIST.md` — Mac/Xcode checklist (static audit only)
- Real HTTP smoke: all 5 ad placements + event POST against DEV backend
- `flutter clean` → analyze (0 errors) → test (17/17) → `flutter build web` OK
- Backend regression: 109 tests + monorepo build OK
- Minor fix: unused import in `test/ads/ad_models_test.dart`

**Заложить на будущее**
- Install Android Studio + SDK; run `flutter build apk --debug` on device/emulator
- Mac/Xcode iOS build verification; add `INTERNET` to main AndroidManifest before release
- DEV cleartext ATS/network config for Android/iOS physical devices
- `--dart-define` API URL for emulator (`10.0.2.2`) without code edits

---

## 2026-09-05 — Этап 3B: Flutter ad integration

**Сделано**
- Mobile: `features/ads/` — sessionId, serve providers, viewability tracker, VIP banner, sponsored business/promotion blocks
- Home: HOME_VIP_BANNER, HOME_PROMOTIONS, HOME_FEATURED (отдельно от organic)
- Category: CATEGORY_TOP, CATEGORY_BOOST + dedup organic list
- `CatalogRepository.serveAds` / `sendAdEvent` (best-effort, failure isolation)
- `BusinessCard.sponsored` optional label; `visibility_detector` for >=50%/1s impressions
- 16 Flutter tests (ads/)

**Сохранено без изменений**
- Organic `GET /businesses`, backend schema/API, admin/business web, go_router structure

**Заложить на будущее**
- Owner campaign analytics screen; widget tests for VIP/sponsored UI with demo seed

---

## 2026-09-05 — Этап 3A: ad serving, fair rotation, analytics

**Сделано**
- `AdRotationService` — fairSort по `qualifiedImpressions/weight`, tie-break hash(sessionId+campaignId+scope), CATEGORY_TOP position 1 через `lastTopPositionAt`
- `AdServingService` — `GET /monetization/ads/serve` (public), фильтры кампаний, AD_SERVED + servedCount
- `AdEventsService` — `POST /monetization/ads/events`, dedupe AD_IMPRESSION 30 мин, click/action counters
- `AdAnalyticsService` — CTR, action groupBy; owner + admin analytics endpoints
- `CampaignExpirationScheduler` — cron */5 min → COMPLETED
- In-memory rate limit guard (120 req/min/IP) для ad events
- `scripts/seed-monetization-demo.ts`, npm script `seed:monetization-demo`
- 34+ unit tests (rotation, serving, events, analytics, expiration)
- Docs: `MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `schema.prisma` (no migration), `GET /businesses`, `business-rank.util.ts`, Flutter/admin/business web

**Заложить на будущее**
- Flutter widgets, period-scoped aggregates from events, Redis optional upgrade

---

## 2026-09-05 — Этап 2: backend monetization core

**Сделано**
- NestJS module `src/modules/monetization/` — catalog, pricing, availability, orders, manual payments, campaign provisioning, creatives
- Public API: products, packages; owner API: quote, orders, campaigns, creatives
- Admin API: orders, payments (manual confirm), campaigns (pause/resume/cancel), creative moderation
- Pricing precedence (city/category/placement/global), legacy plan discounts (BASIC 0%, PRO 10%, TOP_CITY 15%)
- Package pricing without plan discount; idempotent manual payment confirm
- PostgreSQL advisory lock for placement race protection
- Seed: `PromotionPackageItem` for START/BUSINESS/MAX/NEW_PLACE, `PACKAGE` product
- 42 unit tests (pricing, orders, payments, campaigns, availability, RBAC)
- Docs: `docs/MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `PlanPayment`, mock checkout, `/plans`, `business-rank.util.ts`, schema (no new migration)

**Заложить на будущее**
- Этап 3: ad serving, fair rotation, impression/click analytics

---

## 2026-09-05 — Этап 1: campaign-based monetization schema (additive)

**Сделано**
- Новые модели: `AdPlacement`, `MonetizationProduct`, `ProductPrice`, `Order`, `OrderItem`, `Payment`, `AdCreative`, `AdCampaign`, `AdCampaignPlacement`, `PromotionPackage`, `PromotionPackageItem`
- `AnalyticsEvent`: nullable `campaignId`, `placementId`, `sessionId`; enum AD_* values
- Migration `20260905120000_monetization_campaign_architecture` (create-only, не применена автоматически)
- Seed catalog: placements, products, Uralsk prices, packages (`seed-monetization.ts`)

**Сохранено без изменений**
- `Business.planTier`, `planExpiresAt`, `isFeatured`, `featuredSlot`, `PlanPayment`, `PlanLimitsService`

**Заложить на будущее**
- Этап 2: backend services/API для orders/campaigns

---

**Причина**
- Дашборд owner фильтровал акции как `Map`, API возвращает `PromotionModel` → всегда «Нет активных акций»
- FitLife (Базовый тариф): акция на **карточке заведения**, но **не в ленте города** — это по тарифу

**Сделано**
- Исправлен `ownerDashboardProvider`, единые хелперы статуса/дат акций
- Подсказка: «Видна на карточке · не в ленте города (Базовый тариф)»

---

**Причина расхождения**
- Админка показывает **все статусы** (PENDING, ACTIVE, BLOCKED); публичный API — только **ACTIVE**
- Новые заведения от владельцев создаются как **PENDING** до кнопки «Одобрить»
- «Рядом с вами» и категории фильтруют **радиус 3 км** от GPS; если браузер дал координаты **далеко от выбранного города** — список пустой, хотя в админке заведения есть

**Сделано**
- Mobile: если GPS дальше 25 км от центра выбранного города — поиск от **центра города**
- Скрипт `npm run dev:api:sync` — активирует PENDING и проставляет координаты из центра города
- Admin: колонка **«Приложение»** — «В приложении» / «Не в приложении»
- Dev: `npm run dev:restart`, `scripts/dev/restart-all.ps1`, таблица портов в SETUP.md

---

**Сделано**
- Экран категории и блок **«Рядом с вами»** на главной: радиус **3 км** от точки пользователя (GPS или центр города)
- Три блока: **Топ города** → **VIP · Pro** → **Все остальные** (по расстоянию)
- На карточках показывается расстояние, если API вернул `distanceMeters`

**Заложить на будущее**
- Единый вид списка «рядом» на home / search / category

---

## 2026-09-04 — Сортировка каталога по тарифам

**Сделано**
- `GET /businesses`: порядок TOP → PRO → BASIC (с учётом `planExpiresAt`, `featuredSlot`)
- Geo-поиск: сначала тариф, затем расстояние внутри одного tier
- `GET /businesses/recommended/me` — та же сортировка
- Mobile: бейджи **Топ** (TOP_CITY) и **VIP** (PRO)

**Заложить на будущее**
- Денormalized `catalogRank` в БД для больших городов

---

## 2026-09-04 — Mobile owner cabinet parity with business-web

**Сделано**
- Дашборд владельца: KPI за 7 дней, график просмотров, % профиля, тариф, активные акции
- Экраны: `/owner/plan`, `/owner/messages`, `/owner/settings`, `/owner/help`
- Боковое меню кабинета (как навигация business-web)
- Лимиты тарифа в галерее и акциях (как на web)
- API в mobile: `fetchPlans`, `fetchBusinessPlan`, `mockPlanCheckout`

**Заложить на будущее**
- Push-дублирование in-app сообщений
- Видео в галерее

---

## 2026-09-04 — Выбор типа аккаунта при регистрации

**Сделано**
- `POST /auth/verify-code`: опциональный `accountType` (`user` | `business`)
- Новый пользователь получает роль `USER` или `BUSINESS`; существующий `USER` может апгрейдиться до `BUSINESS`
- Mobile: выбор «Пользователь / Бизнес» на экране входа; после входа бизнес → `/owner`
- Business-web: выбор типа на странице логина (по умолчанию «Бизнес»)

**Заложить на будущее**
- Отдельный onboarding для бизнеса без заведения (сразу на форму регистрации)

---

## 2026-09-04 — Phase 2: launchStatus городов + уведомления тарифов

**Сделано**
- `City.launchStatus`: `COMING_SOON` | `LIVE` — admin UI, API cities
- Mobile: другой текст заглушки для городов «скоро откроется»
- In-app уведомления: `PLAN_ACTIVATED`, `PLAN_EXPIRED` при подключении и истечении тарифа
- FAQ по тарифам в business-web «Помощь»

**Заложить на будущее**
- Push (FCM) дублирует in-app уведомления
- Авто-перевод города в LIVE при N заведениях

---

## 2026-09-04 — Тарифы для бизнеса (Basic / Pro / Топ города)

**Сделано**
- Тарифы в БД: `Business.planTier`, `planExpiresAt`, история `PlanPayment` (mock)
- Каталог тарифов и лимиты в `PlanLimitsService`
- API: `GET /plans`, `GET /businesses/:id/plan`, `POST /businesses/:id/plan/mock-checkout`
- Ограничения: фото, активные акции, глубина аналитики, акции в городской ленте
- После mock-оплаты: VIP (`isFeatured`), слот топа для «Топ города»
- Business-web: страница тарифов с кнопкой «Подключить (тест)», дашборд показывает текущий план
- Admin-web: колонка «Тариф», назначение через `PATCH /admin/businesses/:id/plan`
- Автодаунгрейд истёкшего тарифа; лимит фото на странице «Фото» в кабинете
- Инструкция по тарифам: `docs/product/business-tariffs.md`
- Уточнённые лимиты акций: срок, лента, антиспам; даунгрейд лишних акций в DRAFT

**Лимиты**

| | Базовый | Pro | Топ города |
|---|---------|-----|------------|
| Цена | 0 | 9 900 ₸/30 дн. | 19 900 ₸/30 дн. |
| Фото | 5 | ∞ | ∞ |
| Активные акции | 1 | 5 | 10 |
| В ленте города одновременно | 0 | 2 | 5 |
| Срок одной акции | 14 дн. | 90 дн. | 90 дн. |
| Новых акций в день | 1 | 3 | 5 |
| Аналитика | 7 дней | 90 дней | 90 дней |
| VIP в выдаче | нет | да | да |
| Слот «топ города» | нет | нет | да |

**Заложить на будущее**
- Реальная оплата (Kaspi / карта) и webhooks
- Cron даунгрейда при истечении + push-уведомление владельцу
- Лимиты меню/услуг, AI-описания для Top

---

## 2026-09-04 — Mobile: синхронизация города на карте

**Сделано**
- Шапка карты (CityPill) всегда видна и обновляется при смене города
- Карта перелетает к координатам выбранного города (`centerLat/centerLng` из API)
- `CityState` хранит координаты центра; picker передаёт их при выборе
- Единый `invalidateCityScopedProviders` при смене города

---

## 2026-09-04 — Mobile: экран «пустой город»

**Сделано**
- Виджет `EmptyCityView` — «{город} скоро в QalaGo»
- Кнопки: **Выбрать другой город** и **Добавить заведение**
- Показывается на **Главной**, **Категории** и **Карте**, если в городе 0 активных заведений
- Провайдер `cityCatalogTotalProvider` — лёгкая проверка через `meta.total`

**Заложить на будущее**
- Порог «мало контента» (например < 5 заведений) — мягкая подсказка вместо полной заглушки
- Push/email «город запущен» пользователям, выбравшим город заранее
- Admin-флаг `launchStatus: coming_soon | live` вместо только подсчёта бизнесов

---

## 2026-09-04 — Bootstrap категорий + скрытие per-city

**Сделано**
- При `POST /admin/cities` — автокопирование порядка категорий из Уральска
- `CategoryCityOrder.isHidden` — скрыть категорию только в одном городе
- API: `PATCH /admin/categories/:id/city-visibility`
- Admin-web: кнопка «Скрыть/Показать» в категориях; проверка дубликата slug при создании города
- Mobile получает уже отфильтрованный список через `GET /categories?citySlug=`

**Заложить на будущее**
- Копировать порядок из выбранного города (не только uralsk)
- Drag-and-drop сортировка категорий
- Экран «скоро откроем» для пустого города без заведений

---

## 2026-09-04 — Admin: автоподсказки города + координаты

**Сделано**
- API: `GET /admin/geo/search?q=` — geocoding через OpenStreetMap (Nominatim), только ADMIN
- Admin-web: при вводе названия города — выпадающий список подсказок
- При выборе автозаполняются: название, slug, широта, долгота, timezone

**Заложить на будущее**
- Кэш geocoding-ответов на backend (rate limit Nominatim: 1 req/s)
- Платный fallback: Google Places / 2GIS для точности по KZ
- Карта-превью выбранной точки перед сохранением
- Валидация: город уже существует в БД → предупреждение до POST

---

## 2026-09-04 — Admin: управление городами

**Сделано**
- API: `GET/POST /admin/cities`, `PATCH /admin/cities/:id` (только роль **ADMIN**)
- Admin-web: вкладка **«Города»** — форма создания, список, активация/скрытие
- Поля города: `slug`, `nameRu`, `nameKk`, координаты центра, `timezone`, `isActive`
- Автоподсказка slug из названия (транслит)
- Контракт: `docs/architecture/api-contracts.md`, RBAC обновлён

**Заложить на будущее (города)**
| Тема | Зачем |
|------|--------|
| **Bootstrap контента** | При создании города — seed категорий-порядка, demo-бизнесы, VIP-слоты |
| **CITY_ADMIN при запуске** | Wizard: создать город → назначить модератора → checklist перед `isActive` |
| **Границы города** | GeoJSON полигон / `radiusKm` для карты и фильтра «рядом» |
| **Feature flags per city** | Бронирование, доставка, акции — включать по городам |
| **Локализация** | Обязательный `nameKk`, контент на kk для App Store / законодательства |
| **Аналитика** | Дашборд KPI отдельно по городу, воронка запуска |
| **Юридическое** | Оферта, реквизиты, support-контакты per city |
| **Кэш/CDN** | Инвалидация списка городов в mobile/web после POST/PATCH |
| **Миграция slug** | Запретить смену slug после запуска или soft-redirect старых ссылок |
| **Очередь модерации** | Пустой город: UX «скоро откроем» vs полный каталог |

---

## 2026-09-04 — Порядок категорий per-city

**Сделано**
- Таблица `CategoryCityOrder`, API `GET /categories?citySlug=`, admin city-order
- Admin-web: порядок категорий для выбранного города
- Mobile: категории запрашиваются с `citySlug` текущего города

**Заложить на будущее**
- Скрытие категории в конкретном городе (`isVisible` в `CategoryCityOrder`)
- Drag-and-drop сортировка в admin-web
- Копирование порядка из другого города

---

## 2026-09-03 — Admin-web polish + mobile UX

**Сделано**
- Admin shell, KPI, pagination, VIP slots, category inline edit, CITY_ADMIN scope
- Mobile: city picker, owner reviews, search, promotions filters
- Business-web: settings, register, brand theme

**Заложить на будущее**
- Admin-web: split на отдельные routes вместо одной dashboard-страницы
- Geocoding при создании бизнеса (lat/lng из адреса)

---

## Как добавлять записи

```markdown
## YYYY-MM-DD — Краткий заголовок

**Сделано**
- ...

**Заложить на будущее**
- ...
```

Обязательно при каждой заметной фиче (см. `AGENTS.md`).
