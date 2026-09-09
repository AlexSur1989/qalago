# Stage 5N.0 — Business Registration & Ownership Flow Audit

> **AUDIT / DESIGN ONLY** — no runtime changes, no migrations, no BusinessClaim implementation.  
> **Checkpoint:** `05839f7` (Stage 5M.4.1) · tag `stage-5m4-checkpoint` · **11 Prisma migrations**

**Date:** 2026-09-08  
**Scope:** Authentication, business creation, ownership, moderation, client UX, and target design for Flow A (add business) and Flow B (claim existing business).

---

## Executive summary

QalaGo today treats **business identity as a system role** (`UserRole.BUSINESS`) in several paths, while Stage 5M already introduced **per-business membership** (`BusinessMembership` OWNER/MANAGER). The product target is clear: **one human account (`User.role = USER`) may own or manage multiple businesses via membership**, without a separate “business account type.”

**Current reality:** new business onboarding bypasses moderation intent at the API layer — `POST /businesses` immediately creates a `Business` row (`status: PENDING`), sets `ownerId`, creates ACTIVE OWNER membership, and may upgrade `USER → BUSINESS`. There is **no** separate application entity and **no** ownership claim flow.

**Recommended direction for Stage 5N:**

| Area | Recommendation |
|------|----------------|
| New business | **Option B** — separate `BusinessApplication` entity; create/activate `Business` only on approval |
| Existing business | New `BusinessOwnershipClaim` entity with moderation |
| `UserRole.BUSINESS` | Stop assigning on new approvals in 5N.x; keep enum for compatibility |
| `Business.ownerId` | Set on first approved owner only; do not overwrite on co-owner approval |
| MVP verification | Admin manual review; optional business-phone OTP later; **no** public upload for legal docs |
| Moderation | ADMIN + scoped CITY_ADMIN + SUPER_ADMIN; all grants → AuditLog |

---

## CURRENT STATE

### 1. Precheck (2026-09-08)

| Check | Result |
|-------|--------|
| Branch | `master` |
| HEAD | `05839f7` — Finalize SUPER_ADMIN governance verification (Stage 5M.4.1) |
| Worktree | Clean (audit doc only) |
| Tag | `stage-5m4-checkpoint` exists |
| Prisma validate | OK |
| Migrations | 11 applied, up to date |

### 2. Authentication & registration

**Paths traced:** `AuthController` → `AuthService` → OTP / dev-login → JWT → `claimPendingInvitations`.

| Question | Answer |
|----------|--------|
| Brand-new OTP user default | `USER` (`accountType` defaults to `'user'`) |
| OTP + `accountType: 'business'` | `BUSINESS` (new user) or `USER → BUSINESS` (existing USER only) |
| Brand-new dev-login user | Always `USER` (no `accountType` parameter) |
| Frontend can choose role? | Only `accountType: 'user' \| 'business'` on OTP verify — maps to USER/BUSINESS only |
| USER vs BUSINESS selection in UI? | Business Web login defaults `accountType` to `'business'`; Flutter consumer auth uses default `'user'` |
| Client sends privileged roles? | **No** — ADMIN/SUPER_ADMIN/CITY_ADMIN not client-settable |
| Login changes role? | Only USER→BUSINESS upgrade via `accountType=business`; privileged roles preserved |
| Invitation claim changes role? | **No** — creates ACTIVE MANAGER membership only |

**Key files:**

- `services/catalog-api/src/modules/auth/auth.service.ts` — `completeLogin`, role upsert
- `services/catalog-api/src/modules/auth/auth-role.util.ts` — `resolveAccountRole`
- `services/catalog-api/src/modules/auth/dto/auth.dto.ts` — `accountType?: 'user' | 'business'`
- `services/catalog-api/src/common/guards/jwt-auth.guard.ts` — role reloaded from DB each request

**Repository search:** no `userType`, `businessAccount`; only `accountType`.

### 3. UserRole.BUSINESS — legacy inventory

