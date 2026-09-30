# Future-Ready Platform Architecture — QalaGo

**Status:** **AGREED / DOCUMENTED** (planning and architectural guidance only)  
**Scope:** Scale, reliability, multi-surface, multi-city, and production-maturity **principles** for all future QalaGo development  
**Does not:** Implement infrastructure, change API contracts, reopen **AOP** or **BIZ**, or replace closed product tracks

**Related (canonical product/architecture, unchanged by this doc):**

- [overview.md](./overview.md) — current system context  
- [future-extensibility-contracts.md](./future-extensibility-contracts.md) — public URL, navigation, 6.12A invariants  
- [api-contracts.md](./api-contracts.md) — `/api/v1` boundary  
- [business-location.md](./business-location.md) · [business-membership.md](./business-membership.md) · [rbac.md](./rbac.md)

**Legend**

| Label | Meaning |
|-------|---------|
| **CURRENT** | Exists in repo/docs today (may be partial) |
| **PLANNED** | Agreed direction; not started or not complete |
| **FUTURE OPTIONAL** | May be adopted when measured need appears |

---

## 1. Core architectural principle (canonical rule)

**Any new QalaGo feature should be designed so that it can operate with:**

- multiple API instances  
- multiple cities  
- multiple businesses per owner  
- multiple **BusinessLocations**  
- Android, iOS, and Web clients  

**without changing core business logic.**

**Avoid assumptions such as:**

- exactly one API process  
- exactly one city  
- exactly one business per owner  
- exactly one frontend  
- exactly one worker  
- local server filesystem as shared durable storage  

---

## 2. Current foundation (**CURRENT** — factual snapshot)

Where the codebase and existing architecture docs support it:

| Area | **CURRENT** baseline |
|------|----------------------|
| Backend | NestJS **`services/catalog-api`**, REST **`/api/v1`** |
| Data | **PostgreSQL** + **Prisma**; **PostGIS** / **BusinessLocation** geography (6.12A **CLOSED**) |
| Clients | **Flutter** mobile (Android/iOS), **Consumer Web**, **Business Web**, **Admin Web** |
| Multi-city | **`cityId` / `citySlug`** scoping in catalog and ops (not Uralsk-only in domain design) |
| Multi-business owner | Business Web **selected business** context; membership model documented |
| Admin / owner planes | **AOP CLOSED**, **BIZ CLOSED** — contracts remain canonical |
| Feature rollout | Runtime flags (e.g. **`businessTeamEnabled`**) — **CURRENT** pattern, not full cohort engine |
| Redis | Present in architecture intent; use as cache/coordination — **not** primary entity store |
| Object storage | **PLANNED** for production media at scale; local/ephemeral disk acceptable in dev |
| Workers | **PLANNED** — long jobs should not block HTTP indefinitely |
| SCALE track | **PLANNED** — **not started** (see §70) |

Nothing in this document marks **PLANNED** items as implemented.

---

## 3. Architecture decision rule

**Prefer the simplest architecture that satisfies current reliability and security requirements while preserving a clean path to future scale.**

Examples:

- Do **not** add Kubernetes because 1M users are theoretically possible.  
- Do **not** add microservices because modules exist.  
- Do **not** add read replicas before DB read load justifies them.  
- Do **not** add a search cluster before PostgreSQL search is a **measured** bottleneck.  

---

## 4. Modular monolith first (**CURRENT** direction, **PLANNED** hardening)

QalaGo remains a **modular monolith** while that remains operationally appropriate.

**Do not prematurely split into microservices.**

Maintain clear module/domain boundaries, including:

Auth · Users · Businesses · BusinessLocations · Catalog · Reviews · Promotions · Notifications · Ads/Monetization · Billing · Search/Discovery · Media · Moderation · Reports · Platform configuration

**Future extraction** of a module into a separate service should be possible **without rewriting the whole platform**.

**Explicit non-goal now:** **NO microservice migration.**

---

## 5. Stateless API (**PLANNED** verification — SCALE.1)

Catalog API instances must be **horizontally scalable** and **as stateless as practical**.

Critical runtime state must **not** live only inside one NestJS process.

**Do not rely on:**

- in-process session state as the sole auth/session store for multi-instance prod  
- in-memory locks for cross-instance coordination  
- in-memory job queues as durable work  
- instance-local cache as **source of truth**  

