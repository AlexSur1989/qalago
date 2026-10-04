# Production legal activation plan (manual sequence)

**Stage:** 6.15L.3 — **no env flags changed in this stage**

1. Complete `docs/legal/production/operator-fact-sheet.md` from official records.
2. Counsel approves **RU** texts (production candidates or successor version).
3. Counsel approves **KK** texts (full body, not headers only).
4. Resolve **refund policy** (`refund-policy-decision.md`).
5. Finalize **processor register** and Privacy cross-border disclosures.
6. Resolve **minors policy** (`minors-policy-decision.md`).
7. Resolve **cookie consent** decision (`cookie-consent-decision.md`).
8. Resolve **complaint/support/SLA** (`complaint-handling-readiness.md`).
9. Assign final **version identifier** (e.g. `2026-XX-XX-published-1`) per document pair.
10. Load content into `LegalDocument` rows as **DRAFT** (seed or admin import).
11. **Admin publish** each RU + KK pair (`SUPER_ADMIN`); validation must pass (no placeholders).
12. Verify **GET /legal/current** and **GET /legal/required** for each context.
13. Verify **re-consent** (`requiresReacceptance`, version bump behavior).
14. **Deliberately enable** `LEGAL_ENFORCE_CHECKOUT=true` in staging, then production when ready.
15. Enable `LEGAL_REQUIRE_PERSONAL_DATA_CONSENT=true` **only** if counsel approved separate PD consent.
16. Run **staging physical QA** (`staging-qa-checklist.md`).
17. Production rollout with monitoring.
18. Post-rollout audit (acceptance logs, blocked checkouts, unpublished doc errors).

**Do not** skip publish validation or enable enforcement with DRAFT-only DB content.
