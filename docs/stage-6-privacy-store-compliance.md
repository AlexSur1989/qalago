# Stage 6.3 — Privacy, Terms, Account Deletion & Store Compliance

## Current state (post-F.7 — authoritative for hosting)

- **Canonical public legal host:** Consumer Web / **`https://qalago.kz`**
- **Canonical routes:** **`/privacy`**, **`/terms`**, **`/account-deletion`** on Consumer Web (`apps/consumer-web`)
- **Business Web:** legacy legal routes **308 redirect** to Consumer Web — not a competing canonical host
- **External legal/content debt:** unchanged — **`docs/legal-review-required.md`** (not production legal approval)

## Summary (Stage 6.3 historical snapshot)

Prepared legal/store **foundation** aligned with repository behavior:

- Public pages: `/privacy`, `/terms`, `/account-deletion` (Business Web — deploy to qalago.kz)
- Flutter: legal links + login consent + existing in-app deletion
- Business Web: legal links + login consent
- Documentation: data inventory, Play/Apple drafts, checklists, legal-review list

**Not lawyer-approved.** Placeholders must be replaced before production publication.

## Public host (Stage 6.3 snapshot — superseded for hosting by F.7)

At Stage 6.3, legal pages were first implemented on Business Web. **Current hosting** is Consumer Web — see **Current state (post-F.7)** above and **`docs/architecture/public-consumer-web.md`** § F.7.

Configure:

- `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL=https://qalago.kz`
- Flutter: `QALAGO_PUBLIC_BASE_URL` / **`LegalConstants`** → Consumer Web URLs

## Account deletion truth

Current page: [apps/consumer-web/app/account-deletion](../apps/consumer-web/app/account-deletion/page.tsx). Inventory: [privacy-data-inventory.md](./privacy-data-inventory.md).

## Apple revocation

Carried from B7: **PRE-APP-STORE BLOCKER** — no insecure workaround in 6.3.

## Related docs

- [privacy-data-inventory.md](./privacy-data-inventory.md)
- [legal-review-required.md](./legal-review-required.md)
- [store/store-compliance-links.md](./store/store-compliance-links.md)
