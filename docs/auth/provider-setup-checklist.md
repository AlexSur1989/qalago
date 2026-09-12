# Provider auth setup checklist (no secrets in repo)

## GOOGLE

### Google Cloud

1. Create or select a Google Cloud project.
2. Configure OAuth consent screen (app name, support email, scopes: email, profile, openid).
3. Create OAuth 2.0 clients as needed:
   - **Android** — package name `kz.qalago.qalago_mobile`
   - **iOS** — bundle ID `kz.qalago.qalagoMobile`
   - **Web** — if required for server `aud` validation or Flutter `serverClientId`

### Android fingerprints

Obtain debug certificates (release later via Play App Signing):

```powershell
cd apps/mobile/android
./gradlew signingReport
```

Record **SHA-1** and **SHA-256** for debug (and release when available). Add to Android OAuth client in Google Cloud.

### Backend env (`services/catalog-api`)

```env
GOOGLE_AUTH_ENABLED=true
GOOGLE_CLIENT_ID_ANDROID=<android-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=<ios-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_ID_WEB=<web-client-id>.apps.googleusercontent.com
```

At least one client ID required when enabled in production.

### Flutter

- `--dart-define=GOOGLE_AUTH_ENABLED=true` when building with provider UI (see `AppConstants`).
- Configure `GoogleSignIn` server client ID if package requires it for ID token audience (env/dart-define — do not commit real IDs).

### Release signing

Future: upload signing key to Play Console; add release SHA-1/SHA-256 to OAuth client.

---

## APPLE

### Apple Developer

1. App ID for bundle `kz.qalago.qalagoMobile`
2. Enable **Sign in with Apple** capability
3. Note **Team ID**
4. **Service ID** only if web/server OAuth extension is added later

### iOS project

- Entitlement `com.apple.developer.applesignin` when signing with valid team
- Capability in Xcode — manual step if local signing lacks team

### Backend env

```env
APPLE_AUTH_ENABLED=true
APPLE_CLIENT_ID_IOS=<bundle-or-services-id>
APPLE_CLIENT_ID_WEB=<optional-service-id-for-web>
```

### Flutter

- `sign_in_with_apple` — iOS only for native button in current product rules
- `--dart-define=APPLE_AUTH_ENABLED=true` for client-side gating

### Real device test

Sign in with Apple requires Apple Developer signing on a physical iPhone — schedule in physical-device QA.

---

## Release flags

After backend env is valid, SUPER_ADMIN may set `googleAuthEnabled` / `appleAuthEnabled` via release config API. Backend still enforces env + verification.

## Security

Never commit: Google client secrets (if used), Apple `.p8` keys, real tokens, or production client IDs in source. Use env / secret manager only.
