# AI Agents Rules — QalaGo

**Scope:** `packages/agents/**`, `packages/ai-core/**`, `services/ai-orchestrator/**`, `docs/agents/**`.

## Principles

1. Agents never get raw DB credentials or unrestricted file system access.
2. All agent actions go through `services/ai-orchestrator`.
3. Tools are allowlisted per agent — default deny.
4. Every agent run is logged (input hash, tools used, outcome, latency).

## Required agent definition

Each agent in `packages/agents/<name>/` must include:

| Field | Description |
|-------|-------------|
| `name` | unique kebab-case id |
| `purpose` | one paragraph |
| `inputSchema` | JSON Schema / Zod |
| `outputSchema` | JSON Schema / Zod |
| `allowedTools` | explicit list |
| `forbiddenActions` | explicit list |
| `memoryPolicy` | none / session / user-scoped |
| `errorHandling` | retry, fallback, human handoff |
| `tests` | unit + schema validation |
| `documentation` | `README.md` in agent folder |

Template: `docs/agents/agent-template.md`.

## Tool registry

- Central registry: `docs/agents/tools.md`.
- New tool: document first, implement in orchestrator, then attach to agents.
- Tools return structured JSON; no free-form shell commands.

## Forbidden for all agents

- Write/delete production data without human confirmation (except draft content).
- Access `.env`, secrets, JWT signing keys.
- Send SMS/push/email without dedicated notification service + policy.
- Modify `api-contracts.md` or Prisma schema autonomously.
- Run `prisma migrate`, `drop`, `truncate`, `rm -rf`.
- Exfiltrate PII in logs or external LLM prompts without redaction policy.

## Memory policy options

| Policy | Use when |
|--------|----------|
| `none` | stateless classification (moderation) |
| `session` | multi-step dialog in one request |
| `user-scoped` | recommendations (store preferences id only, not raw PII) |

## Orchestrator responsibilities

- Validate input against schema.
- Resolve agent by intent or explicit route.
- Enforce tool allowlist and rate limits.
- Redact phone/email in prompts where possible.
- Return output validated against `outputSchema`.

## MVP agents (planned, not implemented)

| Agent | Phase | Read-only |
|-------|-------|-----------|
| `recommendation-agent` | v2 | yes (catalog queries) |
| `moderation-agent` | v2 | yes + flag draft |
| `content-agent` | v2 | draft editorials only |

Do not implement agent business logic until `catalog-api` MVP is stable.

## Testing agents

- Schema round-trip tests (valid/invalid input).
- Tool allowlist rejection tests.
- Golden files for prompt templates (no live LLM in CI).
- Optional integration with mocked LLM adapter.
