# External launch checklist — QalaGo (engineering gate)

**Status:** Living checklist (2026-10-06 Stage 9). **Not** store approval or legal compliance by itself.  
Use with [ps-kz-vps-runbook.md](./ps-kz-vps-runbook.md) and store-specific docs under `docs/store/`.

---

## A. Local remediation track (PS.kz prep)

| Stage | Gate | Local status (2026-10-06) |
|-------|------|---------------------------|
| 1 | Current-state audit | **DONE** — `docs/changelog.md` |
| 2 | DB bootstrap / restore proof | **DONE** (isolated DBs) |
| 3 | Builds / contract drift | **DONE** — legal was blocker; fixed in 7.1 |
| 4 | Auth/session HTTP QA | **DONE** — 14/14 smoke |
| 5 | BOLA / uploads Jest | **DONE** (scoped) |
| 6 | Monetization LAUNCH gate | **DONE** — script + HTTP 403 purchases |
| 7.1 | Legal Path R + migration | **DONE** on `qalago_dev` |
| 8 | CI slice | **DONE** — all **web builds PASS**; business contextual **7/7** |
| 9 | VPS runbook + this checklist | **DONE** (docs) |
| 10 | Backup rehearsal + Cluster C | **DONE** — consumer **463/463** |
| 11–12 | Commits + tag + smoke | **DONE** — GitHub `master` @ `ccb4e43`, tag **`ps-kz-prep-2026-10-06`**, HTTP smoke **4/4** |
| 13 | Pre-VPS build matrix | **DONE** (local) — shared-types + 4× Next + nest **PASS**; catalog-api Jest **233/241** |

**Before VPS cutover:** remaining catalog-api Jest suites (harness/integration) **or** operator risk sign-off; PROD.2 env on server (§B–C below).

---

## B. Production environment (PROD.2)

- [ ] `QALAGO_ENV=PRODUCTION` with strict config pass (no dev login, no OTP debug)
- [ ] HTTPS on all public origins; CORS matches real hosts
- [ ] `JWT_SECRET` / MFA encryption key rotated from dev
- [ ] Geocoding provider live (not mock) with server-side API key
- [ ] Push (FCM) credentials if `PUSH_ENABLED=true`
- [ ] AI orchestrator **not** public without `QALAGO_INTERNAL_SERVICE_TOKEN`

Ref: [production-environment.md](./production-environment.md)

---

## C. Database & migrations

- [ ] Backup taken and restore **rehearsed** once on staging/VPS
- [ ] `prisma migrate status` → all folders applied on target DB
- [ ] Greenfield VPS uses [database-bootstrap.md](./database-bootstrap.md) — **not** blind `migrate deploy`
- [ ] PostGIS verified on host ([postgis-local.md](./postgis-local.md) — PS.kz **UNVERIFIED**)

---

## D. Monetization & Play first release

- [ ] Production `GET /app-config`: `monetizationMode=LAUNCH`, purchases off, `launchAccessActive=true`
- [ ] `node scripts/check-google-play-launch-mode.mjs https://api.<prod>/api/v1` → exit 0
- [ ] Admin `GET …/admin/platform-features/google-play-launch-check` → `pass: true`
- [ ] No mock checkout or fake payment UI in mobile release build

Ref: [6.18L-launch-mode.md](../monetization/6.18L-launch-mode.md)

---

## E. Security & auth

- [ ] Staff MFA enforced for admin routes (production policy)
- [ ] Rate limits / Redis decision documented (PROD.5)
- [ ] Upload path: trusted URL policy + receipt tokens ([media-upload-architecture.md](../security/media-upload-architecture.md))
- [ ] Dependency audit reviewed (high/critical on exposed surfaces)

Ref: [stage-6-8a-local-security-audit.md](../security/stage-6-8a-local-security-audit.md)

---

## F. Legal & compliance (engineering)

- [ ] F.7 consumer legal routes live on HTTPS (9 public segments post-7.1)
- [ ] Contextual legal flows for checkout when mode → NORMAL later
- [ ] Counsel review per [legal-review-required.md](../legal-review-required.md)
- [ ] KZ compliance contract acknowledged — [kazakhstan-compliance-contract.md](../architecture/kazakhstan-compliance-contract.md) (docs lock, not approval)

---

## G. Google Play (store)

Copy and extend [google-play-compliance-checklist.md](../store/google-play-compliance-checklist.md):

- [ ] Privacy policy URL, account deletion, Data Safety draft
- [ ] Release AAB signed; target API level current
- [ ] **No** `QALAGO_DEV_LOGIN` in release defines
- [ ] Physical device smoke (login, map, legal, deletion)

---

## H. Observability & ops

- [ ] Health endpoint monitored (`/api/v1/health`)
- [ ] Postgres daily backup + off-server copy
- [ ] `uploads/` backup strategy (until S3 PROD.3)
- [ ] Incident runbook: [incident-secret-leak-runbook.md](../security/incident-secret-leak-runbook.md)

---

## I. Sign-off block (fill at launch)

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | Git SHA deployed: |
| Product / launch mode | | | LAUNCH vs NORMAL: |
| Legal (external) | | | Not replaced by this doc |

**Submission status:** NOT STARTED
