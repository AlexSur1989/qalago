# AI Orchestrator — QalaGo (Phase 4 scaffold)

Sidecar service for AI agents. **No direct DB access** — reads catalog via HTTP.

## Dev

```powershell
# API must run on :3002
npm run dev:ai
```

Health: http://localhost:3004/api/v1/health

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Service health |
| GET | `/api/v1/agents` | Registered agent specs |
| POST | `/api/v1/recommendations` | Body: `{ "citySlug": "uralsk", "limit": 10 }`, optional `Authorization: Bearer` |
| POST | `/api/v1/moderation/analyze` | Body: `{ "text": "...", "rating": 1-5?, "reviewId": "?" }` — rule-based review screening |
| POST | `/api/v1/content/draft` | Body: `{ "citySlug": "uralsk", "topic": "food", "limit": 5 }` — editorial markdown draft |

## Env

| Variable | Default |
|----------|---------|
| `PORT` | `3004` |
| `CATALOG_API_URL` | `http://localhost:3002/api/v1` |
| `CORS_ORIGIN` | `*` (dev); set to admin/mobile origin in production |
