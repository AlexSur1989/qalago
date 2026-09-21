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
| `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` | Legal/store pages host until F.7 (default dev: business-web `http://localhost:3003`) |

See `docs/architecture/public-consumer-web.md`.
