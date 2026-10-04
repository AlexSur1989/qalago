# Cookie and analytics consent — decision record

**Stage:** 6.15L.3
**Status:** LEGAL REVIEW REQUIRED

## Current product facts

| Mechanism | Present | Notes |
|-----------|---------|--------|
| Cookie policy page (`/cookies`) | Yes (Consumer Web, pack-backed) | Text still DRAFT |
| Cookie banner / CMP | **No** | Not implemented |
| `qalago_web_session` | Yes (Consumer Web ads analytics correlation) | First-party; see `cookies-analytics.*.md` |
| Google Analytics / Yandex Metrica | **Not found** in repo consumer web baseline | Absent unless added outside audit |
| Third-party marketing pixels | **Not found** in scoped audit | Re-verify before launch |
| Ads analytics events | Server-side / first-party session correlation | Documented in privacy + cookies drafts |

## Questions for counsel

1. Is a **banner** legally required for current first-party session cookie only?
2. Classification: **strictly necessary** vs **analytics** for `qalago_web_session`?
3. Is **opt-out** or settings UI required even without third-party scripts?
4. If Firebase/analytics expanded later, **prior consent** workflow?

## Out of scope (6.15L.3)

No cookie banner implementation.
