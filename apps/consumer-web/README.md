# QalaGo Consumer Web (public discovery)

Public city discovery shell on **Next.js 15** App Router (port **3005**).

## Dev

From repo root:

```powershell
npm run dev:consumer
```

Requires catalog-api (`npm run dev:api`) for live data.

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Catalog API base (default `http://localhost:3002/api/v1`) |
| `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` | External public base for deferred links (e.g. Business Web `/help`); canonical legal pages are on Consumer Web (`/privacy`, `/terms`, `/account-deletion`) |
| `QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS` | **Optional** — comma-separated SHA-256 cert fingerprints for `/.well-known/assetlinks.json` (production App Links verification) |
| `QALAGO_APPLE_TEAM_ID` | **Optional** — 10-character Apple Team ID for `/.well-known/apple-app-site-association` (production Universal Links) |

See `docs/architecture/public-consumer-web.md`.
