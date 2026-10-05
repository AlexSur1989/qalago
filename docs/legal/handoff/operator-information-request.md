# Operator information request — QalaGo legal publication

**Stage:** 6.15L.4
**Legal baseline date:** 2026-10-03
**Status:** INCOMPLETE — do **not** substitute invented values into production candidates.

This questionnaire collects **exact operator facts** required to replace placeholders in RU/KK production candidates and to complete processor/hosting disclosures. Each field lists **why it is needed**, **which documents use it**, **whether it blocks publication**, and **evidence** the operator should provide.

---

## A. Corporate identity

| Field | Why needed | Documents using it | Blocks publication | Evidence requested |
|-------|------------|-------------------|--------------------|--------------------|
| Full legal name (RU) | Operator identification in all public/business legal text | All 16 production candidates; Privacy §1; Terms header; Offer party | **YES** | Certificate of registration / state registry extract; counsel-confirmed spelling |
| Full legal name (KK) | KK locale parity | Same (KK files) | **YES** | Official KK translation or registered name in KK if applicable |
| BIN (БСН / БИН) | Tax/registration identifier | Privacy RU/KK; Terms; PD Consent; Business Terms; Public Offer | **YES** | Registration certificate showing BIN |
| Legal form (ТОО, ИП, etc.) | Offer/Business Terms party description | Public Offer; Business Terms; internal contracts | **YES** (if stated in published text) | Registration extract |
| Registration details (if applicable) | PD operator notification / registry per counsel | Privacy `[REGISTRATION_DETAILS_IF_REQUIRED]` | **Conditional** (COUNSEL-011) | Regulator correspondence; counsel confirmation |
| Legal address (RU/KK) | Mandatory operator address | Privacy; Terms; PD Consent; Public Offer | **YES** | Registration certificate; lease if different from registered |
| Postal address | Correspondence for PD requests | Privacy RU/KK | **YES** | Official company card or operator letter |

---

## B. Public contacts

| Field | Why needed | Documents using it | Blocks publication | Evidence requested |
|-------|------------|-------------------|--------------------|--------------------|
| Support email | User/business support and complaints | Terms; Community; Advertising Rules; Offer; Privacy (secondary) | **YES** | Mailbox created; screenshot of DNS/MX or provider admin |
| Privacy / data rights email | PD subject requests | Privacy; PD Consent; Business Terms (business PD note) | **YES** | Dedicated mailbox; escalation process doc |
| Legal correspondence email | Pre-trial / legal notices (if separate) | Public Offer disputes section (after counsel) | **Conditional** | Operator decision + counsel |
| Support phone | Optional published contact | Terms RU (`[PHONE]`) | **YES if left in body** | Operator confirms number and hours |
| Public website (canonical URL) | Links and “published at” clauses | All docs with `[WEBSITE]`; UI legal links | **YES** | Live URL; align with `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` |

---

## C. Payment / commercial details

| Field | Why needed | Documents using it | Blocks publication | Evidence requested |
|-------|------------|-------------------|--------------------|--------------------|
| Bank / payment details for manual billing | Offer §5.1 references manual transfer | Public Offer RU/KK (after counsel fills requisites) | **YES** (when manual billing shown) | Bank requisites on company letterhead; finance approval |
| Beneficiary name | Must match legal entity on invoices | Public Offer; finance ops | **YES** | Bank contract / account opening docs |
| Invoice / payment contact | Business billing support | Business Terms; Offer | **Recommended** | Internal routing (email/role) |
| Tax / VAT status | Price and refund wording | Public Offer; Business Terms | **Counsel + finance** | Tax registration; counsel clause |
| Receipt / invoice process | Post-payment documentation | Offer; operator SOP | **Operational** | Finance SOP (not necessarily in public doc) |

**Note:** Product uses **manual** PlanPayment / Order confirmation (no acquirer in repo). Refund policy text is **not** operator fact alone — see COUNSEL-004.

---

## D. Infrastructure facts

| Field | Why needed | Documents using it | Blocks publication | Evidence requested |
|-------|------------|-------------------|--------------------|--------------------|
| Production hosting provider | Processor disclosure | Privacy §8 | **YES** | Hosting contract; provider legal name |
| Server / compute region | Cross-border assessment | Privacy §8; processor register | **YES** | Provider dashboard region; contract appendix |
| PostgreSQL hosting region | DB location disclosure | Privacy §8 | **YES** | Managed DB console export |
| Object storage provider | Media retention / processors | Privacy §8; retention matrix | **If S3 enabled** | S3/cloud contract |
| Object storage region | Cross-border | Privacy §8 | **If S3 enabled** | Bucket region screenshot |
| Backups region | Sub-processor disclosure | Privacy §8 (if disclosed) | **If disclosed** | Backup policy doc |
| CDN (if any) | Tile/static asset path | Privacy; Cookies | **If used** | CDN vendor + DPA |

---

## E. Service providers (production truth)

| Field | Why needed | Documents using it | Blocks publication | Evidence requested |
|-------|------------|-------------------|--------------------|--------------------|
| SMS provider | OTP disclosure | Privacy §8 | **When SMS live** | Vendor contract; DPA |
| Payment acquirer | N/A today | — | **N/A** | Future if integrated |
| Push provider (Firebase FCM) | Processor list | Privacy §8 | **When configured** | Firebase project settings; Google DPA |
| OAuth providers enabled in prod | Auth processors | Privacy §8 | **When enabled** | Google/Apple console; DPAs |
| Map / tile provider | OSM + any CDN | Privacy; Cookies | **YES** (map in product) | Architecture note; tile URL list |

See also `docs/legal/handoff/processor-evidence-request.md`.

---

## F. Responsible persons (roles, not invented names)

| Role | Why needed | Documents / process | Blocks publication | Evidence requested |
|------|------------|---------------------|--------------------|--------------------|
| Operator representative (signatory) | Publication approval matrix | Internal sign-off | **YES** for go-live | Board/CEO authorization |
| Privacy / data protection contact | PD requests | Privacy; internal PD policy | **YES** | Named role + `[PRIVACY_EMAIL]` |
| Legal / counsel contact | Handoff and return | Handoff pack | **For closure** | Counsel engagement letter |
| Support escalation contact | Incidents and complaints | Complaint readiness | **Operational** | On-call roster |
| Security incident contact | Breach notification | Internal procedure | **Internal + may affect Privacy** | `docs/legal/internal/data-access-security-incident-procedure.md` |

---

## Submission instructions

1. Complete this questionnaire in a **single operator response document** (or spreadsheet) with attachments indexed by field.
2. Do **not** email secrets; use secure channel for bank details.
3. After counsel approves wording, apply substitutions per `docs/legal/handoff/operator-placeholder-substitution-matrix.md`.
4. Map public env vars per `docs/legal/production/operator-fact-sheet.md` § Env alignment.

**Reference:** `docs/legal/production/operator-fact-sheet.md` (current status: all core fields UNKNOWN).
