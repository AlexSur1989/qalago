# Store compliance links — QalaGo

## Intended production URLs

| Resource | URL | Local implementation | Deploy status |
|----------|-----|----------------------|---------------|
| Privacy Policy | https://qalago.kz/privacy | `apps/business-web/app/privacy` | NEEDS DEPLOYMENT |
| Terms of Use | https://qalago.kz/terms | `apps/business-web/app/terms` | NEEDS DEPLOYMENT |
| Account deletion | https://qalago.kz/account-deletion | `apps/business-web/app/account-deletion` | NEEDS DEPLOYMENT |
| Support | https://qalago.kz/support | Not implemented (placeholder in help) | NEEDS LEGAL DATA |
| Marketing site | https://qalago.kz | Not in repo | FUTURE |

## Dev / staging

Business Web serves pages at `{host}/privacy`, `/terms`, `/account-deletion` (e.g. `http://localhost:3003/privacy`).

Flutter/Business Web link config:

- `QALAGO_PUBLIC_BASE_URL` / `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` → default `https://qalago.kz`

## App deep links

Flutter opens HTTPS URLs in external browser (`url_launcher`).