API instances must be **interchangeable** behind a load balancer.

**CURRENT:** BFF/session patterns in web apps; backend session strategy must remain compatible with this rule as SCALE work proceeds.

---

## 6. Source of truth

| Store | Role |
|-------|------|
| **PostgreSQL / PostGIS** | **CURRENT** canonical source of truth for durable domain data |
| **Redis** | **PLANNED** roles: cache, distributed locks, queue coordination, rate limiting, short-lived state — **not** primary DB for business entities |

---

## 7. PostgreSQL / PostGIS future readiness (**PLANNED** — SCALE.5)

Preserve PostgreSQL/PostGIS as the primary data platform.

Future readiness includes: proper indexes, query observability, slow-query analysis, PostGIS spatial indexes, connection-pool planning, archive/partition readiness for high-volume tables.

**Read replicas:** **FUTURE OPTIONAL** — **do not introduce now.**

**Rule:** Critical read-after-write flows must use **primary** consistency when immediate correctness matters, e.g. permissions, ownership, billing/payment state, lifecycle/moderation, freshly saved business/location where product requires it.

---

## 8. Large-table / partitioning readiness (**PLANNED** design discipline)

**Do not implement partitioning now.**

Design potentially high-volume tables so **time-based partitioning** remains possible later.

Candidate domains: analytics events, ad impressions/clicks, notifications, audit logs, webhook deliveries, job history, search/event logs.

Avoid schema choices that make later partitioning unnecessarily difficult.

---

## 9. Cache strategy (**PLANNED** — SCALE.2)

Caching requires clear **ownership** and **invalidation**.

Do not cache merely because data is read often.

Future cache candidates: public categories, city configuration, public discovery slices, feature/config state, reference data.

Every cache must define: source of truth, key structure, TTL, invalidation trigger, stale tolerance, behavior when Redis is unavailable (graceful fallback to DB where safe).

---

## 10. Graceful degradation (**PLANNED** product + engineering rule)

Optional infrastructure or providers may fail without destroying core operation:

| Failure | Degradation |
|---------|-------------|
| Map unavailable | Branch address / manual coordinates remain usable where supported |
| Analytics unavailable | Owner can still manage business |
| Redis cache unavailable | Core catalog reads fall back to DB where safe |
| AI unavailable | Core catalog/business management continues |
| Notification delivery provider unavailable | Durable domain operation should not **necessarily** fail |

Do not make optional systems hard dependencies unless product semantics require it.

---

## 11. Background jobs / workers (**PLANNED** — SCALE.3)

Long-running or asynchronous work belongs in **dedicated workers**, not the HTTP request lifecycle.

Future worker candidates: push, email, SMS, image processing, media transforms, scheduled jobs, analytics aggregation, exports/imports, webhook retries, AI processing, moderation automation, search indexing.

HTTP handlers stay **fast and request-focused**.

---

## 12. Scheduler / cron safety (**PLANNED** — SCALE.8)

Scheduled jobs must be safe when **multiple API replicas** exist.

**Do not assume** one process equals one cron execution.

Use a **dedicated scheduler/worker** or **distributed lock / leader** mechanism.

Duplicate cron must not cause duplicate business side effects.

---

## 13. Event-driven readiness (**PLANNED**)

Prepare domains for important business events (examples):

`BUSINESS_CREATED` · `BUSINESS_APPROVED` · `BUSINESS_BLOCKED` · `BUSINESS_UPDATED` · `LOCATION_CREATED` · `REVIEW_CREATED` · `REVIEW_REPLIED` · `PROMOTION_CREATED` · `PLAN_ACTIVATED` · `PAYMENT_COMPLETED` · `CAMPAIGN_ACTIVATED` · `OWNERSHIP_CLAIM_APPROVED`

**No full message bus required now.**

Avoid tight coupling where one module directly performs every downstream action.

---

## 14. Outbox readiness (**PLANNED** — SCALE.8)

**Transactional outbox** for critical domain events:

DB transaction succeeds → durable outbox row → worker delivers notifications / webhooks / indexing.

Especially: payments, billing, plan activation, ads, notifications, partner integrations, webhooks.

**Do not implement outbox now.**

---

