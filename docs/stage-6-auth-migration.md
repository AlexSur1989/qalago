# Stage 6 — Auth Migration (Google / Apple)

## Current state (after 6.2B1)

- **Phone OTP** remains the active login method when `OTP_AUTH_ENABLED=true`
- **Google/Apple endpoints** are NOT implemented yet
- Foundation models are in place for future provider verification

## Foundation (Stage 6.2B1)

### AuthProvider enum

`GOOGLE`, `APPLE` — phone OTP is not an AuthProvider; it uses `User.phone` + OTP infrastructure.

### AuthIdentity

Stores external provider linkage:

| Field | Purpose |
|-------|---------|
| `provider` + `providerUserId` | Primary identity key (Google/Apple `sub`) |
| `email` | Provider metadata only — **not** used for auth or auto-linking |
| `emailVerified` | Provider metadata |

Constraints:

- `@@unique([provider, providerUserId])`
- `@@unique([userId, provider])` — one Google and one Apple identity per user (MVP)

### AuthIdentityTombstone

Prevents deleted accounts from being silently recreated via the same provider identity.

Stores only `provider`, `providerUserId`, `deletedAt` — **no provider email**.

### User changes

- `phone` → nullable (`String? @unique`) — existing users unchanged
- `email` → optional canonical contact field — **not** used for authentication

**Important:** `Business.phone` is business contact data, unrelated to `User.phone`.

## Feature flags

| Flag | B1 default | Future production target |
|------|------------|--------------------------|
| `OTP_AUTH_ENABLED` | `true` | `false` |
| `GOOGLE_AUTH_ENABLED` | `false` | `true` (when B2 ships) |
| `APPLE_AUTH_ENABLED` | `false` | `true` (when B3 ships) |

When `OTP_AUTH_ENABLED=false`: `POST /auth/send-code` and `/auth/verify-code` return 404.

`DEV_LOGIN_ENABLED` remains separate.

## Account deletion

On `DELETE /users/me`:

1. Tombstone all `AuthIdentity` rows (`provider` + `providerUserId`)
2. Delete `AuthIdentity` rows
3. Continue hybrid deletion (deactivate, anonymize phone, clear email, etc.)

Future Google/Apple login must check `AuthIdentityTombstone` before creating users.

## Explicitly forbidden

- Auto-linking users by email (`find User where email == provider.email`)
- Storing provider OAuth/ID tokens in the database
- Deriving ADMIN/BUSINESS roles from provider claims

## Known transitional limitation

`BusinessInvitation` remains **phone-based**. Users without a phone cannot claim manager invitations until **Stage 6.2B6**.

## Implementation roadmap

| Stage | Scope |
|-------|-------|
| **6.2B1** ✅ | Schema, AuthIdentity, tombstones, nullable phone, flags |
| **6.2B2** | Google backend token verification + endpoint |
| **6.2B3** | Apple backend token verification + endpoint |
| **6.2B4** | Flutter Google + Apple UI |
| **6.2B5** | Business Web social login |
| **6.2B6** | Team invitation redesign (email/link) |
| **6.2B7** | OTP deprecation, admin identity linking, QA |

## JWT

QalaGo JWT remains `{ sub, phone?, role }`. Provider tokens are never embedded.

Authorization: JWT `sub` → reload User → RBAC/memberships unchanged.
