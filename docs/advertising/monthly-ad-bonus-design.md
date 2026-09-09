# Monthly advertising bonus — design note (Stage 6.4)

## Status

**NOT IMPLEMENTED** as a ledger/wallet in Stage 6.4.

Canonical plan catalog exposes `monthlyAdBonusKzt` for UI and documentation only.

## Approved amounts (KZT / month)

| Internal tier | Public plan | Bonus |
|---------------|-------------|-------|
| FREE | Бесплатный | 0 |
| BASIC | Бизнес | 500 |
| PREMIUM | PRO | 1 500 |
| VIP | VIP | 3 500 |

## Product definition

Internal QalaGo advertising credit — **not** cash, withdrawable balance, or bank money.

## Unresolved rules (require finance + legal)

1. Issue date (calendar month vs billing anniversary)
2. Monthly renewal and idempotency
3. Expiration / carry-over policy
4. Upgrade mid-cycle (proration?)
5. Downgrade mid-cycle
6. Subscription cancellation / refund interaction
7. Which ad products accept bonus (all product lines vs subset)
8. Discount ordering: plan % discount vs bonus application
9. Ledger + audit requirements
10. Fraud/abuse prevention

## Stage 6.4 scope

- Represent bonus in `PLAN_CATALOG`
- Show in Business Web / owner UI copy
- Do **not** implement `balance += bonus` without ledger model

## Related

- [stage-6-4-plan-redesign.md](../stage-6-4-plan-redesign.md)
- Ad discount snapshot: existing `OrderItem` pricing at creation time