## 15. Idempotency (**PLANNED** — SCALE.8)

Operations with duplicate-request risk need an idempotency strategy where duplicate execution is **unsafe**.

Candidates: payments, payment webhooks, order creation, campaign activation, claim approval, invite acceptance, ownership transfer, plan activation, refunds, external webhooks.

Do not add idempotency everywhere blindly.

---

## 16. Object storage (**PLANNED** — SCALE.4)

Files/images must **not** depend on local API/VPS disk in production.

**Canonical future flow:**

API → metadata in PostgreSQL → binaries in **S3-compatible object storage** → **CDN** for public delivery where appropriate.

Local disk: ephemeral processing/temp only.

---

## 17. Media pipeline (**PLANNED**)

Documented future pipeline: upload → validation → object storage → resize/thumbnails → modern formats (WebP/AVIF where compatible) → CDN.

**Do not build media processor now.**

---

## 18. Search abstraction (**PLANNED**)

Search logic lives behind a clear **service/domain boundary**.

**CURRENT** implementation may remain PostgreSQL/PostGIS.

Do not scatter search-specific logic across many controllers/pages.

**FUTURE OPTIONAL** engines: PostgreSQL FTS, Meilisearch, OpenSearch/Elasticsearch, etc.

Switching engine must not require rewriting core business logic.

**Do not introduce a search cluster now.**

---

## 19. Map / geo provider abstraction (**PLANNED**)

Core business logic must not hard-bind to one map vendor.

Future abstractions: tiles, geocoding, reverse geocoding, routing, places search.

**BusinessLocation** remains **provider-independent** domain data.

See also [geocoding.md](./geocoding.md), [catalog-geo-query.md](./catalog-geo-query.md).

---

## 20. Notification provider abstraction (**PLANNED**)

Producers must not embed a specific delivery vendor.

Conceptual flow: **domain event → notification layer → channels** (in-app, push/FCM, email, SMS, future messaging).

**CURRENT:** notification architecture docs exist; provider swap must remain feasible.

---

## 21. Payment provider abstraction (**PLANNED**)

Production billing must not hardcode one PSP in core domain logic.

**PaymentProvider** abstraction (conceptual): Halyk, Kaspi, Freedom, others.

**Do not implement PSP integration in this roadmap.**

Core billing logic stays provider-independent.

---

## 22. Billing ledger (**PLANNED**)

Future production billing needs **auditable immutable accounting history** — not **`payment.status` alone**.

Future records: charge, payment, refund, adjustment, plan activation, invoice/receipt relation.

**Do not implement ledger now.**

---

## 23. Webhook architecture (**PLANNED**)

Incoming webhooks: signature verification, idempotency, event logging, retry-safe processing, replay protection where supported.

Avoid critical webhooks as unaudited raw controller callbacks.

---

## 24. API versioning / backward compatibility (**CURRENT** boundary)

**`/api/v1`** remains the compatibility boundary.

Mobile clients may remain installed for months after backend deploy.

Avoid breaking existing contracts abruptly; breaking changes require explicit versioning/migration strategy.

---

## 25. Zero / low downtime database evolution (**PLANNED**)

Production migrations should follow **expand → migrate → contract** where appropriate:

1. Add compatible schema  
2. Deploy code supporting old + new  
3. Migrate/backfill  
4. Switch reads/writes  
5. Remove legacy later  

Avoid changes that require all clients/services to switch atomically.

---

## 26. Release environments (**PLANNED**)

Canonical: **dev**, **staging**, **production** — similar configuration shape.

Future production flow: build, tests, migrations, backup/safety, deploy, smoke, health/readiness, rollback, feature-flag rollout where useful.

---

## 27. Feature rollout (**CURRENT** partial, **PLANNED** expansion)

Continue runtime feature controls (e.g. **`businessTeamEnabled`**).

**FUTURE OPTIONAL** scopes: global, city, business, percentage/beta cohort — **do not implement those scopes now.**

Gradual launch without redeploy when appropriate.

---

## 28. Multi-city (**CURRENT** rule)

Multi-city is **permanent**. No feature should assume Uralsk is the only city.

City scope applies to: BusinessLocation, discovery, city-specific categories, advertising, analytics, moderation, admin scope, SEO, public web.

