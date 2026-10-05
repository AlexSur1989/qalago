# Counsel question register

**Stage:** 6.15L.4
**Legal baseline date:** 2026-10-03
**Rule:** This register **does not answer** questions — it routes them to counsel with product/context pointers.

---

## COUNSEL-001 — Separate personal data consent instrument

**Question:** Should QalaGo require a **standalone explicit Personal Data Consent** acceptance in addition to Terms + Privacy?

| Aspect | Current state |
|--------|----------------|
| Implementation capability | `LegalDocumentType.PERSONAL_DATA_CONSENT`; Consumer Web `/personal-data-consent`; seed from pack |
| Flag behavior | `LEGAL_REQUIRE_PERSONAL_DATA_CONSENT` — **off by default**; when `true`, guard adds PD consent to mandatory platform set |
| Affected docs | `personal-data-consent.ru.md`, `personal-data-consent.kk.md`; Privacy cross-refs |
| Affected acceptance flow | LOGIN guard; optional re-consent on publish |
| Decision options | (A) Terms+Privacy only; (B) separate PD consent mandatory; (C) mandatory only for specific processing |
| Consequences | UI copy, re-consent scope, store listing disclosures |
| Blocker | LEGAL-BLOCK-009 (conditional) |

---

## COUNSEL-002 — Cross-border processing

**Question:** For **Google / Apple / Firebase / OpenStreetMap / hosting / S3** (and any production SMS vendor), what **transfer basis**, consent, and disclosure text is required under KZ law? What **contracts / DPA** are needed?

| Aspect | Current state |
|--------|----------------|
| Implementation | OAuth flags off in env examples; FCM config-dependent; OSM maps in app; hosting/S3 operator-selected |
| Affected docs | Privacy §8 RU/KK; PD Consent §5.2; Cookies |
| Processor register | `docs/legal/internal/processor-register.md` |
| Decision options | Standard contractual clauses; consent; localization; limit processors |
| Consequences | Privacy wording; enablement gates for OAuth/FCM/S3 |
| Blocker | LEGAL-BLOCK-005 |

---

## COUNSEL-003 — Personal data retention

**Question:** Approve **retention periods** and deletion/anonymization rules for:

- User accounts
- AuthIdentity (incl. tombstone)
- Content reports / moderation cases
- Analytics events
- PlanPayment / Order / Payment
- Audit logs
- Security incidents
- Data rights requests
- LegalAcceptance records
- Push devices / web session
- Uploads / business media
- Server logs / IP (hosting)

| Aspect | Current state |
|--------|----------------|
| Matrix | `docs/legal/internal/data-retention-deletion-matrix.md` |
| Implementation | No scheduled purge jobs; OTP ~5 min TTL |
| Affected docs | Privacy §9 RU/KK |
| Sheet | `docs/legal/handoff/retention-approval-sheet.md` |
| Blocker | LEGAL-BLOCK-006 |

---

## COUNSEL-004 — Refund and cancellation policy

**Question:** Provide **approved RU/KK wording** for refunds/cancellations covering:

- Paid business plans
- Advertising orders
- Rejected ad creatives
- Cancelled campaigns
- Partially served campaigns
- Duplicate payment
- Service outage
- Manual payment / non-activation scenarios

| Aspect | Current state |
|--------|----------------|
| Product facts | `docs/legal/production/refund-policy-decision.md` — manual PlanPayment/Order; no refund engine |
| Placeholder | `[REFUND_POLICY — LEGAL REVIEW REQUIRED]` in Public Offer RU/KK |
| Affected docs | `public-offer.*`; cross-ref `advertising-rules.*`, `business-terms.*` |
| Checkout | `LEGAL_ENFORCE_CHECKOUT` env-gated |
| Blocker | LEGAL-BLOCK-004 |

---

## COUNSEL-005 — Minors

**Question:** Define **minimum age**, need for **age declaration**, **parental consent**, **advertising restrictions**, and **personal data restrictions** for minors.

| Aspect | Current state |
|--------|----------------|
| Product facts | No birthdate, no age gate (`minors-policy-decision.md`) |
| Affected docs | Privacy §11; Terms RU/KK |
| Blocker | LEGAL-BLOCK-007 |

