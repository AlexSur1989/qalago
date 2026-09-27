# Future Extensibility Contracts

**Gate:** FUTURE EXTENSIBILITY ARCHITECTURE GATE  
**Status:** **AGREED / DOCUMENTED** (Phase 2 — contracts only)  
**Prerequisite for:** **F.4** public Business Pages — **CLOSED / PASS**; **F.5** locale SEO URLs — **CLOSED / PASS** ([public-consumer-web.md](./public-consumer-web.md) § F.5; **`docs/changelog.md`** umbrella closure **2026-09-27**)  
**Depends on:** **6.12A PASS — BUSINESSLOCATION ARCHITECTURE FINALIZED** (invariants non-negotiable)

This document is the **canonical source** for post-6.12A extensibility decisions locked before F.4 makes public URLs and cross-channel navigation externally stable. Other architecture docs **reference** this file; they must not duplicate full contract text.

**Explicitly not in scope here:** F.4 / F.6 implementation, Event entity, Home CMS, NotificationPreference DB, media migration, generalized Favorites, feature-flag implementation, analytics storage redesign.

---

## 6.12A invariants (non-negotiable)

All contracts below preserve:

| Invariant | Rule |
|-----------|------|
| **Business** | Brand / entity identity |
| **BusinessLocation** | Physical branch; **sole** physical/city authority |
| **No `Business.cityId`** | Retired; do not reintroduce |
| **Multi-city** | One Business may have multiple BusinessLocations in different cities |
| **`locationId`** | Branch **context** on reads/navigation; does not replace Business identity |
| **Discovery grain** | **Business** (+ optional `contextLocationId`) unless a future stage explicitly changes a surface |
| **Map grain** | **BusinessLocation** |
| **Reviews / Favorites** | **Business**-grain unless a **separate** future entity defines its own review/save model |

If a future change contradicts this table, stop and reopen 6.12A only with a concrete defect — not for convenience.

---

## Contract 1 — Public URLs (F.4 v1)

### Canonical Business URL

```text
/{citySlug}/business/{businessSlug}
```

- **`citySlug`** — public routing and discovery context (must match an active city in catalog).
- **`businessSlug`** — identifies **Business** (`Business.slug`, globally unique).
- **Business** remains the canonical public entity. **BusinessLocation must not become a second Business URL identity** (no separate public “branch business” slug as primary identity in v1).

### Branch context (v1)

```text
/{citySlug}/business/{businessSlug}?locationId={businessLocationId}
```

- Use **`locationId` query** for v1 branch selection.
- **Do not introduce `locationSlug`** in v1.

### Semantics (summary)

1. **`citySlug`** is meaningful **city context**, not decorative SEO (see **F.4 Phase 0.1 addendum** below).
2. **`businessSlug`** resolves to one **Business** (ACTIVE public rules); a multi-city brand may have **separate indexable pages per city** where it has a branch.
3. **`locationId`** is **branch context** only; resolution rules for city-routed pages are in the addendum (not identical to legacy **`GET /businesses/:id`** when `locationId` is omitted — that path remains **global primary** until F.4 city-context API exists).
4. **Canonical identity** path omits **`locationId`**; branch query must not create a second indexed Business identity.
5. **BusinessLocation** remains physical authority; no **`Business.cityId`**.

### F.4 Phase 0.1 addendum — multi-city public Business URL (LOCKED)

**Status:** **AGREED / DOCUMENTED** (docs only — no runtime change). Closes F.4 Phase 0 audit contract gap.

**Locked identity:** `/{citySlug}/business/{businessSlug}` — **Business** is the entity; **BusinessLocation** is physical/city context only.

#### Rule 1 — City route means city context

`/{citySlug}/business/{businessSlug}` means: this **Business** viewed in the context of **citySlug**.

- Resolve **citySlug** to an active catalog **City**.
- The Business must have at least one **eligible** (public) **BusinessLocation** in that city.
- If **no** eligible branch in **citySlug** → **404**. Do **not** silently show the global primary in another city.