| Class | Location | Notes |
|-------|----------|-------|
| **A** Compatibility | `auth-role.util.ts`, schema enum | Must retain in 5N.0 |
| **B** Authorization | `@Roles(BUSINESS, ...)` on analytics, menu, promotions, plans, monetization, uploads | USER passes via `satisfiesRequiredRoles` (5M.2.1) |
| **C** UI navigation | Flutter `canManageBusinessCabinet`; Business Web login legacy check | Membership also checked |
| **D** Business creation | `businesses.service.ts` L99–104 | USER→BUSINESS in create transaction |
| **E** Owner detection | Dual-read `hasActiveOwnerAccess` uses membership; legacy `ownerId` bypass | Security-critical |
| **F** Seed/test | E2E scripts, specs | Non-runtime |
| **G** Obsolete | None fully removable yet | |
| **H** Shared contract | `packages/shared-types/src/rbac.ts` | Client role labels |

**What turns USER → BUSINESS today:**

1. OTP verify with `accountType: 'business'`
2. `POST /businesses` when creator role is USER

**USER + OWNER/MANAGER membership:** Backend business routes resolve access via `BusinessAccessService` (membership + dual-read ownerId). `@Roles(BUSINESS)` routes allow USER through guard bypass. **Removing automatic USER→BUSINESS on create would not break backend access** for USER+OWNER, but Business Web login UX still treats legacy BUSINESS role as cabinet access shortcut.

### 4. Business creation (today)

**Single production route:** `POST /api/v1/businesses`

| Aspect | Current behavior |
|--------|------------------|
| Auth | JWT required; no `@Roles` guard |
| Allowed actors | Any authenticated user (USER, BUSINESS, admins) |
| DTO | `title`, `categoryId`, `citySlug`, `address`, optional `shortDesc`, `phone` |
| Transaction | Create Business → create ACTIVE OWNER membership → maybe USER→BUSINESS |
| `ownerId` | Always set to creator |
| `status` | `PENDING` |
| `planTier` | Schema default `FREE` |
| Category validation | Must exist (no inactive check) |
| City validation | `cityScope.resolveCityId` — no `launchStatus` gate |
| Duplicate prevention | Slug uniquification only (`title-normalized-{random}`) |
| AuditLog | **None** on create |
| Admin create | **No** dedicated admin business-create endpoint |
| Seed/import | Prisma seed scripts only |

**Clients:**

- `apps/business-web/app/register/page.tsx` → `ownerApi.createBusiness`
- `apps/mobile/.../create_business_screen.dart` → same API

### 5. Business status model (repository truth)

```prisma
enum BusinessStatus {
  PENDING
  ACTIVE
  BLOCKED
}
```

| Field | Purpose |
|-------|---------|
| `status` | Lifecycle: pending moderation / public / blocked |
| `isActive` | **Not on Business** — only on User/City/Category |
| Moderation | Approve → ACTIVE; reject → BLOCKED |
| Timestamps | `createdAt`, `updatedAt` |

**No** DRAFT, REJECTED enum, or separate application table.

**Public queries:** `findAll`, public detail, catalog — filter `status: ACTIVE` (default).

**Assessment:** `PENDING`/`ACTIVE`/`BLOCKED` insufficient for draft/resubmit UX. Separate `BusinessApplication` avoids polluting public/admin business lists with drafts and clarifies rejection vs block.

### 6. Ownership model (security-critical)

| Question | Answer |
|----------|--------|
| `ownerId` nullable? | Yes in schema; always set on current create path |
| Multiple ACTIVE OWNER memberships? | **Allowed** — no DB constraint preventing |
| Zero ACTIVE OWNER? | **Possible** if membership revoked but ownerId remains |
| `ownerId` used for API? | Yes — dual-read in `hasActiveOwnerAccess` |
| Dual-read locations | `BusinessAccessService`, `findMy`, notifications on moderation |
| ownerId vs membership disagree | **Legacy ownerId wins** if user.id === ownerId even when membership REVOKED |
| Revoked membership + matching ownerId | **Still grants OWNER access** (5M.1 migration caveat) |
| Last-owner invariant | **None** |
| Ownership transfer API | **None** |

**BusinessInvitation:** MANAGER invites by phone only; not ownership claims.

### 7. GET /businesses/my

**Response shape:**

```json
{
  "items": [
    {
      "business": { /* full business + category + city */ },
      "access": {
        "role": "OWNER" | "MANAGER",
        "permissions": ["..."]
      }
    }
  ]
}
```

- Includes: legacy `ownerId` match OR ACTIVE OWNER/MANAGER membership
- Excludes: SUSPENDED/REVOKED memberships (not in ACTIVE query)
- Dedup: by business id
- No city filter on list
- Any authenticated user may call (no role guard)

