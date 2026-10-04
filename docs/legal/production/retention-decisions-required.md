# Retention decisions required (counsel / operator)

**Stage:** 6.15L.3
**Implemented behavior:** see `docs/legal/internal/data-retention-deletion-matrix.md`
**Rule:** Do not invent statutory durations here.

## Summary table

| Data category | IMPLEMENTED (code/docs) | TARGET LEGAL | Legal basis status |
|---------------|-------------------------|--------------|-------------------|
| OTP | ~5 min TTL | Same (factual) | OK for OTP mechanics; counsel confirms wording |
| User account | Until delete request; partial anonymize | LEGAL REVIEW REQUIRED | Not finalized in public Privacy |
| AuthIdentity | Delete + tombstone (indefinite tombstone) | LEGAL REVIEW REQUIRED | Tombstone retention undecided |
| Favorites / reviews / notifications | Cascade on user delete | LEGAL REVIEW REQUIRED | |
| Business applications / claims | Persistent business lifecycle | LEGAL REVIEW REQUIRED | |
| Content reports / moderation | Persistent | LEGAL REVIEW REQUIRED | Safety / legal hold |
| Push tokens | Until revoke/delete | LEGAL REVIEW REQUIRED | |
| Analytics / ad events | No purge job; indefinite | LEGAL REVIEW REQUIRED | No userId on AnalyticsEvent (factual) |
| Orders / payments / PlanPayment | Retained on user delete | LEGAL REVIEW REQUIRED | Financial retention |
| Legal acceptances | Cascade with user | LEGAL REVIEW REQUIRED | Evidence retention |
| Audit logs / security incidents | Append-only; no auto-delete | LEGAL REVIEW REQUIRED | |
| Uploaded media | With business; S3 optional | LEGAL REVIEW REQUIRED | File delete policy TBD |
| Data-rights requests | Admin workflow | LEGAL REVIEW REQUIRED | SLA not defined |
| Server logs / IP | Not in User table | LEGAL REVIEW REQUIRED | Hosting policy |
| Web session cookie (`qalago_web_session`) | Client max ~30 days (docs) | LEGAL REVIEW REQUIRED | Cookie policy |

## Decisions still required

1. Statutory and operational retention for **financial records** (PlanPayment, Order, Payment) after account deletion.
2. **AnalyticsEvent** and ads analytics retention cap and anonymization.
3. **Moderation / reports** minimum retention and erasure exceptions.
4. **AuditLog / SecurityIncident** retention period and access controls in public Privacy.
5. **Tombstone** records for auth identities — lawful basis and duration.
6. **Scheduled purge jobs** — product has none; counsel decides if mandatory for launch narrative.

No schema or purge implementation in 6.15L.3.
