# Перечень необходимых и достаточных персональных данных

**Статус:** DRAFT — LEGAL REVIEW REQUIRED
**Версия:** 2026-10-03-draft-1
**Источник:** `docs/privacy-data-inventory.md`, `schema.prisma`

Counsel должен сопоставить перечень с действующими правилами РК на 2026-10-03.

| Data category | Field/model | Purpose | Required/optional | Collection source | Retention (implemented) | Recipient | Legal review notes |
|---------------|-------------|---------|-------------------|-------------------|-------------------------|-----------|-------------------|
| Account ID | User.id | Auth, RBAC | Required | System | Until deletion/anonymize | — | |
| Role | User.role | Access | Required | System | Until deletion | — | |
| Name | User.name | Profile, reviews | Optional | User | Until deletion | — | |
| Phone | User.phone | OTP login | Optional (social) | User/OTP | Until deletion | Future SMS TBD | |
| Email | User.email | Contact | Optional | User | Until deletion | — | |
| City pref | User.preferredCityId | Catalog | Optional | User | Until deletion | — | |
| OAuth | AuthIdentity | Login | If provider used | Google/Apple | Until deletion + tombstone | Google, Apple | Cross-border REVIEW |
| OTP | OtpCode | Verify | Transient | Auth | ~5 min | — | |
| Favorites | Favorite | UX | Optional | User | Deleted on user delete | — | |
| Reviews | Review | UGC | Optional | User | Deleted on user delete | Public display | |
| Reports | ContentReport | Safety | On use | User/owner | Retained | Moderators | LEGAL REVIEW |
| Notifications | Notification | UX | On events | System | Deleted on user delete | — | |
| Push token | PushDevice | Push | Optional | Mobile FCM | Until revoke | Firebase | Cross-border REVIEW |
| Business app | BusinessApplication | Onboarding | On apply | Owner | REVIEW | Admin | |
| Business data | Business, BusinessLocation | Catalog | Business | Owner | Business lifecycle | Public | Not consumer PD |
| Team invite | BusinessInvitation | RBAC | On invite | Owner | 7d / status | Invitee email | |
| Plan payment | PlanPayment | Billing | If paid plan | Owner | Retained on user delete | — | LEGAL REVIEW |
| Ad order | Order, Payment | Ads | If ad buy | Owner | Retained | — | LEGAL REVIEW |
| Analytics | AnalyticsEvent | Stats/ads | Automatic | Client | Indefinite (no userId) | — | LEGAL REVIEW |
| Web session | cookie qalago_web_session | Ad correlation | Automatic web | Browser | ~30 days | — | Cookie policy |
| Legal accept | LegalAcceptance | Compliance | Mandatory docs | User action | With user | — | |
| Data rights | DataRightsRequest | Rights | On request | User | Case lifecycle | Admin | |
| Audit | AuditLog | Security | System | System | Indefinite | — | LEGAL REVIEW |
| GPS | Device only | Map/sort | Optional | OS | Not stored server profile | — | Transient |

**Future (marked, not implemented):** SMS provider fields; payment gateway card data — **not in repo**.
