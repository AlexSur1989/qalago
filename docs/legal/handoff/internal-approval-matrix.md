# Internal approval matrix

**Stage:** 6.15L.4
**Rule:** Roles only — **do not invent person names**.

Legend: **R** = required sign-off · **C** = consult · **I** = informed · **—** = not primary

---

## Document publication sign-off

| Document / decision | Operator / Founder | Legal counsel | Privacy / data responsible | Finance / Accounting | Technical lead | Security / Infrastructure | Product owner |
|---------------------|-------------------|---------------|------------------------------|----------------------|----------------|---------------------------|---------------|
| Privacy Policy RU/KK | R | R | R | I | C | C | C |
| User Agreement RU/KK | R | R | C | I | C | I | R |
| PD Consent RU/KK | R | R | R | — | C | I | C |
| Business Terms RU/KK | R | R | C | C | C | I | R |
| Public Offer RU/KK | R | R | I | **R** | C | I | R |
| Advertising Rules RU/KK | R | R | I | C | C | I | R |
| Community Rules RU/KK | R | R | I | — | C | I | R |
| Cookies / Analytics RU/KK | R | R | R | — | **R** | C | C |

---

## Cross-cutting decisions

| Decision | Operator / Founder | Legal counsel | Privacy | Finance | Technical | Security | Product |
|----------|-------------------|---------------|---------|---------|-----------|----------|---------|
| Operator facts substitution | **R** | C | C | C | I | I | I |
| Refund / cancellation policy (COUNSEL-004) | R | **R** | I | **R** | I | — | C |
| Retention periods (COUNSEL-003) | R | **R** | **R** | I | **R** | C | C |
| Cross-border / DPAs (COUNSEL-002) | R | **R** | **R** | — | **R** | **R** | C |
| Minors / age (COUNSEL-005) | R | **R** | R | — | C | — | **R** |
| Cookies / banner (COUNSEL-006) | R | **R** | R | — | **R** | C | R |
| Mandatory acceptance doc set (COUNSEL-001) | R | **R** | R | — | **R** | — | R |
| Enable `LEGAL_ENFORCE_CHECKOUT` | **R** | R | I | I | **R** | I | R |
| Enable `LEGAL_REQUIRE_PERSONAL_DATA_CONSENT` | R | **R** | **R** | — | **R** | — | R |
| Production legal publish (6.15L.5) | **R** | **R** | R | C | **R** | C | R |

---

## Evidence owners

| Evidence type | Primary owner |
|---------------|---------------|
| Registration / BIN / addresses | Operator / Founder |
| Bank requisites | Finance / Accounting |
| Hosting / DB / S3 region facts | Security / Infrastructure |
| Processor DPAs | Operator + Technical + Counsel |
| Support / privacy mailboxes | Operator + Product |

**Counsel return validation:** `docs/legal/handoff/counsel-return-template.md`
