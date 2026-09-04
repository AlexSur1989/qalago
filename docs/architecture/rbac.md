# RBAC — роли и права QalaGo

**Версия:** MVP  
**Роли:** `USER`, `BUSINESS`, `CITY_ADMIN`, `ADMIN`

Права проверяются на **сервере** (`services/catalog-api`). UI только скрывает или показывает разделы — обход через API запрещён guard'ами.

---

## Роли

| Роль | Кто это | Где входит |
|------|---------|------------|
| **USER** | Житель города | Mobile |
| **BUSINESS** | Владелец заведения | Mobile, business-web |
| **CITY_ADMIN** | Модератор одного города | Mobile, admin-web |
| **ADMIN** | Администратор платформы | Mobile, admin-web, business-web |

---

## Матрица возможностей

| Действие | USER | BUSINESS | CITY_ADMIN | ADMIN |
|----------|:----:|:--------:|:----------:|:-----:|
| Каталог, карта, избранное | ✅ | ✅ | ✅ | ✅ |
| Отзывы | ✅ | ✅ | ✅ | ✅ |
| Заявка на заведение | ✅ | ✅ | ✅ | ✅ |
| Кабинет своего бизнеса | ❌ | ✅ | ✅* | ✅ |
| Акции / статистика своего бизнеса | ❌ | ✅ | ✅* | ✅ |
| Ответ на отзыв | ❌ | ✅ | ✅ | ✅ |
| Модерация заведений | ❌ | ❌ | ✅** | ✅ |
| VIP / Топ | ❌ | ❌ | ✅** | ✅ |
| Черновик подборки (AI) | ❌ | ❌ | ✅** | ✅ |
| Категории каталога (CRUD) | ❌ | ❌ | ✅ | ✅ |
| Управление городами (создание, активация) | ❌ | ❌ | ❌ | ✅ |
| Список пользователей | ❌ | ❌ | ❌ | ✅ |
| Смена ролей | ❌ | ❌ | ❌ | ✅ |
| Admin-web | ❌ | ❌ | ✅ | ✅ |
| Business-web | ❌ | ✅ | ✅* | ✅ |

\* Если у аккаунта есть свои заведения  
\** Только в закреплённом городе (`managedCityId`)

---

## Ограничения CITY_ADMIN

- Город задаётся полем `managedCityId` у пользователя.
- `GET /admin/businesses` и `PATCH .../status` — только заведения этого города.
- В admin-web и mobile город **заблокирован** (нельзя смотреть другой город).
- Нельзя: `GET /admin/users`, `PATCH /admin/users/:id/role`.

---

## Тестовые аккаунты (OTP `1234` при `OTP_DEBUG=true`)

| Телефон | Роль | Город |
|---------|------|-------|
| `+77000000003` | USER | любой |
| `+77000000002` | BUSINESS | Uralsk (владелец) |
| `+77000000004` | CITY_ADMIN | Актобе |
| `+77000000001` | ADMIN | все города |

---

## Где enforced в коде

| Слой | Файлы |
|------|--------|
| API guards | `roles.guard.ts`, `business-owner.guard.ts` |
| Город модератора | `city-scope.service.ts` |
| Admin API | `admin.controller.ts` |
| Mobile UI | `role_permissions.dart`, `profile_permissions_screen.dart` |
| Admin-web | `lib/rbac.ts`, login + dashboard |
| Shared | `packages/shared-types/src/rbac.ts` |

---

## Смена политики

1. Обновить этот файл и `packages/shared-types/src/rbac.ts`.
2. Синхронизировать `apps/mobile/lib/core/rbac/role_permissions.dart`.
3. Обновить UI подсказки.
4. Добавить/изменить guard на API при новых правах.
