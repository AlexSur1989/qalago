# Stage 6.2B4 — Flutter Google + Apple Social Auth

## Architecture

```
LoginScreen → AuthNotifier → AuthRepository → POST /auth/google|apple
                    ↑
         GoogleSignInGateway / AppleSignInGateway (native SDK)
```

Provider tokens are **transient**. Only QalaGo `accessToken` is stored in `AuthStorage`.

## Client flags (`--dart-define`)

| Flag | Default | Backend counterpart |
|------|---------|---------------------|
| `QALAGO_GOOGLE_AUTH_ENABLED` | `false` | `GOOGLE_AUTH_ENABLED` |
| `QALAGO_APPLE_AUTH_ENABLED` | `false` | `APPLE_AUTH_ENABLED` |
| `QALAGO_OTP_AUTH_ENABLED` | `true` | `OTP_AUTH_ENABLED` |
| `QALAGO_GOOGLE_CLIENT_ID` | empty | OAuth client (platform) |
| `QALAGO_GOOGLE_SERVER_CLIENT_ID` | empty | Web/server client for ID token |

Buttons are hidden when client flags are `false` — safe without credentials.

## Supported platforms

| Provider | Android | iOS | Flutter Web |
|----------|---------|-----|-------------|
| Google | Yes (when enabled) | Yes (when enabled) | **No** (disabled) |
| Apple | **No** (MVP) | Yes (when enabled) | **No** |
| Phone OTP | Fallback | Fallback | Fallback |

## Bundle / application IDs (repository truth)

| Platform | ID |
|----------|-----|
| Android | `kz.qalago.qalago_mobile` |
| iOS | `kz.qalago.qalagoMobile` |

## Google setup checklist (later)

1. Google Cloud project + OAuth consent screen
2. Android OAuth client: package `kz.qalago.qalago_mobile`, SHA-1/SHA-256
3. iOS OAuth client: bundle `kz.qalago.qalagoMobile`
4. Optional server/web client ID → `QALAGO_GOOGLE_SERVER_CLIENT_ID`
5. Enable backend: `GOOGLE_AUTH_ENABLED=true` + `GOOGLE_CLIENT_ID_*`
6. Enable client: `QALAGO_GOOGLE_AUTH_ENABLED=true`

No `google-services.json`. No Firebase Auth.

## Apple setup checklist (later)

1. Apple Developer Program
2. App ID `kz.qalago.qalagoMobile` with **Sign in with Apple**
3. Xcode: enable capability (see `ios/Runner/Runner.entitlements`)
4. Backend: `APPLE_AUTH_ENABLED=true` + `APPLE_CLIENT_ID_IOS`
5. Client: `QALAGO_APPLE_AUTH_ENABLED=true`

## Apple revocation — deferred (P1)

Account deletion tombstones prevent QalaGo recreation. App Store may require Apple token revocation — not implemented in B4.

## Logout

QalaGo logout clears JWT and auth state only. Google SDK `signOut()` is **not** called on ordinary logout (QalaGo logout ≠ Google disconnect).

## Known limitation

Phone-based manager invitations require a phone number until Stage 6.2B6.
