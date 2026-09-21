# Notification producers (Stage 6.11E.2)

In-app notifications only. Push/FCM deferred.

## Producer matrix

| Event | NotificationType | Recipient | targetType | targetId | Transaction |
|-------|------------------|-----------|------------|----------|-------------|
| New / restored visible review | `NEW_REVIEW` | Active OWNER + MANAGER with `REVIEWS_REPLY`; legacy `ownerId` if no owner membership | `REVIEW` | review id | After review write |
| Owner reply | `REVIEW_REPLY` | Review author (not self-reply) | `REVIEW` | review id | After reply write |
| Moderation hide review | `REVIEW_HIDDEN` | Review author | `REVIEW` | review id | Same `$transaction` as moderation action |
| Moderation restore review | `REVIEW_RESTORED` | Review author (not soft-deleted) | `REVIEW` | review id | Same `$transaction` |
| Business approved/blocked (admin) | `BUSINESS_APPROVED` / `BUSINESS_BLOCKED` | `business.ownerId` | `BUSINESS` | business id | After status update |
| Application approved/rejected | `BUSINESS_APPLICATION_*` | Applicant | `BUSINESS_APPLICATION` | application id | Inside application `$transaction` |
| Claim approved/rejected | `OWNERSHIP_CLAIM_*` | Claimant | `OWNERSHIP_CLAIM` | claim id | Inside claim `$transaction` |
| Email team invite (existing user) | `BUSINESS_INVITATION_RECEIVED` | Matched auth identity user | `BUSINESS` | business id | After invite create |
| Invitation accepted | `BUSINESS_INVITATION_ACCEPTED` | `invitedByUserId` | `BUSINESS` | business id | Inside accept `$transaction` |
| Plan activated | `PLAN_ACTIVATED` | Business owner | `BUSINESS` | business id | After activation |
| Plan expired (lazy sync) | `PLAN_EXPIRED` | Business owner | `BUSINESS` | business id | After conditional `updateMany` |
| Ad creative approved/rejected | `AD_CAMPAIGN_*` | Business owner | `AD_CAMPAIGN` | campaign or creative id | After moderation decision |

## Deferred (E.3+ / infrastructure)

- `REPORT_RESOLVED` for reporters (case/report resolution not immutable enough)
- `NEW_PROMOTION` broadcast or consumer fan-out
- Promotion moderation (no approval workflow)
- Order/payment notifications (defer until production payment semantics stable)
- Phone/email invites without resolvable `userId` (external delivery)
- Instant manager add via phone (no invitation row; no in-app invite event)
- Scheduled plan expiry job (lazy sync remains; duplicate guarded via `updateMany`)
