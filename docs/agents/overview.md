# AI Agents — Overview

## Purpose

AI layer augments QalaGo after catalog MVP is stable: recommendations, moderation assist, editorial content. **Not part of MVP launch.**

## Architecture

```text
Client / Admin
      │
      ▼
services/ai-orchestrator
      ├── validate input (schema)
      ├── select agent (packages/agents)
      ├── execute allowlisted tools
      ├── call packages/ai-core (LLM)
      └── audit log
              │
              ▼
      services/catalog-api (read-only tools)
```

## Design rules

1. **No direct database access** from agents or ai-core.
2. **Tools are HTTP/internal APIs** exposed by orchestrator.
3. **Human in the loop** for publish, block, payment-related actions.
4. **City-scoped** queries — tools require `cityId`.

## Planned agents

| Agent | Input | Output | Phase |
|-------|-------|--------|-------|
| recommendation-agent | userId, cityId, context | ranked businessIds + reasons | v2 |
| moderation-agent | reviewId, text | score, flags, suggest action | v2 |
| content-agent | cityId, topic | draft editorial markdown | v2 |

## Data privacy

- Send to LLM: category prefs, anonymized behavior aggregates — not raw phone.
- Log retention: 30 days default for agent traces (configurable).

## Failure modes

| Failure | Behavior |
|---------|----------|
| LLM timeout | Return fallback (popular nearby) |
| Invalid output schema | Retry once, then error |
| Tool denied | Fail closed, log security event |

## Related

- [Agent template](./agent-template.md)
- [Tools registry](./tools.md)
- [AI rules](../../.cursor/rules/ai-agents/RULE.md)

## Status

Scaffold active (Phase 4): `ai-orchestrator` exposes rule-based recommendations via catalog-api read tools. LLM agents — next iteration.
