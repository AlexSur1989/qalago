# RU / KK glossary — QalaGo consumer (mobile + web)

Canonical product terminology for Flutter `AppLocalizations` (`app_ru.arb` / `app_kk.arb`) and Consumer Web `apps/consumer-web/lib/locale.ts` (`UI_LABELS`).

| RU | KK | Key (examples) |
|----|-----|----------------|
| Главная | Басты бет | `navHome` |
| Категории | Санаттар | `navCategories` |
| Карта | Карта | `navMap` |
| Избранное | Таңдаулылар | `navFavorites` |
| Профиль | Профиль | `navProfile` |
| Поиск | Іздеу | `homeSearchPlaceholder`, `searchPlaceholder` |
| Рядом с вами | Жаныңызда | `homeNearbySection` |
| Рекомендуем | Ұсынамыз | `homeRecommendedSection` |
| Продвигаемые места | Жарнамалық орындар | `categorySponsored` |
| Акции и предложения | Акциялар мен ұсыныстар | `homePromotionsSection` |
| Все места | Барлық орындар | `categoryAllPlaces` |
| Отзывы | Пікірлер | `businessReviews` |
| Позвонить | Қоңырау шалу | `businessCall` |
| Маршрут | Бағыт | `businessRoute` |
| Сайт | Сайт | `businessWebsite` |
| Поделиться | Бөлісу | `businessShare` |
| Открыто / Закрыто | Ашық / Жабық | `businessOpen`, `businessClosed` |
| Сегодня | Бүгін | `businessToday` |
| Сохранить | Сақтау | `commonSave` |
| Отмена | Болдырмау | `commonCancel` |
| Ещё | Тағы | `commonMore` |
| Попробовать снова | Қайталап көру | `commonTryAgain` |
| Нет данных | Дерек жоқ | `commonNoData` |
| Уведомления | Хабарландырулар | `notificationsTitle` |
| Товары и услуги | Тауарлар мен қызметтер | `businessProductsServices` |
| Для бизнеса | Бизнес үшін | `onboardingForBusinessTitle` |
| Удалить аккаунт | Аккаунтты жою | `deleteAccountButton` |
| Реклама (метка) | Жарнама | `commonAd`, `adSemanticLabel` |
| Кабинет бизнеса | Бизнес кабинеті | `ownerDashboardTitle` |
| Тариф (FREE/BASIC/PRO/VIP) | Тариф | `ownerPlanTierFree`, `ownerPlanTierBasic`, `ownerPlanTierPremium`, `ownerPlanTierVip` |
| Продвижение / реклама (owner) | Насихат / жарнама | `ownerMonetizationTitle`, `ownerPromoteCatalogSubtitle` |
| Команда | Команда | `ownerNavTeam` |
| Менеджер | Менеджер | `ownerDefaultManager`, `onboardingRoleManager` |
| Владелец | Ие | `onboardingRoleOwner` |
| Статистика (owner) | Статистика | `ownerAnalyticsTitle` |

## Content rules

- **Category / Subcategory**: use API `nameRu` / `nameKk` via `displayName(localeCode)` — not ARB.
- **Business names, reviews, menus, promotions**: show backend text as-is unless separate RU/KZ fields exist.
- **City names**: `CityState.nameRu` only today; official names are not translated in UI labels.

## Consumer Web (Stage 6.10B.4)

| RU | KK | `UI_LABELS` field |
|----|-----|-------------------|
| Гид по городу | Қала бойынша нұсқау | `siteDescription` (metadata) |
| Заведения и услуги Уральска | Уральск қаласындағы мекемелер мен қызметтер | `homeTagline` |
| Все (подкатегории) | Барлығы | `allSubcategories` |
| Ещё (категории) | Тағы | `moreCategories` |
| Страница не найдена | Бет табылмады | `notFoundTitle` |
| Повторить | Қайталау | `retry` |

- Locale cookie: `qalago_locale` (`ru` / `kk`, fallback `ru`).
- Hardcoded UI guard: `npm run check:ui-strings` (from `apps/consumer-web`).

## Business Web (Stage 6.10B.5)

| RU | KK | Key (examples) |
|----|-----|----------------|
| Обзор | Шолу | `ownerNavOverview` |
| Мой бизнес | Менің бизнесім | `ownerMgmtMyBusiness` |
| Товары и услуги | Тауарлар мен қызметтер | `ownerPermissionCatalogEdit` |
| Реклама и продвижение | Жарнама және насихат | `ownerNavPromote` |
| Статистика | Статистика | `ownerNavAnalytics` |
| Настройки | Баптаулар | `ownerNavSettings` |
| Тариф | Тариф | `ownerNavPlan` |
| Помощь | Көмек | `ownerNavHelp` |
| Сообщения | Хабарламалар | `ownerNavMessages` |
| Команда | Команда | `ownerNavTeam` |
| Выйти | Шығу | `shellLogout` |
| Русский / Қазақша | (labels) | `localeRu`, `localeKk` |

- Locale stack: `lib/locale.ts` (`UI_LABELS`), `lib/locale-server.ts` / `lib/locale-client.ts`, `components/locale-provider.tsx`, `components/locale-switcher.tsx`; cookie `qalago_locale` (same as consumer web).
- Enum/status copy: `lib/presentation.ts` (plan tiers, business status, monetization, permissions, onboarding errors, analytics KPIs) — aligned with Flutter owner ARB.
- Legal pages (`/terms`, `/privacy`, `/account-deletion`): chrome localized via `legal-page-layout`; **legal body remains RU** until counsel review.
- Hardcoded UI guard: `npm run check:ui-strings` (from `apps/business-web`); dictionaries `locale.ts` + `presentation.ts` only.

## Tooling

- Generate l10n: `flutter gen-l10n` (from `apps/mobile`).
- Hardcoded UI guard (scoped paths): `dart run tool/check_hardcoded_ui_strings.dart`.