No hardcoded city names/IDs in domain logic (seed/defaults excepted).

---

## 29. Multi-business owner (**CURRENT** rule)

**Do not assume** one user = one business.

One owner may manage many businesses, branches, chains, franchises.

Business Web keeps **selected business context**.

---

## 30. Business groups / chains readiness (**FUTURE OPTIONAL**)

**Do not implement now.**

Preserve room for **BusinessGroup / BrandGroup / Chain / Organization**:

one company → many **Business** entities → many **BusinessLocations**.

Do not bake chain semantics incorrectly into **BusinessLocation**.

---

## 31. Ownership transfer readiness (**FUTURE OPTIONAL**)

Transfer may remain unimplemented; architecture must allow future transfer without losing history: locations, reviews, promotions, ads, payments, managers, audit trail.

**Do not build transfer now.**

---

## 32. Permission evolution (**CURRENT** + **PLANNED**)

Permissions remain explicit **domain authorization contracts**.

Avoid proliferating `if (role === …)` when a canonical permission helper exists.

**FUTURE OPTIONAL:** custom manager sets, more staff/org roles.

---

## 33. Plan / entitlement engine (**PLANNED** direction)

Prefer **entitlements/capabilities** (`canReplyReviews`, `canUseAnalytics`, `maxLocations`, `maxPhotos`, `maxManagers`, `adsDiscount`, …) over UI checking raw plan names.

**Do not change current plan semantics** because of this document.

---

## 34. Analytics event taxonomy (**PLANNED**)

Canonical event names across clients, e.g. `business_view`, `business_contact_click`, `call_click`, `route_click`, `favorite_add`, `promotion_view`, `ad_impression`, `ad_click`, `search_performed`.

**Do not build full analytics platform now.**

Avoid divergent client naming for the same action.

---

## 35. Ad attribution (**PLANNED**)

Paid vs organic must stay distinguishable: organic view, paid impression/click, promoted placement, campaign attribution.

Do not mix paid and organic metrics in storage/reporting contracts.

---

## 36. Privacy-safe analytics (**PLANNED**)

Collect only what product/business needs; consider pseudonymization, aggregation, retention, deletion/export, consent where applicable.

---

## 37. Data retention (**PLANNED**)

Define retention by data type: sessions, notifications, audit, analytics, webhooks, exports, moderation, payments.

Not every table grows forever; respect legal/business requirements.

---

## 38. User data export / deletion (**PLANNED**)

Preserve ability to export personal data, delete/anonymize where legal, retain where required, track deletion workflow.

Do not hard-delete domain history blindly.

---

## 39. Privacy by design (**PLANNED**)

Data minimization, purpose limitation, least privilege, retention limits, auditable sensitive ops, secure defaults.

Kazakhstan compliance: separate **KZ-C** track — [kazakhstan-compliance-contract.md](./kazakhstan-compliance-contract.md).

---

## 40. Audit trail (**CURRENT** capability, **PLANNED** expansion)

Audit remains cross-cutting.

Future critical actions: staff, ownership, roles, payments, plans, campaigns, security config, platform features, account deletion, high-impact owner actions.

Do not rely on application logs as the only audit record.

---

## 41. Support / operations tooling (**FUTURE OPTIONAL**)

SUPER_ADMIN/support should avoid raw DB access where possible.

Future diagnostics: account, memberships, ownership, sessions, flags, payments, notifications, audit, moderation, entitlements.

**Do not build support console now.**

---

## 42. Impersonation (**FUTURE OPTIONAL** — **do not implement now**)

If ever introduced: restricted role, explicit reason, audit, short-lived session, visible banner, easy exit — **no invisible switching**.

---

## 43. Import / export (**PLANNED**)

Preserve future bulk import/export (businesses, locations, menu, categories, admin exports).

Large jobs → workers.

---

## 44. External integrations (**PLANNED**)

Use adapters (1C, CRM, POS, booking, delivery, partner catalogs).

Provider outage must not corrupt core domain state.

---

## 45. Partner API / webhooks (**FUTURE OPTIONAL**)

**Do not expose partner API now.**

Future: authenticated partner API, outbound webhooks, scoped keys, rate limits, audit, versioning.

---

## 46. AI layer (**PLANNED** optional)

