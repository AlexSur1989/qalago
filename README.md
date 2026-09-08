# QalaGo

Городской super-app для Казахстана. Старт: **Уральск**. Масштаб: **вся KZ**.

Каталог заведений, карта, акции, кабинет предпринимателя, админка, монетизация и аналитика.

## Статус

**Checkpoint:** `2bacbb3` — Stage **5M.3** (AuditLog foundation + documentation).

| Компонент | Состояние |
|-----------|-----------|
| `services/catalog-api` | Production-ready MVP backend |
| `apps/mobile` | Consumer + membership-aware owner |
| `apps/admin-web` | City/platform moderation + audit logs |
| `apps/business-web` | Owner cabinet + team management + team history |
| `services/ai-orchestrator` | Dev scaffold, proxied via catalog-api |

Подробнее: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)

## Стек

| Слой | Технология |
|------|------------|
| Mobile | Flutter, Riverpod, Go Router |
| API | NestJS, Prisma, PostgreSQL, JWT |
| Web | Next.js, TypeScript |
| AI | packages/ai-core + ai-orchestrator |

## Структура monorepo

```text
apps/           mobile, admin-web, business-web
services/       catalog-api, ai-orchestrator
packages/       shared-types, api-client, ai-core
docs/           architecture, contracts, status
infra/          docker, env examples
scripts/dev/    local setup
```

## Быстрый старт

**Требования:** Node 20+, npm 9+, PostgreSQL (или Docker), Flutter для mobile.

```powershell
# 1. Зависимости
npm install

# 2. Env для API
Copy-Item infra\env\.env.example services\catalog-api\.env
# Отредактируйте DATABASE_URL при необходимости

# 3. PostgreSQL + миграции (не db push)
cd services\catalog-api
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npx prisma migrate deploy
npm run seed
npm run start:dev
# → http://localhost:3002/api/v1/health

# 4. Admin + Business web (из корня)
npm run dev:admin      # :3001
npm run dev:business   # :3003

# 5. Mobile
cd apps\mobile
flutter pub get
flutter run -d chrome
```

Полный стек: `npm run dev:all` — см. [scripts/dev/SETUP.md](scripts/dev/SETUP.md).

**Dev login:** только при `DEV_LOGIN_ENABLED=true` и `OTP_DEBUG=true` в `.env`. В production оба **false**.

## Документация

- [Project status](docs/PROJECT_STATUS.md)
- [Documentation index](docs/README.md)
- [Architecture](docs/architecture/overview.md)
- [RBAC](docs/architecture/rbac.md)
- [API contracts](docs/architecture/api-contracts.md)
- [Changelog](docs/changelog.md)
- [Правила для AI](AGENTS.md)

## Принципы

1. Multi-city с первого дня (`City` + `cityId`).
2. Бизнес-логика в `services/` и `packages/`, не в UI.
3. API меняется только вместе с `docs/architecture/api-contracts.md`.
4. Сначала план, потом код.

## Лицензия

Proprietary. All rights reserved.
