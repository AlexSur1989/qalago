# Stage 6.3 — Privacy, Terms, Account Deletion & Store Compliance

## Summary

Prepared legal/store **foundation** aligned with repository behavior:

- Public pages: `/privacy`, `/terms`, `/account-deletion` (Business Web — deploy to qalago.kz)
- Flutter: legal links + login consent + existing in-app deletion
- Business Web: legal links + login consent
- Documentation: data inventory, Play/Apple drafts, checklists, legal-review list

**Not lawyer-approved.** Placeholders must be replaced before production publication.

## Public host

No standalone qalago.kz marketing app in repo. Legal pages live in **business-web** until dedicated public site exists. Configure:

- `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL=https://qalago.kz`
- Flutter: `QALAGO_PUBLIC_BASE_URL`

## Account deletion truth

See [account-deletion page content](../apps/business-web/app/account-deletion/page.tsx) and [privacy-data-inventory.md](./privacy-data-inventory.md).

## Apple revocation

Carried from B7: **PRE-APP-STORE BLOCKER** — no insecure workaround in 6.3.

## Related docs

- [privacy-data-inventory.md](./privacy-data-inventory.md)
- [legal-review-required.md](./legal-review-required.md)
- [store/store-compliance-links.md](./store/store-compliance-links.md)
