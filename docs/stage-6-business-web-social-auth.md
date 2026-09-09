# Stage 6.2B5 — Business Web Google + Apple Social Auth

## Architecture

```
/login → Google GIS / Apple JS → provider token (transient)
      → POST /auth/google|apple → QalaGo JWT
      → localStorage[qalago_business_token]
      → existing useAuth / business RBAC
```

Provider tokens are **never persisted**. Only QalaGo JWT uses existing `TOKEN_KEY`.

## Client environment variables

| Variable | Default | Backend counterpart |
|----------|---------|---------------------|
| `NEXT_PUBLIC_QALAGO_GOOGLE_AUTH_ENABLED` | `false` | `GOOGLE_AUTH_ENABLED` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | empty | `GOOGLE_CLIENT_ID_WEB` |
| `NEXT_PUBLIC_QALAGO_APPLE_AUTH_ENABLED` | `false` | `APPLE_AUTH_ENABLED` |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | empty | `APPLE_CLIENT_ID_WEB` (Service ID) |
| `NEXT_PUBLIC_APPLE_REDIRECT_URI` | empty | Must match Apple Developer config |

Without credentials, social buttons are hidden; OTP login remains available.

## Google setup (later)

1. Google Cloud → OAuth Web client
2. Authorized JavaScript origins: `https://business.qalago.kz` (and local dev origin)
3. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + enable flags
4. Backend: `GOOGLE_AUTH_ENABLED=true`, include Web client ID in `GOOGLE_CLIENT_ID_WEB`

Library: `@react-oauth/google` (Google Identity Services).

## Apple setup (later)

1. Apple Developer → Service ID for web
2. Configure domain + return URL matching `NEXT_PUBLIC_APPLE_REDIRECT_URI`
3. Enable Sign in with Apple on Service ID
4. Backend: `APPLE_AUTH_ENABLED=true`, `APPLE_CLIENT_ID_WEB=<Service ID>`

Browser flow uses Apple JS with:

- **state** — CSRF protection via `sessionStorage`
- **nonce** — replay protection; raw nonce sent to Apple, SHA256 hash verified in identity token before backend exchange

Backend endpoint unchanged: `POST /auth/apple` with `{ identityToken }` only.

## Security notes

- JWT stored in `localStorage` (existing behavior) — XSS risk documented for future httpOnly hardening
- No email-based account linking on client
- No role/accountType submission with social login
- Apple revocation deferred (P1)

## Known limitation

Phone-based manager invitations require B6 for users without `User.phone`.