#### Rule 2 — Default branch without `locationId`

For `/{citySlug}/business/{businessSlug}` with **no** `locationId`, select the active branch **only among eligible locations of this Business in citySlug**:

1. If the **global primary** **BusinessLocation** is in **citySlug** → use that primary.
2. Else → deterministic default in **citySlug** using the same ordering as discovery city context (**A.7.9.3A** — `resolveCityContextLocationIds`): among branches in **C**, order **`isPrimary DESC`, `createdAt ASC`, `id ASC`**, first row wins.

No **cityPrimary** flag; no change to exactly-one **global** primary invariant; selection is **page context** only.

#### Rule 3 — Valid `locationId` in same city

`?locationId=L` when **L** is owned by this Business, public-eligible, and **`L.cityId` matches citySlug** → use **L** for **`effective*`** context. URL may keep `?locationId=L`. **Canonical** for SEO remains the path **without** requiring the query (see Rule 9).

#### Rule 4 — Valid owned `locationId` in another city

When **L** is owned by this Business and public-eligible but **`L`’s city ≠ citySlug** → do **not** render **L** under the wrong city path. **Normalize** with a **permanent redirect** (**HTTP 308** preferred, **301** acceptable per [versioning-and-api-compatibility.md](../release/versioning-and-api-compatibility.md)) to:

`/{actualCitySlug}/business/{businessSlug}?locationId={L}`

Route normalization only — **Business** identity unchanged.

#### Rule 5 — Foreign `locationId`

When **L** belongs to **another Business** → never expose **L**; treat as unusable context. Resolve this Business with **Rule 2** city-default. If no eligible branch in **citySlug** → **404**. **Canonical metadata** and sitemap URLs **exclude** invalid/foreign `locationId` (prefer **render** with city-default and **canonical without** the bad query; optional **302/307** strip of query is implementation detail — must be deterministic and leak-free).

Does **not** weaken 6.12A foreign-location safety on existing **`GET /businesses/:id`**.

#### Rule 6 — Invalid / nonexistent / inactive `locationId`

Invalid, nonexistent, or non-public **L** → unusable; apply **Rule 2**. No branch in **citySlug** → **404**. Do not leak hidden/inactive location state.

#### Rule 7 — Multiple locations in same city

When global primary is **outside citySlug** but several branches exist **in citySlug** → **Rule 2 step 2** (**A.7.9.3A** ordering). Same rule as non-geo discovery **`contextLocationId`**.

#### Rule 8 — Internal discovery links

When list/search/category supplies **`contextLocationId`** in **citySlug**:

`/{citySlug}/business/{businessSlug}?locationId={contextLocationId}`

Business grain remains the slug path; **`locationId`** preserves discovered branch context.

#### Rule 9 — SEO / canonical

- **Indexable identity:** `/{citySlug}/business/{businessSlug}` (canonical **excludes** `locationId`).
- **`?locationId=`** variants are **not** separate indexed identities; **`rel=canonical`** points to path without query (unless a future SEO stage documents otherwise).
- **Sitemap:** city + business slug URLs **only** — no `?locationId=` variants.
- Multi-city Business may appear in sitemap **once per city** where it has a branch (e.g. `/uralsk/business/{slug}` and `/aktobe/business/{slug}`) — **not** **`Business.cityId`**.

#### Rule 10 — Temporary ID route (migration — not implemented)

`/businesses/{businessId}` → resolve Business + effective/context location → **`citySlug` from that location** + **`businessSlug`** → redirect to canonical URL. Preserve valid owned **`locationId`** on query when present. Without **`locationId`**, use **legacy global primary** (or effective location) **only for this redirect target**, not for city-routed page semantics.

#### Rule 11 — Backend implementation boundary (F.4 — not this task)

