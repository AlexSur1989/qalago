# Final versioning plan — post-counsel (stage 6.15L.5+)

**Stage:** 6.15L.4 — **process only**; no final version assigned here.

---

## Preconditions

- Counsel return received per `docs/legal/handoff/counsel-return-template.md`
- Operator facts substituted per `docs/legal/handoff/operator-placeholder-substitution-matrix.md`
- Publication blockers resolved or explicitly waived by counsel with evidence

---

## Steps (after counsel approval)

1. **Receive counsel-approved source documents** (RU/KK) — authoritative markdown or redlines applied to production candidates.
2. **Substitute operator facts** — remove all `[OPERATOR_*]`, `[BIN]`, contact, and `[WEBSITE]` placeholders; resolve or remove `[REGISTRATION_DETAILS_IF_REQUIRED]` per COUNSEL-011.
3. **RU and KK equivalence check** — same legal substance; document intentional differences.
4. **Resolve blocking LEGAL REVIEW REQUIRED markers** — refund section, cross-border, retention, minors, cookies, disputes, etc., per `legal-decision-map.md`.
5. **Assign final publication version** — e.g. `YYYY-MM-DD-v1` ( **not assigned in 6.15L.4** ).
6. **Set effective date** — counsel recommendation + operator approval.
7. **Load into `LegalDocument` as DRAFT** — seed or admin import from approved markdown.
8. **Admin preview** — SUPER_ADMIN review in Admin Web / API.
9. **RU/KK pair validation** — all required types for each locale.
10. **Publish** — `publishDocument`; validation must pass (`validateLegalDocumentContentForPublish`).
11. **Re-consent** — flag existing users where `requiresReacceptance` applies.
12. **Checkout requirements** — verify Offer + Advertising Terms published before any `LEGAL_ENFORCE_CHECKOUT` enablement.
13. **Staging QA** — `docs/legal/production/staging-qa-checklist.md`.
14. **Production enablement** — publish production DB; enable flags only per `docs/legal/production/activation-plan.md`.

---

## Out of scope until 6.15L.5

- Cookie banner implementation (if required by COUNSEL-006)
- Age gate (if required by COUNSEL-005)
- Retention purge jobs (if approved periods require automation)
- Payment gateway integration

---

## Checkpoints

- Update `docs/changelog.md` on 6.15L.5 completion with publish SHA and QA status.
- Update `docs/ai-project-context.md` when legal status changes from **READY FOR COUNSEL FINALIZATION** to staging/production readiness.
