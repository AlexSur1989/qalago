# Реестр обработчиков / третьих лиц

**Статус:** DRAFT — LEGAL REVIEW REQUIRED
**Версия:** 2026-10-03-draft-1
**6.15L.3 audit:** 2026-10-05 (factual repo/env only; no legal conclusions)
**Источник:** `infra/env/.env.example`, `infra/env/.env.production.example`, `docs/privacy-data-inventory.md`, product code references

| Provider | Role | Data categories | Purpose | Region (known) | Cross-border flag | DPA / agreement status | Production enabled (repo default) | Publication disclosure | Operator action |
|----------|------|-----------------|---------|----------------|-------------------|------------------------|-----------------------------------|------------------------|-----------------|
| Google | OAuth (Sign-In) | ID token claims, `sub`, email if returned | Authentication | **Not proven from config** (provider infra US/EU typical) | **Likely if enabled** | **LEGAL REVIEW REQUIRED** | **NO** — `GOOGLE_AUTH_ENABLED=false` in env examples | Privacy §8 | Enable only with DPA + disclosure |
| Apple | Sign in with Apple | Identity token, user identifier | Authentication | **Not proven from config** | **Likely if enabled** | **LEGAL REVIEW REQUIRED** | **NO** — `APPLE_AUTH_ENABLED=false` in env examples | Privacy §8 | Enable only with DPA + disclosure |
| Google Firebase | FCM push | Device push token, notification payload | Push notifications | **Not proven** (Google infra) | **Likely if configured** | **LEGAL REVIEW REQUIRED** | **UNKNOWN** — requires `FIREBASE_*` secrets | Privacy §8 | Confirm project region + DPA |
| OpenStreetMap / tile CDN | Map tiles | IP, HTTP requests for tiles | Map display | OSM + **CDN path not fixed in repo** | Possible | OSM license terms; DPA **LEGAL REVIEW REQUIRED** | **YES** (map features in app) | Privacy §8, Cookies | Document tile usage |
| S3-compatible storage | Media objects | Business images/files | Media hosting | **Operator-selected** (`S3_REGION` empty in dev) | If region outside KZ | **LEGAL REVIEW REQUIRED** | **NO** in dev (vars commented) | Privacy §8 | Choose region + DPA |
| SMS provider | OTP delivery | Phone number, OTP message | Login OTP | **UNKNOWN — provider not selected** | UNKNOWN | **LEGAL REVIEW REQUIRED** | **NO** — env notes «not selected» | Privacy §8 | Select vendor + DPA |
| Manual payment ops | Billing | PlanPayment, Order records | Plan/ad billing confirmation | Operator systems | N/A | Internal process | **YES** (manual confirm flows) | Offer, Business Terms | Refund policy decision |
| Payment gateway (acquiring) | Card/wallet pay | — | — | — | — | N/A | **NO** — not in repo | N/A | Future stage |
| Hosting / PostgreSQL | App + DB hosting | All application DB categories | Core service | **Operator choice — UNKNOWN in repo** | If abroad | **LEGAL REVIEW REQUIRED** | Dev/docker default; prod **UNKNOWN** | Privacy §8 | Contract + region fact |

**Cross-border:** QalaGo must **not** claim «no cross-border processing» while Google/Apple/Firebase/OSM/S3/hosting may process abroad. Lawful transfer mechanism — **LEGAL REVIEW REQUIRED** (Privacy, PD Consent).

**Do not** treat empty cells as «no processing» — operator must complete before production publication.
