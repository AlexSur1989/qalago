# QalaGo documentation

## Start here

- **[Project status](./PROJECT_STATUS.md)** — current checkpoint (`2bacbb3`), stages, migrations, test baseline
- **[Changelog](./changelog.md)** — release notes by stage
- **[Local development setup](../scripts/dev/SETUP.md)** — PostgreSQL, API, web, mobile

## Architecture & API

- [Overview](./architecture/overview.md)
- [Modules](./architecture/modules.md)
- [RBAC & roles](./architecture/rbac.md) — includes AuditLog (Stage 5M.3)
- [Business membership & permissions](./architecture/business-membership.md)
- [API contracts](./architecture/api-contracts.md) — team, audit read endpoints

## Product & operations

- [Business tariffs](./product/business-tariffs.md)
- [Monetization](./MONETIZATION.md)
- [Deploy](./deploy.md) — production safety, migrations
- [PostgreSQL backup](./infra/postgresql-backup.md)

## Audits & history

- [Stage 5L RBAC audit](./stage-5l-rbac-audit.md) — **HISTORICAL / SUPERSEDED** (pre–5M.0 snapshot; see [RBAC](./architecture/rbac.md) for current truth)

## AI agents

- [Agents overview](./agents/overview.md)
- [Agent template](./agents/agent-template.md)
