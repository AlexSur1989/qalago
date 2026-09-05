# Changelog — QalaGo

Все значимые продуктовые и технические нововведения фиксируются здесь.  
Формат: дата → что сделано → что заложить на будущее.

---

---

---

## 2026-09-05 — Этап 4B: Admin monetization UI

**Сделано**
- `apps/admin-web` — раздел «Монетизация»: обзор, заказы, оплаты, кампании, креативы, placements
- Manual payment confirm с idempotency (`alreadyPaid`), VIP preview, campaign pause/resume/cancel
- Read-only каталог цен и пакетов на странице placements
- Backend (без schema): `GET /admin/monetization/creatives`, `GET /admin/monetization/placements`, enriched admin order/payment responses
- Vitest: `monetization-utils.test.ts` (labels, formatters, action matrix)

**Сохранено без изменений**
- Prisma schema, payment gateway, consumer Flutter, owner monetization flow

**Заложить на будущее**
- Stage 4C: price editor; backend filters for campaign status; audit trail; campaign analytics charts

---

## 2026-09-05 — Этап 4A: Business monetization UI (owner)

**Сделано**
- Owner flow: «Продвинуть бизнес» → products/packages → quote → order → campaigns → analytics
- `features/owner/monetization/` — models, labels, formatters, providers, 8 screens
- `CatalogRepository` — monetization API methods (products, quote, orders, campaigns, creatives)
- Dashboard CTA + «Мои продвижения»; plan screen link to monetization
- VIP creative editor + preview (`VipBannerAd.previewMode`)
- Business switcher invalidates monetization providers
- 12 monetization unit tests (29 total Flutter tests)

**Сохранено без изменений**
- Backend schema, Stage 3B consumer ads, organic API, legacy plan mock-checkout

**Заложить на будущее**
- Stage 4B admin payment confirm UI; widget tests for promote flow screens

---

## 2026-09-05 — Этап 3C: Flutter cross-platform build & QA prep

**Сделано**
- Environment audit: Flutter 3.41.7, Dart 3.11.5; Android SDK/JDK absent on audit machine
- `docs/mobile/ANDROID_BUILD.md` — SDK setup, API matrix, build commands, DEV localhost notes
- `docs/mobile/IOS_BUILD_CHECKLIST.md` — Mac/Xcode checklist (static audit only)
- Real HTTP smoke: all 5 ad placements + event POST against DEV backend
- `flutter clean` → analyze (0 errors) → test (17/17) → `flutter build web` OK
- Backend regression: 109 tests + monorepo build OK
- Minor fix: unused import in `test/ads/ad_models_test.dart`

**Заложить на будущее**
- Install Android Studio + SDK; run `flutter build apk --debug` on device/emulator
- Mac/Xcode iOS build verification; add `INTERNET` to main AndroidManifest before release
- DEV cleartext ATS/network config for Android/iOS physical devices
- `--dart-define` API URL for emulator (`10.0.2.2`) without code edits

---

## 2026-09-05 — Этап 3B: Flutter ad integration

**Сделано**
- Mobile: `features/ads/` — sessionId, serve providers, viewability tracker, VIP banner, sponsored business/promotion blocks
- Home: HOME_VIP_BANNER, HOME_PROMOTIONS, HOME_FEATURED (отдельно от organic)
- Category: CATEGORY_TOP, CATEGORY_BOOST + dedup organic list
- `CatalogRepository.serveAds` / `sendAdEvent` (best-effort, failure isolation)
- `BusinessCard.sponsored` optional label; `visibility_detector` for >=50%/1s impressions
- 16 Flutter tests (ads/)

**Сохранено без изменений**
- Organic `GET /businesses`, backend schema/API, admin/business web, go_router structure

**Заложить на будущее**
- Owner campaign analytics screen; widget tests for VIP/sponsored UI with demo seed

---

## 2026-09-05 — Этап 3A: ad serving, fair rotation, analytics

