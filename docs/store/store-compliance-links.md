# Store compliance links — QalaGo

## Intended production URLs

| Resource | URL | Canonical implementation (current) | Deploy status |
|----------|-----|-----------------------------------|---------------|
| Privacy Policy | https://qalago.kz/privacy | `apps/consumer-web/app/privacy` | NEEDS DEPLOYMENT |
| Terms of Use | https://qalago.kz/terms | `apps/consumer-web/app/terms` | NEEDS DEPLOYMENT |
| Account deletion | https://qalago.kz/account-deletion | `apps/consumer-web/app/account-deletion` | NEEDS DEPLOYMENT |
| Support / Help | https://qalago.kz/help | `apps/consumer-web/app/help` (`/support` → `/help` compat) | NEEDS DEPLOYMENT / LEGAL DATA |
| Public marketing / discovery | https://qalago.kz | `apps/consumer-web` (Consumer Web) | NEEDS DEPLOYMENT |

**Canonical public host:** Consumer Web / **`https://qalago.kz`**. Business Web legacy **`/privacy`**, **`/terms`**, **`/account-deletion`** routes **308 redirect** to Consumer Web (F.7).

## Dev / staging

- **Consumer Web:** `{host}/privacy`, `/terms`, `/account-deletion`, `/help` (e.g. `http://localhost:3005/help`).
- **Business Web:** same paths on `:3003` redirect to Consumer Web origin — do not treat Business Web as canonical legal host.

Flutter / link config:

- `QALAGO_PUBLIC_BASE_URL` / `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` → default `https://qalago.kz`
- Flutter **`LegalConstants`** opens Consumer Web legal URLs in the system browser.

## App deep links

Flutter opens HTTPS URLs in external browser (`url_launcher`). F.6 App Links / Universal Links target **`https://qalago.kz`** (Consumer Web), not a Flutter Web origin.
