# Business Web — QalaGo

Owner cabinet for desktop browsers.

## Dev

```powershell
# from repo root (API on :3002)
npm run dev:business
```

Open http://localhost:3003 — login as `+77000000002` (BUSINESS owner), OTP `1234` when `OTP_DEBUG=true`.

## Features (MVP)

- Dashboard: KPI, chart, profile completion, tariff/help cards
- Profile edit: description, contacts, hours
- Menu: groups and items CRUD
- Media gallery and cover image
- Promotions CRUD
- Reviews + owner replies
- Messages: in-app notifications
- Help FAQ and tariff overview (static MVP)

Uploaded images are proxied from catalog-api via `/uploads/*` rewrite in `next.config.ts`.
