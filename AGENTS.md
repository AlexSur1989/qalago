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
6. **Changelog** — каноническая инженерная история: **`docs/changelog.md`** (единственный changelog; не создавать второй). Каждый завершённый stage/substage/hotfix/release gate — запись с **Status**, **Checkpoint (commit SHA)** где был commit, краткий Summary, Deferred, Next. Audit-only stages без commit фиксируются в changelog при следующем implementation stage или docs commit. Physical QA после code commit — в changelog при closure. Changelog включается в **тот же focused stage commit**, что и код (не отдельный «update changelog»). Архитектурные «почему» — в `docs/architecture/*`; roadmap — отдельно; не дублировать final reports в changelog.

### Чеклист stage (START → FINISH)

**START (обязательно перед материальной работой):**

1. Прочитать **`AGENTS.md`** (этот файл).
2. Прочитать **`docs/ai-project-context.md`** (текущий этап, next, debt).
3. Прочитать релевантные **`docs/architecture/*`** для затронутой зоны.
4. Просмотреть последние записи **`docs/changelog.md`** (активный трек, checkpoints).
5. **`git rev-parse HEAD`** и **`git status`** — preflight; не трогать protected/local dirt.
6. Явно определить **текущий stage и scope** до правок; **не** начинать следующий stage без согласования.

**FINISH (после завершённого материального stage):**

1. Обновить **`docs/changelog.md`** фактически (Status, Checkpoint SHA, Summary, Deferred, Next).
2. Обновить **`docs/ai-project-context.md`**, если изменилось текущее состояние проекта.
3. Обновить **`docs/architecture/*`**, если изменился архитектурный контракт.
4. Зафиксировать **implementation checkpoint** точным SHA; audit-only без product-кода — не выдавать за implementation PASS.
5. Сохранить deferred; указать **согласованный next**; **не** молча стартовать следующий stage.
6. Commit: код + changelog в одном focused commit (когда пользователь просит commit); docs-only checkpoint — отдельный docs commit допустим.

**Current-state snapshot:** после завершённых stage, **read-only audit gate** или существенных архитектурных решений обновлять **`docs/ai-project-context.md`**; **`docs/changelog.md`** — историческая лента. Тривиальные правки не требуют правок context. **Read-only audit** в context помечать как **audited / pending implementation**, не как implementation complete. **Не создавать** `MEMORY.md`, `HANDOFF.md`, `PROJECT_STATE.md` и другие параллельные context-файлы — только **`AGENTS.md`**, **`docs/ai-project-context.md`**, **`docs/changelog.md`**, **`docs/architecture/*`**.

**Статусы в отчётах:** **Proposed** → **Agreed** → **Implemented** (diff/commit) → **Verified** (tests, physical QA, read-only audit). Не смешивать audited и implemented.

**Рискованные изменения:** read-only audit → review/approval → отдельная implementation → tests → physical QA при необходимости → changelog/context closure. Cursor **не** автоматически начинает следующий stage.

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
