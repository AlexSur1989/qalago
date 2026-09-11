# Stage 6.7D — Advertising UX + Category Discovery

## Previous category sort (`Все места`)

Before 6.7D, the category screen loaded `GET /businesses?categoryId&citySlug&limit=100` with **no `sort` param**. Backend default was **Russian title `localeCompare`** (plan-neutral). Flutter additionally ran `sortNearbyBusinesses` (distance then title), but on the category screen user coordinates were usually absent, so UI order matched **title sort**.

## New category hierarchy (consumer)

1. **Рекомендуем** — organic subset from `sort=recommended` (max 5), excludes paid ad business ids; no «Реклама» label.
2. **Продвигаемые места** — merged `CATEGORY_TOP` + `CATEGORY_BOOST` from ad serve; each card shows «Реклама».
3. **Все места** — full organic list for selected `sort`; paid businesses may appear here if category-eligible; skips only immediate duplicate under sponsored block.

## Organic vs paid

- Paid campaigns do not change organic comparator (no plan/ad tier in sort).
- Impressions: sponsored blocks use existing ad analytics; organic cards use organic tracking.

## Sorting (`sort` query)

| Value | Rule |
|-------|------|
| `recommended` | Title `ru` asc, id tie-break |
| `nearest` | Requires `latitude`+`longitude`; haversine asc within `radiusKm`; title tie-break; without geo → falls back to recommended |
| `rating` | Rated businesses first (avg desc, review count desc); unrated last; title asc |
| `popular` | Sum organic `AnalyticsDailyMetric.views` last 30d desc; title asc |

Default API behavior without `sort`: geo present → nearest; else recommended (backward compatible for geo clients).

## Location / privacy

Nearest uses live `userLocationProvider` (session stream, snapped coords). No new persistence of precise location.

## Owner advertising UX

- `GET /monetization/purchase-states?businessId` is authoritative for card state and primary CTA.
- Quote responses include projected schedule for products/packages (no UI-side schedule recompute).
- Flutter Business Web parity on product list cards.

## Multi-city

All queries use selected `citySlug` / business city; ads serve scoped by category + city context from existing serve API.

## Deferred (6.7QA)

Fast double-buy, stale pending orders, reservation expiry, pagination edge cases, permission transitions, adversarial checkout.
