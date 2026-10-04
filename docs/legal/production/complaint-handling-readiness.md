# Complaint and support handling readiness

**Stage:** 6.15L.3

## How users submit complaints (implemented)

| Channel | API / UI | Auth | Confirmation to user |
|---------|----------|------|----------------------|
| Content report | `POST /reports` (`ContentReportService`) | Authenticated | Product copy indicates submission; **no separate legal acknowledgment email** verified in repo |
| Review report | Mobile / consumer flows | Yes | Localized success string |
| Data rights | `POST /data-rights/requests` | Yes | Admin workflow; UI may be incomplete |
| Moderation appeal | Schema supports appeals | Partial public self-service | Community draft notes gaps — **LEGAL REVIEW REQUIRED** |
| Support email | Placeholder `[SUPPORT_EMAIL]` | N/A | **Not configured** in legal text |

## Moderation flow (high level)

Report → moderation case → staff actions (status enums in Prisma). **SLA timers not implemented** in product.

## Help / contact pages

- Consumer Web `/help` referenced in architecture; legal contacts depend on operator placeholders.
- Business Web legal accept flows link to Consumer Web legal URLs.

## Gaps before production

1. **Real support and privacy mailboxes** provisioned and monitored.
2. **SLA** for complaints (content, ads, PD requests) — **undefined**; do not invent in legal text.
3. **Appeal channel** completeness vs Kazakhstan platform rules — counsel decision.
4. **Confirmation** messages — counsel decides if statutory wording required.

## Owner actions

| Action | Owner |
|--------|--------|
| Support process + staffing | Operator |
| SLA definition | Operator + counsel |
| Published contact details | Operator |
| Moderation policy alignment | Operator + counsel |
