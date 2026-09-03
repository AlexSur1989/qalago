# Tools Registry — QalaGo AI

Tools are invoked only by `services/ai-orchestrator`. Each agent declares an allowlist subset.

**Status:** specification. Not implemented.

---

## Catalog (read-only)

### search_businesses

| Field | Value |
|-------|-------|
| Method | Internal → GET /api/v1/businesses |
| Auth | Service token |
| Params | cityId, categoryId?, search?, limit |
| Returns | `{ items: BusinessSummary[] }` |

### get_business

| Field | Value |
|-------|-------|
| Method | GET /api/v1/businesses/:id |
| Returns | Business detail |

### get_user_preferences

| Field | Value |
|-------|-------|
| Method | Internal user service |
| Returns | `{ favoriteCategories[], recentBusinessIds[] }` — no PII |

---

## Reviews (read + draft flag)

### list_pending_reviews

Admin/service only. Returns reviews awaiting moderation.

### flag_review

Body: `{ reviewId, reason, severity }` — creates moderation ticket, does not delete.

---

## Content (draft only)

### create_editorial_draft

Body: `{ cityId, title, bodyMarkdown, businessIds[] }`  
Status: `DRAFT` until human publishes in admin.

---

## Geo

### businesses_nearby

Params: `cityId`, `lat`, `lng`, `radiusM`, `limit`  
Uses catalog-api geo filter.

---

## Forbidden tools (global deny)

| Tool | Reason |
|------|--------|
| `run_sql` | No raw DB |
| `send_sms` | Use notifications service + policy |
| `delete_*` | No autonomous deletes |
| `update_business` | Human approval required |
| `read_env` | Secrets |

---

## MCP integration (future)

External MCP servers may register read-only tools if:

1. Documented in this file
2. Mapped in orchestrator config
3. Scoped to dev/staging until reviewed

---

## Adding a new tool

1. PR updating this file (purpose, params, auth, side effects).
2. Implement handler in `services/ai-orchestrator/src/tools/`.
3. Unit test allowlist per agent.
4. No agent gets new tool by default — explicit allowlist update.