### 8. Client cabinet entry

**Flutter:**

- Profile «Для бизнеса» → `/owner` if `canAccessBusinessCabinet`, else `/owner/create-business`
- `canManageBusinessCabinet(BUSINESS)` OR non-empty `/businesses/my`
- No claim CTA on business detail
- No search-first onboarding

**Business Web:**

- Login with `accountType: 'business'`; USER without membership → `/register`
- Register → direct `POST /businesses`
- Empty dashboard → link to `/register`
- No claim flow

**Admin Web:**

- Dashboard moderation tab lists PENDING businesses; approve/block via status patch

### 9. Existing claim / application functionality

**None** for ownership or new-business applications.

Only “claim” in codebase: `claimPendingInvitations` (team MANAGER invites).

UI string «Заявка отправлена на модерацию» = direct business create, not a separate application record.

### 10. Duplicate business risk

| Constraint | Exists? |
|------------|---------|
| Unique slug | Yes |
| Unique (title, cityId) | No |
| Address / phone / coordinates dedup | No |
| Per-user pending limit | No |

**Risk:** same user can create unlimited near-duplicate businesses (e.g. “Restaurant Sultan” same address).

### 11. Phone: User vs Business

| Field | Model | Notes |
|-------|-------|-------|
| `User.phone` | Required, unique | Auth identity |
| `Business.phone` | Optional | Public contact |
| `Business.whatsapp` | Optional | Separate field |

**No code assumes User.phone === Business.phone.** Register UI pre-fills business phone from user phone for convenience only.

### 12. Phone normalization

**Shared utility:** `services/catalog-api/src/modules/auth/auth-phone.util.ts` → `normalizeKazakhstanPhone()`

Used by: Auth OTP, BusinessInvitation (team), business-team service.

**Recommendation:** reuse this single utility for claim verification OTP in 5N.x.

### 13. Business creation authorization

| Role | Can POST /businesses? |
|------|----------------------|
| Guest | No |
| USER | Yes |
| BUSINESS | Yes |
| OWNER/MANAGER (membership) | Yes (same endpoint) |
| CITY_ADMIN / ADMIN / SUPER_ADMIN | Yes |

**Gap:** USER can create ACTIVE-path business immediately (pending status but with ownership). Target: USER submits **application**, not direct Business.

### 14. Moderation (today)

| Action | Implementation |
|--------|----------------|
| List pending | `GET /admin/businesses?status=PENDING` |
| Approve | `PATCH /admin/businesses/:id/status` → ACTIVE |
| Reject | Same endpoint → BLOCKED |
| Who | `@Roles(ADMIN, CITY_ADMIN)` + SUPER_ADMIN inherits |
| City scope | `assertBusinessInAdminScope` |
| Approval creates ownership? | **No** — ownership already from create |
| AuditLog on status change | **No** |
| Rejection retains data? | Yes (BLOCKED row remains) |
| Notification | To `ownerId` only — BUSINESS_APPROVED / BUSINESS_BLOCKED |

### 15. City governance (launchStatus)

```prisma
enum CityLaunchStatus { COMING_SOON, LIVE }
```

- Stored on City; managed by SUPER_ADMIN
- **Business create does not check launchStatus**
- Public catalog uses cityId filter only

**Recommendation (evaluate):**

| Policy | LIVE | COMING_SOON |
|--------|------|-------------|
| **A (preferred)** | Normal submit → moderation | Allow application; business stays unpublished until city LIVE + approved |
| B | Normal | Waitlist only (no Business row) |

Policy A fits existing city model and seeded catalog work — applications queue per city without public visibility.

### 16. Category model

- Flat `Category` table (no hierarchy)
- `isActive` boolean — create validates existence only, **not** `isActive`
- Global categories (not per-city FK on category)

**Requirement for 5N:** server must reject inactive/unknown categoryId on application submit.

### 17. Minimum business data (field classification)

