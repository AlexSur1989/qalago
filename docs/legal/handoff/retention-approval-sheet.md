# Retention approval sheet

**Stage:** 6.15L.4
**Source matrix:** `docs/legal/internal/data-retention-deletion-matrix.md`
**Counsel question:** COUNSEL-003
**Rule:** **Do not pre-fill** counsel-approved periods.

| Data category | Current implementation | Proposed / target (engineering scaffold only) | Counsel-approved period | Trigger | Deletion / anonymization method | Legal basis | Decision status |
|---------------|------------------------|---------------------------------------------|---------------------------|---------|--------------------------------|-------------|-----------------|
| OtpCode | ~5 minutes TTL | Same | | Expiry | Auto delete | | PENDING COUNSEL |
| User account | Until delete request | LEGAL REVIEW in matrix | | User request / account closure | Partial anonymize user row; favorites/reviews deleted | | PENDING COUNSEL |
| AuthIdentity | Until delete | LEGAL REVIEW | | User delete | Deleted + tombstone (tombstone indefinite today) | | PENDING COUNSEL |
| Favorite, Review, Notification | Until user delete | LEGAL REVIEW | | User delete | Cascade delete | | PENDING COUNSEL |
| Business data | Business lifecycle | LEGAL REVIEW | | Business closure / contract | Not part of consumer delete | | PENDING COUNSEL |
| PlanPayment, Order, Payment | Retained on user delete | LEGAL REVIEW | | Financial / legal hold | Not auto-purged | | PENDING COUNSEL |
| ContentReport, ModerationCase | Persistent | LEGAL REVIEW | | Case closure policy TBD | No user-trigger purge | | PENDING COUNSEL |
| AnalyticsEvent | No purge job (indefinite) | ~90d proposed in 6.5 scaffold (not implemented) | | Rolling window TBD | Aggregate/anonymize TBD | | PENDING COUNSEL |
| AuditLog | Append-only | LEGAL REVIEW | | Security/compliance | No auto-delete | | PENDING COUNSEL |
| SecurityIncident | Append-only | LEGAL REVIEW | | Incident closure | No auto-delete | | PENDING COUNSEL |
| LegalAcceptance | With user cascade | LEGAL REVIEW | | User delete | Deleted with user | | PENDING COUNSEL |
| PushDevice | Until revoke/delete | LEGAL REVIEW | | Revoke / delete | Device row delete | | PENDING COUNSEL |
| Web session cookie (`qalago_web_session`) | Max 30 days client | LEGAL REVIEW | | Cookie expiry | Browser clear | | PENDING COUNSEL |
| Uploads / BusinessImage | With business | LEGAL REVIEW | | Business/media delete | File delete policy TBD (S3 if enabled) | | PENDING COUNSEL |
| DataRightsRequest | Case completion | LEGAL REVIEW | | Request fulfilled | Admin workflow retention | | PENDING COUNSEL |
| Server logs / IP | Not in User table | LEGAL REVIEW | | Hosting policy | Per hosting provider | | PENDING COUNSEL |

**Implementation note:** No scheduled purge jobs in product (stage 6.9 baseline). Approved periods may require future engineering work — out of scope for 6.15L.4.

**Supporting doc:** `docs/legal/production/retention-decisions-required.md`
