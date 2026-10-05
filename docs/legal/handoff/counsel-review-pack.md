# Counsel review pack — cover memo

**Stage:** 6.15L.4
**To:** External legal counsel (Kazakhstan)
**From:** QalaGo operator / product team
**Legal baseline date:** 2026-10-03
**Document set version:** `2026-10-03-production-candidate-1` (**NOT PUBLISHED**)

---

## 1. Project description

QalaGo is a **city marketplace and local business guide** (MVP: Uralsk, Kazakhstan). Surfaces: **Consumer Web**, **Mobile app**, **Business Web** (owners), **Admin Web**. Backend: **catalog-api** (PostgreSQL, REST `/api/v1/`). Monetization: **manual** business plan payments and **advertising orders** (no integrated card acquirer in current codebase).

Legal infrastructure (stage **6.15L.2**) supports versioned `LegalDocument` rows, locale-aware acceptance, contextual checkout/business-application acceptance, and Consumer Web rendering of RU/KK markdown packs.

---

## 2. Legal baseline date

**2026-10-03** — draft pack and compliance scaffold. Production candidates copy draft bodies with **placeholders retained**.

---

## 3. Current architecture summary

| Layer | Summary |
|-------|---------|
| Content source | `docs/legal/**` markdown; production candidates in `docs/legal/production/candidates/` |
| Publication | Admin publish API; **blocks** operator placeholders and refund placeholder |
| Acceptance | `LegalAcceptanceGuard`; checkout gate via `LEGAL_ENFORCE_CHECKOUT` (**default off**) |
| Locales | RU + KK (`qalago_locale` / `LegalLocale`) |
| Compliance contract | `docs/architecture/kazakhstan-compliance-contract.md` |

Full technical detail: `docs/legal/6.15L-legal-implementation.md`.

---

## 4. Document inventory (production candidates — 16 files)

| Type | RU | KK |
|------|----|----|
| Privacy Policy | `privacy-policy.ru.md` | `privacy-policy.kk.md` |
| User Agreement (Terms) | `terms-of-use.ru.md` | `terms-of-use.kk.md` |
| PD Consent | `personal-data-consent.ru.md` | `personal-data-consent.kk.md` |
| Business Terms | `business-terms.ru.md` | `business-terms.kk.md` |
| Public Offer | `public-offer.ru.md` | `public-offer.kk.md` |
| Advertising Rules | `advertising-rules.ru.md` | `advertising-rules.kk.md` |
| Community Rules | `community-rules.ru.md` | `community-rules.kk.md` |
| Cookies / Analytics | `cookies-analytics.ru.md` | `cookies-analytics.kk.md` |

Status: **PRODUCTION CANDIDATE — NOT PUBLISHED — LEGAL REVIEW REQUIRED**.

---

## 5. Technical acceptance / versioning summary

- Draft seed only; publish requires SUPER_ADMIN workflow.
- Re-consent when new published version + `requiresReacceptance` (model support from 6.15L.2).
- Optional PD consent flag: `LEGAL_REQUIRE_PERSONAL_DATA_CONSENT`.
- Checkout enforcement: `LEGAL_ENFORCE_CHECKOUT` — **must remain off** until counsel + operator approve published pairs.

---

## 6. Monetization summary (factual)

- **PlanPayment:** PENDING → manual operator confirmation; tier upgrade/renewal paths; downgrade restricted.
- **Advertising Order:** checkout after contextual legal acceptance (when docs published/enforced); creative moderation may delay start.
- **Refunds:** not automated — wording required (COUNSEL-004).

See `docs/legal/production/refund-policy-decision.md`.

---

## 7. Data-processing summary

- Inventory: `docs/privacy-data-inventory.md`, `docs/legal/data-inventory.md`
- Retention matrix: `docs/legal/internal/data-retention-deletion-matrix.md`
- No automated retention purge jobs in product.

---

## 8. Third-party processors

Factual register (no legal conclusions): `docs/legal/internal/processor-register.md`.
Evidence checklist: `docs/legal/handoff/processor-evidence-request.md`.

---

## 9. Existing publication blockers

`docs/legal/production/publication-blockers.md` — **LEGAL-BLOCK-001 … LEGAL-BLOCK-014**.

Key themes: operator placeholders, refund placeholder, cross-border, retention, minors, cookies, optional PD consent, KK parity, staging enforcement discipline.

---

## 10. Questions requiring counsel

Full register: **`docs/legal/handoff/counsel-question-register.md`** (COUNSEL-001 … COUNSEL-014).

Supporting decision records:

- `docs/legal/production/refund-policy-decision.md`
- `docs/legal/production/minors-policy-decision.md`
- `docs/legal/production/cookie-consent-decision.md`
- `docs/legal/production/complaint-handling-readiness.md`
- `docs/legal/production/retention-decisions-required.md`

---

## 11. Expected counsel deliverables

Counsel should return (see `docs/legal/handoff/counsel-return-template.md`):

1. **Approved RU text** for each public/business document (or redline against candidates).
2. **Approved KK text** (equivalent substance; flag any intentional divergence).
3. **Operator details confirmed** (or confirm placeholders list for operator to fill).
4. **Refund policy** approved section for Public Offer RU/KK.
5. **Retention periods** approved (matrix in `retention-approval-sheet.md`).
6. **Cross-border position** approved (Privacy + processor actions).
7. **Minors position** approved.
8. **Cookie / analytics position** approved.
9. **Complaint SLA / appeal** wording approved.
10. **IP / UGC** wording approved.
11. **Dispute / jurisdiction** wording approved.
12. **Final list of mandatory acceptance documents** (platform, business, checkout).
13. **Final list of required processor / DPA actions** before enabling OAuth, FCM, S3, SMS, etc.

---

## Handoff attachments index

See **`docs/legal/handoff/counsel-handoff-manifest.md`** for the exact file list to transmit (ZIP optional — not created in 6.15L.4).

**Operator questionnaire:** `docs/legal/handoff/operator-information-request.md`

**Do not publish** or enable production legal enforcement flags until stage **6.15L.5** after counsel return and operator substitution.
