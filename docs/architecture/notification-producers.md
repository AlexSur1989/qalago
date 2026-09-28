# Notification producers (Stage 6.11E.2+)

In-app notifications are canonical. Push/FCM (Stage 6.11E.5) is optional delivery after the in-app row is committed.

## Client rendering (Stage 6.11E.3)

- **Primary display:** Flutter `presentAppNotification()` — localized title/body from `NotificationType` + safe `payload` (RU/KK via gen_l10n).
- **Legacy fallback:** persisted backend `title`/`body` for `GENERAL`, unknown future types, or missing templates.
- **Do not** runtime-translate stored Russian title/body or user-generated content (review text, replies, business names render as-is from payload).
- **Tap (E.4):** optimistic mark read → `resolveNotificationDestination()` → `context.push` to canonical routes; no payload URLs.
- **Business Web:** type chip labels for E.2 enums; list still shows API title/body (full Web RU/KK deferred).

## Producer matrix

| Event | NotificationType | Recipient | targetType | targetId | Transaction |
|-------|------------------|-----------|------------|----------|-------------|
| New / restored visible review | `NEW_REVIEW` | Active OWNER + MANAGER with `REVIEWS_REPLY`; legacy `ownerId` if no owner membership | `REVIEW` | review id | After review write |
| Owner reply | `REVIEW_REPLY` | Review author (not self-reply) | `REVIEW` | review id | After reply write |
| Moderation hide review | `REVIEW_HIDDEN` | Review author | `REVIEW` | review id | Same `$transaction` as moderation action |
| Moderation restore review | `REVIEW_RESTORED` | Review author (not soft-deleted) | `REVIEW` | review id | Same `$transaction` |
| Business approved/blocked (admin) | `BUSINESS_APPROVED` / `BUSINESS_BLOCKED` | `business.ownerId` | `BUSINESS` | business id | After status update |
| Application approved/rejected | `BUSINESS_APPLICATION_*` | Applicant | `BUSINESS_APPLICATION` | application id | Inside application `$transaction` |
| Claim approved/rejected | `OWNERSHIP_CLAIM_*` | Claimant | `OWNERSHIP_CLAIM` | claim id | Inside claim `$transaction` |
| Email team invite (existing user) | `BUSINESS_INVITATION_RECEIVED` | Matched auth identity user | `BUSINESS` | business id | After invite create |
| Invitation accepted | `BUSINESS_INVITATION_ACCEPTED` | `invitedByUserId` | `BUSINESS` | business id | Inside accept `$transaction` |
| Plan activated | `PLAN_ACTIVATED` | Business owner | `BUSINESS` | business id | After activation |
| Plan expired (lazy sync) | `PLAN_EXPIRED` | Business owner | `BUSINESS` | business id | After conditional `updateMany` |
| Ad creative approved/rejected | `AD_CAMPAIGN_*` | Business owner | `AD_CAMPAIGN` | campaign or creative id | After moderation decision |

## Routing matrix (Stage 6.11E.4)

| NotificationType | targetType | Destination (Flutter) | Notes |
|------------------|------------|----------------------|-------|
| `GENERAL` / unknown | * | none | mark read only |
| `NEW_REVIEW` | `REVIEW` | `/owner/reviews/:businessId` | `businessId` from E.2 payload whitelist only |
| `REVIEW_REPLY` | `REVIEW` | `/business/:businessId/reviews` | payload `businessId` whitelist |
| `REVIEW_HIDDEN` / `REVIEW_RESTORED` | `REVIEW` | `/profile/reviews` | |
| `BUSINESS_APPROVED` / `BLOCKED` | `BUSINESS` | `/business/:id` | |
| `BUSINESS_APPLICATION_*` | `BUSINESS_APPLICATION` | `/business/apply?id=` | |
| `OWNERSHIP_CLAIM_*` | `OWNERSHIP_CLAIM` | `/business/claims` | list screen |
| `BUSINESS_INVITATION_*` | `BUSINESS` | `/owner/team` + select business | |
| `PLAN_*` | `BUSINESS` | `/owner/plan` + select business | |
| `AD_CAMPAIGN_*` | `AD_CAMPAIGN` | `/owner/monetization/campaigns/:id` | 404 → screen/snackbar UX |
| `NEW_PROMOTION` | `PROMOTION` | `/promotions` | no producer yet |

Security: never navigate from arbitrary payload paths/URLs; supplementary `businessId` only for `REVIEW` targets per E.2 contract.

Future producer categories, whitelist extensions (`locationId` / `citySlug`), and cross-channel **NavigationTarget** alignment: [future-extensibility-contracts.md](./future-extensibility-contracts.md) § Contracts 2 and 10.

## Push delivery (Stage 6.11E.5)

- **Flow:** domain action → persist `Notification` → after commit, best-effort FCM fan-out to active `PushDevice` rows.
- **Never** call FCM inside Prisma `$transaction` (tx-bound producers schedule push after commit).
- **Eligibility:** all meaningful E.2 types except `GENERAL` and `NEW_PROMOTION`.
- **Payload (data):** `notificationId`, `type`, optional `targetType`, `targetId`, optional `businessId` (REVIEW only). No UGC, secrets, or arbitrary routes.
- **Localization (E.5 as shipped):** OS title/body use persisted notification strings; device `locale` hint stored but not applied to copy.
- **Localization (KZ-C.1D target — [notification-localization.md](./notification-localization.md)):** Central typed **KK/RU renderer** at push send + Business Web inbox; persisted strings = legacy fallback only; producers add **safe payload** fields; **no** per-producer bilingual strings.
- **Client tap:** whitelisted data → `AppNotification` → E.4 `resolveNotificationDestination`.
- **Config:** `PUSH_ENABLED=false` by default; Firebase Admin creds via env. Mobile requires external `google-services.json` / `GoogleService-Info.plist`.

## Producer contract (KZ-C.1D target)

When KZ-C.1D is implemented, producers emit:

- `type`, `targetType`, `targetId`, `userId`(s)
- **`payload`** with presentation-safe fields (`businessName`, `publicReason`, `planTier`, etc. — see notification-localization.md §9)
- **`title` / `body`:** legacy compatibility (RU placeholders acceptable); **not** used for typed push/Web display

Producers **must not** branch on locale or embed KK copy.

---

## Deferred (E.3+ / infrastructure)

- `REPORT_RESOLVED` for reporters (case/report resolution not immutable enough)
- `NEW_PROMOTION` broadcast or consumer fan-out
- Promotion moderation (no approval workflow)
- Order/payment notifications (defer until production payment semantics stable)
- Phone/email invites without resolvable `userId` (external delivery)
- Instant manager add via phone (no invitation row; no in-app invite event)
- Scheduled plan expiry job (lazy sync remains; duplicate guarded via `updateMany`)
