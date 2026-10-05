# Legal decision map — document section → blocker → counsel question

**Stage:** 6.15L.4
**Blocker source:** `docs/legal/production/publication-blockers.md`

---

## Operator facts (no counsel ID — operator + validation)

| Document | Section / scope | Blocker | Counsel ID | Notes |
|----------|-----------------|---------|------------|-------|
| ALL candidates | Operator header placeholders | LEGAL-BLOCK-001 | — | `[OPERATOR_LEGAL_NAME]`, `[BIN]`, addresses |
| ALL with `[WEBSITE]` | URL clauses | LEGAL-BLOCK-002 | — | Canonical public URL |
| Privacy, Terms, Offer, etc. | Support / privacy / phone | LEGAL-BLOCK-003 | — | Mailboxes must work |
| Privacy RU/KK | KK body completeness | LEGAL-BLOCK-011 | — | Pair check at publish |

---

## Counsel decisions

| Document | Section / topic | Blocker | Counsel ID |
|----------|-----------------|---------|------------|
| Public Offer RU/KK | Refunds / returns | LEGAL-BLOCK-004 | COUNSEL-004 |
| Public Offer RU/KK | Offer qualification; manual payment §5.1 | — | COUNSEL-013 |
| Public Offer RU/KK | Force majeure; changes to paid periods | LEGAL-BLOCK-010 | COUNSEL-004, COUNSEL-010 |
| Public Offer RU/KK | Disputes / pretension | LEGAL-BLOCK-010 | COUNSEL-010 |
| Privacy RU/KK | Cross-border / processors §8 | LEGAL-BLOCK-005 | COUNSEL-002 |
| Privacy RU/KK | Lawful basis §6 | LEGAL-BLOCK-006 | COUNSEL-003 |
| Privacy RU/KK | Retention §9 | LEGAL-BLOCK-006 | COUNSEL-003 |
| Privacy RU/KK | Minors §11 | LEGAL-BLOCK-007 | COUNSEL-005 |
| Privacy RU/KK | Registration / notification line | LEGAL-BLOCK-001 (conditional) | COUNSEL-011 |
| Privacy RU/KK | Data subject rights / withdrawal | — | COUNSEL-001, COUNSEL-003 |
| PD Consent RU/KK | Cross-border §5.2 | LEGAL-BLOCK-005 | COUNSEL-002 |
| PD Consent RU/KK | Separate instrument vs Terms+Privacy | LEGAL-BLOCK-009 | COUNSEL-001 |
| PD Consent RU/KK | Withdrawal consequences | — | COUNSEL-001 |
| Terms RU/KK | Minors / eligibility | LEGAL-BLOCK-007 | COUNSEL-005 |
| Terms RU/KK | UGC license | — | COUNSEL-008 |
| Terms RU/KK | Limitation of liability | — | COUNSEL-009 |
| Terms RU/KK | Governing law / disputes | LEGAL-BLOCK-010 | COUNSEL-010 |
| Community Rules RU/KK | Moderation; appeal channel | LEGAL-BLOCK-010 | COUNSEL-007 |
| Community Rules RU/KK | UGC rules | — | COUNSEL-008 |
| Advertising Rules RU/KK | Prohibited categories | — | COUNSEL-012 |
| Advertising Rules RU/KK | Payment / refund cross-ref | LEGAL-BLOCK-004 | COUNSEL-004 |
| Advertising Rules RU/KK | Moderation SLA | LEGAL-BLOCK-010 | COUNSEL-007 |
| Business Terms RU/KK | Business as PD operator | — | COUNSEL-014 |
| Business Terms RU/KK | Liability; third-party content | — | COUNSEL-009 |
| Cookies RU/KK | Consent mechanism | LEGAL-BLOCK-008 | COUNSEL-006 |
| Cookies RU/KK | `qalago_web_session` classification | LEGAL-BLOCK-008 | COUNSEL-006 |
| Privacy + Cookies | Analytics correlation | LEGAL-BLOCK-008 | COUNSEL-006 |

---

## Engineering / process (not counsel text)

| Scope | Blocker | Owner |
|-------|---------|-------|
| Empty content / wrong version | LEGAL-BLOCK-012 | Engineering |
| Publish workflow DRAFT→published | LEGAL-BLOCK-013 | Engineering + admin |
| `LEGAL_ENFORCE_CHECKOUT` before publish | LEGAL-BLOCK-014 | Operator |
| Prisma generate EPERM (Windows) | — (predeploy) | Engineering |

---

## Product flags tied to counsel outcomes

| Flag | Decision | Counsel ID |
|------|----------|------------|
| `LEGAL_REQUIRE_PERSONAL_DATA_CONSENT` | Separate PD consent mandatory? | COUNSEL-001 |
| `LEGAL_ENFORCE_CHECKOUT` | Enable after Offer+Ads published | COUNSEL-004 |
| OAuth / FCM / S3 enablement | Cross-border + DPA | COUNSEL-002 |
