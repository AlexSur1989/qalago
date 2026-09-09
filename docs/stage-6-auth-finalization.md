# Stage 6.2B7 — Auth Migration Finalization

## Final architecture

```
Google / Apple / OTP (legacy)
  → verified server-side (or OTP hash)
  → AuthIdentity (social) or User.phone (OTP legacy)
  → QalaGo User
  → QalaGo JWT { sub, phone?, role }
  → DB-authoritative RBAC + BusinessMembership
```

**Primary auth (intended production):** Google, Apple  
**Transitional fallback:** Phone OTP (independently disableable)  
**Guest:** Flutter consumer only — unchanged

## Feature flags

### Backend (`services/catalog-api`)

| Flag | Default | Effect when false |
|------|---------|-------------------|
| `GOOGLE_AUTH_ENABLED` | `false` | `POST /auth/google` → 404 |
| `APPLE_AUTH_ENABLED` | `false` | `POST /auth/apple` → 404 |
| `OTP_AUTH_ENABLED` | `true` | `POST /auth/send-code`, `/auth/verify-code` → 404 |

Flags are **independent**. Production validation (`assertProductionConfig`):

- `DEV_LOGIN_ENABLED`, `OTP_DEBUG`, mock checkout blocked in production
- Enabled Google/Apple require at least one client ID audience
- **At least one** of OTP / Google / Apple must be enabled in production

### Flutter (`dart-define`)

| Flag | Default |
|------|---------|
| `QALAGO_GOOGLE_AUTH_ENABLED` | `false` |
| `QALAGO_APPLE_AUTH_ENABLED` | `false` |
| `QALAGO_OTP_AUTH_ENABLED` | `true` |
| `QALAGO_DEV_LOGIN` | `false` |

Login order: Google → Apple → OTP (if enabled) → guest always available.

### Business Web (`NEXT_PUBLIC_*`)

| Flag | Default |
|------|---------|
| `NEXT_PUBLIC_QALAGO_GOOGLE_AUTH_ENABLED` | `false` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | — |
| `NEXT_PUBLIC_QALAGO_APPLE_AUTH_ENABLED` | `false` |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` / `REDIRECT_URI` | — |
| `NEXT_PUBLIC_QALAGO_OTP_AUTH_ENABLED` | `true` (opt-out: `false`) |
| `NEXT_PUBLIC_QALAGO_DEV_LOGIN` | `false` |

Login order: Google → Apple → OTP fallback → dev login (dev only).

**Client flags are UX only.** Backend flags are security authority.

## Identity model

### AuthIdentity invariants

- Unique `(provider, providerUserId)` — one QalaGo user per provider subject
- Unique `(userId, provider)` — max one Google + one Apple per user
- Created only from **server-verified** tokens
- Provider email is metadata only — **not** authentication authority

### No auto-linking

Same email across Google/Apple/OTP does **not** merge accounts.

**Tradeoff:** a person may create multiple QalaGo accounts with different providers. This is intentional — safer than email-matching account takeover.

**Deferred:** explicit secure provider linking UX (Stage 6.3+).

### Tombstones

On `DELETE /users/me`:

1. Upsert `AuthIdentityTombstone(provider, providerUserId)` for each identity
2. Delete `AuthIdentity` rows
3. Anonymize user (`isActive=false`, `phone: deleted:…`)

Re-login with tombstoned provider → generic `Authentication failed` (no tombstone leak).

### PHONE auth method (admin display)

Admin `authMethods` derives:

- `GOOGLE` / `APPLE` from `AuthIdentity`
- `PHONE` only for **legacy phone-only** users (no identities, real non-deleted phone)

Does **not** infer PHONE from `User.phone` when social identities exist.

## OTP deprecation safety

| Dependency class | OTP OFF impact |
|------------------|----------------|
| Authentication | send/verify 404; UI hidden when client flag off |
| `User.phone` profile field | **Unchanged** |
| `Business.phone` contact | **Unchanged** |
| Token invitations (B6) | **Works** via Google/Apple + explicit accept |
| Legacy phone invitations | **Not claimable** without OTP login path |
| Existing JWT sessions | **Valid** until expiry (guard checks `isActive`) |
| Guest browsing | **Unchanged** |

## Team invitations (B6 interaction)

- **Token invite:** Google/Apple/OTP users (phone=null OK) → `/invite/:token` → explicit accept
- **Legacy phone invite:** auto-claim via `claimPendingInvitations` on OTP verify only (`tokenHash: null`)
- Social login does **not** auto-claim legacy phone invites

## Apple revocation — gap (P1 before App Store)

**Not implemented in B7.**

| Item | Status |
|------|--------|
| Provider refresh/authorization code storage | **No** — by design |
| Apple `revoke` endpoint integration | **No** |
| Tombstone on QalaGo delete | **Yes** — prevents QalaGo account recreation |
| Apple-side authorization revocation | **Deferred** |

**Future needs:** Apple `.p8` key, Key ID, Team ID, authorization code exchange at delete time. See `docs/stage-6-auth-migration.md`.

## Rate limiting

All limiters use in-process `SlidingWindowRateLimitService` (not Redis).

| Endpoint | Limit |
|----------|-------|
| OTP send | per-phone cooldown + phone/IP windows |
| OTP verify | per-phone + IP attempt windows |
| Google login | per-IP (shared social config) |
| Apple login | per-IP (separate key prefix) |
| Invitation resolve | 30 / 15 min per IP |
| Invitation accept | 10 / 15 min per user |

**Production note:** multi-instance deployment should use shared/distributed rate limiting (Stage 7 infra).

## Google credential matrix

### Backend

| Variable | Purpose |
|----------|---------|
| `GOOGLE_AUTH_ENABLED` | Gate endpoint |
| `GOOGLE_CLIENT_ID_ANDROID` | Allowed `aud` — Android app |
| `GOOGLE_CLIENT_ID_IOS` | Allowed `aud` — iOS app |
| `GOOGLE_CLIENT_ID_WEB` | Allowed `aud` — Business Web GIS |

### Flutter

| Variable | Purpose |
|----------|---------|
| `QALAGO_GOOGLE_AUTH_ENABLED` | Show button |
| `QALAGO_GOOGLE_CLIENT_ID` | Platform OAuth client |
| `QALAGO_GOOGLE_SERVER_CLIENT_ID` | Server client ID (Android idToken) |

**Android package:** `kz.qalago.qalago_mobile` — needs Android OAuth client + SHA-1/256  
**iOS bundle:** `kz.qalago.qalagoMobile` — needs iOS OAuth client + URL scheme if required

### Business Web

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_QALAGO_GOOGLE_AUTH_ENABLED` | Show button |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | GIS web client ID |

