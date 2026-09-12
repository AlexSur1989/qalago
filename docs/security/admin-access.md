# Admin access

## Authentication

- Admin-web uses the same QalaGo auth session as consumers (OTP / dev-login in non-prod).
- **Authorization is separate**: after login, `canAccessAdminWeb(role)` requires a **staff role**.
- Authenticated `USER` without staff access receives **403** on admin API routes and is rejected in admin-web client guard.

## Sessions

- Refresh tokens remain HttpOnly per existing auth architecture.
- SUPER_ADMIN may revoke staff sessions via `POST /admin/staff/:userId/sessions/revoke-all`.
- Disabling staff revokes all sessions and sets `User.role` to `USER`.

## Staff UI

- `/staff` and `/staff/:id` in admin-web — **SUPER_ADMIN only** (server `@Roles(SUPER_ADMIN)` on `/admin/staff/*`).

## Production checklist

- [ ] Bootstrap SUPER_ADMIN via CLI once
- [ ] Verify no staff self-registration endpoints
- [ ] Verify consumer Google/Apple login does not create `StaffAccess`
- [ ] Rotate/bootstrap credentials not stored in git
- [ ] MFA policy documented when enabled in a later stage