---

## COUNSEL-006 — Cookies and first-party analytics

**Question:** Does current **`qalago_web_session`** / first-party ads analytics require a **banner**, **explicit consent**, **opt-out**, or **preferences center**?

| Aspect | Current state |
|--------|----------------|
| Product facts | No CMP; `/cookies` page exists (`cookie-consent-decision.md`) |
| Affected docs | `cookies-analytics.*`; Privacy cookies section |
| Blocker | LEGAL-BLOCK-008 (if banner required) |

---

## COUNSEL-007 — Complaint handling

**Question:** What **legally required acknowledgement**, **response deadline/SLA**, and **appeal/review** requirements apply to content reports, ad disputes, PD requests, and moderation appeals?

| Aspect | Current state |
|--------|----------------|
| Product facts | `complaint-handling-readiness.md` — no SLA timers; appeal self-service partial |
| Affected docs | Community Rules; Advertising Rules; Privacy (data rights) |
| Blocker | LEGAL-BLOCK-010 |

---

## COUNSEL-008 — UGC and IP license

**Question:** Final wording for **user content license**, **business-uploaded media**, **reviews**, and **advertiser creatives** (scope, duration, sublicensing, takedown).

| Aspect | Current state |
|--------|----------------|
| Affected docs | Terms RU/KK; Community Rules; Advertising Rules; Business Terms |
| Implementation | Moderation/report flows exist; no separate IP registry in repo |

---

## COUNSEL-009 — Limitation of liability

**Question:** KZ-law compliant wording for limits/exclusions regarding **service interruption**, **third-party services**, **business/user content**, and **advertising performance**.

| Aspect | Current state |
|--------|----------------|
| Affected docs | Terms; Public Offer; Business Terms; Advertising Rules |

---

## COUNSEL-010 — Jurisdiction and disputes

**Question:** Final **governing law**, **pre-trial complaint process**, and **court/jurisdiction** language.

| Aspect | Current state |
|--------|----------------|
| Affected docs | Terms § disputes; Public Offer RU/KK (pretension to `[SUPPORT_EMAIL]`) |
| Markers | LEGAL REVIEW REQUIRED in Terms and Offer |

---

## COUNSEL-011 — PD operator notification / registration

**Question:** Must the QalaGo operator **notify the regulator**, **register processing**, **file forms**, or **appoint a responsible person** under KZ PD law?

| Aspect | Current state |
|--------|----------------|
| Placeholder | `[REGISTRATION_DETAILS_IF_REQUIRED]` in Privacy RU/KK |
| Internal | `docs/legal/internal/*` PD policy drafts |

---

## COUNSEL-012 — Advertising restrictions

**Question:** Final **prohibited/restricted categories** and **documentary requirements** for business advertisers under KZ law.

| Aspect | Current state |
|--------|----------------|
| Affected docs | `advertising-rules.ru.md`, `advertising-rules.kk.md` |
| Product | VIP/creative moderation; manual payment |

---

## COUNSEL-013 — Public offer qualification and manual billing clause

**Question:** Confirm whether the published document qualifies as a **public offer** under RK civil law; approve **acceptance mechanics**, **manual bank transfer requisites**, and **VAT/price** disclosures in Offer §1.1 and §5.1.

| Aspect | Current state |
|--------|----------------|
| Affected docs | `public-offer.ru.md`, `public-offer.kk.md` |
| Product | No payment gateway in repo |

---

## COUNSEL-014 — Business as PD controller for end-customer data

**Question:** When a business uses QalaGo to reach consumers, who is **PD operator/controller** for which categories? What must **Business Terms** require of businesses?

| Aspect | Current state |
|--------|----------------|
| Affected docs | `business-terms.ru.md` (LEGAL REVIEW REQUIRED note on business PD) |
| Blocker | Cross-ref Privacy processor section |

---

**Total registered questions:** 14 (COUNSEL-001 … COUNSEL-014)

**Map to blockers:** `docs/legal/handoff/legal-decision-map.md`
