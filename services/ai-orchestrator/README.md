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

## Env

| Variable | Default |
|----------|---------|
| `PORT` | `3004` |
| `CATALOG_API_URL` | `http://localhost:3002/api/v1` |
