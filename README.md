# QalaGo

Городской super-app для Казахстана. Старт: **Уральск**. Масштаб: **вся KZ**.

Каталог заведений, карта, акции, связь с бизнесом, кабинет предпринимателя, админка. Позже — бронирование, лояльность, QR, AI-рекомендации.

## Статус

**MVP foundation** — `services/catalog-api` + `apps/mobile` + `apps/admin-web`.
Seed covers Uralsk first and Aktobe as a second-city smoke test. PostgreSQL is required for the API.

## Стек (план)

| Слой | Технология |
|------|------------|
| Mobile | Flutter, Riverpod, Go Router |
| API | NestJS, Prisma, PostgreSQL |
| Web panels | Next.js, TypeScript |
| AI | packages/ai-core + services/ai-orchestrator |
| Infra | Docker, GitHub Actions |

## Структура monorepo

```text
apps/           — deployable приложения (mobile, admin-web, business-web)
services/       — backend-сервисы (catalog-api, ai-orchestrator, …)
packages/       — shared-types, api-client, ai-core, agents
docs/           — архитектура, API, агенты
tests/          — unit, integration, e2e, contract
infra/          — docker, CI, env examples
scripts/        — dev, seed, deploy
```

## Быстрый старт (когда появится код)

```powershell
# 1. Инфраструктура
docker compose -f infra/docker/docker-compose.dev.yml up -d

# 2. Зависимости (из корня)
npm install

# 3. API
cd services/catalog-api
cp ../../infra/env/.env.example .env
npm run start:dev

# 4. Mobile
cd apps/mobile
flutter pub get
flutter run
```

## Документация

- [Архитектура](docs/architecture/overview.md)
- [Модули](docs/architecture/modules.md)
- [API-контракты](docs/architecture/api-contracts.md)
- [AI-агенты](docs/agents/overview.md)
- [Правила для AI-разработчиков](AGENTS.md)

## Принципы

1. Multi-city с первого дня (`City` + `cityId`), запуск с одного города.
2. Бизнес-логика в `services/` и `packages/`, не в UI.
3. API меняется только вместе с `docs/architecture/api-contracts.md`.
4. AI-агенты — через orchestrator, с allowlist tools.
5. Сначала план, потом код.

## Лицензия

Proprietary. All rights reserved.