F.4 requires a **public slug-aware** resolution path that accepts **`businessSlug`**, **`citySlug`**, optional **`locationId`**, and returns **Business** + **effective BusinessLocation** + city-membership validity while preserving existing **`effective*`** pipelines.

- Do **not** overload **`GET /businesses/:id`** to accept slug and city semantics without a separate agreed change.
- Prefer an **explicit** public contract, e.g. **`GET /businesses/by-slug/{businessSlug}`** with query **`citySlug`** (required for F.4 page) and optional **`locationId`**, or equivalent documented endpoint.
- Existing **`GET /businesses/:id?locationId=`** remains for **id + optional branch** clients until deprecated with a window.

### Temporary path (current)

```text
/businesses/{businessId}
```

- Treated as **temporary** compatibility (Consumer Web **noindex** until F.4).
- **F.4 implementation** must define **permanent redirect** behavior from temporary ID paths to canonical slug URLs when indexable public pages ship (typically **301** to `/{citySlug}/business/{businessSlug}` with optional preserved `locationId` query where valid).
- Redirect/canonical rules are **documented here**; **not implemented** in this gate.

---

## Contract 2 — NavigationTarget

### Purpose

One **conceptual** navigation target must eventually map to:

- Android in-app route  
- iOS in-app route  
- Consumer Web URL  
- Notification / push tap target  
- Shared link  
- Future QR resolution  

**NavigationTarget** and **public URL** are related but **not identical** (URLs include SEO/routing; targets include owner-only routes and non-public screens).

### Conceptual fields (no DB / no API DTO in this gate)

| Field | Role |
|-------|------|
| **`entityType`** | Extensible, **additive** enum of navigable entity kinds |
| **`entityId`** | Primary id for the entity (cuid) |
| **`businessId`** | Optional; required for some child entities |
| **`locationId`** | Optional branch **context** (not Business identity) |
| **`citySlug`** | Optional routing/discovery context for public URLs |
| **`source`** | Optional attribution (`trafficSource` / campaign / notification) |

### Rules

- **No arbitrary URLs** as trusted navigation input (align with 6.11E whitelist — no payload `http` routes).
- **Unknown `entityType`** → safe fallback (inbox-only / home / no-op); must not crash older clients.
- **Resolution fails safely** when ids are missing, untrusted, or cross-tenant.
- Future optional whitelisted payload fields may include **`locationId`** and **`citySlug`** for BUSINESS targets (not implemented in this gate).

### Known mappings (current product)

| entityType | Typical entityId | Notes | Consumer Web (F.4 target) | Flutter (current) |
|------------|------------------|-------|---------------------------|-------------------|
| **BUSINESS** | `businessId` | Optional `locationId`, `citySlug` | `/{citySlug}/business/{businessSlug}?locationId=` | `/business/:id?locationId=` |
| **PROMOTION** | `promotionId` | Often needs `businessId` for detail | City/business promotion surfaces (F.4+) | `/promotions`, business promotions routes |
| **REVIEW** | `reviewId` | Whitelist `businessId` in payload for review notifications | Business reviews section | `/business/:id/reviews`, owner reviews |
| **MAP_LOCATION** | `businessLocationId` | Map grain | Map + business link with context | `/map` + detail handoff with `locationId` |
| **BUSINESS_APPLICATION** | `applicationId` | Onboarding | N/A (auth flows) | `/business/apply?id=` |
| **OWNERSHIP_CLAIM** | `claimId` | Owner | N/A | `/business/claims` |
| **AD_CAMPAIGN** | `campaignId` | Owner monetization | N/A | Owner campaign route |
| **EVENT** | — | **Reserved**; not implemented | Future `/{citySlug}/events/…` | Future route TBD |

See also [notification-producers.md](./notification-producers.md) (E.4 routing) and [public-consumer-web.md](./public-consumer-web.md) (F.4 routes).

---

## Contract 3 — F.4 Business showcase v1 (HYBRID / TYPED)

F.4 Business page composition is **hybrid**:

