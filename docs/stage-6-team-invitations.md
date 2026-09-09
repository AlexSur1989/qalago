# Stage 6.2B6 — Team Invitations (Email + Secure Token)

## Summary

Business team invitations no longer depend on `User.phone`. Owners invite managers by **email**; the backend generates a **cryptographically secure one-time token**. The recipient opens a Business Web link, authenticates with any supported QalaGo method (Google, Apple, OTP), and **explicitly accepts** the invitation.

Legacy **phone** invitations remain supported for migration.

## Authorization policy (product decision)

**A. What authorizes acceptance?**

Secure **token possession** + **authenticated QalaGo user** + **explicit accept** action.

Invitation email is **delivery/context only**, not authentication identity. We do **not** auto-link accounts by matching email.

**B. Forwarded invite link**

Yes — another authenticated QalaGo user who receives the link could accept it.

**C. Mitigation**

- High-entropy token (`crypto.randomBytes`, SHA-256 hash stored)
- Single-use (status → ACCEPTED)
- 7-day expiration
- Owner can revoke pending invitations
- Rate limits on resolve/accept
- Explicit accept button (no auto-membership on page load)

**D. OTP users without email**

Can accept **token** invitations after OTP login via `/invite/:token`. Legacy **phone** invitations still auto-claim on verified OTP login.

**E. Apple Hide My Email**

Relay addresses are valid invitation targeting emails. Acceptance does **not** require email match — token possession is sufficient.

**F. TTL**

7 days (`TEAM_INVITE_TTL_DAYS` / `teamInviteTtlDays` config).

**G. Revoke**

Owner can revoke pending invitations via existing DELETE endpoint.

**H. Old token recoverable?**

**No.** Only `tokenHash` is stored. Reissue = revoke old pending + create new invitation.

## Legacy phone invitations

| Aspect | Legacy (phone) | New (email/token) |
|--------|----------------|-------------------|
| Addressing | Normalized KZ phone | Normalized email |
| DB secret | None (phone match) | `tokenHash` only |
| Claim path | `claimPendingInvitations` after OTP | `POST /invitations/accept` |
| Filter | `tokenHash: null` | `tokenHash` set |
| Auto-accept on login | Yes (OTP verified phone) | No — explicit accept |

Existing invitation rows are preserved. `phone` column is nullable for email invites.

## Database model

`BusinessInvitation`:

- `phone?` — legacy
- `email?` — normalized recipient
- `tokenHash?` @unique — SHA-256 of raw token; **never** raw token
- `acceptedByUserId?`, `acceptedAt?`
- `status`: PENDING | ACCEPTED | REVOKED | EXPIRED (expiry also derived from `expiresAt`)
- `permissions[]` — snapshot at invite time
- `expiresAt` — creation + 7 days

Migration: `20260910120000_stage_6_b6_team_invitations`

## Token security

- Generation: `crypto.randomBytes(32)` → base64url
- Storage: SHA-256 hash only
- Comparison: timing-safe hash compare
- Raw token returned **once** on `POST .../team/invite` (email path)
- List/resolve endpoints never return `rawToken` or `tokenHash`
- Do not log raw tokens or full invite URLs in production

## API

| Method | Path | Notes |
|--------|------|-------|
| POST | `/businesses/:id/team/invite` | `{ email, permissions[] }` or legacy `{ phone, permissions[] }` |
| GET | `/businesses/:id/team` | Pending list includes `email`, `inviteType`, no token |
| DELETE | `/businesses/:id/team/invitations/:id` | Revoke pending |
| POST | `/invitations/resolve` | Public preview |
| POST | `/invitations/accept` | Auth + explicit accept |

Invite URL: `{BUSINESS_WEB_BASE_URL}/invite/{rawToken}` (default `http://localhost:3003`).

## Business Web UX

**Team page** (`/business/[id]/team`):

- Email input + permission selection
- On success: «Приглашение создано», copy-link UI — **not** «email sent»
- Pending list shows email/phone, type, expiration
- Revoke unchanged

**Accept page** (`/invite/[token]`):

- Resolve invitation (public)
- Unauthenticated: preview + «Войти и принять приглашение»
- Authenticated: «Принять приглашение» (explicit)
- Post-accept: redirect to business dashboard
- Login redirect preserved via `sanitizeInternalRedirect` (`/login?redirect=/invite/...`)

## Acceptance transaction

Atomic (Prisma `$transaction`):

1. Validate token hash → invitation PENDING and not expired
2. Verify business not BLOCKED
3. Reject OWNER accepting manager invite
4. Idempotent if already MANAGER
5. Upsert MANAGER membership with invited permissions
6. Mark invitation ACCEPTED with `acceptedByUserId` / `acceptedAt`

## Duplicate invitations

Creating a new invite for the same `businessId + normalized email` revokes prior **pending** invitations and issues a fresh token.

## Email delivery — deferred

No transactional email provider in B6. Owner copies link manually (email, WhatsApp, Telegram, etc.).

Future integration point: send email after `createEmailInvitation` with the one-time URL (never store raw token for resend).

## Explicitly forbidden

- Auto-linking AuthIdentity / User by invitation email
- Persisting raw invite tokens
- JWT as permanent invitation authority
- MANAGER inviting managers (unless future product rule)
- Auto-accept on link open

## Flutter / mobile

Out of scope for B6. Invite links open Business Web. Deep links deferred.

## Security checklist

- [x] tokenHash only in DB
- [x] raw token one-time on create
- [x] expiration enforced
- [x] revoke invalidates token
- [x] auth required for accept
- [x] explicit accept required
- [x] OWNER-only invite/revoke
- [x] race-safe transaction
- [x] internal returnTo only (open redirect blocked)
- [x] legacy phone path preserved

## Related docs

- [stage-6-auth-migration.md](./stage-6-auth-migration.md)
- [api-contracts.md](./architecture/api-contracts.md)
