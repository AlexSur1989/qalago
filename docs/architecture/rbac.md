# RBAC — роли и права QalaGo

**Версия:** MVP (Stage 5M.4)  
**Роли:** `USER`, `BUSINESS`, `CITY_ADMIN`, `ADMIN`, `SUPER_ADMIN`

Права проверяются на **сервере** (`services/catalog-api`). UI только скрывает или показывает разделы — обход через API запрещён guard'ами.

---

## Роли

| Роль | Кто это | Где входит |
|------|---------|------------|
| **USER** | Житель города | Mobile |
| **BUSINESS** | Владелец заведения | Mobile, business-web |
| **CITY_ADMIN** | Модератор одного города | Mobile, admin-web |
| **ADMIN** | Операционный администратор платформы | Mobile, admin-web, business-web |
| **SUPER_ADMIN** | Суперадминистратор / governance | Mobile, admin-web, business-web |

---

## Иерархия (Stage 5M.4)

```text
SUPER_ADMIN  → governance + все операции ADMIN
ADMIN        → глобальные операции (без смены системных ролей)
CITY_ADMIN   → managedCityId scope
USER/BUSINESS → без системного admin-доступа
```

`@Roles(ADMIN)` на API допускает **ADMIN + SUPER_ADMIN**.  
`@Roles(SUPER_ADMIN)` — **только SUPER_ADMIN**.

---

## Матрица (Stage 5M.4)

| Возможность | SUPER_ADMIN | ADMIN | CITY_ADMIN |
|-------------|:-----------:|:-----:|:----------:|
| Глобальная модерация бизнеса | ✅ | ✅ | ❌ |
| Модерация в своём городе | ✅ | ✅ | ✅ |
| Аудит (глобальный) | ✅ | ✅ | ❌ |
| Аудит (свой город) | ✅ | ✅ | ✅ |
| Смена системных ролей | ✅ | ❌ | ❌ |
| Создание городов / launch | ✅ | ❌ | ❌ |
| CRUD глобальных категорий (create/delete) | ✅ | ❌ | ❌ |
| Обновление категорий | ✅ | ✅ | ❌ |
| Подтверждение платежей | ✅ | ✅ | city-scoped |

---

---

## Ограничения CITY_ADMIN

- Город задаётся полем `managedCityId` у пользователя.
- `GET /admin/businesses` и `PATCH .../status` — только заведения этого города.
- В admin-web и mobile город **заблокирован** (нельзя смотреть другой город).
- Нельзя: смена системных ролей, создание городов, глобальный CRUD категорий.

---

## Тестовые аккаунты (OTP `1234` при `OTP_DEBUG=true`)

| Телефон | Роль | Город |
|---------|------|-------|
| `+77000000003` | USER | любой |
| `+77000000002` | BUSINESS | Uralsk (владелец) |
| `+77000000004` | CITY_ADMIN | Актобе |
| `+77000000001` | SUPER_ADMIN | все города |
| `+77000000005` | ADMIN | все города (операционный) |

---

## Где enforced в коде

| Слой | Файлы |
|------|--------|
| System governance | `system-access.service.ts`, `SystemAccessService` |
| Город модератора | `city-scope.service.ts` |
| Admin API | `admin.controller.ts` |
| Business membership | `business-membership.service.ts`, `business-access.service.ts` |
| Mobile UI | `role_permissions.dart`, `profile_permissions_screen.dart` |
| Admin-web | `lib/rbac.ts`, login + dashboard |
| Shared | `packages/shared-types/src/rbac.ts` |

---

## AuditLog (Stage 5M.3)

**Назначение:** append-only журнал **безопасностных/операционных** мутаций (не аналитика, не `AnalyticsEvent`).

| Принцип | Правило |
|---------|---------|
| Запись | Только сервер (`AuditLogService.record`) |
| Актор | `actorUserId` + `actorRole` snapshot из auth context |
| Membership | `metadata.membershipRole` = OWNER/MANAGER при business-действиях |
| Scope | `businessId` / `cityId` из загруженного ресурса, не из клиента |
| Metadata | `changedFields`, enum before/after, permission diffs — без секретов/телефонов |
| Immutability | INSERT + READ; нет PATCH/DELETE API |
| Backfill | Нет — аудит с момента деплоя 5M.3 |
| Retention | TBD (пока хранить бессрочно) |

**Чтение:**
- `GET /admin/audit-logs` — ADMIN (global), CITY_ADMIN (`managedCityId` enforced)
- `GET /businesses/:id/team/audit` — OWNER only (team actions)

USER / MANAGER / BUSINESS без admin-доступа **не** читают admin audit logs.

Подробнее: `docs/architecture/business-membership.md`, `docs/architecture/api-contracts.md`.

---

## Смена политики

1. Обновить этот файл и `packages/shared-types/src/rbac.ts`.
2. Синхронизировать `apps/mobile/lib/core/rbac/role_permissions.dart`.
3. Обновить UI подсказки.
4. Добавить/изменить guard на API при новых правах.
