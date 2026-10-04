# Unresolved legal placeholder inventory

**Stage:** 6.15L.3 — consolidated from `docs/legal/**` (baseline 2026-10-03-draft-1)
**Rule:** Nothing below is filled from assumptions. Publication blocked until resolved where indicated.

## Canonical operator placeholders

| Placeholder | Category | Owner | Blocks publication |
|-------------|----------|-------|-------------------|
| `[OPERATOR_LEGAL_NAME]` | A — factual company detail | Operator | YES — all public docs |
| `[BIN]` | A | Operator | YES |
| `[LEGAL_ADDRESS]` | A | Operator | YES |
| `[POSTAL_ADDRESS]` | A | Operator | YES (Privacy) |
| `[SUPPORT_EMAIL]` | A | Operator | YES |
| `[PRIVACY_EMAIL]` | A | Operator | YES |
| `[PHONE]` | A (optional field) | Operator | YES if left in published body |
| `[WEBSITE]` | B — technical / canonical URL | Operator | YES |
| `[REGISTRATION_DETAILS_IF_REQUIRED]` | C — legal decision + fact | Counsel + operator | YES if counsel requires disclosure |

**Category key:** A factual company · B technical fact · C legal decision · D commercial policy · E external processor fact

## Commercial / policy placeholders

| Placeholder / marker | File(s) | Section | Category | Owner | Blocks publication |
|---------------------|---------|---------|----------|-------|-------------------|
| `[REFUND_POLICY — LEGAL REVIEW REQUIRED]` | `business/public-offer.ru.md`, `.kk.md` | Returns / refunds | D | Counsel + operator | YES — Public Offer |
| Refund consequences (ad rejection) | `business/advertising-rules.*.md` | Payment / moderation | D | Counsel | YES (cross-ref Offer) |

## Representative LEGAL REVIEW REQUIRED markers (non-exhaustive)

These are **decisions**, not bracket placeholders; counsel must resolve before calling documents production-effective.

| Topic | Example locations | Category | Owner | Blocks publication |
|-------|-------------------|----------|-------|-------------------|
| Lawful basis per data category | Privacy RU/KK §6 | C | Counsel | YES (Privacy) |
| Cross-border transfer mechanism | Privacy §8; PD Consent §5.2 | C + E | Counsel | YES |
| Retention durations (statutory/target) | Privacy §9; retention matrix | C | Counsel | YES |
| Minors / minimum age | Privacy §11; Terms | C | Counsel | YES |
| Cookie banner requirement | `cookies-analytics.*.md` | C | Counsel | YES (Cookies + Privacy ref) |
| PD consent as separate instrument | `personal-data-consent.*.md`, UI copy | C | Counsel | Conditional |
| Moderation / complaint SLA | Community, Advertising Rules | D | Operator + counsel | YES for consumer-facing SLA claims |
| DPO appointment | Internal PD policy | C | Operator | Internal + may affect Privacy |
| IP/UA on LegalAcceptance | PD Consent draft | C | Counsel | If claimed in published text |

## UI copy placeholders (not DB-published until substituted)

| Placeholder | File | Category | Owner | Blocks publication |
|-------------|------|----------|-------|-------------------|
| `[WEBSITE]` in link templates | `ui-copy/legal-acceptance-copy.md`, `personal-data-consent.md` | B | Operator | YES (client substitution at runtime) |
| `[OPERATOR_LEGAL_NAME]` | `ui-copy/personal-data-consent.md` | A | Operator | YES if PD consent published |

## Technical publication validation (6.15L.2)

`validateLegalDocumentContentForPublish` rejects content containing operator placeholders and `[REFUND_POLICY…]` patterns. **DRAFT** seed remains non-publishable until placeholders removed.

## Per-file operator placeholder presence (public + business pack)

All files under `docs/legal/public/*.md` and `docs/legal/business/*.md` include at least `[OPERATOR_LEGAL_NAME]` and/or `[WEBSITE]` and/or contact placeholders in header or operator sections. **No file in the draft pack is publication-ready without operator fact sheet completion.**

Production candidate copies retain all unresolved markers: `docs/legal/production/candidates/`.
