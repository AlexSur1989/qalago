# Commercial–legal decisions sheet

**Stage:** 6.15L.4
**Rule:** Describes **current product behavior** and **legal/contract decisions needed** — does **not** change product semantics.

| Topic | Current product behavior (repo evidence) | Legal / contract decision needed | Owner decision | Counsel approval | Final clause reference (after approval) |
|-------|------------------------------------------|----------------------------------|----------------|------------------|----------------------------------------|
| Refund policy | No automated refund engine | Mandatory vs discretionary refunds; timelines | Operator + counsel | **Required** | Public Offer § refunds — COUNSEL-004 |
| Cancellation (plan) | Manual PlanPayment; tier rules | Cancellation before activation; unused period | Operator + counsel | **Required** | Offer; Business Terms |
| Cancellation (ads) | Order lifecycle + moderation gates | Cancel before start vs after approval | Operator + counsel | **Required** | Offer; Advertising Rules |
| Partial service (campaign) | Serving logic in product; no pro-rata engine | Pro-rata refund or credit formula | Counsel | **Required** | Offer; Advertising Rules |
| Rejected ad creative | VIP/moderation can reject | Payment held/refund/rework | Counsel | **Required** | Advertising Rules; Offer |
| Service outage | No automated SLA credits | Remedy for paid features / ads | Operator + counsel | **Required** | Offer; Business Terms |
| Duplicate payment | Manual ops | Detection and refund process | Operator + finance | **Required** | Offer |
| Payment confirmation | Admin/manual confirm PlanPayment/Order | When obligation starts; receipt | Counsel | **Required** | Offer §5 |
| Plan renewal semantics | Same-tier renewal path exists | Auto-renew vs manual; notice | Counsel | **Required** | Offer; Business Terms |
| Downgrade | Product restricts downgrade | Contractual wording | Counsel | **Required** | Business Terms |
| Upgrade | Upgrade path exists | Proration / effective date | Counsel | **Required** | Business Terms |
| Advertising moderation | Staff moderation cases | Advertiser obligations; takedown | Counsel | **Required** | Advertising Rules |
| Campaign delays | Provisioning after payment confirm | Liability for delay | Counsel | **Required** | Advertising Rules |
| Manual bank transfer | No gateway | Requisites, VAT, proof of payment | Operator + counsel | **Required** | Offer §5.1 — COUNSEL-013 |
| Taxes / fees in refunds | Not computed in code | Disclosure in refund clause | Finance + counsel | **Required** | Offer |

**Source:** `docs/legal/production/refund-policy-decision.md`, monetization flows in 6.15L.2A docs.