AI must remain **optional** to core operation (content, moderation assist, recommendations, support, categories).

AI outage must not break catalog/business management.

Provider/model replaceable.

---

## 47. Recommendation engine readiness (**FUTURE OPTIONAL**)

No complex ML now.

Preserve signals: views, favorites, clicks, promotions, categories, distance, interaction history where legal.

---

## 48. SEO at scale (**CURRENT** direction, **PLANNED** discipline)

Continue: canonical URLs, city/category/business pages, hreflang, sitemap partitioning, structured data, duplicate control, localized metadata.

Do not generate unlimited low-quality indexable pages.

See [public-consumer-web.md](./public-consumer-web.md).

---

## 49. Localization (**CURRENT** partial, **PLANNED** breadth)

Beyond strings: RU/KK, slugs where localized, dates, currency presentation, pluralization, SEO metadata, validation, notifications, business content.

Do not hardcode Russian in reusable domain services.

---

## 50. Accessibility (**PLANNED** — UXA.11+ ongoing)

Permanent UI contract: keyboard, labels, focus, semantics, contrast, screen readers.

Not a one-time cleanup.

---

## 51. Security architecture (**PLANNED** track)

Rate limiting, brute-force protection, session/device management, staff MFA (**CURRENT** partial), audit, upload validation, dependency/SAST/DAST/secret scanning, webhook verification, least privilege, secure headers, CORS, abuse controls.

One implementation ≠ complete security program.

---

## 52. Abuse / fraud readiness (**PLANNED**)

Review spam, fake businesses, claim abuse, promotion/ad fraud, scraping, account farming, notification abuse.

**Do not implement full fraud engine now.**

---

## 53. Rate limiting (**PLANNED**)

Distributed limits when multiple API instances exist.

Candidates: auth/OTP, reviews, claims, invites, uploads, search, checkout, public writes.

---

## 54. Secrets management (**CURRENT** rule, **PLANNED** production hardening)

Never commit secrets.

Production injection for DB, Redis, FCM, SMS, email, PSP, storage, maps, AI keys.

**No secret values in this document.**

---

## 55. Observability (**PLANNED** — SCALE.7)

Structured logs, correlation ID, latency, error rates, DB pool, slow queries, Redis, queue depth, worker failures, provider failures.

**FUTURE OPTIONAL:** distributed tracing.

---

## 56. Health / readiness / liveness (**PLANNED** — SCALE.6)

Before multi-instance prod: liveness, readiness, dependency health, graceful shutdown.

Load balancer stops new traffic before termination.

---

## 57. Graceful shutdown (**PLANNED** — SCALE.6)

Stop accepting work, finish/abort safely, close DB/Redis, stop consumers, report unready.

Required before serious horizontal scaling.

---

## 58. Backup / restore (**PLANNED** — SCALE.9)

Backup is not complete until **restore is tested**.

Scope: PostgreSQL/PostGIS, object storage, critical config recovery procedures.

---

## 59. Disaster recovery (**PLANNED**)

Define **RPO** and **RTO** explicitly before production maturity — **do not invent numbers in this doc**.

---

## 60. Cost observability (**PLANNED**)

Track cost drivers: DB, storage, CDN, SMS, maps, AI, push, logs, workers.

Scale on cost per active user/request/business, not complexity alone.

---

## 61. Vendor lock-in (**PLANNED** discipline)

Avoid unnecessary lock-in for maps, storage, SMS, payment, AI, email, search — use adapters where change risk is material.

---

## 62. Unique identifiers (**CURRENT** + **PLANNED**)

Public/external contracts should not **unnecessarily** depend on sequential DB IDs.

Safe for imports, integrations, workers, future extraction.

**Do not change current IDs solely for this roadmap.**

---

## 63. Configuration (**PLANNED** discipline)

No hardcoded infra assumptions (single localhost port, one worker, one city, one bucket, one PSP, one map, one frontend, currency embedded deep in domain).

Environment/runtime config at boundaries.

---

## 64. Multi-currency readiness (**FUTURE OPTIONAL**)

**CURRENT:** Kazakhstan / **KZT**.

**Do not implement multi-currency now.**

Centralize currency **presentation** enough to evolve later.

---

## 65. Timezone readiness (**PLANNED**)

Do not assume all cities share one timezone.

