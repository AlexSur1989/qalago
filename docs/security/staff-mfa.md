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