- **Typed sections** in UI (fixed known blocks).
- **Data** from existing backend **`effective*`** and public business APIs.

### V1 sections (non-exhaustive order may vary in UI)

1. Hero / identity  
2. Contacts  
3. Branches (multi-location)  
4. Gallery / media  
5. Services / catalog  
6. Promotions  
7. Reviews / replies  
8. Map / location CTA  

### Do not create in F.4 v1

- Generic **ShowcaseModule** table  
- JSON arbitrary module payloads  
- Polymorphic module ownership  

### Ownership

- Page scope = **Business-first**.  
- Branch-effective sections use **`locationId`** where 6.12A already defines branch semantics (`effectivePhysical`, `effectiveMedia`, `effectiveCatalog`, `effectivePromotions`).  
- **City/editorial content is not** Business showcase scope (Contract 5).

**Server-driven arbitrary per-business module ordering** is deferred until a documented product requirement exists (e.g. owner-defined block order beyond fixed types).

---

## Contract 4 — Event vs Promotion

| | **Promotion** (today) | **Event** (future) |
|---|------------------------|---------------------|
| Nature | Commercial offer / discount / marketing proposition | Scheduled occurrence (concert, opening, class, festival, …) |
| Ownership | **Business** (+ PBA branch semantics) | **City-discoverable**; optional link to Business / BusinessLocation |
| Discovery | Business detail, promotion feeds | City calendar/feed/search facet (future) |
| Implementation | Existing `Promotion` model | **Separate** entity when built — **not** a Promotion subtype |

**Do not** create Event model, enums, routes, or migrations in this gate. Purpose: prevent overloading **Promotion** later.

---

## Contract 5 — Editorial vs Business content

Future **city editorial** content (news, guides, collections, recommendations, “what to do”, “what’s new”) belongs to a **CITY / EDITORIAL** content family.

It must **not** be modeled as:

- `Business.description` / showcase text  
- **Promotion**  
- Fake **Business** entities  

**Business-generated** content remains in the Business domain (catalog, promotions, media, reviews).

No editorial CMS in this gate.

---

## Contract 6 — Home config vs release config

Four separate concerns (may share revision/audit **patterns**, must **not** merge into one mega-config domain):

| Domain | Purpose |
|--------|---------|
| **A) HomeLayoutConfig** | Product home presentation: city scope, section order, enabled state, section-specific config; shared backend authority for Android / iOS / Consumer Web |
| **B) Feature flags** | Capability rollout (`FEATURE_FLAG_KEYS`, city overrides) |
| **C) AppReleaseSettings** | Min/recommended version & build, force update, platform compatibility |
| **D) Maintenance** | Availability / maintenance messaging |

Existing mobile consumption: **`GET /app-config`** ([runtime-config-and-feature-flags.md](../release/runtime-config-and-feature-flags.md)). Home layout API is **future**; requirement preserved in [ai-project-context.md](../ai-project-context.md).

---

## Contract 7 — Content lifecycle principles

No universal **`ContentItem`** table.

- Lifecycle lives on **each domain entity** (`BusinessStatus`, `PromotionStatus`, `AdModerationStatus`, review hide/delete, etc.).
- Shared **vocabulary** (not mandatory states): draft, moderation/review, scheduled visibility, published/active, expired, archived.
- **Moderation** vs **publication** stay separate where meanings differ (`moderationHidden` vs `status`, etc.).
- Use explicit **`startAt` / `endAt`** (or domain dates) when scheduling matters.
- Extract shared infrastructure only after **repeated real workflows** justify it.

---

## Contract 8 — Media ownership policy

Preserve **BusinessImage** + optional **`locationId`** (6.12A.7.7).

Future attachments:

- Prefer **explicit FK** or **dedicated join/attachment** tables.  
- **MediaAsset + typed attachment** only if multiple entities need shared blob metadata at scale.  
- Avoid generic **`ownerType` + `ownerId`** without DB referential integrity as the **default** design.

