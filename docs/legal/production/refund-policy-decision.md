# Refund and cancellation — decision record (unresolved)

**Stage:** 6.15L.3
**Status:** LEGAL REVIEW REQUIRED — **do not publish Public Offer** until `[REFUND_POLICY — LEGAL REVIEW REQUIRED]` is replaced with counsel-approved text.

## Product facts (repository evidence, not legal rules)

### Paid business plan (PlanPayment)

- Purchase creates **PlanPayment** in **PENDING** state; operator/admin confirms payment manually (no automated payment gateway in repo).
- Plan tier activation timing tied to confirmation workflow (not instant card capture).
- **Same-tier renewal** and **upgrade** paths exist; **downgrade** restricted by product rules.
- **No automated refund engine** in codebase.
- Amount/duration semantics fixed in plan catalog — not changed in 6.15L.x.

### Advertising (Order / Payment)

- **Order** creation from Business Web / Mobile owner monetization checkout after contextual legal acceptance (when published/enforced).
- **Payment** confirmation manual; campaign provisioning follows order/moderation flows.
- **VIP / creative moderation** can leave orders in pending/rejected states — paid period may not start until approval (exact money handling = **LEGAL REVIEW REQUIRED**).
- Cancellation capabilities exist in product lifecycle but **refund linkage is not automated**.

## Placeholder in draft / production candidate

- RU/KK Public Offer: `**[REFUND_POLICY — LEGAL REVIEW REQUIRED]**`
- Advertising Rules reference refund consequences via Offer.

## Questions for counsel and operator (not answered here)

1. When is refund **mandatory** vs discretionary under KZ law and Offer?
2. **Partial refund** formula if campaign partially served?
3. **Rejected advertising creative** after payment — full refund, credit, or rework?
4. Campaign **cancelled before start** — refund timing and fees?
5. Campaign **partially served** — pro-rata rules?
6. **Erroneous duplicate payment** / double PlanPayment?
7. Plan purchased but **not activated** or unused period?
8. **Service outage** affecting paid placement or plan features?
9. **Chargeback / payment reversal** process (manual ops)?
10. **Taxes and fees** disclosure in refund calculations?

## Next action

Approve refund section in RU/KK Offer → update production candidates → remove placeholder → re-run publication validation → counsel sign-off.
