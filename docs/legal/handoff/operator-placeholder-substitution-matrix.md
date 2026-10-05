# Operator placeholder substitution matrix

**Stage:** 6.15L.4
**Scope:** All **16** files under `docs/legal/production/candidates/` (version `2026-10-03-production-candidate-1`).
**Rule:** Replace only with **verified operator/counsel-approved** values — never invent.

| Placeholder | Current files (production candidates) | Required replacement | Source / evidence | Owner | Counsel review YES/NO | Blocks publication YES/NO | Status |
|-------------|--------------------------------------|----------------------|-------------------|-------|----------------------|---------------------------|--------|
| `[OPERATOR_LEGAL_NAME]` | `privacy-policy.ru.md`, `privacy-policy.kk.md`; `terms-of-use.ru.md`, `terms-of-use.kk.md`; `personal-data-consent.ru.md`, `personal-data-consent.kk.md`; `community-rules.ru.md`, `community-rules.kk.md`; `cookies-analytics.ru.md`, `cookies-analytics.kk.md`; `business-terms.ru.md`, `business-terms.kk.md`; `advertising-rules.ru.md`, `advertising-rules.kk.md`; `public-offer.ru.md`, `public-offer.kk.md` | Registered legal name RU/KK | Registration certificate | Operator | NO (fact) | **YES** | PENDING |
| `[BIN]` | `privacy-policy.*`; `terms-of-use.*`; `personal-data-consent.*`; `business-terms.*`; `public-offer.*` | Business Identification Number | Registration extract | Operator | NO (fact) | **YES** | PENDING |
| `[LEGAL_ADDRESS]` | `privacy-policy.*`; `terms-of-use.*`; `personal-data-consent.*`; `public-offer.*` | Legal address RU/KK | Registration extract | Operator | NO (fact) | **YES** | PENDING |
| `[POSTAL_ADDRESS]` | `privacy-policy.ru.md`, `privacy-policy.kk.md` | Postal address | Company card / operator letter | Operator | NO (fact) | **YES** | PENDING |
| `[SUPPORT_EMAIL]` | `privacy-policy.*`; `terms-of-use.*`; `community-rules.*`; `business-terms.*`; `advertising-rules.*`; `public-offer.*`; `terms-of-use.ru.md` (`[PHONE]` line context) | Monitored support mailbox | MX proof + ops SOP | Operator | NO (fact) | **YES** | PENDING |
| `[PRIVACY_EMAIL]` | `privacy-policy.*`; `personal-data-consent.*`; `business-terms.ru.md` (business PD note); `cookies-analytics.*` | PD request mailbox | MX proof | Operator | NO (fact) | **YES** | PENDING |
| `[PHONE]` | `privacy-policy.*`; `terms-of-use.ru.md`, `terms-of-use.kk.md` | Phone or remove clause | Operator choice | Operator | NO (fact) | **YES if placeholder remains** | PENDING |
| `[WEBSITE]` | `privacy-policy.*`; `terms-of-use.*`; `cookies-analytics.*`; `public-offer.*` (version URL clauses) | Canonical HTTPS base URL | DNS + env config | Operator | NO (fact) | **YES** | PENDING |
| `[REGISTRATION_DETAILS_IF_REQUIRED]` | `privacy-policy.ru.md`, `privacy-policy.kk.md` | Counsel-approved disclosure or removal | COUNSEL-011 + regulator docs | Counsel + operator | **YES** | **Conditional** | PENDING |
| Manual payment requisites (no single bracket token) | `public-offer.ru.md` §5.1, `public-offer.kk.md` (manual billing narrative) | Bank details + VAT wording | Finance + COUNSEL-004/013 | Operator + counsel | **YES** | **YES** (when published) | PENDING |
| `[REFUND_POLICY — LEGAL REVIEW REQUIRED]` | `public-offer.ru.md`, `public-offer.kk.md` | Approved refund/cancellation section RU/KK | `refund-policy-decision.md` + counsel | Counsel + operator | **YES** | **YES** | PENDING |

## Non-bracket markers (substitute via counsel-approved rewrite, not search-replace)

| Marker / topic | Files | Counsel question | Blocker ID | Status |
|----------------|-------|------------------|------------|--------|
| LEGAL REVIEW REQUIRED — lawful basis | Privacy §6 RU/KK | COUNSEL-003 (basis) | LEGAL-BLOCK-006 | PENDING |
| LEGAL REVIEW REQUIRED — cross-border | Privacy §8; PD Consent §5.2 | COUNSEL-002 | LEGAL-BLOCK-005 | PENDING |
| LEGAL REVIEW REQUIRED — retention | Privacy §9 | COUNSEL-003 | LEGAL-BLOCK-006 | PENDING |
| LEGAL REVIEW REQUIRED — minors | Privacy §11; Terms | COUNSEL-005 | LEGAL-BLOCK-007 | PENDING |
| LEGAL REVIEW REQUIRED — cookies | `cookies-analytics.*` | COUNSEL-006 | LEGAL-BLOCK-008 | PENDING |
| LEGAL REVIEW REQUIRED — complaint / appeal SLA | `community-rules.*`; `advertising-rules.*` | COUNSEL-007 | LEGAL-BLOCK-010 | PENDING |
| LEGAL REVIEW REQUIRED — disputes / governing law | `terms-of-use.*`; `public-offer.*` | COUNSEL-010 | LEGAL-BLOCK-010 | PENDING |
| LEGAL REVIEW REQUIRED — liability caps | Terms; Offer; Business Terms | COUNSEL-009 | — | PENDING |
| LEGAL REVIEW REQUIRED — UGC / IP license | Terms; Community; Advertising | COUNSEL-008 | — | PENDING |
| LEGAL REVIEW REQUIRED — ad categories | `advertising-rules.*` | COUNSEL-012 | — | PENDING |
| LEGAL REVIEW REQUIRED — separate PD consent | `personal-data-consent.*`; product flag | COUNSEL-001 | LEGAL-BLOCK-009 | PENDING |

## UI / runtime (not in 16 DB candidates but blocks consistent UX)

| Placeholder | Location | Owner | Blocks publication |
|-------------|----------|-------|-------------------|
| `[OPERATOR_LEGAL_NAME]`, `[WEBSITE]` | `docs/legal/ui-copy/*` | Operator | **YES** if PD consent published / client copy |

## Validation after substitution

- Run `validateLegalDocumentContentForPublish` (see `stage-6-15l2-legal.spec.ts`).
- Confirm RU/KK pair completeness (LEGAL-BLOCK-011).

**Inventory cross-check:** `docs/legal/production/unresolved-placeholder-inventory.md`.
