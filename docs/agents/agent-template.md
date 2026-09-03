# Agent Template — QalaGo

Copy to `packages/agents/<agent-name>/` when implementing.

---

## Metadata

```yaml
name: example-agent
version: 0.1.0
owner: platform-team
status: draft | active | deprecated
```

## Purpose

One paragraph: what problem this agent solves and for whom.

## Input schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["cityId"],
  "properties": {
    "cityId": { "type": "string" },
    "userId": { "type": "string" },
    "limit": { "type": "integer", "minimum": 1, "maximum": 20, "default": 10 }
  },
  "additionalProperties": false
}
```

## Output schema

```json
{
  "type": "object",
  "required": ["items"],
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["businessId", "reason"],
        "properties": {
          "businessId": { "type": "string" },
          "reason": { "type": "string", "maxLength": 200 }
        }
      }
    }
  }
}
```

## Allowed tools

| Tool | Description |
|------|-------------|
| `search_businesses` | Read catalog with filters |
| `get_user_preferences` | Read anonymized prefs |

## Forbidden actions

- Write/update/delete businesses, reviews, users
- Send notifications
- Access secrets or env
- Execute shell commands

## Memory policy

Choose one:

- `none` — no persistence between requests
- `session` — request-scoped context only
- `user-scoped` — store preference keys in Redis with TTL

Document TTL and keys here.

## Error handling

| Error | Action |
|-------|--------|
| Validation failed | 400, no retry |
| Tool timeout | 1 retry, then partial empty result |
| LLM malformed JSON | 1 repair retry, then 502 |
| Rate limit | 429 to client |

## Prompt guidelines

- System prompt file: `prompts/system.md`
- User template: `prompts/user.template.md`
- No PII in examples committed to repo

## Tests

- [ ] Valid input passes schema
- [ ] Invalid input rejected
- [ ] Disallowed tool call blocked
- [ ] Output matches schema (golden)
- [ ] Fallback path when LLM mocked failure

## Documentation

- `README.md` in agent folder with usage example
- Entry in `docs/agents/tools.md` for each tool

## Checklist before `active`

- [ ] Security review
- [ ] Orchestrator route registered
- [ ] Audit logging verified
- [ ] Load test budget defined