Document per attachment: role, ordering, cover, visibility/moderation, storage metadata, cleanup/orphan rules when implemented.

**No media migration** in this gate.

---

## Contract 9 — Favorites / saves

- **`Favorite`** remains **Business-grain** (`userId`, `businessId`) — **unchanged**.
- Do **not** generalize or migrate to polymorphic bookmarks now.
- Future saves (Event, articles, etc.) → **independent** tables/models first.
- Generalized **Bookmark** abstraction only after multiple saveable entity types justify it.

---

## Contract 10 — Notification extension

6.11E delivery architecture remains **closed** ([notifications-final-architecture.md](./notifications-final-architecture.md)).

Every **future producer** declares a **category**:

| Category | Examples |
|----------|----------|
| transactional / security | auth, account safety |
| reviews | new review, reply, moderation |
| business / account | approval, plan, team |
| promotions | new promotion (when fan-out exists) |
| events | future |
| recommendations / marketing | future; requires consent |

Rules:

- **`NotificationType`** evolution is **additive**; unknown types → safe fallback (E.3).
- No trusted navigation from arbitrary external URLs.
- **Marketing / recommendations** push requires future **explicit consent** semantics; **transactional** notifications must not depend on marketing opt-out.
- Optional whitelisted **`locationId` / `citySlug`** in payloads may be added later for BUSINESS navigation (contract only).

**No NotificationPreference** implementation in this gate.

---

## Contract 11 — Analytics extension

Preserve A.8 **`AnalyticsEvent`** model and organic/ad pipelines.

Authoritative dimensions (use when applicable): `businessId`, `cityId`, `businessLocationId`, `promotionId`, `catalogItemId`, `campaignId`, `trafficSource`, `discoverySurface`, `platform`, `sessionId`, `clientEventId`.

Rules:

- New consumer entities → **additive `AnalyticsEventType`** where appropriate.  
- **Never** overload **`promotionId`** for Event or unrelated entities.  
- Optional future **`referencedEntityType` / `referencedEntityId`** on DTO only if repeated cross-entity analytics requires it (additive).  
- Branch-specific surfaces → **`businessLocationId`**.  
- No universal analytics storage redesign in this gate.

---

## Contract 12 — API evolution

Reaffirmed for production growth ([versioning-and-api-compatibility.md](../release/versioning-and-api-compatibility.md)):

- **`/api/v1`** DTO changes are **additive by default**; clients tolerate unknown fields.
- **Do not silently change** semantics of: **`effectivePhysical`**, **`locationId`**, Business **Favorites** grain, map **BusinessLocation** grain.
- Deprecations documented in **`api-contracts.md`** with transition/removal policy.
- **Public URL paths** are external contracts; changes require **redirects**.
- **`minimumVersion` / `minimumBuild`** only for genuine incompatibility — not routine rollout.
- Optional UI → **feature flags** / capability gating where appropriate.
- **No `/api/v2`** merely to add future features.

---

## Gate completion

| Item | Status |
|------|--------|
| Phase 1 read-only audit | PASS — gate required before F.4 |
| Phase 2 contracts (this document) | **AGREED / DOCUMENTED** |
| F.4 Phase 0.1 multi-city URL addendum | **LOCKED** (§ Contract 1 addendum) |
| F.4 implementation | **CLOSED / PASS** — public Business Pages finalized |
| F.5 Phase 0 locale SEO URL contract | **LOCKED** — [public-consumer-web.md](./public-consumer-web.md) § F.5 |
| F.5 implementation (Phases 1–2 + hotfix) | **CLOSED / PASS** — **`docs/changelog.md`** F.5 umbrella **2026-09-27** |
| F.6 deep links / NavigationTarget | **Not started** |
| 6.12A | **CLOSED** — preserved |

**Next:** **F.6** — explicit staged approval + READ-ONLY audit before implementation — **not auto-started**.
