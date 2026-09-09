# Stage 6 — Auth Migration (Google / Apple)

## Current state (after 6.2B7)

See [stage-6-auth-finalization.md](./stage-6-auth-finalization.md) for production flag matrix, credential checklist, and remaining blockers.

## Historical state (after 6.2B5)

- **Phone OTP** remains available when `OTP_AUTH_ENABLED=true` / client OTP flags
- **Google backend** implemented: `POST /auth/google`
- **Apple backend** implemented: `POST /auth/apple`
- **Flutter consumer** Google/Apple login UI (B4)
- **Business Web** Google/Apple login UI (B5) — see [stage-6-business-web-social-auth.md](./stage-6-business-web-social-auth.md)

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

## Team invitations (Stage 6.2B6)

Email + secure one-time token invitations are implemented. See [stage-6-team-invitations.md](./stage-6-team-invitations.md).

- New invites use **email + token link** (Business Web `/invite/:token`)
- Legacy **phone** invitations still auto-claim via OTP login (`claimPendingInvitations`, `tokenHash: null` only)
- **No email auto-linking** — invitation email is delivery context; acceptance uses token possession + authenticated user + explicit accept

## Implementation roadmap

| Stage | Scope |
|-------|-------|
| **6.2B1** ✅ | Schema, AuthIdentity, tombstones, nullable phone, flags |
| **6.2B2** ✅ | Google backend token verification + `POST /auth/google` |
| **6.2B3** ✅ | Apple backend identity token verification + `POST /auth/apple` |
| **6.2B4** ✅ | Flutter Google + Apple UI (see [stage-6-flutter-social-auth.md](./stage-6-flutter-social-auth.md)) |
| **6.2B5** ✅ | Business Web Google + Apple UI (see [stage-6-business-web-social-auth.md](./stage-6-business-web-social-auth.md)) |
| **6.2B5** | Business Web social login |
| **6.2B6** ✅ | Team invitation redesign (email/link) — see [stage-6-team-invitations.md](./stage-6-team-invitations.md) |
| **6.2B7** ✅ | Auth finalization — OTP deprecation safety, flags, admin authMethods, QA — see [stage-6-auth-finalization.md](./stage-6-auth-finalization.md) |

## POST /auth/google (Stage 6.2B2)

Request: `{ "idToken": "..." }` only.

Flow:

1. Verify Google ID token server-side (`google-auth-library`)
2. Check `AuthIdentityTombstone(GOOGLE, sub)`
3. Find or create `AuthIdentity` + `User`
4. Issue QalaGo JWT

Config:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_AUTH_ENABLED` | Gate endpoint (default `false`) |
| `GOOGLE_CLIENT_ID_ANDROID` | Allowed `aud` |
| `GOOGLE_CLIENT_ID_IOS` | Allowed `aud` |
| `GOOGLE_CLIENT_ID_WEB` | Allowed `aud` |
| `GOOGLE_AUTH_IP_LIMIT` | Rate limit (default 20) |
| `GOOGLE_AUTH_IP_WINDOW_SECONDS` | Window (default 900) |

Production: if `GOOGLE_AUTH_ENABLED=true`, at least one client ID is required at startup.

**No email auto-link.** Provider tokens are transient — never stored or logged.

### Manual local test (when credentials exist)

With `GOOGLE_AUTH_ENABLED=true` and valid client IDs, obtain a real ID token from a Google Sign-In client and:

```http
POST /api/v1/auth/google
Content-Type: application/json

{ "idToken": "<paste token here>" }
```

No debug bypass or magic tokens.

## POST /auth/apple (Stage 6.2B3)

Request: `{ "identityToken": "..." }` only.

Flow mirrors Google with Apple-specific verification via Apple JWKS (`jose`).

Config:

| Variable | Purpose |
|----------|---------|
| `APPLE_AUTH_ENABLED` | Gate endpoint (default `false`) |
| `APPLE_CLIENT_ID_IOS` | iOS App ID / bundle audience (e.g. `kz.qalago.qalagoMobile`) |
| `APPLE_CLIENT_ID_WEB` | Apple Service ID for web (future) |
| `SOCIAL_AUTH_IP_LIMIT` | Shared social auth rate limit (default 20) |
| `SOCIAL_AUTH_IP_WINDOW_SECONDS` | Shared window (default 900) |

Apple identity key: **APPLE + sub** (never email).

Relay emails (`@privaterelay.appleid.com`) are valid provider metadata.

Later logins without email in the token do **not** erase stored `AuthIdentity.email`.

`User.email` and `User.name` are not set from Apple in B3.

### App bundle IDs (repository truth — do not change in auth stages)

| Platform | Identifier |
|----------|------------|
| iOS | `kz.qalago.qalagoMobile` |
| Android | `kz.qalago.qalago_mobile` |

Use these when creating Apple/Google Developer credentials.

### Apple token revocation — deferred (P1 before App Store)

Account deletion tombstones prevent QalaGo account recreation, but **Apple authorization revocation** (requires `.p8` key + authorization code exchange) is **not** implemented in B3. Required before App Store deletion compliance sign-off.

## JWT

QalaGo JWT remains `{ sub, phone?, role }`. Provider tokens are never embedded.

Authorization: JWT `sub` → reload User → RBAC/memberships unchanged.
