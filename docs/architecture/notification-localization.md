# Notification localization architecture (KZ-C.1D)

**Status:** **KZ-C.1D.1 PASS — ARCHITECTURE / CONTRACT LOCKED** (documentation only; **not implemented**).

**Audit baseline:** KZ-C.1D.0 read-only audit at HEAD `27d73d56ac47def5665ed1e5c3d4d0624b2b597f`.

**Canonical history:** `docs/changelog.md`. **Notifications E (unchanged):** `docs/architecture/notifications-final-architecture.md`, `docs/architecture/notification-producers.md`.

**Kazakhstan product locale policy:** no explicit user language → **kk**; explicit **kk** / **ru** wins. See `docs/architecture/kazakhstan-compliance-contract.md` §4.

---

## 1. Problem statement (KZ-C.1D.0 findings)

| Surface | Today | Target |
|---------|--------|--------|
| Flutter in-app (typed E.2) | **KK/RU** via `presentAppNotification` + `appLocaleProvider` | **Preserve** (parity contract) |
| FCM/APNs OS banner | **RU** persisted `title`/`body`; `PushDevice.locale` ignored | **Per-device KK/RU** typed templates |
| Business Web `/messages` | **RU** API `title`/`body` | **UI locale** typed templates |
| DB row | Single RU `title`/`body`, no locale column | **Unchanged**; not authoritative for typed presentation |

---

## 2. Options evaluated

### Option A — Data-only push + client-generated OS copy

FCM/APNs carries **whitelist routing data only**; Flutter (or native) builds OS notification text from the same rules as inbox.

| Factor | Assessment |
|--------|------------|
| Android background / terminated | Requires **local notification** plugin + reliable background handler; killed-state delivery is fragile without native code |
| iOS background / terminated | Data-only **does not** show a user-visible banner unless app code runs; APNs `content-available` alone is insufficient for UX |
| Flutter constraints | `firebase_messaging` background isolate has limited context; **no** `appLocaleProvider` unless persisted locale read explicitly |
| Dependencies | New local-notification stack, platform channels, duplicate handling vs system tray |
| Duplicate notifications | Current gateway sends **both** `notification` + `data`; switching modes risks double banners |
| Business Web | **No benefit** — Web has no FCM inbox renderer |
| E.5 closure | E.5 documented OS copy from persisted strings; data-only is a **contour change**, not additive hardening |
| Testability | Heavy physical QA matrix; hard to contract-test OS text in CI |

**Verdict:** Rejected for QalaGo MVP. High platform risk, does not fix Business Web, reopens E.5 push display assumptions.

### Option B — Server-side typed bilingual push templates (chosen)

At **send time**, for each `PushDevice`, resolve locale → render **KK/RU** strings from a **central typed template module** using `Notification.type` + **safe presentation payload**. Persisted `title`/`body` remain for API legacy and untyped rows.

| Factor | Assessment |
|--------|------------|
| Per-device locale | **Native fit:** fan-out loop already calls `buildPushDisplayCopy(notification, device.locale)` |
| Multi-device KK/RU | **One DB row**, N localized OS messages |
| Business Web | Same renderer (shared module or parity-tested copy) keyed off `qalago_locale` |
| Prisma | **No migration** |
| Navigation / FCM data | **Unchanged whitelist** (`notificationId`, `type`, `targetType`, `targetId`, `businessId`) |
| Testability | Pure functions: type + locale + payload → title/body |
| Producers | Stop owning bilingual copy; emit structured payload fields |

**Verdict:** **Chosen** — matches existing architecture, satisfies KZ-C.1D.0 gaps with minimal blast radius.

### Option C — Other

- **Persist bilingual columns** on `Notification` — rejected: migration, stale copy on locale change, does not solve per-device push.
- **`User.preferredLocale`** — rejected: out of KZ-C.1 scope; device/cookie hints sufficient.
- **Machine translation** of stored RU strings — rejected: not acceptable for compliance/product quality.

---

## 3. Architectural decision (locked)

**Target architecture: Option B** — centralized **server-side typed presentation renderer** for:

1. **Push OS display** (per `PushDevice.locale`, default **kk**)
2. **Business Web inbox** (per Business Web UI locale from `qalago_locale`, default **kk**)

