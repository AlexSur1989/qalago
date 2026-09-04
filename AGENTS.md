# AGENTS.md — правила для AI и Cursor

Этот файл обязателен для любого AI-агента или разработчика с Cursor в репозитории QalaGo.

## Миссия проекта

QalaGo — городской маркетплейс/гид. MVP: Уральск. Цель: масштаб на Казахстан без переписывания архитектуры.

## Workflow (строго)

1. **План** — описать что и зачем, до правок кода.
2. **Контракт** — если меняется API, сначала `docs/architecture/api-contracts.md`.
3. **Код** — минимальный diff, только запрошенный scope.
4. **Тесты** — для новой логики в services/packages.
5. **Docs** — обновить связанные md, если поведение изменилось.
6. **Changelog** — каждое нововведение записать в `docs/changelog.md` (дата, что добавлено, что заложить на будущее).

## Границы ответственности

| Зона | Кто | Можно |
|------|-----|-------|
| `apps/*` | frontend | UI, routing, presentation |
| `services/*` | backend | API, domain, persistence |
| `packages/*` | shared | types, clients, ai-core, agents |
| `docs/*` | all | документация |
| `infra/*` | devops | docker, CI, env examples |
| `.cursor/rules/*` | architect | правила, не продуктовый код |

## Запрещено

- Писать бизнес-логику прямо в UI (`apps/mobile`, web panels).
- Создавать новые папки верхнего уровня без объяснения в PR/комментарии.
- Менять API без обновления `api-contracts.md`.
- Давать AI-агентам полный доступ ко всему репозиторию и prod.
- Использовать production-секреты в коде, коммитах, логах.
- Destructive-действия (drop DB, mass delete, force push) без явного подтверждения пользователя.
- Писать код без плана, если задача затрагивает >1 модуля.
- Массовое удаление файлов без Chief Orchestrator / явного OK.

## Обязательно для каждого AI-агента продукта

См. `docs/agents/agent-template.md`. Кратко:

- name, purpose
- input schema, output schema
- allowed tools, forbidden actions
- memory policy, error handling
- tests, documentation

## Стек и соглашения

- TypeScript strict в backend и web.
- Dart + flutter_lints в mobile.
- Prisma для PostgreSQL.
- REST API prefix: `/api/v1/`.
- Идентификаторы: `cuid` (или `uuid` — зафиксировать при старте кода).
- Языки UI: ru (MVP), kk (v1.1).

## Multi-city

- Все list/query по заведениям фильтруются по `cityId` или `citySlug`.
- Default city на MVP: `uralsk`.
- Не хардкодить «Уральск» в бизнес-логике — только в seed и default config.

## Ссылки на правила Cursor

- [Architecture](.cursor/rules/architecture/RULE.md)
- [AI Agents](.cursor/rules/ai-agents/RULE.md)
- [Testing](.cursor/rules/testing/RULE.md)
- [Security](.cursor/rules/security/RULE.md)

## Порядок реализации (greenfield)

1. `services/catalog-api` — schema, auth, catalog, seed Uralsk
2. `packages/shared-types` — DTO sync
3. `apps/mobile` — auth, home, list, details, map
4. `apps/business-web`, `apps/admin-web` — или admin в mobile временно
5. `packages/ai-core`, `services/ai-orchestrator` — scaffold
6. Tests + CI

## Команды проверки (после появления кода)

```powershell
npm run lint
npm run test
npm run build
cd apps/mobile && flutter analyze && flutter test
docker compose -f infra/docker/docker-compose.dev.yml ps
```
