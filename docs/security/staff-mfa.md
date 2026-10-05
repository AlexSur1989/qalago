# Staff MFA (Stage 6.9.1.2)

Canonical method: **TOTP** (RFC 6238, 6 digits, 30s, SHA-1 via `otplib`, window ±1 step).

## Policy

- **SUPER_ADMIN**: MFA mandatory when `QALAGO_ENV=PRODUCTION` (or `NODE_ENV=production`).
- Other staff: optional unless `STAFF_MFA_REQUIRED=true`.
- OTP SMS re-verify **does not** satisfy MFA when TOTP is enabled.

## API (prefix `/api/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/auth/staff/mfa/status` | Staff JWT |
| POST | `/auth/staff/mfa/enroll/start` | Staff JWT (enrollment-limited OK) |
| POST | `/auth/staff/mfa/enroll/verify` | Staff JWT |
| POST | `/auth/staff/mfa/verify` | Public + `mfaChallengeToken` |
| POST | `/auth/staff/mfa/recovery-codes/regenerate` | Staff JWT + step-up + TOTP |
| POST | `/auth/staff/mfa/disable` | Staff JWT + step-up (not SUPER_ADMIN in prod) |
| POST | `/admin/staff/:userId/mfa/reset` | SUPER_ADMIN + step-up + caller MFA |

Login: primary OTP/dev login may return `mfaRequired` + `mfaChallengeToken`, or `enrollmentRequired` + limited JWT (`mfaEnrollOnly`).

### Session hardening — 2026-10-06

Enrollment restriction is persisted in `AuthSession.mfaEnrollOnly` and survives
refresh. JWT validation combines the JWT restriction with the persisted restriction;
an old limited JWT stays limited until the client replaces it. Successful TOTP
enrollment promotes only the current active session in the same transaction as the
credential update and revokes other limited sessions. Stale/revoked sessions cannot
complete enrollment. Step-up and generic token reissue cannot remove the restriction.

`AllowMfaEnrollment` is an explicit authenticated-route allowlist: own profile reads,
MFA status/start/verify and logout-all. Other protected routes deny limited sessions,
even without staff permission decorators. Public requests with a limited token run
as guests. MFA disable/recovery regeneration are not enrollment-allowed operations.

Google/Apple consumer login uses the same staff policy as OTP. If staff MFA is
required, it returns `403 MFA_REQUIRED` and issues no session/challenge for those
clients; staff must use the Admin Web flow. Consumer/owner social login is unchanged.

Refresh consume/create, logout, staff session revocation and enrollment serialize
on the user's PostgreSQL row. Replay revokes the family and commits that revocation
before returning 401. No grace window: separate browser tabs racing refresh can be
forced to log in again. In-tab Admin/Business single-flight remains unchanged.
Non-staff access-JWT lifetime/revocation semantics are unchanged; this is not a
new immediate access-token revocation mechanism for consumer JWTs.

#### Application and verification gate

Migration: `20261006120000_auth_session_mfa_restriction`. Stop old API processes,
back up the target database and review pending migrations before application.
The migration adds one Boolean column and revokes existing staff sessions because
their previous MFA assurance cannot be recovered. Consumer sessions are preserved.
Regenerate Prisma Client before running the updated API. **Do not start this API
against an unmigrated database.** After explicit user approval, the local application
database received only this auth migration (backup first, SQL in a transaction,
then `migrate resolve --applied`); Prisma Client regenerated and API restarted.
56 migrations are now applied; the auth checksum matches and legal remains pending.
The pre-existing legal migration/schema discrepancy must be reviewed
before running an unrestricted `migrate deploy`; this stage does not resolve it.

The migration and actual Prisma session transactions were tested on a disposable
PostgreSQL 18 instance, using minimal User/StaffAccess/AuthSession fixtures. This is
not a full migration-chain or real-device verification. Reproducible integration
check (from repository root): set `AUTH_TEST_DATABASE_URL` to a dedicated local
database named `qalago_auth_test`, then run
`node tests/integration/catalog-api/auth-session-postgres.cjs`. The check creates a
unique test schema, never reads application `.env`, and does not clean existing data.

Isolated browser/API QA (2026-10-06): OTP login → mandatory enrollment; F5 remains
limited; wrong enrollment TOTP denied; valid enrollment → recovery codes → dashboard;
F5 restores full access; logout → primary login → MFA challenge. HTTP checks confirmed
allowlisted reads, denied profile mutation/step-up/disable/recovery regeneration both
before and after refresh, logout-all revocation and unaffected consumer profile writes.
Admin login now restarts primary authentication after a failed/interrupted MFA request:
the server consumes each challenge before code validation, so it cannot be retried.
The browser regression confirmed cleared codes and an explicit retry instruction,
then a fresh OTP/MFA challenge and successful recovery-code login. HTTP checks
rejected reuse of that recovery code and accepted a fresh valid TOTP login.

Test environment used real AppModule and an isolated copy of Admin Web, separate
PostgreSQL database, synthetic users and debug OTP; no application data or SMS/push.
Its schema was generated from the current pre-auth schema, then the auth migration
was applied. This is **not proof of migration-chain deployability**: clean-database
`migrate deploy` fails at the first migration (`20260905120000_monetization_campaign_architecture`),
with P3018 / PostgreSQL 42704: missing `AnalyticsEventType`. The historical db-push
baseline described in `prisma/MIGRATIONS.md` is not supplied by the checked-in chain.
Release requires a separately reviewed baseline/bootstrap strategy, preserving existing
applied migration checksums. At initial QA the application DB had 55 applied migrations
and two pending; the subsequent approved local auth-only application is recorded above.

Still pending: MFA administrative reset, independent browser-tab races, real Android
and iOS session QA, target-database application and full deployment validation.

Step-up: `POST /auth/staff/step-up` accepts `totp` / `recoveryCode` when MFA enabled.

## Storage

- `StaffMfaCredential.secretEncrypted` — AES-256-GCM (`STAFF_MFA_ENCRYPTION_KEY`).
- Recovery codes: SHA-256 hashes only.
- Pending enrollment expires in 10 minutes.

## Admin Web

- `/login` — MFA challenge + recovery option.
- `/mfa/setup` — enrollment + one-time recovery display.
- `/settings/security` — optional enrollment.

See `docs/security/staff-mfa-recovery.md` for break-glass.
