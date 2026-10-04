# Operator fact sheet — production legal launch

**Stage:** 6.15L.3
**Legal baseline date:** 2026-10-03
**Status:** INCOMPLETE — **UNKNOWN — REQUIRED BEFORE PUBLICATION** where noted

Do **not** treat this file as published legal text. Values must come from official company records and counsel-approved disclosures.

| Field | Value | Status |
|-------|--------|--------|
| Operator legal name | UNKNOWN — REQUIRED BEFORE PUBLICATION | Blocker |
| BIN | UNKNOWN — REQUIRED BEFORE PUBLICATION | Blocker |
| Legal address | UNKNOWN — REQUIRED BEFORE PUBLICATION | Blocker |
| Postal address | UNKNOWN — REQUIRED BEFORE PUBLICATION | Blocker |
| Support email | UNKNOWN — REQUIRED BEFORE PUBLICATION | Blocker |
| Privacy / data protection email | UNKNOWN — REQUIRED BEFORE PUBLICATION | Blocker |
| Phone | UNKNOWN — REQUIRED BEFORE PUBLICATION (optional in some docs) | Blocker if used in published text |
| Website (canonical public URL) | UNKNOWN — REQUIRED BEFORE PUBLICATION | Blocker |
| Registration details (PD notification etc.) | UNKNOWN — LEGAL REVIEW REQUIRED whether required | Counsel |
| Bank / payment details (manual billing) | UNKNOWN — REQUIRED BEFORE PUBLICATION if shown in product/Offer | Operator + counsel |
| Hosting provider | UNKNOWN — REQUIRED BEFORE PUBLICATION | Operator |
| Primary hosting region | UNKNOWN — do not guess | Operator |
| Object storage provider / region | UNKNOWN (S3-compatible optional in `infra/env/.env.example`) | Operator |
| SMS provider | UNKNOWN — not selected in repo config | Operator |
| Push provider | Google Firebase (FCM) when configured | Config-dependent |
| OAuth providers | Google, Apple (feature-flagged off by default in env examples) | Operator confirms prod flags |
| Maps / tile provider | OpenStreetMap (in product) | Disclose; region not proven by repo |
| Payment acquirer | None integrated in repo (manual PlanPayment / Order confirmation) | N/A automated |
| Data protection contact person | UNKNOWN — REQUIRED BEFORE PUBLICATION | Operator |
| Customer support contact | UNKNOWN — REQUIRED BEFORE PUBLICATION | Operator |

## Env alignment (after facts known)

Map approved values to:

- `NEXT_PUBLIC_LEGAL_OPERATOR_NAME`
- `NEXT_PUBLIC_LEGAL_ADDRESS`
- `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL`
- `NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL`
- `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL`

See `docs/legal-review-required.md` and `docs/legal/operator-details-required.md`.
