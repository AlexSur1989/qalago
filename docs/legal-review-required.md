# Legal review required — QalaGo (Stage 6.3)

Central list of unresolved legal/business decisions. **Do not publish production legal pages until resolved.**

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Legal operator name | BLOCKER | `LEGAL_OPERATOR_NAME` / `NEXT_PUBLIC_LEGAL_OPERATOR_NAME` |
| 2 | Legal address | BLOCKER | `LEGAL_ADDRESS` |
| 3 | Privacy contact email | BLOCKER | `PRIVACY_CONTACT_EMAIL` |
| 4 | Support contact email | BLOCKER | `SUPPORT_CONTACT_EMAIL` — no fake email in production |
| 5 | Legal jurisdiction / governing law | REVIEW | Terms §12 placeholder |
| 6 | Retention periods (orders, audit, analytics) | REVIEW | Implementation retains; legal basis TBD |
| 7 | Financial/audit record retention justification | REVIEW | account-deletion.service |
| 8 | Minimum user age / children policy | REVIEW | No age gate in app |
| 9 | User content license wording | REVIEW | Terms §10 |
| 10 | Limitation of liability / disclaimers | REVIEW | Terms §11 |
| 11 | Data processor / sub-processor list | REVIEW | Hosting, auth providers |
| 12 | Cross-border processing statement | REVIEW | If applicable |
| 13 | Marketing consent / newsletters | N/A MVP | Not implemented |
| 14 | Business commercial terms (B2B offer) | DEFERRED | Separate from consumer Terms |
| 15 | Kazakh (kk) legal translation | DRAFT | RU draft only; kk marked DRAFT |
| 16 | Apple authorization revocation | PRE-APP-STORE | Stage 6.2B7 gap |
| 17 | Report-review in-app mechanism | PRODUCT GAP | Not implemented — do not claim in store |
| 18 | Consumer data export API | DEFERRED | Support process only |
| 19 | Server log retention policy | REVIEW | IP in rate limit / logs |
| 20 | Production HTTPS deployment | DEPLOY | Required before secure transmission claims |

## Env variables (Business Web / deploy)

```
NEXT_PUBLIC_LEGAL_OPERATOR_NAME=
NEXT_PUBLIC_LEGAL_ADDRESS=
NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=
NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=
NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL=
NEXT_PUBLIC_LEGAL_JURISDICTION=
NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL=https://qalago.kz
```

## Flutter

```
--dart-define=QALAGO_PUBLIC_BASE_URL=https://qalago.kz
```