| Field | Application | Publication | Optional | Admin-only | System |
|-------|-------------|-------------|----------|------------|--------|
| title | ✓ | ✓ | | | |
| categoryId | ✓ | ✓ | | | |
| cityId/citySlug | ✓ | ✓ | | | |
| address | ✓ | ✓ | | | |
| shortDesc | ✓ | ✓ | | | |
| phone | ✓ | ✓ | | | |
| description | | ✓ | ✓ | | |
| lat/lng | | ✓ | ✓ | | |
| whatsapp, website, instagram | | ✓ | ✓ | | |
| workHours | | ✓ | ✓ | | |
| coverImage, images | | ✓ | ✓ | | |
| slug | | | | | ✓ |
| status, planTier | | | | partial | ✓ |
| ownerId | | | | | ✓ (on approval) |
| isFeatured, featuredSlot | | | | ✓ | |

### 18. Draft requirements

| Question | Current | Recommendation |
|----------|---------|----------------|
| Partial save? | No | DRAFT status on `BusinessApplication` |
| Resume onboarding? | No | `GET/PATCH` own application |
| DRAFT pollutes public queries? | N/A | Separate entity avoids this |
| Separate application? | No | **Yes — Option B** |

### 19. Upload infrastructure

- `POST /uploads` — auth + `@Roles(BUSINESS, ...)`; files public at `/uploads/*`
- **Not suitable** for confidential ownership documents
- MVP: admin manual verification without document upload; secure private storage deferred

### 20. Notifications

Existing `Notification` model supports GENERAL, BUSINESS_APPROVED, BUSINESS_BLOCKED, etc.

**Stage 5N:** extend with application/claim types (or reuse GENERAL with typed titles) — no implementation in 5N.0.

### 21. Local DB aggregates (dev, no PII)

| Metric | Count |
|--------|-------|
| Users USER | 10 |
| Users BUSINESS | 3 |
| Users CITY_ADMIN | 1 |
| Users ADMIN | 1 |
| Users SUPER_ADMIN | 1 |
| Businesses total | 17 |
| ACTIVE | 15 |
| PENDING | 2 |
| With ownerId | 17 |
| Without ownerId | 0 |
| BusinessMembership rows | 26 |
| ACTIVE OWNER | 17 |
| ACTIVE MANAGER | 9 |
| Businesses missing ACTIVE OWNER | 0 |
| Businesses with >1 ACTIVE OWNER | 0 |
| BUSINESS users without ACTIVE OWNER membership | 2 |
| USER with ACTIVE OWNER membership | 0 |

**Note:** 2 BUSINESS-role users lack OWNER membership — legacy dual-path inconsistency to address in migration plan.

---

## PROBLEMS

1. **Consumer vs business identity conflated** — `UserRole.BUSINESS` and automatic upgrade on create.
2. **Immediate ownership on create** — no moderation gate before ownerId + membership.
3. **No claim flow** — seeded/catalog businesses cannot be claimed safely.
4. **No duplicate prevention** — slug-only uniqueness.
5. **ownerId dual-read bypass** — revoked membership does not revoke legacy owner access.
6. **No AuditLog** on business create or moderation status change.
7. **PENDING businesses** appear in owner cabinet and can be edited before approval.
8. **No search-first onboarding** — duplicates likely at scale.
9. **Category inactive not enforced** on create.
10. **City launchStatus ignored** on business create.

---

## SECURITY RISKS

| Risk | Severity | Current state |
|------|----------|---------------|
| Ownership takeover via create/claim | **P0** | No claim; create grants immediate owner |
| ownerId legacy bypass after revoke | **P0** | Documented 5M.1 caveat |
| Duplicate business spam | **P1** | No limits |
| Claim spam / competitor claims | **P1** | N/A until implemented — design controls needed |
| IDOR on applications/claims | **P1** | Design must scope by applicant |
| Moderator cross-city | **P2** | Enforced today via CityScope |
| Stale/double approval race | **P1** | No conditional status updates on moderation |
| Phone enumeration | **P2** | OTP auth existing surface |
| Evidence leakage | **P1** | Public upload path unsuitable |
| Client actor spoofing | **P2** | Server uses JWT user id |

---

## TARGET MODEL

### Registration principle

> **One person, one User account (`role = USER`). Business access exclusively via `BusinessMembership` (OWNER/MANAGER).**

`UserRole.BUSINESS` remains enum compatibility; **stop assigning** on new flows when safe.

### Flow A — Add new business (target)

```
Authenticated USER
  → Profile «Для бизнеса» → «Добавить бизнес»
  → Search existing (name/city/address)
  → If found → Flow B claim
  → If not → BusinessApplication (DRAFT)
  → Fill fields → Submit (PENDING)
  → Admin/CITY_ADMIN moderation
  → Approve → create Business ACTIVE + OWNER membership + ownerId + AuditLog
  → Reject → user-visible reason; allow edit/resubmit
```

