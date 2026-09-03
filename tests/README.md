# Tests

Cross-cutting tests live here. Service-specific unit tests stay colocated.

## Layout (planned)

```text
tests/
├── unit/           — packages
├── integration/    — catalog-api + Postgres
├── contract/       — api-contracts.md compliance
└── e2e/            — mobile smoke (integration_test)
```

See `.cursor/rules/testing/RULE.md`.
