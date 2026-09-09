# Apple App Privacy — draft (Stage 6.3)

**Not submitted.** Map to App Store Connect questionnaire after legal review.

| Apple category | Collected | Linked to identity | Used for tracking | Purpose |
|----------------|-----------|-------------------|-------------------|---------|
| Name | Yes | Yes | No | App functionality |
| Email Address | Yes (provider) | Yes | No | App functionality |
| Phone Number | Optional | Yes | No | App functionality |
| User ID | Yes | Yes | No | App functionality |
| Coarse Location | Yes (bucket) | No | No | Analytics |
| Precise Location | Device-only | No* | No | App functionality |
| Product Interaction | Yes | No | No | Analytics / ads |
| Other Usage Data | Yes | No | No | Analytics |

\* Precise location used on device; server gets query coords transiently and distance buckets in analytics.

## Sign in with Apple

Implemented. Authorization revocation on delete: **NOT implemented** — pre-App Store blocker.

## Third-party partners

- Apple (Sign in with Apple)
- Google (Google Sign-In on iOS)
- OpenStreetMap (map tiles — network request)

No external AI data sharing for consumer features in current code.