### Flow B — Claim existing business (target)

```
Authenticated USER
  → Business detail «Это ваш бизнес?»
  → BusinessOwnershipClaim (PENDING)
  → Evidence (MVP: message + admin review; optional phone OTP later)
  → Moderation
  → Approve → OWNER membership + ownerId policy + AuditLog
  → Must NOT reset plan/ads/content
```

Neither flow grants ownership before approval.

---

## APPLICATION FLOW (design)

### Option comparison

| Criterion | Option A: Business row pending | Option B: BusinessApplication |
|-----------|-------------------------------|------------------------------|
| Security | Ownership exists before approval | Ownership only after approval |
| Public query pollution | PENDING in Business table | Clean separation |
| Drafts | Awkward (DRAFT status on Business) | Natural DRAFT on application |
| Rejection | BLOCKED conflates moderation reject | Clear REJECTED application |
| Migration | Smaller schema | New table + approval transaction |
| Admin UX | Reuse business list | Dedicated queue (clearer) |

**Recommendation: Option B — `BusinessApplication`**

### Proposed BusinessApplication (minimum)

| Field | Notes |
|-------|-------|
| id | cuid |
| applicantUserId | FK User |
| status | DRAFT, PENDING, APPROVED, REJECTED, CANCELLED |
| cityId, categoryId | Required for submit |
| title, address, shortDesc, phone, … | Application payload |
| rejectionReason | User-visible (nullable) |
| internalNote | Admin-only (nullable) |
| reviewedByUserId, reviewedAt | Moderation |
| resultingBusinessId | Set on approval |
| createdAt, updatedAt | |

Unique partial indexes (design):

- One PENDING per (applicantUserId, normalizedTitle, cityId) — practical dedup
- One DRAFT optional per user (product choice)

---

## CLAIM FLOW (design)

### Proposed BusinessOwnershipClaim (minimum)

| Field | Notes |
|-------|-------|
| id | cuid |
| businessId | FK existing Business |
| claimantUserId | FK User |
| status | PENDING, APPROVED, REJECTED, CANCELLED |
| verificationMethod | MANUAL, BUSINESS_PHONE_OTP (future) |
| message | Claimant explanation |
| evidenceMetadata | JSON — no raw docs in MVP |
| rejectionReason | User-visible |
| internalNote | Admin-only |
| reviewedByUserId, reviewedAt | |
| createdAt, updatedAt | |

**Existing owner present:** do not auto-deny — queue for moderation (co-owner, transfer, inaccessible prior owner).

---

## STATE MACHINES

### Application statuses (MVP)

```
DRAFT ──submit──► PENDING ──approve──► APPROVED (terminal)
                    │
                    ├──reject──► REJECTED ──edit/resubmit──► DRAFT or new row policy
                    └──cancel──► CANCELLED
```

- **PENDING:** locked or edits force re-review (recommend locked for MVP)
- **APPROVED:** immutable snapshot

### Claim statuses (MVP)

```
PENDING ──approve──► APPROVED
   │                    │
   ├──reject──► REJECTED (new claim allowed after cooldown)
   └──cancel──► CANCELLED
```

Optional **EXPIRED** deferred until TTL product requirement exists.

---

## DATA INVARIANTS (target)

1. Every approved new-business application creates exactly one initial ACTIVE OWNER membership.
2. Every ACTIVE business has ≥1 ACTIVE OWNER, except explicitly platform-unclaimed seeded businesses.
3. Claim never grants access before approval.
4. At most one PENDING claim per (businessId, claimantUserId).
5. At most one PENDING application per equivalent user/business identity (practical composite).
6. Approval operations idempotent (conditional status update).
7. Rejected request cannot approve via stale id without valid transition.
8. **ownerId compatibility must not override REVOKED membership indefinitely** — fix in 5N.x: on revoke, clear or reconcile ownerId.

---

## OWNERSHIP GRANT ATOMICITY (design)

### Application approval transaction

1. Validate application PENDING
2. Recheck duplicates (title+city, optional address fuzzy later)
3. Create Business (ACTIVE) or activate stub — prefer create here
4. Create ACTIVE OWNER membership (applicant)
5. Set `ownerId = applicantUserId` (first owner)
6. Mark application APPROVED
7. AuditLog: BUSINESS_APPLICATION_APPROVE + BUSINESS_OWNER_GRANT
8. Notify applicant

