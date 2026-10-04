# Реестр обработчиков / третьих лиц

**Статус:** DRAFT — LEGAL REVIEW REQUIRED  
**Версия:** 2026-10-03-draft-1  
**Источник:** repo config, `docs/privacy-data-inventory.md`

| Provider | Role | Data | Purpose | Region | Cross-border | Agreement/DPA | Subprocessor | Security review | Legal review | Production enabled |
|----------|------|------|---------|--------|--------------|---------------|--------------|-----------------|--------------|-------------------|
| Google | OAuth | ID token, sub | Sign-In | US/EU (provider) | Likely | **TBD** | Google | **TBD** | REQUIRED | Flag-gated |
| Apple | OAuth | identity token | Sign in with Apple | Apple infra | Likely | **TBD** | Apple | **TBD** | REQUIRED | Flag-gated |
| Google Firebase | Push (FCM) | push token, payload | Notifications | Google infra | Likely | **TBD** | Google | **TBD** | REQUIRED | Config-dependent |
| OpenStreetMap | Map tiles | IP, tile requests | Map UI | OSM / CDN | Possible | OSM license | Various | **TBD** | REQUIRED | Yes |
| S3-compatible | Object storage | Media files | Business images | **Operator selects region** | If non-KZ | **TBD** | Cloud vendor | **TBD** | REQUIRED | Optional env |
| SMS provider | OTP | Phone, OTP | Login | **TBD** | TBD | **TBD** | TBD | **TBD** | REQUIRED | **Not selected** |
| Payment gateway | Acquiring | — | — | — | — | — | — | — | N/A | **None in repo** |
| Hosting / PostgreSQL | IaaS/PaaS | All DB | Core app | **Operator choice** | If abroad | **TBD** | Vendor list | **TBD** | REQUIRED | Dev/local default |

**Do not** treat empty cells as «no processing» — operator must complete before production.
