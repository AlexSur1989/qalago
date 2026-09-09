# Stage 6.4 — Subscription Plan Redesign

## Product philosophy

- **FREE** = presence
- **BUSINESS** (internal `BASIC`) = management
- **PRO** (internal `PREMIUM`) = growth and understanding
- **VIP** = intelligence + maximum capabilities

**Subscription ≠ advertising.** Paid plans do not boost organic ranking. Paid visibility uses explicit ad products only.

## Internal enum strategy

Database enum unchanged: `FREE | BASIC | PREMIUM | VIP`.

| Internal | Public name | nameKey |
|----------|-------------|---------|
| FREE | Бесплатный | plan.free |
| BASIC | Бизнес | plan.business |
| PREMIUM | PRO | plan.pro |
| VIP | VIP | plan.vip |

Mapping: `services/catalog-api/src/common/utils/plan-display.util.ts`

## Canonical catalog

Single source of truth: `PLAN_CATALOG` in `services/catalog-api/src/common/services/plan-limits.service.ts`

Exposed via `GET /api/v1/plans`.

## Plan matrix

| | FREE | BUSINESS | PRO | VIP |
|---|-----:|---------:|----:|----:|
| Price KZT/mo | 0 | 4 900 | 9 900 | 19 900 |
| Photos | 5 | 20 | 50 | 100 |
| Products/services | 10 | 50 | 150 | 300 |
| Active promotions | 1 | 3 | 10 | 25 |
| Managers | 0 | 1 | 3 | 10 |
| Review replies | no | yes | yes | yes |
| Extended styling | no | yes* | yes* | yes* |
| Analytics | BASIC | EXTENDED | FULL | ANALYTICS_360 |
| Ad bonus KZT/mo | 0 | 500 | 1 500 | 3 500 |
| Ad discount | 0% | 5% | 10% | 15% |

\*Entitlement defined; no separate theme-builder in repo yet.

## Downgrade behavior

Content preserved (photos, items, promotions, managers). Public slices capped by new limits. Over-limit notice in plan context. Managers over limit: not deleted; `team.overLimit` + block new invites.

## Manager limits

Enforced in `PlanLimitsService.assertCanAddManager()`:
- `BusinessTeamService.inviteManager`
- `BusinessInvitationService.acceptByToken`
- `BusinessMembershipService.claimPendingInvitations` (skips if full)

Pending invitations count toward limit.

## Review replies

FREE blocked at backend (`ReviewsService.reply`). BUSINESS+ allowed with RBAC.

## Ad discount

Resolved at order quote time; snapshotted in `OrderItem`. Historical orders not repriced. `PLAN_ADVERTISING_DISCOUNT_PERCENT` derived from catalog.

## Monthly ad bonus

Catalog + UI only. See [advertising/monthly-ad-bonus-design.md](./advertising/monthly-ad-bonus-design.md).

## Consumer badges

`showPlanBadge` always `false`. Flutter `planBadgeLabel` returns `null`.

## Organic ranking

`compareBusinessTierRank()` returns 0. No plan-based consumer sort.

## Legacy compatibility

Historical `PlanPayment`, orders, and business records with BASIC/PREMIUM remain valid.

## Analytics handoff → Stage 6.5

### Currently supported (approx.)

**FREE (BASIC analytics):** views, call/WhatsApp/route clicks, favorites — partial via existing events.

**BUSINESS (EXTENDED):** + actions, trends — partial.

**PRO (FULL):** traffic sources, search queries, conversion, promotion analytics — partial; many rollups exist.

**VIP (ANALYTICS_360):** benchmark, recommendations, heatmaps, geography — mostly **NOT IMPLEMENTED**; gated in capabilities util only.

### Requires Stage 6.5/6.6 instrumentation

- Full funnel metrics
- Aggregate lost demand
- New vs returning (privacy-safe)
- Category benchmark accuracy
- Product/service analytics depth
- Weekly report generation
- Deterministic recommendations engine

## Deferred

- Monthly ad bonus ledger
- Analytics 360 engine
- Payment acquiring redesign
- Extended styling UI
- Kazakh legal translation of plan copy
