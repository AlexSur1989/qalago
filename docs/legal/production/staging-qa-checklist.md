# Staging legal QA checklist

**Stage:** 6.15L.3
**When:** After documents **PUBLISHED** in staging DB; run with enforcement flag per test section.

## Public pages (RU / KK)

- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/community`
- [ ] `/personal-data-consent`
- [ ] `/cookies`
- [ ] `/business-terms`
- [ ] `/offer`
- [ ] `/advertising-rules`
- [ ] Locale switch preserves correct pack body
- [ ] No placeholder strings visible in HTML

## Platform acceptance gate

- [ ] Mobile RU — Terms + Privacy pending → `/legal/accept`
- [ ] Mobile KK — same
- [ ] Business Web RU/KK — `/legal/accept`
- [ ] Re-consent after version bump
- [ ] Staff roles skip gate (expected)

## Contextual acceptance

- [ ] Business application — Business Terms (when published)
- [ ] Plan purchase — Public Offer
- [ ] Ad order — Offer + Advertising Terms
- [ ] Partial acceptance (Offer ok, Ad Terms missing) — only missing doc prompted
- [ ] Already accepted current version — no duplicate checkbox

## Failure cases

- [ ] Outdated acceptance version → localized stale message; no duplicate PlanPayment/Order
- [ ] Unpublished required doc + enforcement on → block with localized error
- [ ] Missing locale published doc → block publish (admin) / runtime error (enforcement)
- [ ] Publish attempt with placeholder → admin rejected
- [ ] Enforcement **off** — product flows work; backend may not block checkout (document behavior)
- [ ] Enforcement **on** — checkout blocked without acceptance

## Business flows (staging)

- [ ] Onboarding apply submit
- [ ] Plan purchase → single pending PlanPayment
- [ ] Ad purchase → single Order
- [ ] LegalAcceptance rows: correct **source** (`CHECKOUT`, `BUSINESS_APPLICATION`, `LOGIN`)

## Regression

- [ ] PlanPayment amount/duration unchanged
- [ ] Order/Payment semantics unchanged
- [ ] No duplicate acceptance rows for same doc version
