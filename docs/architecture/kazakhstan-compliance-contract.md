# Kazakhstan compliance architecture contract (KZ-C)

**Status:** **KZ-C.0 PASS — COMPLIANCE CONTRACT LOCKED** (documentation only; **not** legal approval; **not** production compliance).

**Audit baseline:** KZ-COMPLIANCE.0 read-only audit PASS at HEAD `9b6b55a83b8733d8b38236ae94d10bdb65c5ed9d`.

**Canonical history:** `docs/changelog.md`. **Counsel checklist (questions, not advice):** `docs/legal/kazakhstan-legal-review-checklist.md`, `docs/legal-review-required.md`. **Technical legal foundation (implemented):** `docs/legal/stage-6-9-legal-safety-foundation.md`.

---

## 1. How to read this document

| Label | Meaning |
|-------|---------|
| **CURRENT STATE** | What the repository does today (may be incomplete). |
| **AGREED TARGET** | Architecture/product contract QalaGo commits to implement in KZ-C.1+ stages. |
| **LEGAL REQUIREMENT** | Only where applicable law is identified at a high level; **no article numbers** in this doc. |
| **QALAGO PRODUCT POLICY** | Product decision; not asserted as statute unless counsel verifies separately. |
| **LEGAL REVIEW REQUIRED** | Unresolved interpretation; counsel must decide before production claims. |
| **DEFERRED IMPLEMENTATION** | Locked in contract; code/schema/UI changes happen in named later stages. |

This document is **not legal advice**. Final legal texts, classifications, and retention durations require **professional Kazakhstan legal review** before public production.

---

## 2. Legal baseline (scope of compliance program)

QalaGo compliance work must account for applicable Kazakhstan law as of the project review date (**2026-09-28**), including at minimum:

- Digital Code of the Republic of Kazakhstan (2026-01-09 No. 255-VIII)
- Law of the Republic of Kazakhstan “On Personal Data and Their Protection”
- Law of the Republic of Kazakhstan “On Artificial Intelligence” (2025-11-17 No. 230-VIII)
- Law of the Republic of Kazakhstan “On Online Platforms and Online Advertising” (2023-07-10 No. 18-VIII)
- Applicable language legislation, advertising legislation, consumer-protection rules, and subordinate regulations where materially relevant

**LEGAL REVIEW REQUIRED** for: exact applicability, operator duties, consent models, retention minima/maxima, cross-border transfer grounds, online-platform classification, advertising disclosure fields, minors policy, and cookie/tracking notices.

Do **not** copy statutory texts into the repository.

---

## 3. Phase plan (locked sequence)

| Phase | Name | Scope |
|-------|------|--------|
| **KZ-C.0** | Compliance contract lock | **THIS STAGE** — docs only |
| **KZ-C.1** | Kazakh-first + localization baseline | Flutter + web defaults; preserve F.5/F.7 |
| **KZ-C.2** | Legal documents + versioned acceptance integration | KK/RU content process + client/API binding |
| **KZ-C.3** | Personal-data lifecycle / rights / public DTO hardening | Deletion, push tokens, `ownerId`, export |
| **KZ-C.4** | Advertising compliance | Labels, transparency, retention class |
| **KZ-C.5** | UGC / moderation / complaint production readiness | Flags, KK operational support |
| **KZ-C.6** | AI compliance foundations | Before consumer/external AI launch |
| **KZ-C.7** | Production providers / hosting / data-location gate | Register + cross-border sign-off |
| **KZ-C.8** | Automated compliance regression | Tests/gates |
| **KZ-C.9** | Physical QA + production legal sign-off | Launch gate evidence |

**Note:** Internal development (e.g. **AOP.0** catalog operations) may proceed in parallel where it does not contradict this contract. **Public production** remains gated by applicable **P0** items in §40.

---

## 4. Kazakh-first locale (QALAGO PRODUCT POLICY)

**AGREED TARGET (P0 before QalaGo public production launch):**

| Situation | Locale |
|-----------|--------|
| No explicit saved user language (first install / first run / no preference) | **`kk-KZ`** (product: Kazakh first-class; implementation may use `kk` code where UI uses two-letter locales) |
| User explicitly chose a language | **Saved choice wins** on all subsequent launches |
| Returning user | **Never overwrite** explicit saved language merely because device/system locale changed |
| Russian | **Fully supported** alongside Kazakh |

