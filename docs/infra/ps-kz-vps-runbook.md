# PS.kz VPS — deployment runbook (first production host)

**Status:** Agreed runbook (2026-10-06 Stage 9). **No VPS purchased or configured in repo.**  
**Scope:** self-hosted Docker path aligned with `infra/docker/docker-compose.prod.yml`.  
**Related:** [deploy.md](../deploy.md), [production-environment.md](./production-environment.md), [database-bootstrap.md](./database-bootstrap.md).

---

## 0. Preconditions (operator)

| Item | Status in repo |
|------|----------------|
| PS.kz VPS + public IP | **External** — not in git |
| Domain + DNS (API, admin, business, consumer) | **External** |
| PostGIS on PostgreSQL 16 | **UNVERIFIED** on PS.kz offering — confirm before cutover ([postgis-local.md](./postgis-local.md)) |
| TLS (Let’s Encrypt / Caddy / Nginx) | Documented pattern in [deploy.md](../deploy.md) §6 — **not automated in repo** |
| Object storage for `uploads/` (PROD.3) | **Deferred** — local disk only in MVP compose |
| Legal counsel sign-off | [legal-review-required.md](../legal-review-required.md) — **not** implied by engineering |

---

## 1. Release artifact

1. **Branch / tag:** deploy from GitHub tag **`ps-kz-prep-2026-10-06`** (or `master` at **`ccb4e43`**+ after Stage 13). Example on VPS:
   ```bash
   git clone https://github.com/AlexSur1989/qalago.git /opt/qalago
   cd /opt/qalago && git checkout ps-kz-prep-2026-10-06
   ```
   Local gate before cutover: `node scripts/dev/_stage8-ci-smoke.mjs` (API on `qalago_dev`); dump handoff: `node scripts/dev/_stage10-backup-rehearsal.mjs` (operator machine).
2. **Do not** deploy from an unreconciled dirty tree (see [external-launch-checklist.md](./external-launch-checklist.md)).
3. **Build matrix (minimum):** all four web `next build`, `catalog-api` `nest build`, Flutter release AAB (Android).
4. **Monetization mode:** first public Android release expects **`LAUNCH`** on production API until Play billing is live — verify with `scripts/check-google-play-launch-mode.mjs` against **production** `GET /app-config`.

---

## 2. Server bootstrap (Ubuntu 22.04+)

```bash
# On VPS (example)
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# re-login
```

Clone or rsync release tree to `/opt/qalago` (read-only deploy user recommended).

**Firewall:** expose **443/80** only; **do not** publish Postgres/Redis to the internet (6.8A SEC-008).

---

## 3. Environment file

```bash
cd /opt/qalago
cp infra/env/.env.production.example .env.prod
chmod 600 .env.prod
# Fill via editor or secret manager — never commit
```

Mandatory profile: `NODE_ENV=production`, `QALAGO_ENV=PRODUCTION`. Full matrix: [production-environment.md](./production-environment.md).

**Hard off in production:**

- `DEV_LOGIN_ENABLED=false`
- `OTP_DEBUG=false`
- `MOCK_PLAN_CHECKOUT_ENABLED=false`
- Strong unique `JWT_SECRET`, `STAFF_MFA_ENCRYPTION_KEY`, `QALAGO_INTERNAL_SERVICE_TOKEN` (if AI enabled)

**CORS / URLs:** HTTPS-only origins matching real admin, business, consumer hosts.

---

## 4. Database strategy (choose one)

### Persona A — Restore from known-good backup (recommended first VPS)

Use when migrating **`qalago_dev`** or staging dump to VPS:

1. `pg_dump -Fc` from source (see [postgresql-backup.md](./postgresql-backup.md)).
2. Create empty DB on VPS Postgres (PostGIS enabled — superuser).
3. `pg_restore --single-transaction` as **postgres**; grant app role.
4. `npx prisma migrate status` — apply **pending only** with `migrate deploy`.
5. Spot-check: `LegalDocumentType` includes `PUBLIC_OFFER`, `PERSONAL_DATA_CONSENT`; `AuthSession.mfaEnrollOnly` if auth hardening release included.

