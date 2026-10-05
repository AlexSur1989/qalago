# Counsel handoff readiness gate

**Stage:** 6.15L.4
**Overall status:** **PARTIALLY READY FOR COUNSEL HANDOFF**

Rationale: The **structural pack** is complete and sendable (candidates + questions + manifests). **Operator identity and infrastructure facts** remain UNKNOWN, so counsel cannot finalize operator-dependent clauses or processor disclosures without follow-up. Policy review can begin in parallel.

---

## Classification key

| Class | Meaning |
|-------|---------|
| READY TO SEND | May transmit to counsel as-is |
| NEEDS OPERATOR FACT | Operator must supply before counsel finalizes text |
| NEEDS TECHNICAL FACT | Engineering/infra must confirm production config |
| NEEDS INTERNAL COMMERCIAL DECISION | Operator business policy (not legal invention) |
| BLOCKED | Cannot proceed without resolution |

---

## Item readiness

| Item | Classification | Notes |
|------|----------------|-------|
| 16 production candidate files RU/KK | READY TO SEND | Placeholders explicit |
| Counsel review pack (cover memo) | READY TO SEND | |
| Counsel question register (14 IDs) | READY TO SEND | Unanswered by design |
| Operator information request | READY TO SEND | Blank questionnaire |
| Placeholder substitution matrix | READY TO SEND | |
| Document review checklist | READY TO SEND | All PENDING COUNSEL REVIEW |
| Legal decision map | READY TO SEND | |
| Processor evidence request | NEEDS OPERATOR FACT + NEEDS TECHNICAL FACT | Forms empty |
| Retention approval sheet | READY TO SEND | Awaiting counsel fill |
| Commercial legal decisions sheet | READY TO SEND | Product behavior documented |
| Final versioning plan | READY TO SEND | Process for 6.15L.5 |
| Handoff manifest | READY TO SEND | |
| Internal approval matrix | READY TO SEND | |
| Counsel return template | READY TO SEND | |
| Operator legal name, BIN, addresses | NEEDS OPERATOR FACT | LEGAL-BLOCK-001 |
| Support / privacy emails, website | NEEDS OPERATOR FACT | LEGAL-BLOCK-002, 003 |
| Refund policy wording | NEEDS INTERNAL COMMERCIAL DECISION + counsel | LEGAL-BLOCK-004; COUNSEL-004 |
| Cross-border disclosures | NEEDS OPERATOR FACT + counsel | COUNSEL-002; hosting/S3/OAuth regions |
| Retention periods | BLOCKED until counsel | COUNSEL-003 |
| Minors / cookies / complaints | BLOCKED until counsel | COUNSEL-005, 006, 007 |
| PD consent mandatory flag | BLOCKED until counsel | COUNSEL-001 |
| Processor DPAs | NEEDS OPERATOR FACT + counsel | Before prod OAuth/FCM/S3/SMS |
| Prisma EPERM (Windows generate) | NEEDS TECHNICAL FACT | Predeploy only; not counsel blocker |
| Publication / enforcement flags | BLOCKED | Do not enable until 6.15L.5 |

---

## Send vs finalize

| Action | Ready? |
|--------|--------|
| Email/share handoff manifest to counsel for **first review** | **YES** |
| Counsel **final approval** without operator fact return | **NO** |
| Production publish | **NO** |
| `LEGAL_ENFORCE_CHECKOUT=true` | **NO** |

---

## Next gate to **READY FOR COUNSEL HANDOFF** (full)

Operator completes `operator-information-request.md` + initial `processor-evidence-request.md` → reclassify operator-dependent items → optional status upgrade before counsel final pass.

**Not production-ready** at any classification above.
