# Provider auth threat model (Stage 6.8D)

| Threat | Mitigation |
|--------|------------|
| Forged provider token | Server-side verify signature, iss, aud, exp; reject on failure |
| Wrong audience (token for another app) | Explicit allowlist from env client IDs / Apple audiences; tests |
| Wrong issuer | Google: `accounts.google.com` only; Apple: `https://appleid.apple.com` |
| Expired / not-yet-valid token | Library verification rejects |
| Missing `sub` | Reject; no identity created |
| Email auto-link takeover | No lookup by email; key is `(provider, sub)` only |
| Identity collision race | DB unique on `(provider, providerUserId)` + transaction retry |
| Client role / userId injection | DTOs accept tokens only; no trusted profile fields |
| Provider token logging | Log redaction: `idToken`, `identityToken`, refresh, access |
| JWKS abuse / SSRF | Fixed Apple HTTPS host; cached JWKS; no user-controlled URL |
| JWKS DoS (bad `kid`) | Bounded cache/timeouts via `jose` remote JWK set |
| Provider outage | Auth fails closed; no unverified fallback |
| Deleted account resurrection | Tombstone check before login; generic error |
| Inactive user session | Block at login and refresh (6.8B) |
| Provider avatar SSRF | No server fetch of avatar URLs in 6.8D; no `avatarUrl` on social create |
| Replay of provider token | Short token TTL; QalaGo issues own session; optional Apple nonce in future if flow requires |
| Refresh replay | 6.8B rotation + reuse detection unchanged |
| Feature flag as security boundary | Backend env + verification always required; flag is rollout only |

## Residual risk

- Real-device and production credential misconfiguration — mitigated by fail-closed startup checks and 404 when disabled.
- Apple first-login name from client — used only for new user display name; identity from verified token only.

## Future (6.9+)

Explicit account linking with proof of both providers; Apple account deletion/revocation webhooks.