**Local rehearsal (Stage 10):** `node scripts/dev/_stage10-backup-rehearsal.mjs` — see [database-bootstrap.md](./database-bootstrap.md).

### Persona B — Greenfield empty PostgreSQL

**Do not** run `migrate deploy` from zero without bootstrap — chain fails at first migration (P3018 / missing `AnalyticsEventType`). Procedure: [database-bootstrap.md](./database-bootstrap.md) Scenario greenfield (PostGIS → HEAD `db push` at release tag → selective SQL / resolve — **operator-reviewed**).

---

## 5. Application deploy (Docker prod compose)

```bash
docker compose -f infra/docker/docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f infra/docker/docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f infra/docker/docker-compose.prod.yml exec api npx prisma generate
```

**Never** `npm run seed` on production.

Bootstrap SUPER_ADMIN once (real phone):

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec \
  -e BOOTSTRAP_SUPER_ADMIN_PHONE=+770XXXXXXXXX \
  api npm run bootstrap:super-admin
```

Health: `GET https://api.<domain>/api/v1/health` → 200.

---

## 6. Web panels

Build with production API URL baked at build time:

| App | Build env | Typical host |
|-----|-----------|--------------|
| Admin | `NEXT_PUBLIC_API_URL=https://api.<domain>/api/v1` | `admin.<domain>` |
| Business | same | `business.<domain>` or path |
| Consumer | `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` | apex / `www` |

Options: Node `next start` behind reverse proxy, or static export host — match team hosting choice on PS.kz.

---

## 7. Post-deploy verification (smoke)

Run from operator workstation against **production** URLs:

```bash
node scripts/check-google-play-launch-mode.mjs https://api.<domain>/api/v1
# Expect pass:true when monetizationMode=LAUNCH for first Play release
```

Manual:

- Admin OTP login + MFA enrollment (staff policy).
- Consumer legal pages HTTPS (F.7 routes).
- Business owner read-only under LAUNCH (no checkout).
- `POST` purchase endpoints → **403** `MONETIZATION_DISABLED` when mode ≠ NORMAL.

Optional: copy `services/catalog-api/scripts/dev/_stage4-auth-qa.mjs` pattern with `QALAGO_API_BASE` — **non-destructive** session tests only after operator approval.

---

## 8. Rollback

1. Stop compose: `docker compose … down` (keep volumes).
2. Restore Postgres from last **verified** `pg_dump` ([postgresql-backup.md](./postgresql-backup.md)).
3. Redeploy previous image/tag; re-run `migrate deploy` only if forward migrations were applied on failed deploy.

Auth migration rollback is **not** scripted — use backup restore, not manual column drops.

---

## 9. Local remediation cross-links

| Stage | Topic | Doc / artifact |
|-------|--------|----------------|
| 2 | Migration bootstrap | [database-bootstrap.md](./database-bootstrap.md) |
| 4 | Auth QA script | `_stage4-auth-qa.mjs` |
| 6 | Launch mode | [6.18L-launch-mode.md](../monetization/6.18L-launch-mode.md) |
| 7.1 | Legal enum | [6.19a1-legal-reconciliation.md](../architecture/6.19a1-legal-reconciliation.md) |
| 8 | CI parity | `.github/workflows/ci.yml`, `_stage8-ci-smoke.mjs` |

---

## 10. Open engineering debt before “production READY”

- Migration **baseline** for true greenfield `migrate deploy` (Stage 2 finding).
- Full **catalog-api Jest** + consumer **home/ads** vitest green (Stage 8).
- **S3** uploads + backup automation (PROD.3).
- **Redis** mandatory for scale (PROD.5).
- npm **audit** triage (multer/Nest chain — Stage 5).