Business hours and schedules need explicit local-time semantics when expansion requires.

**Do not redesign current time model now.**

---

## 66–69. Explicit non-goals (now)

| Topic | Status |
|-------|--------|
| **Multi-region** | **NO** — separate review if ever needed |
| **Kubernetes** | **NO** — simpler orchestration first |
| **Microservices** | **NO** — prefer modular monolith replicas |
| **DB sharding** | **NO** — indexes, vertical scale, replicas, partitioning first |

Also **NO** now: read replicas, event-bus migration, dedicated search cluster, production load-balancer rollout, production worker cluster, partner API, ownership-transfer implementation, AI platform rewrite.

---

## 70. SCALE roadmap (**PLANNED** — **not started**)

| Stage | Name |
|-------|------|
| **SCALE.0** | Read-only architecture audit |
| **SCALE.1** | Stateless API verification |
| **SCALE.2** | Redis / cache / distributed-lock foundation |
| **SCALE.3** | Background jobs + worker foundation |
| **SCALE.4** | Object storage / CDN readiness |
| **SCALE.5** | PostgreSQL / PostGIS performance baseline |
| **SCALE.6** | Health / readiness / graceful shutdown |
| **SCALE.7** | Observability |
| **SCALE.8** | Idempotency / scheduler / outbox readiness |
| **SCALE.9** | Backup / restore / disaster recovery |
| **SCALE.10** | Multi-instance staging test |
| **SCALE.11** | Load / stress / capacity baseline |
| **SCALE.12** | Production scale-readiness closure |

**None of these stages are started** by publishing this document.

---

## 71. Multi-instance target topology (**PLANNED** — conceptual)

```text
                 Reverse Proxy / Load Balancer
                         |
              ------------------------
              |          |           |
            API 1      API 2       API N
              |          |           |
              -------- shared -------
                         |
        --------------------------------------
        |                |                  |
   PostgreSQL          Redis          Object Storage
      PostGIS                              + CDN
        |
   replicas (FUTURE OPTIONAL)

Workers — separate from HTTP API
```

**Do not implement this topology now.**

---

## 72. Load testing (**PLANNED** — SCALE.11)

Measure: QPS, concurrent users, p50/p95/p99 latency, DB CPU/connections, slow queries, cache hit ratio, Redis latency, queue depth, notification throughput, media/CDN traffic, errors/timeouts.

Registered user count alone is **not** a scaling trigger.

---

## 73. Scale triggers (**PLANNED** principles)

| Constraint | Response |
|------------|----------|
| API CPU saturation | Add API replicas |
| DB read saturation | Optimize/index → read replicas if justified |
| Heavy async work | Scale workers |
| Static/media traffic | CDN |
| Search bottleneck | Dedicated search layer if PostgreSQL inadequate |

Do not deploy complex infrastructure preemptively.

---

## 74. Roadmap placement (canonical order)

**CURRENT active track:** **UXA** (backoffice UI/UX — continue **UXA.11 → UXA.13**).

Then (high level, unchanged product priority):

```text
UXA.11 → UXA.12 → UXA.13
  ↓
Consumer Web UI/UX
  ↓
Mobile UI/UX
  ↓
Production / security / pre-VPS readiness
  ↓
SCALE.0 → SCALE.12  (foundation — parallel only when explicitly approved; default: after UXA + pre-VPS gates)
  ↓
VPS / production deployment
```

**Do not start SCALE** while **UXA** is the agreed active track unless Chief Orchestrator explicitly reprioritizes.

---

## 75. Relation to closed tracks

**AOP = CLOSED** · **BIZ = CLOSED**

This document **does not reopen** those tracks or alter their contracts.

---

## 76. Protected contracts (unchanged)

No change from this documentation alone to: auth, RBAC, **BusinessMembership**, **BusinessLocation** semantics, platform feature semantics, monetization, plans, notifications, **API contracts**, DB schema, deployment/runtime config, or **UXA** implementation work in progress.

---

## 77. Document maintenance

When SCALE or production gates begin, update **`docs/changelog.md`** and **`docs/ai-project-context.md`** with **Status** and checkpoint SHAs per **`AGENTS.md`**.

Until then, treat this file as **architectural north star**, not an implementation checklist marked complete.