**Сделано**
- `AdRotationService` — fairSort по `qualifiedImpressions/weight`, tie-break hash(sessionId+campaignId+scope), CATEGORY_TOP position 1 через `lastTopPositionAt`
- `AdServingService` — `GET /monetization/ads/serve` (public), фильтры кампаний, AD_SERVED + servedCount
- `AdEventsService` — `POST /monetization/ads/events`, dedupe AD_IMPRESSION 30 мин, click/action counters
- `AdAnalyticsService` — CTR, action groupBy; owner + admin analytics endpoints
- `CampaignExpirationScheduler` — cron */5 min → COMPLETED
- In-memory rate limit guard (120 req/min/IP) для ad events
- `scripts/seed-monetization-demo.ts`, npm script `seed:monetization-demo`
- 34+ unit tests (rotation, serving, events, analytics, expiration)
- Docs: `MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `schema.prisma` (no migration), `GET /businesses`, `business-rank.util.ts`, Flutter/admin/business web

**Заложить на будущее**
- Flutter widgets, period-scoped aggregates from events, Redis optional upgrade

---

## 2026-09-05 — Этап 2: backend monetization core

**Сделано**
- NestJS module `src/modules/monetization/` — catalog, pricing, availability, orders, manual payments, campaign provisioning, creatives
- Public API: products, packages; owner API: quote, orders, campaigns, creatives
- Admin API: orders, payments (manual confirm), campaigns (pause/resume/cancel), creative moderation
- Pricing precedence (city/category/placement/global), legacy plan discounts (BASIC 0%, PRO 10%, TOP_CITY 15%)
- Package pricing without plan discount; idempotent manual payment confirm
- PostgreSQL advisory lock for placement race protection
- Seed: `PromotionPackageItem` for START/BUSINESS/MAX/NEW_PLACE, `PACKAGE` product
- 42 unit tests (pricing, orders, payments, campaigns, availability, RBAC)
- Docs: `docs/MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `PlanPayment`, mock checkout, `/plans`, `business-rank.util.ts`, schema (no new migration)

**Заложить на будущее**
- Этап 3: ad serving, fair rotation, impression/click analytics

---

## 2026-09-05 — Этап 1: campaign-based monetization schema (additive)

**Сделано**
- Новые модели: `AdPlacement`, `MonetizationProduct`, `ProductPrice`, `Order`, `OrderItem`, `Payment`, `AdCreative`, `AdCampaign`, `AdCampaignPlacement`, `PromotionPackage`, `PromotionPackageItem`
- `AnalyticsEvent`: nullable `campaignId`, `placementId`, `sessionId`; enum AD_* values
- Migration `20260905120000_monetization_campaign_architecture` (create-only, не применена автоматически)
- Seed catalog: placements, products, Uralsk prices, packages (`seed-monetization.ts`)

**Сохранено без изменений**
- `Business.planTier`, `planExpiresAt`, `isFeatured`, `featuredSlot`, `PlanPayment`, `PlanLimitsService`

**Заложить на будущее**
- Этап 2: backend services/API для orders/campaigns

---

**Причина**
- Дашборд owner фильтровал акции как `Map`, API возвращает `PromotionModel` → всегда «Нет активных акций»
- FitLife (Базовый тариф): акция на **карточке заведения**, но **не в ленте города** — это по тарифу

**Сделано**
- Исправлен `ownerDashboardProvider`, единые хелперы статуса/дат акций
- Подсказка: «Видна на карточке · не в ленте города (Базовый тариф)»

---

**Причина расхождения**
- Админка показывает **все статусы** (PENDING, ACTIVE, BLOCKED); публичный API — только **ACTIVE**
- Новые заведения от владельцев создаются как **PENDING** до кнопки «Одобрить»
- «Рядом с вами» и категории фильтруют **радиус 3 км** от GPS; если браузер дал координаты **далеко от выбранного города** — список пустой, хотя в админке заведения есть

**Сделано**
- Mobile: если GPS дальше 25 км от центра выбранного города — поиск от **центра города**
- Скрипт `npm run dev:api:sync` — активирует PENDING и проставляет координаты из центра города
- Admin: колонка **«Приложение»** — «В приложении» / «Не в приложении»
- Dev: `npm run dev:restart`, `scripts/dev/restart-all.ps1`, таблица портов в SETUP.md

---

**Сделано**
- Экран категории и блок **«Рядом с вами»** на главной: радиус **3 км** от точки пользователя (GPS или центр города)
- Три блока: **Топ города** → **VIP · Pro** → **Все остальные** (по расстоянию)
- На карточках показывается расстояние, если API вернул `distanceMeters`

**Заложить на будущее**
- Единый вид списка «рядом» на home / search / category

---

## 2026-09-04 — Сортировка каталога по тарифам

**Сделано**
- `GET /businesses`: порядок TOP → PRO → BASIC (с учётом `planExpiresAt`, `featuredSlot`)
- Geo-поиск: сначала тариф, затем расстояние внутри одного tier
- `GET /businesses/recommended/me` — та же сортировка
- Mobile: бейджи **Топ** (TOP_CITY) и **VIP** (PRO)

