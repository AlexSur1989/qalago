# QalaGo — локальный запуск

## 1. PostgreSQL

Docker не установлен на машине — используйте один из вариантов:

**A. Docker Desktop** (рекомендуется):
```powershell
npm run dev:infra
```

**B. Локальный PostgreSQL** — создайте БД и пользователя:
```sql
CREATE USER qalago WITH PASSWORD 'qalago_dev';
CREATE DATABASE qalago_dev OWNER qalago;
```

Скопируйте env:
```powershell
Copy-Item infra\env\.env.example services\catalog-api\.env
# Отредактируйте DATABASE_URL под ваш PostgreSQL
```

**Prisma / DATABASE_URL (Windows):** Prisma reads process env **before** `.env`. Не задавайте `$env:DATABASE_URL` в PowerShell с кавычками внутри значения — URL должен начинаться с `postgresql://`. Если Prisma пишет «URL must start with postgresql://», выполните `Remove-Item Env:DATABASE_URL` и повторите команду.

## 2. Backend

```powershell
cd services\catalog-api
npm install
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npx prisma migrate deploy
npm run seed
npm run start:dev
```

Проверка: http://localhost:3002/api/v1/health

## Порты (localhost)

| Сервис | URL |
|--------|-----|
| API (catalog-api) | http://localhost:3002/api/v1 |
| Admin web | http://localhost:3001 |
| Business web | http://localhost:3003 |
| AI orchestrator | http://localhost:3004/api/v1 |
| Flutter Web DEV/QA preview | http://localhost:8080 (local only — not production public site) |
| Consumer Web (public browser) | http://localhost:3005 |

Полный стек одной командой из корня репозитория:

```powershell
npm run dev:all
# или перезапуск:
.\scripts\dev\restart-all.ps1
```

## 3. Flutter Mobile / Flutter Web

- **`:3005`** — Consumer Web — local stand-in for the **public browser** frontend (`npm run dev:consumer`).
- **`:8080`** — Flutter Web DEV/QA preview when using `npm run dev:all` (full app in browser; **not** `qalago.kz`).

```powershell
cd apps\mobile
flutter pub get
flutter run -d chrome   # Flutter Web — local DEV/QA only
```

Тестовый вход: `+77000000003`, OTP из ответа API (при `OTP_DEBUG=true`).

## 4. Shared types

```powershell
cd packages\shared-types
npm install
npm run build
```
