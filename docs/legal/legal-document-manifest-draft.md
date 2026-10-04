# Legal document manifest (draft)

**Version pack:** 2026-10-03-draft-1  
**Status:** DRAFT — not wired to Prisma seed in 6.15L.1

| type (enum if exists) | slug/route (proposed) | RU file | KK file | version | mandatory | audience | acceptance source | persistence | reaccept on version | publication |
|----------------------|------------------------|---------|---------|---------|-----------|----------|-------------------|-------------|---------------------|-------------|
| PRIVACY_POLICY | `/privacy` | `docs/legal/public/privacy-policy.ru.md` | `docs/legal/public/privacy-policy.kk.md` | 2026-10-03-draft-1 | YES | Public | LOGIN / RECONSENT | YES | YES if requiresReacceptance | DRAFT |
| TERMS_OF_SERVICE | `/terms` | `docs/legal/public/terms-of-use.ru.md` | `docs/legal/public/terms-of-use.kk.md` | 2026-10-03-draft-1 | YES | Public | LOGIN / RECONSENT | YES | YES | DRAFT |
| COMMUNITY_GUIDELINES | `/community` | `docs/legal/public/community-rules.ru.md` | `docs/legal/public/community-rules.kk.md` | 2026-10-03-draft-1 | NO (recommended ack) | Public | PROFILE optional | OPTIONAL | YES | DRAFT |
| — **SCHEMA DECISION REQUIRED** | `/consent` | `docs/legal/public/personal-data-consent.ru.md` | `docs/legal/public/personal-data-consent.kk.md` | 2026-10-03-draft-1 | LEGAL REVIEW | Public | SIGN_UP / LOGIN | YES if counsel | YES | DRAFT |
| BUSINESS_TERMS | `/business-terms` | `docs/legal/business/business-terms.ru.md` | `docs/legal/business/business-terms.kk.md` | 2026-10-03-draft-1 | YES for business cabinet | Business | BUSINESS_APPLICATION / LOGIN | YES (target) | YES | DRAFT |
| ADVERTISING_TERMS | `/advertising-rules` | `docs/legal/business/advertising-rules.ru.md` | `docs/legal/business/advertising-rules.kk.md` | 2026-10-03-draft-1 | YES before ad purchase | Business | CHECKOUT | YES (target) | YES | DRAFT |
| — **SCHEMA DECISION REQUIRED** | `/offer` | `docs/legal/business/public-offer.ru.md` | `docs/legal/business/public-offer.kk.md` | 2026-10-03-draft-1 | YES before paid plan/ad | Business | CHECKOUT | YES (target) | YES | DRAFT |
| — **SCHEMA DECISION REQUIRED** | `/cookies` | `docs/legal/public/cookies-analytics.ru.md` | `docs/legal/public/cookies-analytics.kk.md` | 2026-10-03-draft-1 | LEGAL REVIEW | Public | BANNER TBD | TBD | YES | DRAFT |
| — N/A | `/account-deletion` | (existing F.7 page — not in this pack body) | — | — | NO | Public | — | — | — | Existing draft |

**Notes:**

- Existing Prisma `LegalDocumentType` has no `PUBLIC_OFFER`, `PERSONAL_DATA_CONSENT`, `COOKIE_POLICY` — mark **SCHEMA DECISION REQUIRED** for 6.15L.2+.
- Current mandatory acceptance in code: **TERMS_OF_SERVICE + PRIVACY_POLICY** only.
- Consumer Web canonical paths today: `/privacy`, `/terms` only.
