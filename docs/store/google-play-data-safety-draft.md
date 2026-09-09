# Google Play Data Safety — draft (Stage 6.3)

**Not submitted.** Align with [privacy-data-inventory.md](../privacy-data-inventory.md) before Play Console.

| Data type | Collected | Shared | Ephemeral | Required | Purpose | Encrypted in transit (prod) | Deletion |
|-----------|-----------|--------|-----------|----------|---------|----------------------------|----------|
| Name | Yes | No | No | Optional | Account, reviews | HTTPS required | Yes |
| Email | Yes (provider metadata) | No | No | Optional | Auth metadata | HTTPS | Tombstone/block |
| Phone | Yes | No | No | Optional | OTP auth | HTTPS | Anonymized |
| User IDs | Yes | No | No | Required | Account | HTTPS | Anonymized |
| Photos | Business only | No | No | Optional | Business listing | HTTPS | Business scope |
| Location (precise) | Device use | No* | Yes* | Optional | Nearby sort | HTTPS for API | N/A server store |
| App activity | Yes | No | No | — | Analytics, ads | HTTPS | Aggregated retained |
| Search history | Partial | No | No | — | Analytics query on VIEW | HTTPS | No user link |
| Purchase history | Business orders | No | No | — | Monetization | HTTPS | Retained REVIEW |

\* Precise coords sent in API query params transiently; analytics stores distance bucket only.

## Third-party SDKs (Play disclosure)

- Google Sign-In — authentication
- Sign in with Apple — authentication (iOS)
- No Firebase Analytics / AdMob in repo

## Tracking

Cross-app tracking: **No evidence** in current implementation. Internal first-party ad rotation is not third-party tracking.

## Account deletion

In-app: Yes (Flutter Profile)  
Web resource: https://qalago.kz/account-deletion (after deploy)
