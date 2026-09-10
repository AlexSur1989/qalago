# Stage 6.6B — Analytics entitlements & backend security

Backend is the **only authoritative** source for analytics read access. Clients must not rely on UI hiding.

## A. Plan matrix (internal tier)

| Capability | FREE | BASIC (Бизнес) | PREMIUM (PRO) | VIP |
|------------|------|----------------|---------------|-----|
| maxDays | 30 | 30 | 90 | 365 |
| views / viewTrend | ✓ | ✓ | ✓ | ✓ |
| actions / actionTrend | — | ✓ | ✓ | ✓ |
| impressions | — | ✓ | ✓ | ✓ |
| periodComparison | — | ✓ | ✓ | ✓ |
| promotion summary | — | ✓ | ✓ | ✓ |
| promotion breakdown | — | — | ✓ | ✓ |
| website/Instagram in actions breakdown | — | ✓ | ✓ | ✓ |
| ctr | — | — | ✓ | ✓ |
| conversion | — | — | ✓ | ✓ |
| trafficSources | — | — | ✓ | ✓ |
| searchQueries | — | — | ✓ | ✓ |
| reportExport (plan) | — | — | ✓ | ✓ |
| popularTimes | — | — | — | ✓ |
| audience (NEW/RETURNING) | — | — | — | ✓ |
| catalogAnalytics | — | — | — | ✓ |
| audienceGeography | — | — | — | ✓ |
| visitorMetrics (overview UV/session) | — | — | — | ✓ |
| benchmark / recommendations | — | — | — | ✓ |

## B. analyticsTier mapping

| Tier | analyticsTier label |
|------|---------------------|
| FREE | BASIC |
| BASIC | EXTENDED |
| PREMIUM | FULL |
| VIP | ANALYTICS_360 |

## C. maxAnalyticsDays

Enforced via `clampAnalyticsDays()` on **summary**, **trends**, **dashboard**, and **export** (through dashboard build). Requesting `days=365` on FREE returns **30** days of data in `effectiveRange.days`.

## D. Overview field gating

| Field | FREE | BASIC | PRO | VIP |
|-------|------|-------|-----|-----|
| views | ✓ | ✓ | ✓ | ✓ |
| actions / totalCustomerActions | omitted | ✓ | ✓ | ✓ |
| impressions | omitted | ✓ | ✓ | ✓ |
| ctr | omitted | omitted | ✓ | ✓ |
| conversionRate | omitted | omitted | ✓ | ✓ |
| uniqueVisitors* / sessions* | omitted | omitted | omitted | ✓ |

Unauthorized fields are **omitted** (undefined in JSON), not zero-filled secrets.

## E. Section gating

Unauthorized sections return **`null`** (stable keys). No populated data for locked sections.

## F. Export rules

- **Plan:** `reportExport` on PREMIUM and VIP only.
- **Permission:** `ANALYTICS_EXPORT` required (implies `ANALYTICS_VIEW` at grant time).
- CSV content follows the same capabilities as dashboard (PRO CSV excludes VIP-only blocks).

## G. Membership permissions

| Endpoint | Permission |
|----------|------------|
| summary / trends / dashboard | `ANALYTICS_VIEW` |
| export | `ANALYTICS_EXPORT` (+ plan `reportExport`) |

Managers without permissions receive **403**.

## H. Admin behavior

`ADMIN` / `CITY_ADMIN` / `SUPER_ADMIN` receive all **membership** permissions when accessing a business, but **dashboard metrics remain filtered by the business subscription plan** (`effectiveTier` from `getBusinessPlanContext`). Platform admins do not bypass plan entitlements on analytics payloads.

## I. Downgrade / upgrade

Analytics events and rollups are **not deleted** on downgrade. Read access changes immediately with `effectiveTier`. Upgrade restores visibility within stored/rollup retention.

## J. Privacy invariants

Entitlements do not bypass search query ≥3, geography ≥10, benchmark cohort ≥5, or PII prohibitions.

## K. API null / locked semantics

- `capabilities` — public flags for client UX.
- `lockedSections` — upgrade hints; must align with null/omitted data.
- Never return locked metric values in another field.

## L. FREE decision (Stage 6.6B)

**Preserved Stage 6.4 / product: FREE = views + view trend only.**  
Spec bullets listing call/WhatsApp on FREE were **not** applied because authoritative catalog copy is «Базовая статистика» with actions locked until BASIC (Бизнес).

## M. Deferred UI

Flutter / Business Web upgrade prompts and PRO export button enablement → **Stage 6.6C**.
