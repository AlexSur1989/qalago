# Counsel return template

**Stage:** 6.15L.4
**Instructions for counsel:** Return one section per document or one consolidated pack. Use this template so the operator can execute stage **6.15L.5** without ambiguity.

---

## Per-document return block

```text
Document type: [e.g. PUBLIC_OFFER]
Language: [RU | KK]
Source file reviewed: [e.g. docs/legal/production/candidates/public-offer.ru.md]
Approved file: [path or attachment name]
Comments resolved: [YES | NO — list open items]
Final clause decisions: [brief list or annex reference]
Effective date recommendation: [YYYY-MM-DD or "upon publish"]
Re-consent required: [YES | NO | CONDITIONAL — explain]
Publication blockers remaining: [list LEGAL-BLOCK-IDs or NONE]
Approval metadata:
  Approved by: [counsel firm / lawyer name]
  Role: [Licensed counsel Kazakhstan]
  Date: [YYYY-MM-DD]
  Version label recommendation: [YYYY-MM-DD-v1]
```

---

## Global deliverables checklist

Counsel should also return a cover index confirming:

- [ ] All mandatory document types addressed (see COUNSEL-001 outcome for PD Consent)
- [ ] Refund section replaces `[REFUND_POLICY — LEGAL REVIEW REQUIRED]` in both Offer files
- [ ] Cross-border section aligned with processor register facts (or list operator facts still needed)
- [ ] Retention sheet filled in `retention-approval-sheet.md` or annex
- [ ] Minors, cookies, complaints, IP, liability, jurisdiction — resolved or marked BLOCKED with reason
- [ ] List of **mandatory acceptance documents** for: (a) consumer login, (b) business login, (c) checkout, (d) business application
- [ ] List of **processor/DPA actions** before enabling: Google OAuth, Apple, Firebase, S3, SMS, etc.

---

## Redlines vs clean copy

Prefer **clean approved markdown** for RU and KK under a counsel-controlled folder (operator may copy into `docs/legal/production/candidates/` after internal review).

If redline only, specify which production candidate version was marked.

---

## What counsel should NOT do in return

- Do not instruct production publish or env flag changes — operator executes per `final-versioning-plan.md`
- Do not substitute operator BIN/addresses without operator-provided evidence

---

## Operator intake

| Received item | Received date | Stored location | Internal approver role |
|---------------|---------------|-----------------|------------------------|
| | | | |
