# Staff oversight (Stage 6.9.2)

SUPER_ADMIN-only reporting for governance (read-only):

- `GET /admin/reports/staff` — counts, role distribution, recent critical audit actions.
- `GET /admin/reports/staff/:userId` — role, city scopes, sessions count, audit timeline.
- `GET /admin/reports/staff/anomalies` — deterministic thresholds (e.g. high privileged action volume in 24h). Wording: **requires review**, not fraud accusations.

## Excluded

- Tokens, MFA secrets, passwords, provider tokens.
- **MFA compliance metrics** — not implemented; responses may include `mfaStatus: NOT_IMPLEMENTED`.
- Admin UI staff detail shows: **«MFA: не настроено — функция ещё не внедрена»** (no “protected” MFA state).
## Related

- Staff mutation APIs remain `/admin/staff/*` with step-up where required.
- Audit detail remains `/admin/reports/audit` (SUPER_ADMIN) and existing `/admin/audit-logs` for operational audit (`AUDIT_VIEW`).