### Claim approval transaction

1. Validate claim PENDING
2. Validate business exists
3. Upsert ACTIVE OWNER membership for claimant
4. **ownerId policy:** set only if null; if set, keep as primary legacy owner unless transfer product defined
5. Mark claim APPROVED
6. AuditLog: BUSINESS_OWNERSHIP_CLAIM_APPROVE + BUSINESS_OWNER_GRANT
7. Notify claimant
8. **Do not** alter planTier, ads, content

---

## ownerId COMPATIBILITY POLICY

| Scenario | Policy |
|----------|--------|
| First approved owner (app or claim) | Set `ownerId = userId` |
| Second OWNER membership | Do **not** overwrite ownerId |
| Ownership transfer (future) | Explicit admin flow updates ownerId + membership |
| Membership REVOKED for ownerId user | **Clear ownerId or sync** — close 5M.1 bypass |

---

## MULTIPLE OWNERS

- **Architecturally yes** — multiple ACTIVE OWNER memberships allowed
- Claims and co-owner adds require moderation
- `ownerId` = legacy primary only
- Arbitrary owner promotion by existing OWNER — **not** in MVP (admin/SUPER_ADMIN later)

---

## LAST OWNER INVARIANT

Recommend: ACTIVE business must not have zero ACTIVE OWNERs.

**Violation paths today:**

- Revoke sole OWNER membership while ownerId remains
- Admin BLOCKED without membership check

**Enforcement (later):** service-layer check on revoke/suspend; optional DB trigger deferred.

---

## MODERATION AUTHORITY

| Action | SUPER_ADMIN | ADMIN | CITY_ADMIN |
|--------|-------------|-------|------------|
| Approve/reject application | ✓ global | ✓ global | ✓ managed city only |
| Approve/reject claim | ✓ global | ✓ global | ✓ managed city only |
| Grant ownership | ✓ (via approve) | ✓ | ✓ scoped |

All ownership grants → AuditLog. No USER self-approval.

---

## AUDITLOG EXTENSION (design only)

Current `AuditAction` (35 values) — no application/claim actions.

**Minimal additions:**

- `BUSINESS_APPLICATION_SUBMIT`
- `BUSINESS_APPLICATION_APPROVE`
- `BUSINESS_APPLICATION_REJECT`
- `BUSINESS_OWNERSHIP_CLAIM_SUBMIT`
- `BUSINESS_OWNERSHIP_CLAIM_APPROVE`
- `BUSINESS_OWNERSHIP_CLAIM_REJECT`
- `BUSINESS_OWNER_GRANT`

**Safe metadata:** applicationId, claimId, businessId, cityId, categoryId, statusBefore, statusAfter, verificationMethod.

**Never log:** OTP, full phone, documents, tokens, private evidence.

---

## API DESIGN (proposed, not implemented)

Prefix: `/api/v1/`. Adapt to existing Nest module layout.

### User — applications

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/business-applications` | Create DRAFT |
| GET | `/business-applications/my` | List own |
| GET | `/business-applications/:id` | Detail (owner only) |
| PATCH | `/business-applications/:id` | Edit DRAFT / resubmit REJECTED |
| POST | `/business-applications/:id/submit` | DRAFT → PENDING |
| POST | `/business-applications/:id/cancel` | Cancel |

### User — claims

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/businesses/:id/ownership-claims` | Submit claim |
| GET | `/ownership-claims/my` | List own claims |
| GET | `/ownership-claims/:id` | Detail |
| POST | `/ownership-claims/:id/cancel` | Cancel pending |

### User — search (duplicate prevention UX)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/businesses/onboarding-search?q=&citySlug=` | Name/address search for onboarding |