**Flutter in-app** keeps **gen_l10n** `presentAppNotification` (E.3). **Contract parity** (same semantic templates, same fallbacks) is enforced by **tests**, not by forcing one code path.

Persisted `Notification.title` / `Notification.body`:

- Remain **required** API fields and **legacy fallback** for `GENERAL`, unknown types, and incomplete historical rows.
- Are **not** authoritative for typed push or Business Web presentation after KZ-C.1D implementation.

---

## 4. Source of truth

| Artifact | Role |
|----------|------|
| `Notification.type` | Semantic event identity (enum) |
| `Notification.payload` | Safe structured data for interpolation + navigation (superset for API; FCM data remains whitelisted subset) |
| `Notification.title` / `body` | **Legacy / historical / GENERAL** fallback; producer compatibility; **not** typed presentation source |
| `PushDevice.locale` | **Per-device** push presentation locale hint (`kk` \| `ru` \| null) |
| Flutter `appLocaleProvider` | Mobile **in-app** presentation locale |
| Business Web `qalago_locale` cookie + `normalizeLocale` | Business Web **in-app** presentation locale |
| **No** `User.preferredLocale` | Not introduced in KZ-C.1D |

---

## 5. Locale resolution contract

### Push (`PushDevice.locale` → push template locale)

| Input | Resolved presentation locale |
|-------|----------------------------|
| `kk` (incl. `kk-KZ` normalized) | **kk** |
| `ru` | **ru** |
| `null` / missing | **kk** |
| invalid | **kk** |

Implementation note (future): align `PushDevicesService.normalizeLocale` storage with resolution (invalid → store `null`, resolve at render time to **kk**).

### Business Web

| Cookie / preference | Presentation locale |
|---------------------|----------------------|
| `qalago_locale=kk` | **kk** |
| `qalago_locale=ru` | **ru** |
| no cookie / invalid | **kk** |

### Flutter in-app

Unchanged KZ-C.1B: `appLocaleProvider` + explicit `qalago_ui_locale`; no change in KZ-C.1D.1.

---

## 6. PushDevice locale synchronization (design)

**Goal:** Explicit language switch updates push hint **without** logout/login.

**Chosen mechanism:** **Dedicated listener** on effective app locale, plus existing auth bootstrap.

1. **Keep** `authPushSyncProvider` — on `isAuthenticated` true → `syncForAuthenticatedUser(localeTag: appLocaleProvider.languageCode)`.
2. **Add** `pushLocaleSyncProvider` (or equivalent) — `ref.listen(appLocaleProvider, …)` when authenticated:
   - Call `PushRegistrationService.syncForAuthenticatedUser(localeTag: newCode)` **best-effort** (fire-and-forget `unawaited`, catch errors).
   - **Must not** block `setLocale()` or prefs write.
3. **Fix** `onTokenRefresh` handler (implementation stage) to read **current** locale at refresh time, not a stale closure captured at first sync.

**Failure behavior:** Network/register failure → language switch still succeeds; next auth event or token refresh reconciles locale.

**Duplicate registration:** Re-use existing upsert-by-token; only `locale` + `lastSeenAt` update when token unchanged.

**Auth cycles:** Push sync providers depend on auth + push services only; **no** new auth dependencies from `AppLocaleNotifier`.

---

## 7. Template architecture

### Central renderer (catalog-api)

Single module (conceptual API):

```ts
renderNotificationPresentation(input: {
  type: NotificationType;
  locale: 'kk' | 'ru';
  payload: Record<string, unknown> | null;
  legacyTitle: string;
  legacyBody: string | null;
}): { title: string; body?: string; usedLegacyFallback: boolean }
```

**Rules:**

- Known `NotificationType` (E.2 set) → **KK/RU template strings** in one catalog (e.g. `notification-presentation.templates.ts`).
- `GENERAL`, unknown enum value, or renderer `unsupported` → `legacyTitle` / `legacyBody` (**no MT** of legacy text).
- **Push:** `buildPushDisplayCopy` calls renderer with `resolvePushLocale(device.locale)` + notification fields.
- **Business Web:** client or small shared helper calls same logic (see §8).

