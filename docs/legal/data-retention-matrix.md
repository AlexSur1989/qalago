# Data retention matrix

Statuses: **CURRENT_TECHNICAL_BEHAVIOR** | **PROPOSED** | **LEGAL_REVIEW_REQUIRED**

| Class | Current behavior | Legal duration |
|-------|------------------|----------------|
| AuthSession | Rotating refresh; revoke on logout/deletion | CURRENT |
| AuthIdentityTombstone | Permanent block on provider sub | CURRENT |
| Orders/Payments | Not deleted on user delete | LEGAL_REVIEW_REQUIRED |
| Analytics raw | ~90d scaffold (6.5) | CURRENT |
| Moderation cases | Persist until policy defined | LEGAL_REVIEW_REQUIRED |
| AuditLog | Append-only | LEGAL_REVIEW_REQUIRED |

No destructive scheduled purge jobs in Stage 6.9.
