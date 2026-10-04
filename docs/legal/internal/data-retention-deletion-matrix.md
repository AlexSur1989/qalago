# Матрица хранения и удаления данных

**Статус:** DRAFT — LEGAL REVIEW REQUIRED  
**Версия:** 2026-10-03-draft-1

Легенда: **IMPLEMENTED** = текущее поведение кода; **TARGET LEGAL** = целевой срок после counsel (не реализован автоматически).

| Data class | IMPLEMENTED RETENTION | TARGET LEGAL RETENTION | Deletion behavior | Notes |
|------------|----------------------|------------------------|-------------------|-------|
| OtpCode | ~5 minutes TTL | Same | Auto expiry | |
| User account | Until delete request | LEGAL REVIEW | Partial anonymize user row | Favorites/reviews deleted |
| AuthIdentity | Until delete | LEGAL REVIEW | Deleted + tombstone | Tombstone indefinite |
| Favorite, Review, Notification | Until user delete | LEGAL REVIEW | Cascade delete | |
| Business data | Business lifecycle | LEGAL REVIEW | Not part of consumer delete | |
| PlanPayment, Order, Payment | Retained on user delete | LEGAL REVIEW | Not auto-purged | Financial |
| ContentReport, ModerationCase | Persistent | LEGAL REVIEW | No user-trigger purge | Safety |
| AnalyticsEvent | No purge job (indefinite) | LEGAL REVIEW (~90d proposed in 6.5 scaffold) | N/A userId | |
| AuditLog, SecurityIncident | Append-only | LEGAL REVIEW | No auto-delete | |
| LegalAcceptance | With user cascade | LEGAL REVIEW | Deleted with user | |
| PushDevice | Until revoke/delete | LEGAL REVIEW | Device row delete | |
| Web session cookie | Max 30 days client | LEGAL REVIEW | Browser clear | |
| Uploads / BusinessImage | With business | LEGAL REVIEW | File delete policy TBD | S3 if enabled |
| DataRightsRequest | Case completion | LEGAL REVIEW | Admin workflow | |
| Server logs / IP | Not in User table | LEGAL REVIEW | Hosting policy | |

Scheduled purge jobs: **none** in Stage 6.9 (per existing docs).
