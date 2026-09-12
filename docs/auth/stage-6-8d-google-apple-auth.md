# Stage 6.8D — Google Sign-In & Sign in with Apple

## Previous auth architecture (baseline)

- **OTP** (`POST /auth/send-code`, `/auth/verify-code`) — phone verification, optional name on first register.
- **DEV login** (`POST /auth/dev-login`) — local-only when `DEV_LOGIN_ENABLED=true`; blocked in production config validation.
- **Stage 6.8B sessions** — short-lived access JWT + rotating refresh via `AuthSessionService.issueQalaGoSession()`; logout / logout-all; inactive users denied refresh.
- **AuthIdentity** — canonical mapping `(provider, providerUserId) → User`; tombstones block resurrection.
- **Guest-first** — app usable without login; auth on protected actions.

## Common provider boundary

1. Client obtains provider credential (ID token / identity token) via official SDK.
2. Backend **verifies** token (Google OAuth library / Apple JWKS + `jose`).
3. Produces `VerifiedProviderIdentity` claims: `providerUserId` (sub), optional email metadata.
4. `SocialAuthLoginService.completeSocialLogin()` resolves identity, creates user if needed, issues QalaGo session only.

Provider tokens are **never** stored in DB or logs.

## Google verification

- Service: `GoogleIdTokenVerifierService` (`google-auth-library` `OAuth2Client.verifyIdToken`).
- Validates signature, `exp`, `iss` (`accounts.google.com`, `https://accounts.google.com`), `aud` against allowlist from env client IDs.
- Identity key: `GOOGLE` + verified `sub`.
- Verified `name` may initialize `User.name` on **first** registration only.

## Apple verification

- Service: `AppleIdentityTokenVerifierService` — fixed Apple JWKS URL (HTTPS), bounded cache, `jwtVerify`.
- Validates signature, `iss` (`https://appleid.apple.com`), `aud` against `APPLE_CLIENT_ID_*`.
- Identity key: `APPLE` + verified `sub`.
- Optional `firstLoginDisplayName` from client only alongside verified token; used for new-user `name` only.
- Repeat login without email in token: supported; metadata on `AuthIdentity` preserved when email omitted.

## No email auto-linking

Identity resolution uses **only** `(provider, providerUserId)`. Same email on Google and Apple creates **two** users unless an explicit future linking flow exists.

## Session issuance

All successful provider logins call `AuthSessionService.issueQalaGoSession()` — same contract as OTP (access + refresh, safe user DTO).

## Inactive / deleted users

- `isActive=false` → `401 Authentication failed`.
- Tombstoned `(provider, sub)` → `401` without leaking tombstone details.
- No new user created for tombstoned identity.

## Avatar priority (6.8C.1)

Social login **does not** read or write `User.avatarUrl`. Custom uploaded avatars cannot be overwritten by provider login. Provider picture URLs are not server-fetched in this stage.

## Feature flags vs environment

| Layer | Google | Apple |
|-------|--------|-------|
| Client rollout | `googleAuthEnabled` in app-config (default OFF) | `appleAuthEnabled` (default OFF) |
| Backend capability | `GOOGLE_AUTH_ENABLED` + client IDs | `APPLE_AUTH_ENABLED` + audiences |
| Effective UI | flag AND env AND platform AND dart-define client config | same |

`AppConfigService` ANDs release flags with backend env flags.

## Production fail-closed

`assertProductionConfig()` rejects production startup when Google/Apple enabled without required client ID / audience configuration.

## Endpoints

- `POST /api/v1/auth/google` — body `{ idToken }`
- `POST /api/v1/auth/apple` — body `{ identityToken, firstLoginDisplayName? }`

When provider disabled: **404**. Rate limit: shared social auth IP limits.

## Guest state

Provider login uses existing `_finishLogin` / city sync / favorites providers; no forced home redirect. Cancellation → `SocialSignInCancelled`, no session.

## Real credential setup

See [provider-setup-checklist.md](./provider-setup-checklist.md).

## Test status

Backend: verifier + social login + session specs (mocked verifiers). Flutter: social auth unit/notifier tests with mocks. **Real Google/Apple device login not verified in CI** without external credentials.

## Deferred

- **6.9** — account deletion UX, Apple revocation compliance details.
- **Physical QA** — SHA fingerprints, real iPhone Sign in with Apple, Android Google.
- **7.x** — VPS/production rollout.