Producers **do not** select KK/RU; they continue to pass **legacy RU** `title`/`body` for API compatibility until a later cleanup stage optionally simplifies literals to generic placeholders.

---

## 8. Template ownership

| Consumer | Owner | Notes |
|----------|--------|------|
| Push OS copy | **catalog-api** renderer | Authoritative for FCM `notification.title/body` |
| Business Web inbox | **Same TS module** ideally via future `packages/notification-presentation` **or** catalog-api module re-exported to business-web with **parity tests** | Avoid premature cross-language package; **acceptable:** duplicate TS with shared snapshot tests in KZ-C.1D implementation |
| Flutter in-app | **ARB / gen_l10n** | Keep; parity enforced by contract tests mapping type → key semantics |

Do **not** block KZ-C.1D on a new shared npm package; ship renderer in `services/catalog-api` first, extract package only if duplication hurts.

---

## 9. Safe payload matrix (presentation vs push data)

**FCM data whitelist (unchanged):** `notificationId`, `type`, `targetType`, `targetId`, `businessId` only — see `push-payload.ts`.

**JSON `Notification.payload` (API)** may gain **presentation-safe** fields; they **must not** be copied into FCM data unless explicitly approved in a future E amendment.

| NotificationType | Current payload (typical) | Presentation fields needed | Push data change |
|------------------|---------------------------|----------------------------|------------------|
| `NEW_REVIEW` | `businessId`, `reviewId`, `rating` | `businessName` (add) | No |
| `REVIEW_REPLY` | `businessId`, `reviewId` | `businessName` (add); **no** reply text in push | No |
| `REVIEW_HIDDEN` / `REVIEW_RESTORED` | `businessId`, `reviewId` | `businessName` (add) | No |
| `BUSINESS_APPROVED` / `BLOCKED` | often empty | `businessName`, `businessId` (add) | Optional `businessId` already via target |
| `BUSINESS_APPLICATION_APPROVED` | `applicationId`, `businessId` | `businessName` (add) | No |
| `BUSINESS_APPLICATION_REJECTED` | `applicationId` | `publicReason` (add, sanitized) | No |
| `OWNERSHIP_CLAIM_APPROVED` | `claimId`, `businessId` | `businessName` (add) | No |
| `OWNERSHIP_CLAIM_REJECTED` | `claimId`, `businessId` | `publicReason` (add) | No |
| `BUSINESS_INVITATION_RECEIVED` | business ids | `businessName` (add) | No |
| `BUSINESS_INVITATION_ACCEPTED` | business ids | `businessName` (add) | No |
| `PLAN_ACTIVATED` | `businessId`, `planTier` | `businessName`, `planTier` (tier code OK) | No |
| `PLAN_EXPIRED` | `businessId`, `previousPlanTier` | `businessName`, `planTier` | No |
| `AD_CAMPAIGN_APPROVED` / `REJECTED` | `businessId`, `creativeId`, … | `businessName`; reject: `publicReason` optional | No |
| `GENERAL` / `NEW_PROMOTION` | varies | legacy title/body only | No |

**Field classification:**

| Class | Examples | Push OS | In-app typed |
|-------|----------|---------|--------------|
| SAFE FOR PUSH DISPLAY | `businessName`, `planTier` code, `rating` | Interpolate in template | Yes |
| SAFE AUTHENTICATED IN-APP ONLY | full `publicReason` when long | Generic template; detail in app | Yes |
| UGC — DISPLAY WITH CARE | owner reply text, user review text | **Generic** push body; full text in app/inbox detail only | Flutter already avoids showing raw reply in template title |
| INTERNAL — NEVER | staff notes, audit ids, rejection internals | Never | Never |

Producers add fields in **create** path only; **no Prisma migration**.

---

## 10. UGC and sensitive text rules

- **Never machine-translate** user or staff free text.
- **REVIEW_REPLY:** Push/in-app typed **wrapper** in KK/RU; **do not** put full owner reply on lock-screen push; persisted `body` may still store reply for legacy API consumers until cleaned up — Business Web typed renderer should **not** surface raw reply as primary title.
- **Rejection / moderation public reason:** If `publicReason` is present and **short** (implementation cap, e.g. ≤120 chars, no newlines), may append to localized body; otherwise generic “see details in app”.
- **Ad creative rejection:** Same as public reason; internal moderator-only notes **never** in payload.

