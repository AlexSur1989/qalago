# Data inventory (code-derived)

See also legacy [privacy-data-inventory.md](../privacy-data-inventory.md). Stage 6.9 adds:

| Data | Storage | Public | Deletion (current) | Legal review |
|------|---------|--------|-------------------|--------------|
| LegalAcceptance | PostgreSQL | No | With user cascade | LEGAL_REVIEW_REQUIRED |
| DataRightsRequest | PostgreSQL | No (self only) | Cascade | LEGAL_REVIEW_REQUIRED |
| ContentReport | PostgreSQL | No | Retained for cases | LEGAL_REVIEW_REQUIRED |
| ModerationCase/Action | PostgreSQL | No | Soft retention | LEGAL_REVIEW_REQUIRED |
| GovernmentRequest | PostgreSQL | No | SUPER_ADMIN | LEGAL_REVIEW_REQUIRED |
| SecurityIncident | PostgreSQL | No | SUPER_ADMIN | LEGAL_REVIEW_REQUIRED |

Location: selected city + ephemeral device location for map/search — audit mobile providers for persistence (no precise GPS DB field on User in schema).
