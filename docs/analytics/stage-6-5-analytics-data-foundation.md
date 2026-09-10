# Stage 6.5 / 6.5.1 — Analytics Data Foundation

Date: 2026-09-10 (6.5), 2026-09-10 (6.5.1 instrumentation completion)  
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
- Flutter: `TrackedBusinessCard`, `BusinessImpressionHost`, `TrackedCatalogItemCard`, `MapBusinessPreviewImpression`, `ReviewsViewTracker`.

### Map (Stage 6.5.1)

| Event | When fired | Dedup |
|-------|------------|-------|
| `BUSINESS_IMPRESSION` (`trafficSource=MAP`, `discoverySurface=MAP_PIN`) | User **selects** a business on the map (preview panel opens) **or** a bottom-sheet list tile meets viewability (≥50% / 500ms) | Once per business per session per surface key |
| `VIEW_BUSINESS` (`trafficSource=MAP`, `discoverySurface=MAP_PIN`) | User taps **Подробнее** → business detail opens | Once per detail visit (existing view-once) |

**Not counted:** API marker fetch, map pan/zoom/rebuild, off-screen pins.

### Catalog (Stage 6.5.1)

| Event | When fired |
|-------|------------|
| `CATALOG_ITEM_IMPRESSION` | Item ≥50% visible for 500ms on business-detail preview (`BUSINESS_DETAIL_PREVIEW`) or full catalog screen (`CATALOG_SCREEN`) |
| `CATALOG_ITEM_VIEW` | User taps item when a meaningful action exists (preview tile → open full catalog) |
| `CATALOG_ITEM_ACTION` | **Not wired** — no meaningful per-item action in current UI |

`catalogItemId` required. Impression ≠ API fetch.

### Reviews (Stage 6.5.1)

| Event | When fired |
|-------|------------|
| `REVIEWS_VIEW` | Reviews block ≥50% visible for 500ms on business detail (once per session) |
| `REVIEW_CREATED` | **After successful** `POST /reviews` only — not on button press before API response |

No review text, rating body, or PII in analytics payloads.

### Search funnel (Stage 6.5.1)

Canonical open event remains `VIEW_BUSINESS` (not `SEARCH_RESULT_OPEN`).

Funnel: `SEARCH_PERFORMED` (optional) → `SEARCH_RESULT_IMPRESSION` → `VIEW_BUSINESS` with:

- `trafficSource=SEARCH`
- `discoverySurface=SEARCH_RESULTS` on open
- normalized `searchQuery` where privacy-safe
- `visitorId` / `sessionId` on impression and open

Rollup: `searchImpressions` + `searchOpens` in `AnalyticsDailyMetric`; `SEARCH_QUERY` dimension rows.

## 4. Visitor / session model

| Concept | Implementation |
|---------|----------------|
| Visitor | Random 32-byte hex in `SharedPreferences`; sent as `visitorId`; stored as SHA-256 `visitorHash` |
| Session | In-memory id; rotates after **30 min** inactivity |
| Authenticated user | **No** raw `userId` in analytics events |
| Business dashboards | Aggregates only — never visitor list |

### New / returning (Stage 6.5.1)

| Term | Definition |
|------|------------|
| **NEW** | First meaningful `VIEW_BUSINESS` for this business by this pseudonymous visitor (`visitorHash`) |
| **RETURNING** | Same visitor already recorded in `AnalyticsBusinessVisitor` for that business |

- State table: `AnalyticsBusinessVisitor` (`businessId` + `visitorHash`, first/last seen).
- Set on ingest; stored as `visitorType` on `VIEW_BUSINESS` events.
- Rollup dimension: `VISITOR_TYPE` → aggregates only (`NEW` / `RETURNING` counts).
- Idempotent: unique `(businessId, visitorHash)` + race-safe create; `clientEventId` dedup on events.
- **Never** exposed: individual visitors, raw `visitorId`, userId, phone, email.

## 5. Privacy model

- No PII, GPS, review text, or raw `userId` in `AnalyticsEvent`.
- Search queries normalized; business UI threshold **≥3** (`MIN_SEARCH_QUERY_DISPLAY_COUNT`).
- Geography: coarse buckets only; display threshold **≥10** views.
- Benchmark: anonymized category cohort **≥5** businesses.
- Internal traffic: `isInternal=true` or header `X-QalaGo-Internal-Analytics: 1`.

## 6. Rollup architecture

- **`AnalyticsDailyMetric`**: per business + local `metricDate` (YYYY-MM-DD in `City.timezone`).
- **`AnalyticsDailyDimensionMetric`**: controlled dimensions (`SOURCE`, `SEARCH_QUERY`, `PROMOTION`, `CATALOG_ITEM`, `HOUR`, `DISTANCE_BUCKET`, `VISITOR_TYPE`).
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

**Deferred to 6.6:** Analytics 360 UI, export UX polish, new/returning visitor **UI**, recommendation engine, weekly reports, named competitors.

**Ready after 6.5.1:** map/catalog/review instrumentation, search funnel attribution, NEW/RETURNING aggregates (data layer).

## 11. Scaling notes (Stage 7+)

PostgreSQL sufficient for MVP. High-volume path: batch ingest → Redis queue → worker rollups. No ClickHouse/Kafka in 6.5.