**LEGAL REVIEW REQUIRED:** whether any statute mandates first-run Kazakh; this contract treats KK-first as **QALAGO PRODUCT POLICY**, not as a documented statutory requirement.

### 4.1 Surface contract (target behavior)

| Surface | CURRENT STATE (audit) | AGREED TARGET |
|---------|----------------------|---------------|
| Flutter Android / iOS | **IMPLEMENTED (KZ-C.1B):** `kQalagoProductDefaultLocale` = **kk**; explicit `qalago_ui_locale` wins; device locale not used for initial UI; default not auto-persisted | — |
| Consumer Web | **IMPLEMENTED (KZ-C.1C):** `DEFAULT_PUBLIC_LOCALE = kk`; no cookie → **kk** UI/redirect path; explicit `qalago_locale` **kk**/**ru** wins; invalid → **kk**; cookie **not** auto-set on default visit; F.5 **x-default RU** unchanged | KZ-C.1F physical QA |
| Business Web | **IMPLEMENTED (KZ-C.1C):** `normalizeLocale` / SSR `<html lang>` / client fallback → **kk** when no explicit cookie; same cookie semantics as Consumer Web | Residual RU-hardcoded ops strings (non-blocker); KZ-C.1F physical QA |
| Admin Web | Operational UI largely RU | Admin ops localization **phased**; public/user/business **legal/compliance** surfaces must not silently stay RU-only for production |
| Notifications | **IMPLEMENTED + PHYSICAL QA VERIFIED (KZ-C.1F):** server typed KK/RU for push (per `PushDevice.locale`) + Business Web `/messages`; Flutter in-app ARB (E.3) + push locale sync; **SM-J610FN** live FCM + inbox/deep-link | **iOS FCM deferred**; **`fcm_fallback_notification_channel`** polish optional |
| Legal documents | F.7 neutral URLs; body largely RU draft | Approved **KK + RU** where required (§8) |

**KZ-C.1E (automated gate PASS):** Consumer **323/323**, Business **210/210**, notification package **9/9**, catalog-api notification jest **127/127**, builds PASS; Flutter KZ-C.1 focused **98** PASS; ARB **956/956**. **KZ-C.1F / KZ-C.1B physical FCM PASS** — **KZ-C.1 CLOSED** (see **`docs/changelog.md`**).

**DEFERRED:** iOS physical FCM; Admin Web localization; F.5 **x-default=kk** SEO decision (separate from product default); unrelated flaky full-suite jest / network widget tests (documented in changelog).

### 4.2 F.5 SEO compatibility (do not reopen F.5)

**CURRENT STATE:** F.5 **CLOSED / PASS** — locale-prefixed discovery URLs `/kk/...`, `/ru/...`; legal URLs locale-neutral per F.7.

**AGREED TARGET:** KK-first default must **not** break:

- Canonical URLs, hreflang, locale-prefixed discovery URLs
- Legacy redirects, F.6 deep links
- F.7 neutral legal URLs (`/privacy`, `/terms`, `/account-deletion`)

**Implementation dependency:** F.5 **x-default** / default-locale SEO assumptions may need an explicit decision during **KZ-C.1** (not an automatic rewrite in KZ-C.0).

---

## 5. Operator identity

**CURRENT STATE:** Placeholders in Consumer Web `LEGAL_PLACEHOLDERS` and `docs/legal-review-required.md` (operator name, address, contacts).

**AGREED DECISION:** **`OPERATOR_IDENTITY = PENDING BUSINESS DECISION`**

Do **not** invent legal form (ИП/ТОО), BIN, legal name, address, or contact emails in architecture or code.

**P0 PRODUCTION BLOCKER:** production legal publication and store disclosures blocked until operator identity and required contacts are finalized.

**Not a blocker** for internal development (including AOP.0), provided production claims are not made.

Architecture must allow supplying operator fields via configuration/env **without** rewriting application architecture.

---

## 6. Legal document set (conceptual)

Evaluate and maintain (final list **LEGAL REVIEW REQUIRED** where noted):

| Document | Role |
|----------|------|
| Privacy Policy | Personal-data notice |
| Terms / User Agreement | Service terms |
| Account deletion information | Process + rights (F.7 page + backend deletion) |
| Personal-data notices/consent | Where counsel requires separate consent |
| Community / Review rules | UGC |
| Moderation / complaint procedure | Platform trust |
| Business terms | B2B (deferred in checklist) |
| Advertising terms/policy | Ad Engine |
| AI notice/policy | When consumer/external AI launches |
| Processor/subprocessor disclosure | Where appropriate |

**DEFERRED:** Final legal text — counsel + content process, not engineering in KZ-C.0.

---

## 7. KK + RU legal content

**CURRENT STATE:** Consumer legal **bodies** primarily **Russian drafts**; KK chrome via layout; checklist item #15 DRAFT.

**AGREED TARGET:** For documents requiring user/business comprehension in both supported languages, **approved KK and RU versions** before public production where applicable.

**Policy:** Uncontrolled machine translation is **not** final legal text. MT may assist drafting; **review/approval** through legal-content process.

---

## 8. Legal document source of truth (three concerns)

Resolves audit conflict: **F.7 static Consumer Web pages** vs **backend `LegalDocument` / `LegalAcceptance`**.

| Concern | AGREED TARGET |
|---------|---------------|
| **PUBLIC PRESENTATION** | Consumer Web remains **canonical public host** for legal URLs (F.7). Pages are **not** dependent on authenticated session for reading. |
| **VERSIONED LEGAL RECORD** | Backend **`LegalDocument`** (type, version, locale, status, `requiresReacceptance`) is the **authoritative compliance/version source** for documents that require tracked acceptance. |
| **ACCEPTANCE RECORD** | Backend **`LegalAcceptance`** stores proof (user, document, version, locale, source, `acceptedAt`). |

Static TSX may remain for presentation until KZ-C.2 defines sync/render from published records; **target** is alignment so displayed version matches provable acceptance.

**IMPLEMENTED (KZ-C.2):** Shared manifest **`PUBLISHED_PLATFORM_LEGAL_VERSIONS`**; published **`LegalDocument`** rows seeded to match; Consumer Web Terms/Privacy display **version** from manifest; backend **`GET /legal/current`** exposes same versions + public URLs.

---

## 9. Legal acceptance

**CURRENT STATE (KZ-C.2):** **`GET /legal/current`**, **`POST /legal/me/accept`** (version + idempotency), **`POST /legal/me/accept-required`**; **`LegalAcceptanceGuard`** on product APIs; **Flutter** and **Business Web** acceptance gates; **staff roles exempt** from consumer mandatory Terms/Privacy gate.

**AGREED TARGET** — where acceptance is legally/product-required, proof must support at minimum:

- userId / account identity
- document type
- document version
- locale
- acceptedAt
- source/surface (`LegalAcceptanceSource`)

Preserve existing **`LegalAcceptance`** schema where suitable.

**LEGAL REVIEW REQUIRED:** exact list of documents/actions requiring **affirmative** acceptance.

Informational pages (e.g. account-deletion **instructions**) may not require the same acceptance class as Terms/Privacy.

---

## 10. Re-acceptance

**CURRENT STATE:** `LegalDocument.requiresReacceptance` in schema and `LegalService` status logic.

**AGREED TARGET:** Material legal changes **may** require re-acceptance when configured. **Not** every wording edit forces re-acceptance — **policy/legal determination** controls.

---

## 11. Personal data principles

**AGREED TARGET (architecture):**

- Collect only data needed for defined product, security, or legal purposes.
- Do not expose internal identifiers publicly without product need.
- Separate **public business information** from **personal data of business representatives**.
- Define retention and deletion **per data domain** (see inventories).
- Document third-party processing in a **provider register** (§14).

**DEFERRED:** Schema redesign — use KZ-C.3+ as needed.

**Reference inventories:** `docs/privacy-data-inventory.md`, `docs/legal/data-inventory.md`.

---

## 12. Public DTO privacy

**IMPLEMENTED (KZ-C.3):** Guest catalog responses use explicit mappers in **`catalog-api`** (`public-business`, `public-review`, `public-promotion` DTOs). Runtime JSON **must not** include **`ownerId`**, **`planTier`**, **`planExpiresAt`**, internal **`status`** / featured / moderation workflow scalars on business/review/promotion payloads, or review **`userId`** / nested **`user`** — only **`author.name`** / **`author.avatarUrl`**. Stable resource ids (**`businessId`**, **`locationId`**, **`reviewId`**, promotion id, ad **campaign/creative/placement** ids) remain for product and CW.6 analytics. Owner/admin/authenticated business-management APIs **unchanged**.

**ID POLICY:** Remove **relationship/identity** ids that reveal private actors; keep **public resource** ids required by UI and tracking.

**DEFERRED:** Broader PD lifecycle (**KZ-C.4+**); full provider register (**KZ-C.7**).

---

## 13. Data location and providers

**CURRENT STATE:** Dev localhost Postgres/uploads; production hosting, S3, Firebase, SMS — **UNKNOWN** in repo; no completed DPA register.

**AGREED TARGET:**

- Maintain explicit **production provider/data-location register** (see template §13.1).
- Do **not** assume geography from provider brand/domain.
- **UNKNOWN** acceptable during development.
- **UNKNOWN not acceptable** for production systems handling regulated personal data where location/transfer must be established (**KZ-C.7** gate).

### 13.1 Register fields (each production system)

provider · purpose · data categories · storage/processing location (if known) · contract/DPA status · cross-border implications · retention/deletion relationship · production owner

### 13.2 Primary vs backup (independent review)

Production compliance review must cover **independently:**

primary PostgreSQL · replicas · backups · object storage · uploads · logs · Redis · analytics stores · push infrastructure

A KZ-hosted primary DB does **not** automatically prove backup/log/object-storage compliance.

---

## 14. Third-party processors

Before enabling production features, **verify** (technical register always; legal role **LEGAL REVIEW REQUIRED**):

Google · Apple · Firebase/FCM · SMS provider · hosting · object storage · analytics/crash (if added) · AI provider (if added) · map/geocoder where personal data may be transmitted

Not every third party is automatically a legal “processor”; classification is **LEGAL REVIEW REQUIRED**.

---

## 15. User rights

**CURRENT STATE:** `DataRightsRequest` API + admin workflow; `dataRightsEnabled` flag default **OFF**; no automated export ZIP; account deletion via `DELETE /users/me`.

**AGREED TARGET:** Reuse existing data-rights architecture; support applicable rights including access, correction, deletion, withdrawal where applicable, complaint, export where legally/product-required.

**LEGAL REVIEW REQUIRED:** exact statutory scope.

Account deletion must remain a **real backend lifecycle** (not only a public instruction page).

---

## 16. Account deletion (preserve + harden)

**CURRENT STATE:** `AccountDeletionService` — soft anonymize user; delete reviews/favorites/notifications; revoke memberships; cancel pending apps/claims; tombstone auth identities; retain orders/audit.

**Future review (KZ-C.3):** PushDevice/token cleanup · avatar file lifecycle · retained orders/payments · audit/security records · legal acceptance records · ownership/membership rules.

Do **not** indiscriminately delete audit/payment/legal evidence; retention/legal basis **per domain** — **LEGAL REVIEW REQUIRED**.

---

## 17. Push notifications

**AGREED TARGET:**

- Distinguish **transactional/service** vs **marketing/promotional** notifications.
- Future preference/consent must not assume OS permission alone satisfies all legal/product consent questions.
- Push tokens: defined **invalidation/deletion** lifecycle (**KZ-C.3**).

**CURRENT STATE:** `PushDevice` model; FCM optional; deletion tx does not explicitly clear push rows (user row retained).

**KZ-C.1D.2 (implemented):** Option B — `@qalago/notification-presentation` renderer for push + Business Web; producer payload enrichment (`businessName`, `publicReason`, tier codes); Flutter push locale sync; **no** Prisma change. Canonical: **`docs/architecture/notification-localization.md`**. Physical push QA: **KZ-C.1F**.

---

## 18. Geolocation

**AGREED TARGET:**

- **`BusinessLocation` coordinates** = public business/catalog data.
- **User/device location** = potentially personal/sensitive; **minimize** storage; avoid precise user GPS unless a defined feature requires it.
- Nearby/map: keep **transient/minimized** where possible.

**Do not reopen** frozen Maps C architecture; compliance debt only (licensing/attribution separate from PD).

---

## 19. Online platform classification

**Do not** declare in documentation that QalaGo legally **is** or **is not** an “online platform” until counsel confirms.

**CURRENT STATE:** Features potentially relevant: accounts, UGC, reviews, business listings, moderation, complaints, advertising.

**Status:** **LEGAL REVIEW REQUIRED BEFORE PRODUCTION.**

Architecture should nevertheless support reasonable platform controls (moderation, complaints, terms access).

---

## 20. UGC / moderation

**AGREED TARGET:** Production support for moderation/complaints on reviews, replies, business content, photos/media, promotions where applicable.

**Kazakh-language content** must be **operationally supportable** (not RU-only ops as final production readiness).

Reviews D / Stage 6.9 moderation architecture **remain closed**; compliance work is **additive**.

---

## 21. Compliance feature flags

**CURRENT STATE:** `legalCenterEnabled`, `reportingEnabled`, `dataRightsEnabled` default **OFF** (`feature-flag.defaults.ts`).

**AGREED TARGET:** Production readiness review must **explicitly determine and verify** required flags.

**Launch gate item:** **COMPLIANCE-REQUIRED FEATURE FLAGS VERIFIED** (do not silently enable in KZ-C.0).

---

## 22. Advertising (permanent product contract)

**Preserve** shared Ad Engine products: `HOME_VIP_BANNER`, `CATEGORY_TOP`, `CATEGORY_BOOST`, `HOME_FEATURED`, `HOME_PROMOTIONS`.

**AGREED TARGET:** Advertising compliance behavior is **consistent** across surfaces where placements exist: `APP_ANDROID`, `APP_IOS`, `WEB_MOBILE`, `WEB_DESKTOP` — **no separate legal behavior per frontend**.

### 22.1 Ad label

**CURRENT STATE:** API constant `SPONSORED_DISPLAY_LABEL = 'Реклама'` (fixed Russian).

**AGREED TARGET:** Locale-aware user-facing identification **KK/RU**; stable semantic ad metadata in API (**KZ-C.4**).

### 22.2 Advertiser transparency

**AGREED TARGET:** Serve/compliance model capable of presenting legally required advertiser/source identification without unnecessary internal IDs.

**LEGAL REVIEW REQUIRED:** exact required fields (Business.id / campaignId alone **not** assumed sufficient).

### 22.3 Ad retention

**AGREED TARGET:** Do **not** reuse general analytics retention blindly for **legal advertising evidence**. Separate data classes. **KZ-C.4** defines evidence retention, audience PD separation, post-delete behavior.

**LEGAL REVIEW REQUIRED:** statutory retention where applicable.

### 22.4 Targeting

**CURRENT STATE:** city, category, optional branch — **no** behavioral/minor targeting found in audit.

**AGREED TARGET:** No sensitive-personal-data or minor-specific targeting without separate compliance review. Behavioral profiling requires **new explicit compliance gate**.

### 22.5 Paid vs organic transparency

**AGREED TARGET:** Users must be able to distinguish (conceptually) organic discovery, paid advertising, promotion, editorial placement, AI recommendation. Plan tier / featured ≠ advertising automatically — product classification in **KZ-C.4**.

---

## 23. Minors

**CURRENT STATE:** No DOB/age; no age gate.

**MINORS POLICY = LEGAL REVIEW REQUIRED** before age-based targeting, minor-specific services, sensitive profiling, or features legally requiring age determination.

**Do not** add DOB collection in KZ-C.0.

---

## 24. AI

**CURRENT STATE:** `ai-orchestrator` rule-based internal services; admin content drafts; **no consumer QalaGo AI**.

**AGREED TARGET:** No external LLM production-ready without **AI compliance gate** (**KZ-C.6** before consumer/external launch): disclosure, synthetic marking, human oversight, provider/transfer review, PD controls, automated decisions, prohibited uses, logging.

### 24.1 Content origin (conceptual reserve)

Future provenance categories: **HUMAN**, **AI_ASSISTED**, **AI_GENERATED**.

**Do not** add Prisma fields in KZ-C.0; schema in **KZ-C.6** when use cases are known.

### 24.2 AI provider gate

Before production external AI: provider review, data categories, training/storage policy, processing region, cross-border review, contract/DPA, user disclosure — all reviewed.

---

## 25. Analytics and logging

**Analytics AGREED TARGET:** Maintain anonymous / pseudonymous / identified distinction; no precise GPS in analytics for convenience; search queries, visitor hashes, sessions, branch context subject to retention/privacy review; **do not** silently purge data required by another legal domain (e.g. advertising evidence).

**CURRENT STATE:** Organic `track()` does not set `userId`; raw event purge scaffold 90d opt-in (`AnalyticsRetentionService`).

**Logging AGREED TARGET:** Document production destination, categories, access, retention, IP handling, security events, cross-border implications. Do not log tokens, passwords, OTP secrets, unnecessary personal payloads.

**UNKNOWN production log destination** = resolve before production launch (**KZ-C.7**), not necessarily blocking internal dev.

---

## 26. Cookies / web storage

**CURRENT STATE:** Functional `qalago_locale` cookie; Business Web HttpOnly auth cookies.

**AGREED TARGET:** Do **not** automatically import GDPR cookie-banner architecture. If future analytics/ad tracking adds browser identifiers, **dedicated Kazakhstan legal review**.

---

## 27. Business representative data

**AGREED TARGET:** Separate **public business data** from personal data of owner, manager, claimant, applicant, advertiser representative. Ownership/admin metadata **must not** become public because the business profile is public.

**AOP.0** must respect this on all public/admin read/write paths.

---

## 28. Payments

**CURRENT STATE:** Manual payment provider default; no card PAN storage.

**AGREED TARGET:** Not described as final fiscal/payment compliance. Automated production payments require separate review (provider, contract, data flow, receipts/fiscal, retention, refunds, consumer/B2B rules).

---

## 29. Intellectual property and maps

**AGREED TARGET:** Future Terms must address rights to host/display/moderate user and business content.

Third-party map/data/media licensing is **separate** from personal-data compliance. **Do not reopen** frozen map stages.

---

## 30. Production compliance gate

QalaGo must **not** be documented as **LEGAL READY**, **COMPLIANCE COMPLETE**, or **PRODUCTION COMPLIANT** until P0 controls are verified.

Minimum launch gate checklist:

1. Operator identity finalized  
2. Legal contacts finalized  
3. Required legal documents approved (counsel)  
4. Required KK/RU legal versions approved where applicable  
5. Acceptance architecture wired where required  
6. Production provider/data-location register reviewed  
7. Required data-location/cross-border decisions complete  
8. Public DTO privacy hardening complete (`ownerId` minimum)  
9. Required complaint/reporting capabilities enabled and verified  
10. Advertising compliance verified **if ads launch publicly**  
11. Production HTTPS/security configuration verified  
12. Store privacy disclosures aligned with actual processing  
13. Legal sign-off recorded (external)  

**KZ-C.9** records physical QA + sign-off evidence.

---

## 31. Relation to AOP.0

**AOP read-only audit:** PASS. **AOP.0:** **PASS — ADMIN CATALOG / OPERATIONS CONTRACT LOCKED** — **`docs/architecture/admin-catalog-operations.md`** (implementation **AOP.1+** not started).

**KZ-C.0 informs AOP.0.** AOP.0 must preserve:

- Staff catalog mutations auditable  
- Public Business DTO must not expose owner/staff personal identifiers  
- Ownerless platform-created Business allowed  
- Ownership claim preserves audit history  
- Business representative PD remains non-public  
- Compliance/legal queues not bypassed via admin shortcuts  
- AOP is **catalog operations**, not a parallel full legal CMS  
- **BusinessLocation** architecture authoritative  
- **slug** immutable unless separate redirect stage  
- **No synthetic owner account** for platform-created businesses  

**Do not inflate AOP** with full legal CMS, full privacy request UI, AI compliance console, advertising archive, or processor register UI unless a later stage requires it.

---

## 32. Closed stages (no reopen)

Unless a **proven defect** appears, do **not** reopen: **6.12A**, **F.4**, **F.5**, **F.6**, **F.7**, **Public Help**, **F.8**, **Reviews D**, **Notifications E**, **Maps C**.

Compliance work is **primarily ADDITIVE**. Historical PASS for original scope remains valid.

---

## 33. References

| Resource | Purpose |
|----------|---------|
| `docs/privacy-data-inventory.md` | PD inventory snapshot |
| `docs/legal/data-retention-matrix.md` | Retention behavior vs legal review |
| `docs/legal-review-required.md` | Unresolved business/legal items |
| `docs/architecture/public-consumer-web.md` | F.5, F.7 (legal URLs) |
| `docs/architecture/api-contracts.md` | Legal/safety API (Stage 6.9) |
| `docs/store/store-compliance-links.md` | Store listing links |

---

**Next recommended stage:** **KZ-C.1** — Kazakh-first + localization baseline (explicit agreement before implementation).
