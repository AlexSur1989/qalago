# Notifications — final architecture (Stage 6.11E.6)

## Canonical rule

**In-app `Notification` rows are the product source of truth.**  
Push (FCM) is optional, best-effort delivery. Push failure must never roll back domain actions or corrupt notifications.

## End-to-end flow

```
Domain event (review, moderation, plan, …)
  → producer calls NotificationsService.create / createForUsers
  → PostgreSQL Notification (optionally inside Prisma $transaction)
  → after successful commit: PushDeliveryService.deliverAfterCommit (setImmediate)
  → active PushDevice rows for user
  → PushDeliveryGateway (Noop when PUSH_ENABLED=false, Firebase Admin when configured)
  → Flutter: inbox list + presentAppNotification (RU/KK)
  → tap: resolveNotificationDestination → authorized routes (E.4)
```

There is **one** server creation path (`NotificationsService`). FCM is only invoked from `PushDeliveryService` / gateway implementations.

## Data

- **Notification:** `type`, `title`, `body`, `targetType`, `targetId`, `payload`, `isRead`
- **PushDevice:** unique `token`, `userId`, `platform`, `isActive`, optional client `locale` hint

## API (JWT, user-scoped)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/notifications` | Paginated inbox (default limit 20, max 50) |
| GET | `/notifications/unread-count` | Badge |
| PATCH | `/notifications/:id/read` | Mark one read |
| PATCH | `/notifications/read-all` | Mark all read |
| POST | `/notifications/devices` | Register/refresh FCM token |
| DELETE | `/notifications/devices` | Revoke token (body) |

No client-facing notification **create** endpoint.

## Push configuration

- `PUSH_ENABLED=false` (default local): Noop gateway, no FCM calls; app and API behave normally.
- Production: `PUSH_ENABLED=true` + Firebase Admin env vars (see `infra/env/.env.example`).

### Non-durable dispatch (accepted MVP debt)

Post-commit delivery uses **`setImmediate`** in `PushDeliveryService.deliverAfterCommit`.

| Question | Answer |
|----------|--------|
| Process crash after DB commit, before `setImmediate` runs? | **Yes, possible** |
| In-app notification survives? | **Yes** |
| Push may be lost? | **Yes** |

Document as **best-effort non-durable push**. Future hardening: outbox / queue-backed dispatcher (not required for E.6).

## Push payload (whitelist)

Data-only routing fields: `notificationId`, `type`, `targetType`, `targetId`, optional `businessId` (REVIEW).  
No UGC, secrets, payment data, or arbitrary URLs.

## Flutter

- **Presentation:** `presentAppNotification` + gen_l10n (RU/KK); legacy backend title/body for `GENERAL` / unknown types.
- **Navigation:** `resolveNotificationDestination` — no arbitrary payload URLs; `MODERATION_CASE` / `ORDER` / `PAYMENT` unsupported (mark-read only).
- **Legacy alias:** `REVIEW_NEW` treated like `NEW_REVIEW` in presentation/navigation for old rows.
- **Push:** optional Firebase; builds without `google-services.json`; tap reuses E.4 resolver.
- **F.6 (not implemented):** HTTPS App/Universal Links use a separate parser → typed target pipeline — [deep-links.md](./deep-links.md). **Do not** add arbitrary URL fields to FCM; E contour remains closed.

## Business Web

List, pagination, type labels, mark read / mark all, unread badge via `lib/api.ts`.  
**Deferred:** in-app target deep links (E.4 scope was mobile-only).

## External gates (not E.6 blockers)

- Firebase project + Android/iOS config files
- Apple Push capability + APNs key
- Live FCM physical delivery test
- Local DB: apply migration `20260921160000_stage_6_11e5_push_device` if PushDevice table missing (resolve any obsolete local-only migration drift first)

## Deferred product scope

Push preference center, marketing/guest push, delivery analytics/outbox, Web notification target navigation, scheduled plan-expiry job (lazy sync remains).

---

## KZ-C.1D — Localized presentation (contract lock)

**Status:** **KZ-C.1D.1 PASS — architecture locked** (docs only; **not implemented**). Full contract: **[notification-localization.md](./notification-localization.md)**.

**Decision (summary):** **Server-side typed bilingual templates (Option B)** at push send time and for Business Web inbox. **One** persisted `Notification` row; **per-device** push locale via `PushDevice.locale` (null/invalid → **kk**). Persisted `title`/`body` remain **legacy/API fallback**, not authoritative for typed OS/Web display. **Flutter in-app** keeps E.3 `presentAppNotification` + ARB; parity via tests.

**Unchanged from E:** FCM **data** whitelist, E.4 navigation, single `NotificationsService` create path, no client create API, no Prisma migration for KZ-C.1D.

**Implementation deferred** until agreed **KZ-C.1D** code stage; physical push QA deferred **KZ-C.1F**.
