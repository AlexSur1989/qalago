# Stage 6.5.2 — Mobile Owner Team Management

## Architecture

- **Authoritative backend:** existing `BusinessTeamService`, `BusinessInvitationService`, `PlanLimitsService`.
- **Flutter:** `CatalogRepository` team methods + Riverpod `ownerTeamSnapshotProvider(businessId)`.
- **RBAC UI:** `OwnerNavItem.team` and dashboard tile visible only when `isOwner(access)`.
- **No duplicate team system** — same REST contract as Business Web.

## Endpoints used

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/businesses/:businessId/team` | Members + pending invitations |
| POST | `/businesses/:businessId/team/invite` | Email invite + permissions |
| PATCH | `/businesses/:businessId/team/:membershipId` | Update permissions / status |
| DELETE | `/businesses/:businessId/team/invitations/:invitationId` | Revoke pending invite |
| GET | `/businesses/:businessId/plan` | Manager slot usage (`plan.team`) |
| POST | `/invitations/resolve` | Public resolve by token |
| POST | `/invitations/accept` | Authenticated accept |

## Roles & permissions

- **OWNER:** full team management (list, invite, edit, suspend, restore, revoke invitation).
- **MANAGER:** no team screen in nav; backend enforces OWNER-only mutations.
- Permissions: `BusinessPermission` enum (10 values) with RU labels aligned to Business Web.
- Presets: Управляющий, Контент-менеджер, Маркетолог, Аналитик.

## Invitation model

- Primary invite identifier: **email** (`InviteTeamMemberDto.email`).
- Response may include `inviteUrl` for manual delivery; **`rawToken` is not persisted or logged** in mobile.
- UX copy: «Приглашение создано» + copy link — not «Письмо отправлено».

## Manager limits

- Loaded from `GET /businesses/:id/plan` → `team.slotsUsed`, `team.limit`, `team.canAddManager`.
- Pending invitations count toward slots (backend `countManagerSlotsUsed`).
- No hardcoded FREE/BUSINESS/PRO/VIP numbers in UI.

## Mobile invitation acceptance

- Route: `/invite/:token` (guest can open; login required before accept).
- Flow: resolve → show business/status → login if needed → explicit «Принять приглашение» → accept → `/owner`.
- **Deferred:** production Universal Links / App Links infrastructure.

## Security

- OWNER-only UI gating; backend remains authoritative.
- Invitation token not logged, not stored in persistent local storage, not sent to analytics.
- Friendly error mapping (`team_error_utils.dart`) — no raw Dio in UI.

## QA (automated)

- Flutter: `flutter test`, `flutter analyze`
- Backend: `npm test`, `npm run build` (no backend changes in Stage 6.5.2)

## Deferred / limitations

- Team audit history UI (API exists; not in mobile MVP scope).
- Transactional email delivery.
- Production deep link domain configuration for invites.
