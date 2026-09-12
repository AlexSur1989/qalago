# Moderation system (Stage 6.9)

1. User submits **ContentReport** (reason code + optional text).
2. System opens **ModerationCase** (city scoped when target is city-bound).
3. Admin triages/applies **ModerationAction** (hide/restore/suspend).
4. Affected party may **ModerationAppeal** (owner for business actions).
5. All sensitive mutations audit-logged; reporter identity not exposed to subjects.

Business hide uses `BusinessStatus.BLOCKED` — excludes organic discovery and paid ad serve (ACTIVE only). Reviews/promotions/media use `moderationHidden`.
