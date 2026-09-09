# Stage 6.5 — Analytics Data Foundation

Date: 2026-09-10  
Scope: data model, ingest, rollups, privacy, Flutter instrumentation. **Not** Analytics 360 UI (Stage 6.6).

## 1. Current-state audit (pre-6.5)

| Area | Before 6.5 |
|------|------------|
| Storage | Single `AnalyticsEvent` table; no daily rollups |
| Organic events | `VIEW_BUSINESS`, actions, `PROMOTION_VIEW` (no `promotionId`) |
| Impressions | None — API list load ≠ UI impression |
| Idempotency | None |
| Visitor/session | Ads only (`sessionId` on ad pipeline) |
| Timezone | `popularTimes` used UTC hours |
| Search | Normalized query on `VIEW_BUSINESS` + threshold ≥3 |
| Geography | Coarse buckets + threshold ≥10 views |
| Benchmark | Category cohort threshold ≥5 peers |
| Retention | Indefinite raw events |

## 2. Event taxonomy (canonical)

**Discovery:** `BUSINESS_IMPRESSION`, `VIEW_BUSINESS`, `SEARCH_PERFORMED`, `SEARCH_RESULT_IMPRESSION`, `SEARCH_RESULT_OPEN`  
**Actions:** `CALL_CLICK`, `WHATSAPP_CLICK`, `ROUTE_CLICK`, `WEBSITE_CLICK`, `INSTAGRAM_CLICK`, `FAVORITE_ADD`, `FAVORITE_REMOVE`  
**Promotions:** `PROMOTION_IMPRESSION`, `PROMOTION_VIEW`, `PROMOTION_ACTION`  
**Catalog:** `CATALOG_ITEM_IMPRESSION`, `CATALOG_ITEM_VIEW`, `CATALOG_ITEM_ACTION`  
**Reviews:** `REVIEWS_VIEW`, `REVIEW_CREATED`  
**Ads:** unchanged — `AD_*` via `/monetization/ads/events`

Legacy `VIEW_BUSINESS` remains the canonical business **open/view**.

## 3. Impression semantics

- Fired only when entity is **≥50% visible for 500ms** (`OrganicViewabilityTracker`).
- **Once per entity per session surface** (client dedup via `AnalyticsImpressionController`).
- Not fired for: prefetch, off-screen items, sponsored ad cards (ad pipeline unchanged).
- Flutter: `TrackedBusinessCard`, `BusinessImpressionHost`.

## 4. Visitor / session model

| Concept | Implementation |
|---------|----------------|
| Visitor | Random 32-byte hex in `SharedPreferences`; sent as `visitorId`; stored as SHA-256 `visitorHash` |
| Session | In-memory id; rotates after **30 min** inactivity |
| Authenticated user | **No** raw `userId` in analytics events |
| Business dashboards | Aggregates only — never visitor list |

## 5. Privacy model

- No PII, GPS, review text, or raw `userId` in `AnalyticsEvent`.
- Search queries normalized; business UI threshold **≥3** (`MIN_SEARCH_QUERY_DISPLAY_COUNT`).
- Geography: coarse buckets only; display threshold **≥10** views.
- Benchmark: anonymized category cohort **≥5** businesses.
- Internal traffic: `isInternal=true` or header `X-QalaGo-Internal-Analytics: 1`.

## 6. Rollup architecture

- **`AnalyticsDailyMetric`**: per business + local `metricDate` (YYYY-MM-DD in `City.timezone`).
- **`AnalyticsDailyDimensionMetric`**: controlled dimensions (`SOURCE`, `SEARCH_QUERY`, `PROMOTION`, `CATALOG_ITEM`, `HOUR`, `DISTANCE_BUCKET`).
- **Job:** `AnalyticsRollupScheduler` cron `15 2 * * *` UTC → yesterday per business timezone.
- Idempotent: upsert daily row; replace dimension rows for date.
- Trends API prefers rollups when present; falls back to raw events.

## 7. Retention

| Layer | Policy |
|-------|--------|
| Raw `AnalyticsEvent` | **90 days** (`RAW_ANALYTICS_EVENT_RETENTION_DAYS`) — cleanup via `AnalyticsRetentionService.purgeExpiredRawEvents()` (not auto-scheduled in 6.5) |
| Daily rollups | Long-lived (no auto purge in 6.5) |

## 8. Dedup / idempotency

- Client sends `clientEventId` (UUID-like, max 64 chars).
- Server unique index on `clientEventId`; duplicate → `{ success: true, deduplicated: true }`.

## 9. Plan support matrix (data collected; gating unchanged from 6.4)

| Tier | Foundation enables |
|------|-------------------|
| FREE | views, basic actions, 30d |
| BASIC (+) | impressions, website/IG, promotions, trends |
| PRO (+) | sources, search aggregates, CTR/funnel inputs, dimension rollups |
| VIP (+) | hour heatmap, geography, benchmark inputs, catalog/promotion breakdowns |

## 10. Stage 6.6 readiness

**Available after 6.5:** daily metrics, dimension rollups, impression funnel inputs, promotion/catalog linkage, timezone-correct hours, visitor/session approximations.

**Deferred to 6.6:** Analytics 360 UI, export UX polish, new/returning visitor UI, recommendation engine, weekly reports, named competitors.

## 11. Scaling notes (Stage 7+)

PostgreSQL sufficient for MVP. High-volume path: batch ingest → Redis queue → worker rollups. No ClickHouse/Kafka in 6.5.