**Заложить на будущее**
- Денormalized `catalogRank` в БД для больших городов

---

## 2026-09-04 — Mobile owner cabinet parity with business-web

**Сделано**
- Дашборд владельца: KPI за 7 дней, график просмотров, % профиля, тариф, активные акции
- Экраны: `/owner/plan`, `/owner/messages`, `/owner/settings`, `/owner/help`
- Боковое меню кабинета (как навигация business-web)
- Лимиты тарифа в галерее и акциях (как на web)
- API в mobile: `fetchPlans`, `fetchBusinessPlan`, `mockPlanCheckout`

**Заложить на будущее**
- Push-дублирование in-app сообщений
- Видео в галерее

---

## 2026-09-04 — Выбор типа аккаунта при регистрации

**Сделано**
- `POST /auth/verify-code`: опциональный `accountType` (`user` | `business`)
- Новый пользователь получает роль `USER` или `BUSINESS`; существующий `USER` может апгрейдиться до `BUSINESS`
- Mobile: выбор «Пользователь / Бизнес» на экране входа; после входа бизнес → `/owner`
- Business-web: выбор типа на странице логина (по умолчанию «Бизнес»)

**Заложить на будущее**
- Отдельный onboarding для бизнеса без заведения (сразу на форму регистрации)

---

## 2026-09-04 — Phase 2: launchStatus городов + уведомления тарифов

**Сделано**
- `City.launchStatus`: `COMING_SOON` | `LIVE` — admin UI, API cities
- Mobile: другой текст заглушки для городов «скоро откроется»
- In-app уведомления: `PLAN_ACTIVATED`, `PLAN_EXPIRED` при подключении и истечении тарифа
- FAQ по тарифам в business-web «Помощь»

**Заложить на будущее**
- Push (FCM) дублирует in-app уведомления
- Авто-перевод города в LIVE при N заведениях

---

## 2026-09-04 — Тарифы для бизнеса (Basic / Pro / Топ города)

**Сделано**
- Тарифы в БД: `Business.planTier`, `planExpiresAt`, история `PlanPayment` (mock)
- Каталог тарифов и лимиты в `PlanLimitsService`
- API: `GET /plans`, `GET /businesses/:id/plan`, `POST /businesses/:id/plan/mock-checkout`
- Ограничения: фото, активные акции, глубина аналитики, акции в городской ленте
- После mock-оплаты: VIP (`isFeatured`), слот топа для «Топ города»
- Business-web: страница тарифов с кнопкой «Подключить (тест)», дашборд показывает текущий план
- Admin-web: колонка «Тариф», назначение через `PATCH /admin/businesses/:id/plan`
- Автодаунгрейд истёкшего тарифа; лимит фото на странице «Фото» в кабинете
- Инструкция по тарифам: `docs/product/business-tariffs.md`
- Уточнённые лимиты акций: срок, лента, антиспам; даунгрейд лишних акций в DRAFT

**Лимиты**

| | Базовый | Pro | Топ города |
|---|---------|-----|------------|
| Цена | 0 | 9 900 ₸/30 дн. | 19 900 ₸/30 дн. |
| Фото | 5 | ∞ | ∞ |
| Активные акции | 1 | 5 | 10 |
| В ленте города одновременно | 0 | 2 | 5 |
| Срок одной акции | 14 дн. | 90 дн. | 90 дн. |
| Новых акций в день | 1 | 3 | 5 |
| Аналитика | 7 дней | 90 дней | 90 дней |
| VIP в выдаче | нет | да | да |
| Слот «топ города» | нет | нет | да |

**Заложить на будущее**
- Реальная оплата (Kaspi / карта) и webhooks
- Cron даунгрейда при истечении + push-уведомление владельцу
- Лимиты меню/услуг, AI-описания для Top

---

## 2026-09-04 — Mobile: синхронизация города на карте

**Сделано**
- Шапка карты (CityPill) всегда видна и обновляется при смене города
- Карта перелетает к координатам выбранного города (`centerLat/centerLng` из API)
- `CityState` хранит координаты центра; picker передаёт их при выборе
- Единый `invalidateCityScopedProviders` при смене города

---

## 2026-09-04 — Mobile: экран «пустой город»

