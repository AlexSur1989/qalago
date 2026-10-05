# Processor evidence request

**Stage:** 6.15L.4
**Purpose:** Operator supplies **factual** vendor evidence for counsel and Privacy §8 — **no assumptions** in this template.

For each processor, complete the table row when production configuration is known.

---

## Google OAuth

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | |
| Service name (Google Sign-In) | |
| Production enabled YES/NO | Repo default: **NO** (`GOOGLE_AUTH_ENABLED=false` in env examples) |
| Data categories sent | ID token claims, `sub`, email if returned |
| Processing location / region | |
| Contractual terms (ToS link) | |
| DPA / data processing addendum | |
| Subprocessor list | |
| Security certification (if available) | |
| Cross-border details | |

---

## Apple Sign in with Apple

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | |
| Service name | |
| Production enabled YES/NO | Repo default: **NO** |
| Data categories sent | Identity token, user identifier |
| Processing location / region | |
| Contractual terms | |
| DPA / addendum | |
| Subprocessor list | |
| Security certification | |
| Cross-border details | |

---

## Google Firebase (FCM push)

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | |
| Service name | Firebase Cloud Messaging |
| Production enabled YES/NO | **UNKNOWN** — requires `FIREBASE_*` configuration |
| Data categories sent | Device push token, notification payload |
| Processing location / region | |
| Contractual terms | |
| DPA / addendum | |
| Subprocessor list | |
| Security certification | |
| Cross-border details | |

---

## OpenStreetMap / map tiles

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | OpenStreetMap Foundation + tile server operator |
| Service name | Map tile requests |
| Production enabled YES/NO | **YES** (map features in app) |
| Data categories sent | IP, HTTP request metadata |
| Processing location / region | |
| Contractual terms (ODbL / tile usage policy) | |
| DPA (if separate CDN) | |
| Subprocessor list (CDN) | |
| Security certification | |
| Cross-border details | |

---

## Hosting provider (application runtime)

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | |
| Service name | |
| Production enabled YES/NO | |
| Data categories sent | All application traffic; logs |
| Processing location / region | |
| Contractual terms | |
| DPA / addendum | |
| Subprocessor list | |
| Security certification | |
| Cross-border details | |

---

## PostgreSQL hosting

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | |
| Service name | Managed PostgreSQL |
| Production enabled YES/NO | |
| Data categories sent | Full DB contents |
| Processing location / region | |
| Contractual terms | |
| DPA / addendum | |
| Subprocessor list | |
| Security certification | |
| Cross-border details | |

---

## S3 / object storage

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | |
| Service name | S3-compatible storage |
| Production enabled YES/NO | Dev: commented; prod: **operator** |
| Data categories sent | Business media, uploads |
| Processing location / region | |
| Contractual terms | |
| DPA / addendum | |
| Subprocessor list | |
| Security certification | |
| Cross-border details | |

---

## SMS provider (OTP)

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | |
| Service name | |
| Production enabled YES/NO | Repo: **not selected** |
| Data categories sent | Phone number, OTP content |
| Processing location / region | |
| Contractual terms | |
| DPA / addendum | |
| Subprocessor list | |
| Security certification | |
| Cross-border details | |

---

## Payment provider (acquiring)

| Field | Operator response |
|-------|-------------------|
| Legal entity / provider name | N/A — **no acquirer in repo** |
| Service name | Manual PlanPayment / Order confirmation |
| Production enabled YES/NO | Manual ops **YES** |
| Data categories sent | Payment records in DB |
| Processing location / region | Operator systems |
| Contractual terms | Public Offer / finance SOP |
| DPA | N/A unless gateway added |
| Subprocessor list | |
| Security certification | |
| Cross-border details | |

---

**Cross-reference:** `docs/legal/internal/processor-register.md`
**Counsel question:** COUNSEL-002