Origin must match Google Cloud Console authorized JavaScript origins.

## Apple credential matrix

### Backend

| Variable | Purpose |
|----------|---------|
| `APPLE_AUTH_ENABLED` | Gate endpoint |
| `APPLE_CLIENT_ID_IOS` | iOS App ID / bundle audience |
| `APPLE_CLIENT_ID_WEB` | Apple Service ID (web) |

### Flutter

| Variable | Purpose |
|----------|---------|
| `QALAGO_APPLE_AUTH_ENABLED` | Show button (iOS) |

**iOS bundle:** `kz.qalago.qalagoMobile` — Sign in with Apple capability

### Business Web

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_QALAGO_APPLE_AUTH_ENABLED` | Show button |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | Service ID |
| `NEXT_PUBLIC_APPLE_REDIRECT_URI` | Registered return URL |

**Future server ops:** Team ID, Key ID, `.p8` — not committed, not in `NEXT_PUBLIC_*`

## Admin identity visibility (B7)

`GET /admin/users` includes safe `authMethods: ('GOOGLE'|'APPLE'|'PHONE')[]`.

**Not exposed:** providerUserId, subs, tokens, token hashes, full AuthIdentity rows.

**Not implemented:** admin linking, impersonation, manual provider attachment.

**Admin Web login:** still phone OTP / dev login only — social admin login deferred.

## All-auth-off behavior

| Surface | Behavior |
|---------|----------|
| Backend production | Startup fails if OTP+Google+Apple all disabled |
| Flutter consumer | Message + guest path remains |
| Business Web | Controlled error message on login page |
| Admin Web | OTP forms remain (ops concern when OTP deprecated) |

## Real E2E checklist (pre-production)

- [ ] Android Google Sign-In with real client IDs
- [ ] iOS Google Sign-In
- [ ] iOS Apple Sign-In
- [ ] Business Web Google GIS
- [ ] Business Web Apple JS
- [ ] OTP-off deployment with social only
- [ ] Token manager invitation (phone=null)
- [ ] Account deletion + tombstone re-login block
- [ ] Apple revocation (App Store compliance)

## Remaining blockers

1. Real Google/Apple OAuth credentials and device/browser E2E
2. Apple authorization revocation (App Store)
3. Admin Web social login (when OTP deprecated for ops)
4. Distributed rate limiting for multi-instance
5. httpOnly cookie session hardening (optional)
6. Transactional invite email provider
7. Explicit provider account linking UX

## Related docs

- [stage-6-auth-migration.md](./stage-6-auth-migration.md)
- [stage-6-team-invitations.md](./stage-6-team-invitations.md)
- [api-contracts.md](./architecture/api-contracts.md)
