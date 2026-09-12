# Staff step-up verification (Stage 6.9.1.1)

## Purpose

Sensitive staff mutations require **recent step-up** after primary authentication.

## Mechanism

- Access JWT may include `stepUpAt` (Unix seconds) after successful OTP re-verification.
- Endpoint: `POST /api/v1/auth/staff/step-up` with body `{ "code": "<otp>" }` and current Bearer token.
- Step-up uses the same OTP pipeline as login (`send-code` → verify), bound to the staff user's phone.

## TTL

**Default: 600 seconds (10 minutes).**

Override via environment/config key `app.staffStepUpTtlSeconds` if present in catalog-api config.

Critical actions decorated with `@RequireStaffStepUp()` reject with `STEP_UP_REQUIRED` when `stepUpAt` is missing or outside the TTL.

## Audit

Successful step-up records `STAFF_STEP_UP_VERIFIED` (no secrets in metadata).

## MFA

**STAFF MFA PENDING** — TOTP/WebAuthn is not implemented in this stage; OTP step-up is the enforced re-auth seam.
