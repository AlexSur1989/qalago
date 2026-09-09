# Privacy data inventory — QalaGo (Stage 6.3)

Repository truth as of Stage 6.3. **Legal retention justifications marked REVIEW require counsel.**

| Data category | Fields / examples | Source | Purpose | Req/opt | Stored where | Third party | Retention (current) | On account deletion | Google Play | Apple | Notes |
|---------------|-------------------|--------|---------|---------|--------------|-------------|---------------------|----------------------|-------------|-------|-------|
| Account identity | userId, role, isActive | Auth | Access control | Required | PostgreSQL User | — | Until deletion | Anonymized row kept | Account info | User ID | |
| Display name | name | User input | Profile, reviews | Optional | User | — | Until deletion | Cleared | Name | Name | |
| Phone (OTP) | phone E.164 | OTP verify | Login, legacy invite | Opt for social | User | — | Until deletion | → deleted:… | Phone number | — | Social users null |
| Email (canonical) | email | Rare/manual | Contact | Optional | User | — | Until deletion | Cleared | Email | — | Not set on social create |
| AuthIdentity | provider, providerUserId | Google/Apple token | Login | Opt | AuthIdentity | Google/Apple verify | Until deletion | Deleted + tombstone | — | User ID | email metadata only |
| Tombstone | provider, providerUserId | Deletion | Block re-register | — | AuthIdentityTombstone | — | Indefinite | Created | — | — | No email stored |
| City preference | preferredCityId | User pick | Catalog scope | Optional | User | — | Until deletion | Cleared | — | — | |
| Favorites | businessId | User action | UX | Optional | Favorite | — | Until deletion | **Deleted** | — | — | |
| Reviews | rating, text | User | UGC | Optional | Review | — | Until deletion | **Deleted** | — | — | |
| Notifications | type, payload | System | UX | — | Notification | — | Until deletion | **Deleted** | — | — | |
| OTP codes | codeHash, phone | Auth | Login | — | OtpCode | — | TTL 5 min | **Deleted** | — | — | |
| Business profile | title, address, lat/lng, contacts | Owner | Catalog | Business | Business | — | Business lifecycle | Not consumer deletion | Location | — | |
| Team invite | email, phone, tokenHash | Owner | Manager access | — | BusinessInvitation | — | 7d / status | Pending revoked if sender deletes | Email | — | |
| Membership | role, permissions | System | RBAC | — | BusinessMembership | — | — | REVOKED | — | — | |
| Analytics event | type, trafficSource, searchQuery, audienceDistanceBucket, sessionId | Client | Stats | — | AnalyticsEvent | — | Indefinite | **No userId** stored | App activity | Analytics | |
| Ad session | sessionId (client) | Client | Ad caps | — | AnalyticsEvent | — | — | — | Device/other | — | First-party ads |
| Orders/payments | amounts, status, userId? | Business | Billing | — | Order, Payment | — | REVIEW | **Retained** | Purchase history | — | No card data |
| Audit log | action, metadata | System | Security | — | AuditLog | — | REVIEW | **Retained** | — | — | |
| Uploads | imageUrl | Owner | Business media | — | Disk + BusinessImage | — | Business | Not user PII | Photos | — | |
| Device location | lat/lng snap | GPS | Sort/map | Optional | **Not stored** server-side for user | OS | Transient query | — | Precise loc | Coarse | Buckets in analytics |
| JWT | sub, phone?, role | Server | Session | — | Client storage | — | 7d default | Invalid if inactive | — | — | |
| IP address | — | Request | Rate limit | — | Not in User table | — | Logs REVIEW | — | — | — | |

## Third-party map (active)

| Service | Active | Data shared | Purpose |
|---------|--------|-------------|---------|
| Google Sign-In | Flag-gated | ID token → server | Auth |
| Sign in with Apple | Flag-gated | Identity token → server | Auth |
| OpenStreetMap tiles | Yes | Tile requests (IP to OSM) | Map display |
| Google Fonts | Possible | Font fetch | Typography |

## AI

| Service | Consumer PII to external LLM |
|---------|------------------------------|
| ai-orchestrator | **No** — rule-based only in current code |

## Data export

**IMPLEMENTED:** No  
**Process:** Support email after contact assigned (see legal-review-required.md)