---

## 11. Business Web `/messages`

After KZ-C.1D implementation:

- For each typed notification: display **`renderNotificationPresentation(type, uiLocale, payload, item.title, item.body)`** — not raw API title/body.
- Type chip labels remain from existing `UiLabels`.
- `GENERAL` / unknown: show API `title`/`body` (legacy).

No API version break; optional future `displayTitle`/`displayBody` **not required** if client renders.

---

## 12. Flutter in-app (unchanged implementation)

Keep `presentAppNotification` + ARB. KZ-C.1D implementation adds **parity tests** (type + locale + payload fixtures) aligned with server renderer semantics.

Do **not** replace Flutter presentation solely for structural uniformity.

---

## 13. Multi-device behavior

One `Notification` row per user/event. `PushDeliveryService` fan-out:

- Device A `locale=kk` → renderer → **KK** FCM notification block  
- Device B `locale=ru` → renderer → **RU** FCM notification block  

In-app: each device uses its own `appLocaleProvider`. **No contradiction** when push locale sync works; if push locale stale briefly, inbox still correct — acceptable until resync.

---

## 14. Historical rows (no migration)

- **Typed row + sufficient payload:** localized presentation via type + payload; missing `businessName` → **generic** template (no fabricated names).
- **Typed row + sparse payload:** generic template; do not invent data from `title`/`body` parsing.
- **GENERAL / unknown type:** legacy `title`/`body` as today.
- **Do not** bulk-update dev/prod notification rows for locale.

---

## 15. Producer contract (future implementation)

Producers call `NotificationsService.create*` with:

- `type`, `targetType`, `targetId`
- **`payload`** including presentation-safe fields (§9)
- **`title` / `body`:** legacy RU compatibility strings (may be simplified later to neutral placeholders)

Producers **must not** embed KK strings or branch on locale.

---

## 16. Privacy / lock-screen rules

OS banners are public. Default **conservative**:

- No internal moderation notes, staff-only comments, tokens, emails, phones, or full UGC in push **body**.
- Prefer generic localized copy + open app for detail when in doubt.
- FCM **data** payload remains minimal whitelist (E.4 navigation).

---

## 17. Categories / preferences

Transactional/service types only in scope. `NEW_PROMOTION` remains **without producer**; marketing opt-in / preference center **deferred** (KZ-C.0 §17).

---

## 18. Database / API

- **No** Prisma schema change, **no** migration, **no** localized columns, **no** `User.preferredLocale`.
- **GET /notifications** DTO unchanged; additive payload keys allowed.

---

## 19. Test contract (KZ-C.1D implementation / KZ-C.1E)

Automated:

- Push renderer: typed **kk** / **ru**; null/invalid device locale → **kk**
- Multi-device fan-out mock: same notification, two locales → two copy variants
- `GENERAL` + unknown → legacy fallback
- Historical sparse payload → generic typed template
- UGC types → no raw reply in push output
- Business Web: KK / RU / no-cookie → **kk** presentation
- Flutter: existing `notification_presentation_test` regression + **parity fixtures** vs server renderer
- Push locale resync: unit/widget test that locale change triggers register with new locale (mock API)
- Resync failure non-fatal
- `assertPushDataPayloadSafe` / navigation unchanged

Physical QA (KZ-C.1F — **not** in 1D.1): Android KK/RU push banners, switch without re-login, tap navigation; Business Web KK/RU messages; foreground/background/terminated where feasible.

---

## 20. Closed-stage safety

- **Notifications E:** CLOSED/PASS — additive localization; navigation whitelist unchanged.
- **F.5 / F.6 / F.7:** untouched.

---

## 21. Deferred

- Shared `packages/notification-presentation` extraction (optional)
- Producer literal cleanup (RU-only title/body simplification)
- Push preference center / marketing consent
- `NEW_PROMOTION` producer
- Outbox / durable push dispatcher

---

## 22. Next stage

**KZ-C.1D implementation** — explicit agreement before coding; then **KZ-C.1E** automated tests; **KZ-C.1F** physical QA. **Do not** auto-start.
