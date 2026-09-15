# RU / KK glossary — QalaGo consumer mobile

Canonical product terminology for Flutter `AppLocalizations` (`app_ru.arb` / `app_kk.arb`).

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

## Tooling

- Generate l10n: `flutter gen-l10n` (from `apps/mobile`).
- Hardcoded UI guard (scoped paths): `dart run tool/check_hardcoded_ui_strings.dart`.
