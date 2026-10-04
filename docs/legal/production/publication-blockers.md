# Legal publication blockers

**Stage:** 6.15L.3
**Validation:** `validateLegalDocumentContentForPublish`, admin `publishDocument` (SUPER_ADMIN)

| Blocker ID | Document / scope | Reason | Owner | Resolution evidence | Blocks publication |
|------------|------------------|--------|-------|---------------------|-------------------|
| LEGAL-BLOCK-001 | ALL public + business | Operator identity placeholders (`[OPERATOR_*]`, `[BIN]`, addresses) | Operator | Official registration records + substituted RU/KK text | YES |
| LEGAL-BLOCK-002 | ALL public | `[WEBSITE]` not replaced with canonical URL | Operator | DNS/live site + env `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` | YES |
| LEGAL-BLOCK-003 | Privacy, Terms, Offer | Support/privacy contacts `[SUPPORT_EMAIL]`, `[PRIVACY_EMAIL]`, `[PHONE]` | Operator | Working mailboxes | YES |
| LEGAL-BLOCK-004 | Public Offer RU/KK | `[REFUND_POLICY — LEGAL REVIEW REQUIRED]` | Counsel + operator | Approved refund section | YES |
| LEGAL-BLOCK-005 | Privacy RU/KK | Cross-border / processor disclosures incomplete vs fact sheet | Counsel + operator | Updated processor register + Privacy §8 | YES |
| LEGAL-BLOCK-006 | Privacy RU/KK | Retention statements vs implementation | Counsel | Approved retention matrix | YES |
| LEGAL-BLOCK-007 | Privacy / Terms | Minors policy unresolved | Counsel | Approved minors clause or age gate decision | YES |
| LEGAL-BLOCK-008 | Cookies + Privacy | Cookie consent mechanism undecided | Counsel | Banner decision documented | YES if banner required |
| LEGAL-BLOCK-009 | PD Consent (optional doc) | Whether separate consent instrument required | Counsel | Decision record | Conditional |
| LEGAL-BLOCK-010 | Community / Ads | SLA and complaint timelines in text | Counsel + operator | Ops capacity + approved wording | YES if SLA claimed |
| LEGAL-BLOCK-011 | KK locale | Missing KK body for any required type | Operator + translator | Pair completeness check | YES |
| LEGAL-BLOCK-012 | Any | Empty content / wrong version | Engineering | Seed + admin review | YES |
| LEGAL-BLOCK-013 | Any | Publish while status not DRAFT→workflow error | Engineering | Admin process | YES |
| LEGAL-BLOCK-014 | Production env | `LEGAL_ENFORCE_CHECKOUT` enabled before docs published | Operator | Staging QA + publish checklist | Operational (not DB publish) |

## Non-blockers for technical DRAFT seed

- Draft pack in DB as **DRAFT** — intentional.
- Acceptance UX with unpublished docs — enforcement env-gated off by default.