**Сделано**
- Виджет `EmptyCityView` — «{город} скоро в QalaGo»
- Кнопки: **Выбрать другой город** и **Добавить заведение**
- Показывается на **Главной**, **Категории** и **Карте**, если в городе 0 активных заведений
- Провайдер `cityCatalogTotalProvider` — лёгкая проверка через `meta.total`

**Заложить на будущее**
- Порог «мало контента» (например < 5 заведений) — мягкая подсказка вместо полной заглушки
- Push/email «город запущен» пользователям, выбравшим город заранее
- Admin-флаг `launchStatus: coming_soon | live` вместо только подсчёта бизнесов

---

## 2026-09-04 — Bootstrap категорий + скрытие per-city

**Сделано**
- При `POST /admin/cities` — автокопирование порядка категорий из Уральска
- `CategoryCityOrder.isHidden` — скрыть категорию только в одном городе
- API: `PATCH /admin/categories/:id/city-visibility`
- Admin-web: кнопка «Скрыть/Показать» в категориях; проверка дубликата slug при создании города
- Mobile получает уже отфильтрованный список через `GET /categories?citySlug=`

**Заложить на будущее**
- Копировать порядок из выбранного города (не только uralsk)
- Drag-and-drop сортировка категорий
- Экран «скоро откроем» для пустого города без заведений

---

## 2026-09-04 — Admin: автоподсказки города + координаты

**Сделано**
- API: `GET /admin/geo/search?q=` — geocoding через OpenStreetMap (Nominatim), только ADMIN
- Admin-web: при вводе названия города — выпадающий список подсказок
- При выборе автозаполняются: название, slug, широта, долгота, timezone

**Заложить на будущее**
- Кэш geocoding-ответов на backend (rate limit Nominatim: 1 req/s)
- Платный fallback: Google Places / 2GIS для точности по KZ
- Карта-превью выбранной точки перед сохранением
- Валидация: город уже существует в БД → предупреждение до POST

---

## 2026-09-04 — Admin: управление городами

**Сделано**
- API: `GET/POST /admin/cities`, `PATCH /admin/cities/:id` (только роль **ADMIN**)
- Admin-web: вкладка **«Города»** — форма создания, список, активация/скрытие
- Поля города: `slug`, `nameRu`, `nameKk`, координаты центра, `timezone`, `isActive`
- Автоподсказка slug из названия (транслит)
- Контракт: `docs/architecture/api-contracts.md`, RBAC обновлён

**Заложить на будущее (города)**
| Тема | Зачем |
|------|--------|
| **Bootstrap контента** | При создании города — seed категорий-порядка, demo-бизнесы, VIP-слоты |
| **CITY_ADMIN при запуске** | Wizard: создать город → назначить модератора → checklist перед `isActive` |
| **Границы города** | GeoJSON полигон / `radiusKm` для карты и фильтра «рядом» |
| **Feature flags per city** | Бронирование, доставка, акции — включать по городам |
| **Локализация** | Обязательный `nameKk`, контент на kk для App Store / законодательства |
| **Аналитика** | Дашборд KPI отдельно по городу, воронка запуска |
| **Юридическое** | Оферта, реквизиты, support-контакты per city |
| **Кэш/CDN** | Инвалидация списка городов в mobile/web после POST/PATCH |
| **Миграция slug** | Запретить смену slug после запуска или soft-redirect старых ссылок |
| **Очередь модерации** | Пустой город: UX «скоро откроем» vs полный каталог |

---

## 2026-09-04 — Порядок категорий per-city

**Сделано**
- Таблица `CategoryCityOrder`, API `GET /categories?citySlug=`, admin city-order
- Admin-web: порядок категорий для выбранного города
- Mobile: категории запрашиваются с `citySlug` текущего города

**Заложить на будущее**
- Скрытие категории в конкретном городе (`isVisible` в `CategoryCityOrder`)
- Drag-and-drop сортировка в admin-web
- Копирование порядка из другого города

---

## 2026-09-03 — Admin-web polish + mobile UX

**Сделано**
- Admin shell, KPI, pagination, VIP slots, category inline edit, CITY_ADMIN scope
- Mobile: city picker, owner reviews, search, promotions filters
- Business-web: settings, register, brand theme

**Заложить на будущее**
- Admin-web: split на отдельные routes вместо одной dashboard-страницы
- Geocoding при создании бизнеса (lat/lng из адреса)

---

## Как добавлять записи

```markdown
## YYYY-MM-DD — Краткий заголовок

**Сделано**
- ...

**Заложить на будущее**
- ...
```

Обязательно при каждой заметной фиче (см. `AGENTS.md`).
