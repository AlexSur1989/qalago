# Stage 6.9 — Legal & Safety Technical Foundation

**Status:** IMPLEMENTED (technical controls). **LEGAL_REVIEW_REQUIRED** for all consumer-facing legal text and retention durations.

## Scope delivered

- Versioned `LegalDocument` + `LegalAcceptance` (RU/KK locales, DRAFT/PUBLISHED/ARCHIVED).
- Public `GET /legal/documents/:type`; authenticated legal status + acceptance.
- `DataRightsRequest` lifecycle (export, delete account, etc.) — export execution scaffolded via status workflow; no fake completed export files.
- `ContentReport` → `ModerationCase` with dedupe, rate limits, city scoping for CITY_ADMIN.
- `ModerationAction` (hide/restore business, review, promotion, media; user suspend + session revoke).
- `ModerationAppeal` (owner/user eligibility, duplicate guard).
- `GovernmentRequest` + `SecurityIncident` registers (**SUPER_ADMIN** only).
- Account deletion: session revoke, avatar clear, tombstones, sole-owner block code `BUSINESS_OWNERSHIP_REQUIRES_RESOLUTION`.
- Feature flags (default OFF): `legalCenterEnabled`, `reportingEnabled`, `dataRightsEnabled`.

## Not in this stage

- Real legal approval, store submission, VPS/production deploy.
- Google/Apple flag enablement or provider credentials.
- Full data export ZIP generation (service boundary + request states only unless extended).

See also: [moderation-system.md](../safety/moderation-system.md), [data-inventory.md](./data-inventory.md), [kazakhstan-legal-review-checklist.md](./kazakhstan-legal-review-checklist.md).
