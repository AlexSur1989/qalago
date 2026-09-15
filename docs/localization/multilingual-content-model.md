# Multilingual content model (Stage 6.10B.6)

## Ownership classes

| Class | Examples | Storage | Runtime translation |
|-------|----------|---------|---------------------|
| A. QalaGo taxonomy | City, Category, Subcategory | `nameRu` + `nameKk` | No |
| B. Business-authored | ServiceItem, Promotion | primary + optional `*Kk` | No |
| C. User-authored | Review text, replies | single field | No |
| D. System | Notifications, locked analytics copy | template/event codes (partial) | No |
| E. Legal | Terms, Privacy | `LegalDocument.locale` RU/KK rows | No auto-translate |
| F. Identifiers | slugs, enums, brand `Business.title` | unchanged | N/A |

## Fields (implemented)

| Entity | RU | KK | Legacy / primary | Required |
|--------|----|----|------------------|----------|
| City | `nameRu` | `nameKk?` | — | RU required; KK optional |
| Category | `nameRu` | `nameKk` | `title` ≈ nameRu | both required (seed) |
| Subcategory | `nameRu` | `nameKk` | — | both required |
| Business | — | — | `title`, `description` | brand name not split |
| ServiceItem | `title`, `description` | `titleKk?`, `descriptionKk?` | primary fields | one language enough |
| Promotion | `title`, `description` | `titleKk?`, `descriptionKk?` | primary fields | one language enough |
| Review | — | — | `text`, `ownerReply` | original only |

## Fallback (display only)

| Class | RU request | KK request |
|-------|------------|------------|
| Taxonomy | `nameRu` → legacy title | `nameKk` → `nameRu` |
| Business-authored | primary fields | `*Kk` → primary |
| User content | as stored | as stored |
| Legal | published RU doc | published KK if exists; else product policy |

Resolver implementations:

- Backend: `services/catalog-api/src/common/localized-content.ts`
- Shared TS: `packages/shared-types/src/localized-content.ts`
- Flutter: `apps/mobile/lib/core/locale/localized_content.dart`
- Consumer Web: `apps/consumer-web/lib/localized-content.ts`

Fallback does **not** write Russian into `*Kk` columns.

## PATCH rules

Optional `*Kk` fields: trim; empty → `null`. Updating `titleKk` does not change `title` / `titleRu`.

## Search (unchanged ranking)

- Business search: still `title`, `shortDesc`, `address` (insensitive).
- Gap: `titleKk` / taxonomy KK not in business text search yet; category KK available via API for client-side filters.

## Legal

**LEGAL CONTENT GAP — APPROVED KK VERSION REQUIRED** for official Terms/Privacy body where only RU is published today.

## No runtime translation

No AI/API translation; no mass backfill of business copy into KK fields.