### Admin

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/business-applications` | Queue (city-scoped) |
| POST | `/admin/business-applications/:id/approve` | |
| POST | `/admin/business-applications/:id/reject` | |
| GET | `/admin/ownership-claims` | Queue |
| POST | `/admin/ownership-claims/:id/approve` | |
| POST | `/admin/ownership-claims/:id/reject` | |

### Response privacy

- Applicant sees own application/claim
- Admin sees moderation fields per city scope
- Public/other owners do not see claimant evidence
- Other OWNER does not see pending claims by default

---

## CLIENT UX (design)

### Profile — «Для бизнеса»

| State | UI |
|-------|-----|
| No businesses | «Добавить бизнес», «Найти свой бизнес» |
| Has businesses | «Мои бизнесы», roles, «Добавить ещё», «Найти существующий» |

No `UserRole.BUSINESS` requirement.

### Business detail — claim CTA

| Viewer | CTA |
|--------|-----|
| Guest | «Это ваш бизнес?» → login redirect |
| Non-owner USER | Show claim |
| OWNER | Hide |
| MANAGER | Hide claim (default) |
| Pending claimant | «Заявка на подтверждении» |
| Rejected | Retry per policy |

### Flutter routes (proposed)

- `/business/start` — hub
- `/business/search` — search-first
- `/business/apply`, `/business/applications/:id`
- `/business/:id/claim`, `/business/claims/:id`

Preserve Stage 5E safe redirect: `/login?redirect=...`

### Business Web

Replace register-only empty state with:

- «Нет заведений» + Add + Find existing

### Admin Web

New section: **Business requests** (or split Applications | Claims)

- Pending counts, city filter, approve/reject, AuditLog link
- CITY_ADMIN filtered by managedCityId

---

## CLAIM EVIDENCE (MVP)

| Method | MVP | Notes |
|--------|-----|-------|
| Admin manual | **Yes** | Primary for KZ local businesses |
| Claim message | **Yes** | Free text |
| Business phone OTP | Later | Use shared phone normalizer |
| Website/email domain | Later | |
| Document upload | **No** | No private storage |
| Call-back | Manual admin | Operational |

**Security note:** name/title or public phone alone proves nothing.

---

## CLAIM ABUSE CONTROLS (design)

- Rate limit claims per user/day
- Rate limit applications per user/day
- Unique partial index: one PENDING per (businessId, claimantUserId)
- Cooldown after REJECTED before resubmit
- Admin flag for repeat abusers
- No information leak on reject (generic reason option)
- CAPTCHA deferred

---

## RACE CONDITIONS (design)

| Scenario | Mitigation |
|----------|------------|
| Two admins approve same request | Conditional update `WHERE status = PENDING`; idempotent response |
| Two users claim same unowned business | Both queued; admin resolves; first approve wins; second reject with reason |
| Application approved while duplicate created | Approval transaction rechecks duplicates |
| Membership revoked during approval | Re-validate membership state in transaction |
| Double submit | Idempotency key or status guard |

---

## PLAN / MONETIZATION

- New approved business: `planTier = FREE` (schema default)
- Claim on existing business: **must not** change planTier, planExpiresAt, ads, campaigns
- Application/claim: **no** paid plan required

---

## MIGRATION STRATEGY

### UserRole.BUSINESS phased deprecation

| Stage | Action |
|-------|--------|
| 5N.1–5N.4 | Stop assigning BUSINESS on application/claim approval |
| 5N.5 | Audit remaining BUSINESS users |
| Post-5N | Migrate BUSINESS → USER where ACTIVE OWNER membership exists |
| Future | Remove enum only when all clients/backend stop depending |

**Do not remove enum in 5N.0.**

### Existing data (future, non-destructive)

1. **BUSINESS users without OWNER membership (2 in dev):** backfill membership or demote to USER
2. **ownerId without membership:** backfill ACTIVE OWNER membership
3. **Membership without ownerId:** set ownerId for primary owner
4. **Seeded unowned businesses:** keep for claim flow; document platform-owned flag if needed
5. **Revoke bypass:** on membership REVOKE, clear ownerId if matches

---

## TEST PLAN (future 5N implementation)

### Automated

| Area | Cases |
|------|-------|
| Auth | USER default; no role escalation; accountType business legacy |
| Application | CRUD draft, submit, approve, reject, resubmit, IDOR |
| Claim | Submit, approve, reject, existing owner, unowned seed |
| Authorization | USER submit; no self-approve; CITY_ADMIN scope |
| Duplicates | Same title/city; concurrent applications |
| Membership | OWNER created on approve only |
| ownerId | Set once; not overwritten on co-owner |
| Revoke | ownerId bypass closed |
| Race | Double approve, concurrent claims |
| AuditLog | All transitions |
| Notifications | Approved/rejected |
| Public | No draft/pending in catalog |
| Plan | Preserved on claim |
| Regression | POST /businesses legacy path deprecated/ gated |

### Manual QA

- New user adds business (Flutter + Business Web)
- Existing user adds second business
- User claims seeded business
- Claim while OWNER/MANAGER
- Duplicate application
- Rejection/resubmit
- CITY_ADMIN vs foreign city denial
- ADMIN / SUPER_ADMIN approval
- Logout/login persistence
- Auth redirect to claim flow

---

## PERFORMANCE / INDEX PLAN (future)

**BusinessApplication:** `(status, cityId, createdAt)`, `(applicantUserId, status)`

**BusinessOwnershipClaim:** `(status, createdAt)`, `(businessId, status)`, `(claimantUserId, status)`

**Unique partial:** PENDING constraints per section 32.

---

## RETENTION

- Keep APPROVED/REJECTED applications and claims for audit history
- No automatic deletion in MVP
- Legal retention duration — product/legal decision later

---

## IMPLEMENTATION STAGES (recommended)

| Stage | Scope |
|-------|-------|
| **5N.1** | BusinessApplication schema, user + admin API, approval transaction, AuditLog, deprecate direct create flag |
| **5N.2** | BusinessOwnershipClaim schema, user + admin API, claim approval transaction |
| **5N.3** | Admin Web moderation UI (applications + claims queues) |
| **5N.4** | Flutter + Business Web onboarding (search-first, profile, claim CTA) |
| **5N.5** | Security hardening (ownerId/revoke fix, rate limits, idempotency), stop USER→BUSINESS upgrade, checkpoint tag |

### P0/P1/P2 priorities

| Priority | Item |
|----------|------|
| **P0** | Separate application/claim; no pre-approval ownership; approval atomicity; AuditLog |
| **P0** | Close ownerId revoke bypass |
| **P1** | Search-first UX; duplicate constraints; CITY_ADMIN queues |
| **P1** | Stop BUSINESS role assignment on new flows |
| **P2** | Business phone OTP verification; EXPIRED claim state; document storage |

---

## BLOCKERS

None for audit completion. Implementation blocked on explicit 5N.1 kickoff.

---

## IMPLEMENTED (5N.0)

- [x] Repository audit
- [x] Target architecture design
- [x] This document

## Stage 5N.1 implementation note (2026-09-09)

- [x] `BusinessApplication` model + user/admin API
- [x] Approval transaction (Business + membership + ownerId + AuditLog)
- [x] P0 ownerId revocation bypass fix
- [x] `POST /businesses` deprecated (legacy, not removed)
- [x] Ownership claims backend (5N.2)
- [x] Admin Web moderation UI (5N.3)
- [x] Flutter/Business Web onboarding (5N.4)

## Stage 5N.2 implementation note (2026-09-09)

- [x] `BusinessOwnershipClaim` + user/admin API
- [x] Manual verification only; no phone auto-approval
- [x] Approval preserves plan/content; ownerId set only if null
- [x] Admin Web UI (5N.3)
- [ ] Consumer claim CTA (5N.4)

## Stage 5N.3 implementation note (2026-09-09)

- [x] Admin Web «Заявки бизнеса» — applications + claims queues, detail, approve/reject
- [x] CITY_ADMIN city lock; pending badges; Russian status labels
- [ ] Dedicated admin business detail route after approval (shows title only)
- [x] Consumer/business onboarding (5N.4)
- [ ] Verification/rate limits (5N.5)

## Stage 5N.4 implementation note (2026-09-09)

- [x] Flutter + Business Web onboarding (search-first, applications, claims)
- [x] Auth UX: single User login (no account type selector)
- [x] Membership-based cabinet access; no new `UserRole.BUSINESS` assignment in onboarding
- [ ] Backend removal of legacy `POST /businesses` (5N.5)
- [ ] Phone verification / rate limits (5N.5)

## NOT IMPLEMENTED (by design)
- Client onboarding UI
- UserRole.BUSINESS removal
- Business.ownerId removal
- MODERATOR role
- Stage 6

---

## References

- [Business membership](./architecture/business-membership.md)
- [RBAC](./architecture/rbac.md)
- [Stage 5L RBAC audit](./stage-5l-rbac-audit.md) (historical)
- Checkpoint tag: `stage-5m4-checkpoint`
