# Changelog — QalaGo

**Каноническая инженерная история проекта** (не заменяется git log).  
Формат: дата → stage → Status / Checkpoint → Summary → Deferred → Next.  
Дисциплина обновления: `AGENTS.md` (Workflow §6, чеклист START/FINISH).

---

## 2026-09-28 — KZ-C.0 — Kazakhstan compliance contract lock

- **Status:** **KZ-C.0 PASS — COMPLIANCE CONTRACT LOCKED**. **Not** “KZ compliance complete” / **not** legal approval / **not** production compliant.
- **Starting HEAD:** **`9b6b55a83b8733d8b38236ae94d10bdb65c5ed9d`** (KZ-COMPLIANCE.0 audit baseline).
- **Checkpoint:** KZ-C.0 docs commit in git log immediately after starting HEAD.
- **Scope:** **Documentation only** — canonical contract **`docs/architecture/kazakhstan-compliance-contract.md`**; **`docs/ai-project-context.md`**; cross-link **`docs/legal/stage-6-9-legal-safety-foundation.md`**. **No application code**, **no Prisma**, **no DB**, **no UI/API implementation**.
- **Decisions locked:** Legal baseline scope (counsel review flags); **KK-first** as **QALAGO PRODUCT POLICY (P0 pre-public launch)** with explicit preference wins; F.5/F.7 compatibility constraints; operator identity pending; legal doc set + KK/RU approval target; **LegalDocument** version authority vs Consumer Web presentation vs **LegalAcceptance**; acceptance/reacceptance principles; PD + public DTO (`ownerId` P0 hardening); provider/data-location register; user rights/deletion/push/geo; online-platform classification **LEGAL REVIEW REQUIRED**; ad engine cross-surface contract; AI/minors/analytics/logging/cookies/payments/IP; production compliance gate; AOP.0 intersection without inflating AOP; closed stages remain closed; phase plan **KZ-C.1–KZ-C.9**.
- **Tests/checks:** `git diff --check` on docs; no product test run (docs-only).
- **Deferred implementation:** All KZ-C.1+ stages; counsel sign-off; operator env values; client legal acceptance wiring; KK-first code; DTO hardening; ad compliance; flags verification; production provider register.
- **Next:** **Explicit agreement** before **KZ-C.1** (Kazakh-first + localization baseline) or **AOP.0** — **do not auto-start**.

---

## 2026-09-28 — F.8 — Social preview / OG image pipeline finalized (umbrella)

- **Status:** **F.8 PASS — SOCIAL PREVIEW / OG IMAGE PIPELINE FINALIZED**. **F.8 CLOSED / PASS**. **F.8.5 LOCAL PHYSICAL QA PASS**. **F.7 / PUBLIC HELP** unchanged.
- **Checkpoint:** Pre-closure HEAD **`4ab630c95c8d7c011efd0a2e107298e25e2ef086`**; docs closure commit in git log immediately after. **Implementation code:** **`4ab630c…`** (F.8.4); F.8.0–F.8.3 commits in git log.
- **Scope:** **Documentation only** — record user physical QA on **`http://localhost:3005`**; § **F.8** closure assessment; **no application/API/DB changes**.
- **Summary:** **Local physical PASS:** RU/KK city, help, privacy, terms, account-deletion, search (**noindex**), **`/support` → `/help`**, canonical Business + real **`locationId`** (OG URL without query; fallback image), external Unsplash cover → fallback (**coffee-house-uralsk**), direct fallback PNG. **NOT OBSERVED:** trusted **`/uploads/…`** Business cover in live catalog (automated F.8.3/F.8.4 PASS). **NOT VERIFIED:** **`https://qalago.kz`** Telegram/WhatsApp/Facebook/X crawler previews. § **F.8.17** criterion **19** recorded per § **18** (local QA + separate external debt) — aligned with **F.6** closure pattern.
- **Deferred (external production debt):** Public HTTPS social crawler verification on deployed Consumer Web origin.
- **Next:** **Explicit agreement** before next stage — **do not auto-start** post-F.8 work.

---

## 2026-09-28 — F.8.4 — Automated social preview regression gate

- **Status:** **F.8.4 PASS — AUTOMATED SOCIAL PREVIEW REGRESSION GATE**. **F.8 IN PROGRESS** (not CLOSED). **F.8.5 NOT STARTED**. **F.7 / PUBLIC HELP** unchanged.
- **Checkpoint:** Pre-gate HEAD **`41b41673892b374f0222e6023ea194e25cdea5fc`**; commit in git log immediately after.
- **Scope:** **`f8-phase4-automated-gate.test.ts`** (§ **F.8.17** mapping, route matrix, extended trust matrix, SSRF static audit, default asset); minimal fix **`business-social-preview.ts`** — reject **`decodeURIComponent`** path **`..`**; docs. **No** feature expansion.
- **Summary:** Participating routes: **`og:image`/`twitter:image`**, **`summary_large_image`**, **`openGraph.url` = canonical**, RU/KK + legal/help neutrality, search **noindex**, redirect routes without independent OG identity, Business trusted **`/uploads/…`** vs fallback, no fetch. **315** vitest PASS; **`next build`** PASS. External crawler previews = **F.8.5 / EXTERNAL-PENDING**.
- **Deferred:** **F.8.5** physical/public HTTPS social preview QA.
- **Next:** **Explicit agreement** before **F.8.5** — **do not auto-start F.8.5**.

---

## 2026-09-28 — F.8.3 — Safe Business social preview selection

- **Status:** **F.8.3 PASS — SAFE BUSINESS SOCIAL PREVIEW SELECTION**. **F.8 IN PROGRESS**. **F.8.4 NOT STARTED**. **F.7 / PUBLIC HELP** unchanged.
- **Checkpoint:** Pre-phase HEAD **`1a9eb2e71e2ac86860b024564d9aa7861f93a621`**; implementation commit in git log immediately after.
- **Scope:** **`apps/consumer-web`** — **`lib/seo/business-social-preview.ts`** (trusted **`/uploads/…`** only; Consumer Web absolute URLs); **`metadataForCanonicalBusiness`** + business **`page.tsx`** pass **`coverImageUrl` only**; **`withSocialPreviewImages`**; **`f8-phase3-business-social-preview.test.ts`**. **No** API/DB; **no** fetch/SSRF; **no** **`effectiveMedia`** (branch-grain ambiguity).
- **Summary:** Trusted relative **`/uploads/…`** or absolute on configured **Consumer/API** origin → Business **`og:image`/`twitter:image`** (no fabricated upload dimensions); else QalaGo fallback (**1200×630**). External URLs rejected. **`openGraph.url`/canonical** unchanged; **`locationId`** ignored for metadata. **295** vitest PASS; **`next build`** PASS.
- **Deferred:** **F.8.4** full regression gate; **F.8.5** production social preview QA.
- **Next:** **Explicit agreement** before **F.8.4** — **do not auto-start F.8.4**.

---

## 2026-09-28 — F.8.2 — Public route social preview rollout

- **Status:** **F.8.2 PASS — PUBLIC ROUTE SOCIAL PREVIEW ROLLOUT**. **F.8 IN PROGRESS**. **F.8.3 NOT STARTED**. **F.7 / PUBLIC HELP** unchanged.
- **Checkpoint:** Pre-phase HEAD **`b7c862e2aee67a23a7d6026c2cd7c2dccc01e992`**; commit in git log immediately after.
- **Scope:** **Verification + tests** — **`lib/seo/f8-phase2-route-rollout.test.ts`** documents route matrix; **no production metadata/routing changes** (F.8.1 shared helpers already cover indexable discovery, business fallback-only, legal/help neutral, search noindex+fallback, legacy business no OG identity, `/support` redirect-only).
- **Summary:** Indexable families use **`/og/qalago-default.png`** via **`withDefaultSocialPreview()`**; RU/KK **`openGraph.url` = canonical**; legal/help locale-neutral; business **`locationId`** not in OG URL; search **noindex** preserved. **280** vitest PASS; **`next build`** PASS.
- **Deferred:** **F.8.3** Business eligible cover; **F.8.5** production crawler QA.
- **Next:** **Explicit agreement** before **F.8.3** — **do not auto-start F.8.3**.

---

## 2026-09-28 — F.8.1 — Default QalaGo OG image + shared metadata plumbing

- **Status:** **F.8.1 PASS — DEFAULT QALAGO OG IMAGE + SHARED METADATA PLUMBING**. **F.8 IN PROGRESS** (not CLOSED). **F.8.2 NOT STARTED**. **F.7 / PUBLIC HELP** unchanged.
- **Checkpoint:** Pre-phase HEAD **`97aa5a54529b82a306b3ad52308e7a92b40da3e7`**; implementation commit in git log immediately after.
- **Scope:** **`apps/consumer-web`** only — static **`public/og/qalago-default.png`** (**1200×630**, wordmark + brand **`#00a8d6`**); **`lib/seo/social-preview.ts`**; **`page-metadata.ts`** shared **`withDefaultSocialPreview()`**; **`f8-phase1-social-preview.test.ts`**; regen script **`tool/generate-default-og.ps1`**. **No** Business media selection; **no** canonical/hreflang/sitemap/routing/API/DB changes.
- **Summary:** Chose **static asset** (deterministic, cacheable, no runtime fetch). All routes using central metadata helpers inherit default **`og:image`** / **`twitter:image`** + **`summary_large_image`**; **`openGraph.url`** / canonical unchanged. **267** vitest PASS; **`next build`** PASS.
- **Deferred:** **F.8.2** route-family rollout audit; **F.8.3** Business cover; production Telegram/WhatsApp/Facebook/X preview (**F.8.5**).
- **Next:** **Explicit agreement** before **F.8.2** — **do not auto-start F.8.2**.

---

## 2026-09-28 — F.8.0 — OG image pipeline contract lock

- **Status:** **F.8.0 PASS — OG IMAGE PIPELINE CONTRACT LOCKED**. **F.8 IN PROGRESS** (not CLOSED). **F.7 CLOSED / PASS** (unchanged). **PUBLIC HELP CLOSED / PASS** (unchanged). **F.8.1 NOT STARTED**.
- **Checkpoint:** Pre-lock HEAD **`248f45ff0518aa1e8354020e524aaa0581cc14ee`**; docs commit in git log immediately after.
- **Scope:** **Documentation only** — canonical **§ F.8** in **`docs/architecture/public-consumer-web.md`**; **`docs/ai-project-context.md`**; this entry. **No application code**, **no tests**, **no image assets**.
- **Summary:** **F.8** completes Consumer Web **social preview images** started as text/URL metadata in **F.3/F.4/F.5/F.7/Public Help**. Locked: **1200×630** canvas; **`twitter:card` = `summary_large_image`**; single QalaGo **fallback** (branding only — no prices/ads/PII); route matrix (discovery → fallback; business → eligible cover → fallback); **Business-grain** (not BusinessLocation); **`locationId`** does not change OG identity; locale-neutral **`/privacy`**, **`/terms`**, **`/account-deletion`**, **`/help`**; **no arbitrary server-side remote image fetch**; fail-safe fallback; absolute URLs via configured public origin; phases **F.8.0–F.8.5**; **19-point** final acceptance checklist; production Telegram/WhatsApp/Facebook/X preview = **verification debt** until **F.8.5**.
- **Deferred:** **F.8.1+** implementation (static vs **`ImageResponse`** for fallback decided in **F.8.1**); trusted-media allowlist detail; physical/public crawler QA.
- **Next:** **Explicit agreement** before **F.8.1** — **do not auto-start F.8.1**.

---

## 2026-09-28 — Public help — physical QA closure (umbrella)

- **Status:** **PUBLIC HELP PASS — CONSUMER WEB PUBLIC SUPPORT FINALIZED**. **PHYSICAL QA PASS / CLOSED**. **F.7 CLOSED / PASS**. **F.8 NOT STARTED**.
- **Checkpoint:** Implementation **`840a842ec4c38b290bbc30020b3cac7b1231929d`**; locale-switch hotfix **`08b53405ed7c6aa8240e06de01bed2e12fa51127`**; closure docs commit in git log immediately after.
- **Scope:** **Documentation only** — user physical browser QA sign-off (Consumer Web **localhost:3005**); no application code.
- **Summary:** **Physical QA PASS:** footer **Поддержка** → same-origin **`/help`**; **`/support` → `/help`**; **`/help`** RU ↔ KK locale switch keeps **`/help`** (200, localized chrome/content) — defect **`/kk/help`** **404** confirmed **FIXED** after hotfix **`08b5340…`**; F.7 legal **`/privacy`**, **`/terms`**, **`/account-deletion`** locale switches remain locale-neutral (no **404**). Business Web owner **`/help`** out of scope (unchanged).
- **Deferred:** Production support contact / legal content approval (**`docs/legal-review-required.md`**) — not production legal clearance.
- **Next:** **Explicit agreement** before **F.8** or other stages — **do not auto-start F.8**.

---

## 2026-09-28 — Public help hotfix — locale switch on locale-neutral routes

- **Status:** **PUBLIC HELP LOCALE SWITCH HOTFIX — IMPLEMENTED / AUTOMATED PASS**. **Physical retest: PASS** (umbrella closure entry **2026-09-28**). **F.7 CLOSED / PASS**. **F.8 NOT STARTED**.
- **Checkpoint:** Pre-hotfix HEAD **`840a842ec4c38b290bbc30020b3cac7b1231929d`**; hotfix commit **`08b53405ed7c6aa8240e06de01bed2e12fa51127`**.
- **Scope:** Consumer Web — `swapLocaleInPathname` + `LocaleSwitcher` refresh when pathname unchanged; regression tests for **`/help`** and F.7 legal roots.
- **Summary:** Physical QA on **`/help`**: language switcher navigated to **`/kk/help`** / **`/ru/help`** → **404**. **Root cause:** `swapLocaleInPathname` prefixed locale onto neutral segments (`help`, `privacy`, etc.). **Fix:** locale-neutral roots keep path; cookie updates + **`router.refresh()`** re-render RU/KK chrome/content. Discovery **`/ru|kk/…`** switching unchanged.
- **Deferred:** None (physical retest closed in umbrella entry).
- **Next:** Umbrella physical QA closure — **completed**.

---

## 2026-09-28 — Public help — Consumer Web public support

- **Status:** **PUBLIC HELP PASS — CONSUMER WEB PUBLIC SUPPORT** (implementation). **Physical QA: PASS** (umbrella closure **2026-09-28**). **F.7 CLOSED / PASS** (not reopened). **F.8 NOT STARTED**.
- **Checkpoint:** Pre-stage HEAD **`d5d007d23e95c693f83cac658051972ffa802a22`**; implementation commit in git log immediately after.
- **Scope:** Consumer Web public **`/help`** (guest-safe static FAQ + support contact placeholders); PublicShell footer same-origin **Поддержка/Қолдау**; SEO canonical + sitemap entry; **`/support` → `/help`** compat redirect; Business Web **`/help`** preserved as authenticated owner help; docs/store URL sync to **`https://qalago.kz/help`**. **No** Flutter/Android/iOS/F.6/deployment changes.
- **Summary:** Canonical public support URL **`/help`** on Consumer Web. Content from Flutter **`ProfileHelpScreen`** RU/KK ARB consumer FAQ; contact via **`NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL`** placeholder architecture. Footer no longer sends users to Business Web for support. Owner cabinet help unchanged on Business Web origin.
- **Deferred:** Production support contact approval (**`docs/legal-review-required.md`**). **F.8** — explicit agreement before start.
- **Next:** Umbrella physical QA closure — **completed**; **do not auto-start F.8**.

---

## 2026-09-28 — Flutter Web disposition — DEV/QA only (Option B)

- **Status:** **FLUTTER WEB DISPOSITION PASS — DEV/QA ONLY**. **F.7 CLOSED / PASS** (unchanged). **F.8 NOT STARTED**.
- **Checkpoint:** Pre-checkpoint HEAD **`8a9d3ca7c642151243e69b6ee491b6ce8052b75b`**; implementation commit in git log immediately after.
- **Scope:** **Documentation / architecture only** — no application code, deployment, redirects, or Flutter target removal.
- **Summary:** **Option B approved.** **Flutter Mobile** remains the production **Android/iOS** native client. **Consumer Web** remains the **canonical public browser** client; **`https://qalago.kz`** belongs to Consumer Web. **Flutter Web** retained for **DEV/QA / local demo / compile-regression** (local **`:8080`** may remain via `dev:all`); **not** production/public, **not** SEO owner. Read-only audit: **no** repository evidence of production Flutter Web deployment; **no** redirect required from repository evidence; **Android/iOS do not depend** on Flutter Web; shared Catalog API / PostgreSQL unchanged.
- **Deferred:** Optional future full Flutter Web retirement — requires **separate audit** (shared `apps/mobile/lib` also serves Android/iOS). **F.8** and other stages — explicit agreement before start.
- **Next:** Review checkpoint report; **do not auto-start F.8**.

---

## 2026-09-28 — F.7 — Legal migration finalized (umbrella closure)

- **Status:** **F.7 PASS — LEGAL MIGRATION FINALIZED**. **F.7 CLOSED / PASS**. **F.8 NOT STARTED**.
- **Checkpoint:** Pre-closure HEAD **`ece46c260a178f3b2b96b03a569f8b0093391343`** (Phase **5** physical QA sign-off); final implementation code checkpoint **`30ab33f033a6dca52dd57c90e263559081b08a98`** (Hotfix **1**); closure docs commit in git log immediately after.
- **Scope:** **Documentation only** — umbrella closure after Phases **0–5** PASS, Hotfix **1** physically verified, and final read-only umbrella audit (**F.7 READY FOR UMBRELLA CLOSURE**; technical blockers **NONE**).
- **Summary:** Consumer Web is the **canonical public legal host** (`qalago.kz` origin). Locale-neutral **`/privacy`**, **`/terms`**, **`/account-deletion`**; Business Web legacy routes **308** redirect to Consumer Web; RU/KK QalaGo chrome; legal body **Russian** source-language draft (no machine translation); self-canonical/indexable legal SEO; robots/sitemap verified; physical browser QA **PASS**; F.4/F.5/F.6 compatibility preserved. **Do not** interpret as production legal counsel approval, approved Kazakh legal body, or production publication clearance.
- **External production legal/content debt:** unchanged — **`docs/legal-review-required.md`** (operator, contacts, jurisdiction, retention, KK translation, HTTPS/deploy claims, store gaps, etc.) — **separate from** technical F.7 closure.
- **Valid post-F.7 technical debt:** Business Web dead legal layout cleanup; **`/support` vs `/help`**; **F.8** OG pipeline; broader Web contours; **6.12B**; F.6 production association verification; unrelated Business Web UI-guard failures — see phase entries and architecture doc.
- **Next:** **Explicit agreement** before any new stage (**F.8** or other) — **do not auto-start**.

---

## 2026-09-28 — F.7 Phase 5 — Cross-app regression and physical browser QA

- **Status:** **F.7 PHASE 5 PASS — CROSS-APP REGRESSION AND PHYSICAL BROWSER QA VERIFIED**. F.7 umbrella: **IN PROGRESS / NOT CLOSED** (final umbrella closure audit not performed). **F.8 NOT STARTED**.
- **Checkpoint:** Phase **5** sign-off at HEAD **`30ab33f033a6dca52dd57c90e263559081b08a98`** (includes Hotfix **1** commit); pre–Phase **5** automated gate baseline **`bc26dae5fcaf3727a88407a907b412fc7d19d96e`**.
- **Scope:** QA sign-off only — records user physical browser QA (Chrome, Consumer Web **localhost:3005**, Business Web **localhost:3003**); **no** application code in this entry.
- **Summary:** Automated Phase **5** gate PASS (**236/236** Consumer Web vitest at hotfix HEAD). Physical QA: Consumer legal pages, Business Web **308** redirects, robots/sitemap, locale-prefixed legal URLs **404** — PASS. Initial PublicShell logo defect (**/ru/privacy**) found in physical QA; **Hotfix 1** (`parseCitySlugFromPathname` + legal roots) corrected; first user retest failed due to **stale `next start` on :3005**; after rebuild/restart from hotfix HEAD, RU/KK logo → **`/ru|kk/uralsk`**, categories → **`/ru|kk/uralsk/categories`**, footer legal links locale-neutral — PASS. KK chrome PASS; legal body remained Russian per contract.
- **Deferred:** **F.7 final umbrella closure** (explicit approval); production legal/content approval (**`docs/legal-review-required.md`**); `/help` vs `/support`; F.8 OG pipeline; Business Web unrelated **201/203** UI-guard debt.
- **Next:** **F.7 final umbrella closure audit** — **explicit approval required** — **do not auto-start**. **Do not** claim **F.7 CLOSED / PASS** or production legal approval.

---

## 2026-09-28 — F.7 Phase 5 hotfix — legal PublicShell navigation

- **Status:** **F.7 PHASE 5 HOTFIX — LEGAL PUBLICSHELL NAVIGATION CORRECTED**. F.7 umbrella: **IN PROGRESS / NOT CLOSED**; Phase **5 physical QA not closed** (retest required). **F.8 NOT STARTED**.
- **Checkpoint:** Pre-hotfix HEAD **`bc26dae5fcaf3727a88407a907b412fc7d19d96e`**; implementation commit in git log immediately after.
- **Scope:** Consumer Web — `parseCitySlugFromPathname` must not treat F.7 legal roots as city slugs; PublicShell logo/home/categories on `/privacy`, `/terms`, `/account-deletion` use default city discovery paths again.
- **Summary:** Physical QA defect: logo from `/privacy` linked to `/ru/privacy` (404). Root cause: first path segment `privacy` parsed as `citySlug`. Footer legal links unchanged (locale-neutral).
- **Deferred:** Phase **5** manual browser sign-off; F.7 final closure; production legal content debt.
- **Next:** **Physical retest** of legal page PublicShell navigation — **do not claim Phase 5 physical PASS** until user verifies.

---

## 2026-09-28 — F.7 Phase 4 — Legal localization and SEO completion

- **Status:** **F.7 PHASE 4 PASS — LEGAL LOCALIZATION AND SEO COMPLETED**. F.7 umbrella: **IN PROGRESS / NOT CLOSED**. **F.8 NOT STARTED**.
- **Checkpoint:** Pre-Phase-4 HEAD **`0aa29641cc0de1ab0da5039fd30905e34684acb4`**; implementation commit in git log immediately after.
- **Scope:** Consumer Web only — locale-neutral **`/privacy`**, **`/terms`**, **`/account-deletion`** canonical metadata (no RU/KK hreflang); RU/KK **chrome** via `LEGAL_UI` + cookie preference; legal **body** remains Russian (not machine-translated); sitemap adds three canonical legal URLs once; robots indexable; **no** F.8 OG pipeline; **no** Business Web/Flutter/API changes.
- **Summary:** `metadataForLegalPage`, `canonicalForLegalPage`, `buildLegalSitemapEntries`; `LegalPageLayout` uses localized headings; Consumer Web **222/222** vitest; **`next build`** OK. Business Web redirect tests **11/11** PASS (unchanged redirects).
- **Deferred:** Phase **5** cross-app + physical browser QA; counsel-approved Kazakh legal body; F.7 final closure; Business Web pre-existing UI-guard failures (reviews page).
- **Next:** **F.7 Phase 5** — regression + physical browser QA — **explicit approval required** — **do not auto-start**.

---

## 2026-09-28 — F.7 Phase 3 — Business Web legacy legal redirects

- **Status:** **F.7 PHASE 3 PASS — BUSINESS WEB LEGAL HOST RETIRED**. F.7 umbrella: **IN PROGRESS / NOT CLOSED**. **F.8 NOT STARTED**.
- **Checkpoint:** Pre-Phase-3 HEAD **`6e314045054921a8d19f89f1054fd0bf1d8b646c`**; implementation commit in git log immediately after.
- **Scope:** Business Web only — `/privacy`, `/terms`, `/account-deletion` **permanentRedirect** to Consumer Web origin via `getConsumerWebOrigin()` (`NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` → `NEXT_PUBLIC_CONSUMER_WEB_URL` → `http://localhost:3005`); **no** Consumer Web page changes, **no** `/help` redirect, **no** Flutter/API/Prisma, **no** Phase 4–5.
- **Summary:** Legacy Business Web legal routes no longer render competing canonical documents; `publicLegalUrl()` for migrated paths aligns with Consumer Web origin. Business Web legal/F.7 tests PASS; **`next build`** OK. Full Business Web vitest **201/203** — **2 pre-existing** hardcoded-UI failures in `app/business/[id]/reviews/page.tsx` (unrelated to F.7). Consumer Web F.7 regression **17/17** PASS.
- **Deferred:** Phase **4** localization/SEO; Phase **5** cross-app + physical browser QA; dead `legal-page-layout` / placeholder cleanup on Business Web; production legal counsel approval.
- **Next:** **F.7 Phase 4** — legal localization/SEO completion — **explicit approval required** — **do not auto-start**.

---

## 2026-09-28 — F.7 Phase 2 — Consumer Web same-origin legal links

- **Status:** **F.7 PHASE 2 PASS — CONSUMER WEB LEGAL LINKS MIGRATED SAME-ORIGIN**. F.7 umbrella: **IN PROGRESS / NOT CLOSED**. **F.8 NOT STARTED**.
- **Checkpoint:** Pre-Phase-2 HEAD **`4426de41cf88f202bf680c80bf0560f5cb47862f`**; implementation commit in git log immediately after.
- **Scope:** Consumer Web only — PublicShell footer `/privacy`, `/terms`, `/account-deletion` via same-origin `Link`; `legal-links.ts` + docs; **help** still external via `getPublicSiteBaseUrl()`; **no** Business Web, Flutter, API, Phase 3–5.
- **Summary:** Footer no longer uses Business Web as legal host for migrated pages; `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` retained for deferred `/help`. Consumer Web **211/211** vitest; **`next build`** OK.
- **Deferred:** Phase **3** Business Web redirects; Phase **4** SEO; Phase **5** physical QA; `/support` architecture.
- **Next:** **F.7 Phase 3** — Business Web legacy redirects — **explicit approval required** — **do not auto-start**.

---

## 2026-09-28 — F.7 Phase 1 — Consumer Web legal routes

- **Status:** **F.7 PHASE 1 PASS — CONSUMER WEB LEGAL ROUTES IMPLEMENTED**. F.7 umbrella: **IN PROGRESS / NOT CLOSED**. **F.8 NOT STARTED**.
- **Checkpoint:** Pre-Phase-1 HEAD **`7f30a7783970136d8c44331c69178df8048b8582`**; implementation commit in git log immediately after.
- **Scope:** Consumer Web only — `/privacy`, `/terms`, `/account-deletion` static pages; middleware exemption for locale-neutral legal roots; **no** PublicShell footer migration, **no** Business Web redirects, **no** Phase 4 SEO, **no** API/Prisma/Flutter changes.
- **Summary:** Migrated Business Web legal content pattern to `apps/consumer-web`; shared `LegalPageLayout`, `legal-config`, `legal-ui`; F.7 tests + UI guard allowlist; Consumer Web **205/205** vitest; **`next build`** OK.
- **Deferred:** Phase **2** same-origin footer; Phase **3** Business Web redirects; Phase **4** SEO; Phase **5** physical QA; production legal approval (`docs/legal-review-required.md`).
- **Next:** **F.7 Phase 2** — PublicShell/footer same-origin — **explicit approval required** — **do not auto-start**.

---

## 2026-09-28 — F.7 Phase 0 — legal migration contract lock

- **Status:** **F.7 PHASE 0 PASS — LEGAL MIGRATION CONTRACT LOCKED**. F.7 umbrella: **IN PROGRESS / NOT CLOSED**. **F.8 NOT STARTED**.
- **Checkpoint:** Pre-lock HEAD **`70b12d49b446510bd84851d88572d1993b794169`**; Phase **0** docs lock commit in git log immediately after.
- **Scope:** **Documentation only** — canonical F.7 contract in **`docs/architecture/public-consumer-web.md`** § **F.7** after read-only Phase **0** audit.
- **Summary:** Lock locale-neutral canonical legal URLs (`/privacy`, `/terms`, `/account-deletion` on Consumer Web origin); static page migration from Business Web; no Prisma/API/Admin redesign; no `/support` in F.7; Business Web redirects policy; Flutter URLs stable; production legal approval remains **`docs/legal-review-required.md`** gate.
- **Deferred:** F.7 Phases **1–5** + final closure; legal API→Web rendering; `/support` vs `/help`; production counsel-approved copy.
- **Next:** **F.7 Phase 1** — Consumer Web legal routes — **explicit approval required** — **do not auto-start**.

---

## 2026-09-28 — F.6 Phase 6 — cross-platform closure QA

- **Status:** **F.6 PASS — DEEP LINKS ARCHITECTURE FINALIZED**. **F.6 CLOSED / PASS**. **F.7 NOT STARTED**.
- **Checkpoint:** `2bccb92` (Phase 6 closure QA tests); umbrella docs closure in this commit series.
- **Scope:** Closure QA only — automated F.6 matrix, session-city lifecycle tests, Notifications E regression, Consumer Web well-known + F.5 middleware regression; **no** production Verified App Links / Universal Links; **no** F.7.
- **Summary:** Phases **0–6** complete. Flutter deep-link pipeline verified (**71** targeted tests; **1126/1126** full mobile). Consumer Web **193/193**. Notifications E **PASS** (typed destinations; no FCM raw URL path). Session city semantics verified (persisted city preserved; City Picker clears session). Android physical E2E **not run** (ADB unavailable in closure environment).
- **Deferred:** Production Android Verified App Links (Play App Signing SHA on `assetlinks.json`); production iOS Universal Links (`QALAGO_APPLE_TEAM_ID`, signed build, physical device); Android release signing TODO; non-blocking debt (pathPrefix breadth, session timeout, failed pending retention, full attribution).
- **Next:** **F.7** — explicit approval required — **do not auto-start**.

---

## 2026-09-27 — F.6 Phase 5 — iOS Universal Links

- **Status:** **F.6 PHASE 5 IMPLEMENTATION PASS — iOS UNIVERSAL LINKS CONFIGURED**. F.6 umbrella: **IN PROGRESS / NOT CLOSED**. **Production Universal Links: NOT VERIFIED**.
- **Checkpoint:** `9a36ce4e6a2a4127f182497cfc1e47768f97d041`.
- **Scope:** iOS-only — `Runner.entitlements` `applinks:qalago.kz`; `FlutterDeepLinkingEnabled=false`; **6** static config tests; Phase **1–2** + Android manifest regression (**65** total). **No** AppDelegate changes; **no** fabricated Team ID; **no** Web/API/Flutter coordinator changes.
- **Summary:** Universal Links enter via **app_links** → existing Phase **2** pipeline. AASA remains Phase **3** `QALAGO_APPLE_TEAM_ID` env on Consumer Web.
- **Deferred:** macOS/Xcode signed build; physical iOS QA; production AASA deploy; Phase **6** closure.
- **Next:** **F.6 Phase 6** — explicit approval required — **do not auto-start**.

---

## 2026-09-27 — F.6 Phase 4 — Android App Links

- **Status:** **F.6 PHASE 4 IMPLEMENTATION PASS — ANDROID APP LINKS CONFIGURED**. F.6 umbrella: **IN PROGRESS / NOT CLOSED**. **Production Verified App Links: NOT VERIFIED** (requires `qalago.kz` `assetlinks.json` + Play App Signing SHA-256).
- **Checkpoint:** `a3ed962a9805f9d2caa98b64db55bca00da4fd3b`.
- **Scope:** Android-only — `AndroidManifest.xml` HTTPS App Links for `qalago.kz` `/ru` + `/kk` with `autoVerify`; `flutter_deeplinking_enabled=false`; manifest inspection tests (**6**); Phase **1–2** deep-link regression (**53**). **No** iOS, Flutter parser/coordinator changes, Web/API/Prisma changes.
- **Summary:** URI delivery path remains **app_links → Phase 1 parser → Phase 2 coordinator**. Debug keystore SHA-256 available for optional local association QA only — **not** committed to production env.
- **Deferred:** Production domain verification; Play App Signing fingerprint on Consumer Web; physical navigation QA when debug APK install blocked/slow.
- **Next:** **F.6 Phase 5** — explicit approval required — **do not auto-start**.

---

## 2026-09-27 — F.6 Phase 3 — Web association endpoints

- **Status:** **F.6 PHASE 3 IMPLEMENTATION PASS — WEB ASSOCIATION ENDPOINTS PREPARED**. F.6 umbrella: **IN PROGRESS / NOT CLOSED**.
- **Checkpoint:** `f2d60b314ce1559e3fff560a0d7615d01f4a6502`.
- **Scope:** Consumer Web only — `/.well-known/assetlinks.json` + `/.well-known/apple-app-site-association` route handlers; F.5 middleware exemption for `/.well-known/*`; env-gated Android/iOS association JSON; **15** focused vitest cases; **193/193** consumer-web tests; **`next build`** PASS. **No** Flutter/Android/iOS manifest/entitlement changes; **no** API/Prisma changes.
- **Summary:** Before Phase **3**, neutral middleware treated `/.well-known/…` like any path → **308** to `/ru/.well-known/…` (or `/kk/…`). Now root association URLs stay at `/.well-known/*` with `application/json`. Without env config: assetlinks `[]` (200); AASA empty details (404). **Not** production App/Universal Links verification.
- **Deferred:** F.6 Phases **4–6**; real Play App Signing SHA-256; Apple Team ID; `qalago.kz` production deployment check.
- **Next:** **F.6 Phase 4** — explicit approval required — **do not auto-start**.

---

## 2026-09-27 — F.6 Phase 2 — Flutter deep link navigation

- **Status:** **F.6 PHASE 2 IMPLEMENTATION PASS — FLUTTER DEEP LINK NAVIGATION INTEGRATED**. F.6 umbrella: **IN PROGRESS / NOT CLOSED**.
- **Checkpoint:** `a94bc23002b5ecf6df483c7a878b581cc464baef`.
- **Scope:** Mobile-only — **`app_links`** receiver; **`PublicDeepLinkCoordinator`** / **`PublicDeepLinkExecutor`**; session city (**`deepLinkSessionCitySlugProvider`**, **`discoveryCitySlugProvider`**); catalog **`fetchBusinessBySlug`**; discovery surfaces wired to link city context; **53** deep-link tests (parser + coordinator + executor). **No** Consumer Web middleware, **no** `/.well-known`, **no** Android autoVerify / iOS Associated Domains, **no** API/Prisma/Notifications E changes.
- **Summary:** Canonical HTTPS URIs → Phase **1** parser → typed target → deferred execution after onboarding → locale persist (**ru/kk**); business slug resolution with link **`citySlug`**; category/subcategory slug → existing routes; invalid/unsupported links no-op without locale/city mutation.
- **Deferred:** F.6 Phases **3–6** (Web association, manifests, physical OS link QA).
- **Next:** **F.6 Phase 3** — explicit approval required — **do not auto-start**.

---

## 2026-09-27 — F.6 Phase 1.1 — locationId contract terminology

- **Status:** **F.6 PHASE 1.1 PASS — LOCATIONID CONTRACT TERMINOLOGY ALIGNED**. F.6 Phase **1** remains **PASS**; umbrella **IN PROGRESS / NOT CLOSED**.
- **Checkpoint:** `174560d6661ca6f0a98bcb882bd30e8e9f86a572`.
- **Scope:** **Documentation only** — align F.6 architecture wording with Prisma source of truth: **`BusinessLocation.id`** = `String @id @default(cuid())`.
- **Summary:** Removed incorrect **UUID** terminology for public **`locationId`** / **`BusinessLocation.id`** in **`docs/architecture/deep-links.md`**. Phase **1** parser already accepted canonical CUID-shaped branch ids; **no** runtime, parser, test, API, or DB change. **6.12A** semantics unchanged.
- **Deferred:** F.6 Phases **2–6** unchanged.
- **Next:** **F.6 Phase 2** — explicit approval required — **do not auto-start**.

---

## 2026-09-27 — F.6 Phase 1 — public URL parser

- **Status:** **F.6 PHASE 1 IMPLEMENTATION PASS — PUBLIC URL PARSER AND TYPED TARGET VERIFIED**. F.6 umbrella: **IN PROGRESS / NOT CLOSED**.
- **Checkpoint:** `527b96e5a1ebe7b5a1c4e2782e05a1e243a2ba5d`.
- **Scope:** Mobile-only pure parser — **`apps/mobile/lib/core/deep_links/`** (`parsePublicDeepLink`, sealed **`PublicDeepLinkTarget`**, **`PublicDeepLinkParseResult`**); **37** focused unit tests; full **`flutter test`** PASS; **`flutter analyze`** on module PASS. **No** navigation, packages, native config, Web, API, or Notifications E changes.
- **Summary:** Canonical **`https://qalago.kz`** `/ru|kk/…` families → typed targets (city, categories, category, subcategory, business + optional **`locationId`**, search + **`q`**); strict host/scheme; reserved-segment precedence; legacy neutral URLs **unsupported**; query allowlist per contract.
- **Deferred:** Phases **2–6** (receiver, deferred nav, well-known, App Links, Universal Links, closure QA).
- **Next:** **F.6 Phase 2** — explicit approval required — **do not auto-start**.

---

## 2026-09-27 — F.6 Phase 0 — deep link contract lock

- **Status:** **F.6 PHASE 0 PASS — DEEP LINK CONTRACT LOCKED**. F.6 umbrella: **AGREED / NOT IMPLEMENTED** (Phases **1–6** not started).
- **Checkpoint:** `7e57430eedf53dae68e71ca147511bf36ba34ace`.
- **Scope:** **Documentation only** — canonical F.6 contract after read-only Phase 0 audit at HEAD **`64cb9061443c4492f56bf432b8f525bc1efa7839`**.
- **Summary:** Locked **`docs/architecture/deep-links.md`**: HTTPS **`https://qalago.kz`** public links; F.5 URL families unchanged; **NavigationTarget** conceptual (no DB); single trust boundary (parser → typed target → existing router); **E.4/E.5/E.6** contour preserved (no FCM URL navigation); **locale** URL-authoritative with persist via existing app locale mechanism; **city** link context without silent overwrite of persisted city; **locationId** + **by-slug** API; deferred deep-link queue required for cold start; **/.well-known** must not be locale-redirected (implementation deferred); Android **`kz.qalago.qalago_mobile`** / iOS **`kz.qalago.qalagoMobile`**; locked implementation Phases **0–6**. Cross-refs in **`public-consumer-web.md`**, **`future-extensibility-contracts.md`**, **`business-location.md`**, **`notifications-final-architecture.md`**, **`api-contracts.md`**.
- **Deferred:** All F.6 product implementation (Phases **1–6**); association files; middleware exemption; manifest/entitlements; signing SHA-256 / Apple Team ID (production verification gates).
- **Next:** **F.6 Phase 1** — public URL parser + typed target + automated tests — **requires explicit approval** — **do not auto-start**.

---

## 2026-09-27 — F.5 — formal umbrella closure

- **Status:** **F.5 PASS — LOCALE SEO URL ARCHITECTURE IMPLEMENTED AND VERIFIED**. **F.5 is CLOSED / PASS** (reopen only on confirmed defect or explicit new scope).
- **Checkpoint:** `b6dc9f92aed8ec7ad06f6c73876d348918e04459`.
- **Scope:** **Documentation only** — formal closure after Phase **0** contract, Phase **1** (+ **1.1–1.4**), Phase **2** SEO, and **PublicShell** locale UI hotfix — all **VERIFIED / PHYSICAL QA PASS** per **`docs/changelog.md`** entries **2026-09-27**.
- **Summary:** Consumer Web indexable **`/ru/`** / **`/kk/`** architecture; URL locale authoritative; neutral compatibility redirects; locale-aware navigation and safe locale switching; F.4 business routes under locale prefixes; locale-prefixed **canonical**, reciprocal **hreflang**, **`x-default`→RU**, dual-locale **sitemap**, **OG URL**, search **noindex**; **PublicShell** QalaGo-owned UI follows URL locale. **6.12A** / **F.4** contracts preserved. Implementation checkpoints: Phase **2** **`3fc822f…`**; Phase **2** physical QA **`7968113…`**; PublicShell hotfix **`e7bb8e1…`** / QA **`1bdd422…`**.
- **Deferred (non-blocking):** Legacy **`/businesses/{id}`** redirect not manually exercised (Phase **1** QA; automated PASS); real **`locationId`** branch UI not manually exercised (automated PASS); root **`<html lang>`** vs URL on soft nav — **not verified**, optional follow-up; production crawl validation; **LocalBusiness** / **AggregateRating** JSON-LD (not F.5); **F.6** / **F.7** / **F.8** and other out-of-scope items per § F.5.
- **Next:** **F.6 — Deep Links / App Links / Universal Links** is the **next canonical Consumer Web stage** per roadmap (**F.1→…→F.8**). **NOT STARTED** — requires **explicit staged approval**; **READ-ONLY audit** before implementation — **do not auto-start**.

---

## 2026-09-27 — F.5 locale UI hotfix — PublicShell physical QA closure

- **Status:** **F.5 LOCALE UI HOTFIX PHYSICAL QA PASS — PUBLICSHELL LOCALE VERIFIED**.
- **Checkpoint:** `1bdd422a67f1107b7a93d2720d71787ff847d6f5`.
- **Scope:** **Documentation only** — records user-verified manual browser QA (Consumer Web **localhost:3005**). **No** application/test/backend changes. Phase **2** SEO **not** reimplemented or reopened.
- **Summary:** On **`/ru/aktobe`**, soft switch to KK **without reload** → URL **`/kk/aktobe`**, shell **Басты бет** / **Санаттар**; reverse KK → RU restores **Главная** / **Категории** without reload. Direct load **`/kk/aktobe`** shows KK shell labels immediately. KK footer and city-switcher QalaGo-owned UI confirmed Kazakh (not stale RU). Implementation at **`e7bb8e1…`**.
- **Non-blocking follow-up (not verified here):** root **`<html lang>`** may still follow persistent root-layout locale on soft nav — separate from PublicShell defect; **not** physically verified in this session.
- **Deferred:** Full **F.5** umbrella closure only if separately agreed; Phase **1** manual gaps unchanged (legacy **`/businesses/{id}`** redirect; real **`locationId`** UI).
- **Next:** Roadmap / explicit approval only — **do not** auto-start another F.5 phase or contour.

---

## 2026-09-27 — F.5 locale UI hotfix — PublicShell URL locale

- **Status:** **F.5 LOCALE UI HOTFIX IMPLEMENTATION PASS — PUBLICSHELL URL LOCALE FIXED** (automated verification PASS; **hotfix physical/browser QA not yet performed**).
- **Checkpoint:** `e7bb8e1243b3fba541d376812fb6ada99800005c`.
- **Scope:** **`apps/consumer-web` only** — **`PublicShell`** client labels/links. **No** SEO/routing/backend/Prisma/Flutter changes.
- **Summary:** Post–Phase 2 physical QA regression: after soft **RU → KK** navigation, header/footer shell labels (**`Главная`**, **`Категории`**, etc.) stayed RU while URL was **`/kk/…`**. Root cause: **`UI_LABELS[layoutLocale]`** from persistent root layout prop; links already used pathname locale. Fix: **`resolveEffectivePublicLocale(pathname, layoutFallback)`** (same contract as Phase **1.4** **`LocaleSwitcher`**) drives **`UI_LABELS`**, nav links, and **`CitySwitcher`** locale/labels. Phase **2** SEO physical QA remains **PASS**.
- **Automated verification:** **`f5-public-shell-locale.test.ts`**; full Consumer Web Vitest; **`tsc --noEmit`**; **`next build`** (see commit report).
- **Deferred:** Hotfix physical QA; optional **`<html lang>`** alignment with URL locale on soft nav (non-blocking follow-up); full F.5 umbrella closure only if separately agreed.
- **Next:** **Physical/browser QA** for shell label switch (**RU ↔ KK** without reload); do **not** auto-start another contour.

---

## 2026-09-27 — F.5 Phase 2 — physical QA closure

- **Status:** **F.5 PHASE 2 PHYSICAL QA PASS — LOCALE SEO VERIFIED**.
- **Checkpoint:** `7968113aa88eee1622388adc337dba1d305e6347`.
- **Scope:** **Documentation only** — records user-verified manual browser QA (Chrome, Consumer Web **localhost:3005**). **No** application/test/backend changes.
- **Summary:** View-source and sitemap checks confirm locale-prefixed **canonical** on **`/ru/aktobe`** and **`/kk/aktobe`**; city **hreflang** (`ru`, `kk`, **`x-default`→RU**) reciprocal on KK city page; business canonical and hreflang on **`/kk/aktobe/business/aktobe-coffee-lab`**; search **`/kk/aktobe/search?q=coffee`** remains **`noindex, follow`**; **`/sitemap.xml`** loads with **`/ru/`** and **`/kk/`** entries (incl. business RU+KK), excludes neutral **`/aktobe`**, **`/search`**, **`/businesses/`**, and query strings; **OG `url`** matches KK business canonical; category pagination **`/kk/aktobe/bars?page=2`** canonical preserves **`?page=2`** with locale prefix; neutral **`/aktobe`** → **`/ru/aktobe`** redirect verified.
- **Physical QA limitations (non-blocking):** real **`?locationId=`** branch context on business page — **not** manually exercised (no branch selector / usable **`locationId`** in session); automated F.4/F.5 **`locationId`** canonical exclusion regressions remain **PASS**.
- **Local dev note (not a product defect):** stale **`apps/consumer-web/.next`** cache caused **`Cannot find module './901.js'`** before QA; resolved by stopping dev server, deleting **only** **`.next`**, and restarting — **no** source change.
- **Deferred:** Full **F.5** umbrella closure only if separately agreed; production crawl validation; deferred JSON-LD types per F.4; Phase **1** manual gaps unchanged (legacy **`/businesses/{id}`** redirect).
- **Next:** Follow roadmap / explicit approval — **do not** auto-start another F.5 phase or contour.

---

## 2026-09-27 — F.5 Phase 2 — locale SEO implementation

- **Status:** **F.5 PHASE 2 IMPLEMENTATION PASS — LOCALE SEO CONTRACT IMPLEMENTED** (automated verification PASS; **Phase 2 physical/browser QA not yet performed**).
- **Checkpoint:** `3fc822f8270e5e2a743a328eac16a16a880edcda`.
- **Scope:** **`apps/consumer-web` SEO layer only** — canonical, hreflang, sitemap, Open Graph URL. **No** backend/Prisma/DB/routing redesign. **No** LocalBusiness/AggregateRating JSON-LD.
- **Summary:** Extended **`lib/seo/canonical.ts`** with locale-prefixed indexable URLs; **`buildIndexableLocaleSeoAlternates()`** emits **canonical + `languages` (`ru`, `kk`, `x-default`→RU)** on city/categories/category/subcategory/business metadata; OG **`url`** matches locale canonical; search stays **noindex** with locale-prefixed canonical URL; sitemap emits **both `/ru/` and `/kk/`** per indexable discovery/business URL (dynamic cities; F.4 per-city business dedupe × locales); neutral/search/legacy/query variants excluded.
- **Automated verification:** **`f5-phase2-locale-seo.test.ts`** **9 PASS**; updated F.3/F.4 SEO tests; full Consumer Web Vitest **20 files / 172 PASS**; **`tsc --noEmit` PASS**; **`next build` PASS**.
- **Deferred:** Phase **2 physical QA** (view-source hreflang/canonical/sitemap); hreflang/sitemap production crawl validation; deferred JSON-LD types per F.4.
- **Next:** **Physical/browser QA** for Phase 2 SEO tags; do **not** treat as full F.5 contour closure unless separately agreed.

---

## 2026-09-27 — F.5 Phase 1 — physical QA closure

- **Status:** **F.5 PHASE 1 PHYSICAL QA PASS — LOCALE ROUTING VERIFIED**.
- **Checkpoint:** `97f31af17cbe350c0a3c86facf4c326d29da0fc6`.
- **Scope:** **Documentation only** — records user-verified manual browser QA (Chrome, Consumer Web **localhost:3005**). **No** application/test/backend changes. **F.5 Phase 2 not started.**
- **Summary:** Multi-city locale routing, locale preference vs explicit URL precedence, safe search **`q`** / **`page`** / unsupported-query filtering, and consecutive **RU ↔ KK** switches **without reload** (Phase **1.4**) are **physically verified**. Phase **1.1** (route collision), **1.2** (multi-city middleware), **1.3** (safe query on switch), **1.4** (URL-derived switcher state) remain **PASS**. Historical defect (reverse switch no-op on stale layout locale) confirmed **fixed** post–1.4.
- **Physical QA limitations (non-blocking for Phase 1 closure):** (1) legacy **`/businesses/{id}`** redirect — **not** manually exercised (no convenient UUID); automated F.4/F.5 regressions **PASS**. (2) real **BusinessLocation `locationId`** locale switching — **not** manually exercised (no branch selector in session); automated **`locationId`** regressions **PASS**.
- **Deferred:** **F.5 Phase 2** (hreflang, locale sitemap expansion, full locale canonical metadata) — **explicit approval required**, **not auto-started**.
- **Next:** Agree scope and start **F.5 Phase 2** only after explicit approval.

---

## 2026-09-27 — F.5 Phase 1.4 hotfix — URL-derived locale state fixed

- **Status:** **F.5 PHASE 1.4 HOTFIX PASS — URL-DERIVED LOCALE STATE FIXED** (automated regression PASS; **physical browser QA must resume**).
- **Checkpoint:** `727dbdd69d0e189feb695508cbe2fdc7faa94e48`.
- **Root cause:** After soft **`/ru/…` → `/kk/…`** navigation, **`LocaleSwitcher`** still used stale **`locale`** from root **`PublicShell`** (SSR **`resolveLayoutLocale()`**); **`next === locale`** early-return blocked reverse switch with no error.
- **Summary:** **`resolveEffectivePublicLocale(pathname, layoutFallback)`** + **`evaluateLocaleSwitch()`**; switcher guard, **`aria-pressed`**, and active styling use **URL-derived** locale; layout prop is fallback only. No **`router.refresh()`**, reload, or middleware change. Phase **1.3** safe **`q`/`page`/`locationId`** preserved.
- **Automated verification:** **`f5-phase1-4-locale-switch-state.test.ts`** **10 PASS**; full Consumer Web Vitest **19 files / 163 PASS**; typecheck + **`next build` PASS**; dev/production HTTP smoke PASS.
- **Deferred:** F.5 **Phase 2** not started; **physical/manual browser QA** (**RU → KK → RU** and **KK → RU → KK** on search with **`q`**).
- **Next:** Resume physical browser QA from **`/ru/aktobe/search?q=coffee`**; explicit approval before Phase 2.

---

## 2026-09-27 — F.5 Phase 1.3 hotfix — locale switch safe query preservation fixed

- **Status:** **F.5 PHASE 1.3 HOTFIX PASS — LOCALE SWITCH SAFE QUERY PRESERVATION FIXED** (automated regression PASS; **physical browser QA still pending / must resume**).
- **Checkpoint:** `b6ccbc9628b8cd2a043e6cd39eae9375776f0a54`.
- **Root cause:** Physical QA on **`/ru/aktobe/search?q=coffee`** → KK switch dropped **`q`** because **`LocaleSwitcher`** passed only **`locationId`** and **`page`** into **`swapLocaleInPathname()`**; **`buildSafePublicQueryString()`** already supported **`q`**.
- **Summary:** Shared **`pickSafePublicQueryFromUrlSearchParams()`** + **`buildLocaleSwitchTarget()`** (same path as switcher); **`LocaleSwitcher`** now preserves allowlisted **`q`** with **`locationId`** / validated **`page`**; arbitrary params (e.g. **`utm_*`**) still filtered. **Phase 1.2 unchanged.** Middleware / Search SSR untouched.
- **Automated verification:** **`f5-phase1-3-locale-switch-query.test.ts`** **8 PASS**; full Consumer Web Vitest **18 files / 153 PASS**; typecheck + **`next build` PASS**; production start smoke PASS.
- **Deferred:** F.5 **Phase 2** not started; **physical/manual browser QA** (locale switch + search **`q`** scenario).
- **Next:** Resume physical browser QA from **`/ru/aktobe/search?q=coffee`** → KK; explicit approval before Phase 2.

---

## 2026-09-27 — F.5 Phase 1.2 hotfix — multi-city locale routing corrected

- **Status:** **F.5 PHASE 1.2 HOTFIX PASS — MULTI-CITY LOCALE ROUTING CORRECTED** (automated + dev/production runtime smoke PASS; **physical browser QA must resume**).
- **Checkpoint:** this focused `fix(web): correct F.5 multi-city locale routing` commit (final SHA in handoff).
- **Root cause:** Phase 1.1 middleware classified every supported-locale path with exactly two segments as a misplaced default-city path, so valid, future, and unknown city slugs were incorrectly nested under Uralsk.
- **Summary:** Removed generic two-segment normalization. After `ru` / `kk`, an arbitrary next segment is always `citySlug`; middleware has no city allowlist and does not query Catalog API. Only explicit locale-level compatibility shorthands **`categories`** and **`search`** insert the default city. Locale root insertion and neutral compatibility remain unchanged. `/{locale}/business/{slug}` is not invented as a shorthand; canonical business URLs retain `/{locale}/{citySlug}/business/{businessSlug}`. Unknown cities now reach canonical city validation and return **404 without URL rewrite**; city validation runs before the dependent categories request so its API 404 cannot become an accidental 500.
- **Verification:** focused F.5 Phase 1.2 routing tests **31 PASS**; full Consumer Web Vitest **17 files / 145 tests PASS** (F.5 Phase 1/1.1, F.2/F.3, F.4, mismatch/security, favicon included); typecheck and production build PASS; real dev and production requests verified Aktobe RU/KK, unknown-city RU/KK 404, explicit shorthands, Uralsk, neutral-cookie redirects, nested city routes, and no dynamic route collision.
- **Deferred:** F.5 **Phase 2** (hreflang, locale sitemap expansion, canonical SEO) **not started**; physical/manual browser QA.
- **Next:** Return to physical browser QA at the failed unknown-city scenario; explicit approval remains required before Phase 2.

---

## 2026-09-27 — F.5 Phase 1.1 hotfix — Next.js route collision resolved

- **Status:** **F.5 PHASE 1.1 HOTFIX PASS — NEXT.JS ROUTE COLLISION RESOLVED** (automated + **dev/production runtime smoke PASS**; **physical browser QA still pending**).
- **Checkpoint:** `e7b4b7fcf2a95bee7f75a224ca08a1ee29cef1b0`.
- **Root cause:** Next.js 15.5.25 rejects sibling App Router trees **`app/[locale]/…`** and **`app/[citySlug]/…`** — both claim the first dynamic URL segment (`'citySlug' !== 'locale'`). **`next build`** did not fail; **`next dev`** and request handling on **`next start`** did.
- **Summary:** Removed obsolete **`app/[citySlug]/**`** compatibility pages; locale-neutral and misplaced locale-prefixed entry redirects moved to **middleware-only** (308, single hop, cookie **`ru`/`kk`** or default **`ru`**, safe query **`locationId`/`page`/`q`**); canonical SSR/render tree **`app/[locale]/[citySlug]/…`** only; preserved **`/`** via **`app/page.tsx`**, legacy **`/businesses/{id}`**, **`/categories*`**, static/system exclusions, favicon → **`/icon`** rewrite, F.4 business semantics unchanged.
- **Automated verification:** consumer-web vitest **141 PASS** (incl. **`f5-phase1-1-middleware-locale-redirect.test.ts`**); F.5 Phase 1 / F.2–F.4 / mismatch / favicon regressions PASS; **`tsc --noEmit` PASS**; **`next build` PASS**; **dev Ready** + HTTP smoke **`/`**, **`/uralsk`**, **`/ru/uralsk`**, **`/kk/uralsk`**, **`/favicon.ico`** PASS; **production Ready** + smoke incl. **`/robots.txt`**, **`/sitemap.xml`**, canonical business route PASS — **no dynamic slug collision observed**.
- **Deferred:** F.5 **Phase 2** (hreflang, locale sitemap, full locale canonical metadata); **physical/manual browser QA**.
- **Next:** Resume **physical browser QA** (human); **explicit approval** before **F.5 Phase 2** — **not auto-started**.

---

## 2026-09-27 — F.5 Phase 1 — locale routing foundation

- **Status:** **F.5 PHASE 1 IMPLEMENTED — LOCALE ROUTING FOUNDATION** (automated verification PASS; **physical/manual QA pending**).
- **Scope:** **`apps/consumer-web` only.** **No** backend, Prisma, Flutter, Admin/Business Web, or F.5 Phase 2 SEO (hreflang/sitemap locale expansion).
- **Summary:** Locale-prefixed public routes **`/ru/…`** / **`/kk/…`** for city discovery, categories, category/subcategory, search, canonical business page; **URL locale authoritative** over `qalago_locale` on prefixed routes (middleware **`x-qalago-route-locale`** + route params); locale-neutral paths remain **compatibility entry** → **permanent redirect** (cookie **`ru`/`kk`** or default **`ru`**); root **`/`** → **`/{locale}/uralsk`**; language switcher swaps locale segment + safe query; internal links/breadcrumbs/branches preserve locale; F.4 wrong-city redirect preserves locale; **`/businesses/{id}`** → direct locale-prefixed canonical; **`ru`/`kk`** top-level reserved.
- **Automated verification:** consumer-web vitest **114 PASS** (incl. **`f5-phase1-locale-routing.test.ts`**); F.2/F.3/F.4/mismatch/favicon regressions updated; **`next build` PASS**.
- **Deferred:** F.5 Phase 2 — hreflang, **x-default**, locale sitemap pairs, locale canonical metadata system; physical F.5 routing QA.
- **Next:** **Physical/manual routing QA** (human); **explicit approval** before **F.5 Phase 2** — **not auto-started**.

---

## 2026-09-27 — F.5 Phase 0 — locale SEO URL contract locked

- **Status:** **F.5 PHASE 0 PASS — LOCALE SEO URL CONTRACT LOCKED**. **F.5 product implementation not started** (Phase 1+ requires explicit approval).
- **Scope:** **Documentation only.** **No** Consumer Web routes, backend, Flutter, DB, or migrations.
- **Summary:** Locked indexable public locale prefixes **`/ru/`** and **`/kk/`**; URL locale authoritative over cookie/`Accept-Language` on prefixed pages; locale-neutral paths remain **compatibility entry** → permanent redirect to prefixed URL (cookie **`ru`/`kk`** or default **`ru`**); self-canonical per locale; reciprocal **hreflang** + **`x-default` → RU** prefixed URL; sitemap emits both locales; F.4 **`locationId`** / multi-city / wrong-city rules preserved under locale; internal links preserve locale; **zero** schema/API requirement. Canonical authority: **`docs/architecture/public-consumer-web.md`** § F.5.
- **Stale doc fix (factual only):** **`future-extensibility-contracts.md`**, **`business-location.md`** — F.4 **CLOSED / PASS** (removed “implementation not started” where current-state was wrong). Historical changelog entries unchanged.
- **Deferred:** F.5 Phase 1 routing/redirects/metadata/sitemap; F.6 deep links; Web auth/favorites; all other F.5 out-of-scope items in contract § F.5.
- **Next:** **Explicit approval required** before **F.5 Phase 1** — **not auto-started**.

---

## 2026-09-27 — F.4 PASS — public business pages finalized

- **Status:** **F.4 PASS — PUBLIC BUSINESS PAGES FINALIZED**. **F.4 is CLOSED** (reopen only on confirmed defect or explicit new scope).
- **Checkpoint (docs closure):** follows hotfix `678cb23a8e9004aa9be3aea170affaad68eb045e` — see git log for this entry’s commit SHA.
- **Implementation checkpoints:** Phase **0** read-only audit (**CONTRACT DECISION REQUIRED**); Phase **0.1** `d727331eaa8ef5a53ff9b6245ba914e63c564011`; Phase **1** `3bcd5cac785c5fbc9c5b5f623c96359645cf1854` (docs checkpoint `5e3826d76aa081b205a087d537405efe31c69fa8`); Phase **2** `52dfe1c4c32a906c964ee3e34470a511864faa84`; Phase **2.1** hotfix `678cb23a8e9004aa9be3aea170affaad68eb045e` (**409** field passthrough + **`/favicon.ico`** → **`/icon`**).
- **Summary:** Canonical **`/{citySlug}/business/{businessSlug}`** (+ optional **`?locationId=`**); backend **`GET /businesses/by-slug/:businessSlug?citySlug=`**; city membership **404**; city-default branch; wrong-city **`locationId`** permanent normalize; foreign/invalid safe fallback; legacy **`/businesses/{id}`** redirect; indexable canonical/sitemap without query; typed showcase + **BreadcrumbList**; **6.12A** compatible.
- **Automated verification (recorded):** Phase **2** — F.4 tests **17**; F.2/F.3 **13** files / **85** tests; typecheck + build **PASS**. Phase **2.1** — F.4 tests **17 PASS**; mismatch suite **11 PASS**; F.2/F.3 **15** files / **97 PASS**; typecheck + build **PASS**; favicon routing test **PASS**; **`ProductionExceptionFilter`** regression **PASS**.
- **Physical / manual browser QA (completed):** discovery → canonical page (Bar Code 51); city-default without query; OSM map CTA; RU/KK UI labels; unknown slug **404**; multi-city fixture (**Uralsk** / **Aktobe** branches, city-default per city); wrong-city URL normalize after **2.1**; temp ID redirects; foreign/invalid **`locationId`** no leak; absent city (**Astana**) **404**; branch switcher cross-city; canonical excludes **`locationId`**; sitemap city/business URLs only; responsive narrow width; favicon **200**; breadcrumbs JSON-LD; **`robots.txt`** disallow **`/businesses/`**.
- **Deferred (non-blocking):** Consumer Web interactive map; **LocalBusiness** / **AggregateRating** JSON-LD; Web auth/favorites; production **`qalago.kz`** origin config (vs localhost); auto-translation of business-generated text; KK **«Фото»** wording; **F.5+** / **6.12B** / other contours — **not started**.
- **Next:** **Explicit agreement required** before any next stage (**F.5**, **6.12B**, etc.) — **not auto-started**.

---

## 2026-09-27 — F.4 Phase 2.1 hotfix wrong-city normalization + favicon

- **Status:** **F.4 PHASE 2.1 HOTFIX — WRONG-CITY NORMALIZATION RUNTIME FIX** (manual QA **not** complete).
- **Summary:** Manual QA found **409** **`BUSINESS_LOCATION_CITY_MISMATCH`** returned only **`statusCode`**, **`message`**, **`code`** — **`ProductionExceptionFilter`** dropped **`businessSlug`**, **`locationId`**, **`citySlug`**; Consumer Web parser correctly rejected incomplete body → **500**. Filter now forwards public normalization fields; strict parser tests added. **`/favicon.ico`** rewritten to **`/icon`** via **`middleware.ts`** so **`[citySlug]`** no longer treats **`favicon.ico`** as a city.
- **Deferred:** F.4 manual QA resume; F.4 **FINALIZED** gate.
- **Next:** Resume manual QA from wrong-city URL **`/uralsk/business/...?locationId=<aktobe-branch>`** (expect permanent redirect to Aktobe).

---

## 2026-09-27 — F.4 Phase 2 canonical Consumer Web business page

- **Status:** **F.4 PHASE 2 IMPLEMENTED — CANONICAL CONSUMER WEB BUSINESS PAGE** (manual QA pending — **F.4 not FINALIZED**).
- **Scope:** **`apps/consumer-web`** — canonical route, typed showcase, discovery link migration, legacy ID redirect, sitemap/SEO/metadata, tests, docs. **No** backend/schema/Flutter/Admin/Business Web changes.
- **Summary:** **`/{citySlug}/business/{businessSlug}`** + optional **`?locationId=`** via **`GET /businesses/by-slug/...`**; **409** → **`permanentRedirect`** to correct city; **404**/`notFound()` per Phase 0.1; sections (hero, contacts, branches, **`effectiveMedia`**, **`effectiveCatalog`**, **`effectivePromotions`**, reviews read-only, OSM CTA); canonical/sitemap **without** query; **`/businesses/{id}`** permanent redirect (noindex preserved); **`BusinessList`** canonical hrefs; **`BreadcrumbList`** JSON-LD; tests **`f4-business-page.test.ts`** + F.2/F.3 regression.
- **Deferred:** F.4 **manual/physical QA**; **LocalBusiness** / **AggregateRating** JSON-LD; F.4 Phase 3+; overall **F.4 FINALIZED** gate.
- **Next:** **F.4 manual QA** (human) — explicit scenarios in implementation report; then agreement on closure / any follow-up stage.

---

## 2026-09-27 — F.4 Phase 1 public business slug/city resolution (backend)

- **Status:** **F.4 PHASE 1 PASS — PUBLIC BUSINESS SLUG/CITY RESOLUTION BACKEND**.
- **Checkpoint:** `3bcd5cac785c5fbc9c5b5f623c96359645cf1854`.
- **Scope:** **`services/catalog-api`** — explicit public slug endpoint; shared detail composition; focused tests; contract docs. **No** Consumer Web page, SEO, Flutter, map, Admin/Business Web, schema migration, or **`Business.cityId`**.
- **Summary:** **`GET /api/v1/businesses/by-slug/:businessSlug?citySlug=`** (required) + optional **`locationId`**. Resolves **`Business.slug`** + city + branch per Phase 0.1: membership **404**; city-default (**primary in city**, else A.7.9.3A ordering); same-city **`locationId`** → **`effective*`**; wrong-city owned **`locationId`** → **409** **`BUSINESS_LOCATION_CITY_MISMATCH`** with public **`citySlug`**; foreign/invalid **`locationId`** → city-default without leak. Refactored **`composePublicBusinessDetail`** shared with **`GET /businesses/:id`** (ID route semantics unchanged). Tests: **`business-f4-public-location-resolution.util.spec.ts`**, **`stage-6-12a-f4-slug-city-detail.spec.ts`**.
- **Deferred:** **F.4 Phase 2** Consumer Web canonical **`/{citySlug}/business/{businessSlug}`** page, redirects, indexable SEO — **explicit approval required**.
- **Next:** **F.4 Phase 2** Consumer Web canonical Business page — **not auto-started**.

---

## 2026-09-27 — F.4 Phase 0.1 multi-city public Business URL contract

- **Status:** **F.4 PHASE 0.1 PASS — MULTI-CITY PUBLIC BUSINESS URL CONTRACT LOCKED**.
- **Scope:** **Documentation only.** **No** runtime/API/schema/DB/product changes.
- **Summary:** Multi-city F.4 URL semantics added to **`docs/architecture/future-extensibility-contracts.md`** (Contract 1 addendum): **`citySlug`** is required city context; **404** when no eligible branch in city; **no `locationId`** → city-scoped default (**global primary in city**, else **A.7.9.3A** ordering); same-city **`locationId`** honored; wrong-city owned **`locationId`** → **308/301** to actual city; foreign/invalid **`locationId`** → city-default without leak; **canonical/sitemap** exclude branch query variants; multi-city indexable **one URL per real city**; temp **`/businesses/{id}`** redirect rules documented; explicit **slug + city** public API boundary (no accidental `:id` overload).
- **6.12A:** Invariants preserved — no **`Business.cityId`**, no **cityPrimary**, global primary unchanged.
- **Next:** **Explicit approval** for **F.4 backend** slug + city-context resolution — **F.4 implementation not started**.

---

## 2026-09-27 — Future Extensibility Architecture Gate (Phase 2 contracts)

- **Status:** **FUTURE EXTENSIBILITY ARCHITECTURE GATE — AGREED / DOCUMENTED**.
- **Scope:** **Docs / architecture only.** **No** product code, tests, schema, migrations, DB, or implementation. Prerequisite decision gate before **F.4** (not a numbered product stage such as 6.12C).
- **Summary:** Canonical contracts locked in **`docs/architecture/future-extensibility-contracts.md`**: F.4 v1 public URL (`/{citySlug}/business/{businessSlug}` + optional `locationId` query); **NavigationTarget** cross-channel model; F.4 **hybrid typed** showcase; **Event vs Promotion** and **editorial vs Business** boundaries; **HomeLayoutConfig** vs release/feature/maintenance split; lifecycle, media, favorites, notification/analytics extension, and API evolution rules. **6.12A** invariants preserved (**Business** / **BusinessLocation** grains, no **`Business.cityId`**).
- **Deferred / not implemented:** F.4, F.6, Event, Home CMS, NotificationPreference, media migration, generalized Favorites, new feature-flag work — unchanged.
- **Next:** **Explicit approval required** before implementation. **F.4** is **architecturally unblocked** as a candidate next stage — **not auto-started**.

---

## 2026-09-27 — 6.12A BusinessLocation architecture (umbrella closure)

- **Status:** **6.12A PASS — BUSINESSLOCATION ARCHITECTURE FINALIZED**.
- **Scope:** **Docs-only umbrella closure** after read-only audit (**READY FOR FORMAL CLOSURE**). **No** product-code, schema, migration, DB, or test changes in this entry.
- **Summary:** All required **6.12A** implementation, hardening, and legacy retirement through **6.12A.9.4.5E** is complete. **Business** = brand/entity; **BusinessLocation** = sole physical/city authority. Retired from **Business:** **`cityId`**, **address**, **lat/lng**, **location**, **locationSource**. **Business** retains documented contact defaults (**phone**, **whatsapp**, **instagram**, **website**, **workHours**). Final grains: map = **BusinessLocation**; discovery/search/category/home = **Business** + **`contextLocationId`**; reviews/favorites/membership = **Business**-wide; branch-effective catalog/promotions/media; **CITY_ADMIN** admin visibility = **ANY BL** in city; owner-equivalent = **primary BL city**; public effective location + safe foreign **`locationId`** fallback verified. **No material ACTIVE_RUNTIME** dependency on retired **Business** physical columns.
- **Evidence (canonical checkpoints — do not rewrite substage history):** **6.12A.9.4.5D3** implementation `7a153cdf497c711c3aeda2b60cc72588f50d7859` — **205/205** suites, **1403/1403** tests, build PASS; **6.12A.9.4.5E** docs closure `657cfc6f1ccad2cf469d0030ade0e0d9aab5146b` — Samsung + API/manual QA, multi-city fixture, primary promotion, cleanup to **109/110/109** primary BL, integrity PASS, **`Business.cityId`** absent, migrations **47/47**; D2 backup preserved (`infra/local-backups/qalago_dev_native_pg18_pre_5d2_business_cityid_retirement_20260926T131630Z.dump`, 596125 bytes); **`a945e-*`** helpers local/untracked.
- **Deferred (post-6.12A — does not block closure):** production coordinate hygiene; optional DB hardening where explicitly deferred; Admin branch-management expansion; **6.12B** / Catalog Import; **F.4** Business Pages; remaining Consumer Web depth; production monetization; map/provider work; broader Admin/Business Web audits; other documented backlog — **explicit agreement required** before start.
- **Next:** **Explicit agreement required** before any post-**6.12A** work (**F.4**, **6.12B**, remaining contours — not auto-started).

---

## 2026-09-26 — 6.12A.9.4.5E Business.cityId retirement physical/manual QA + fixture cleanup

- **Status:** **6.12A.9.4.5E PASS — BUSINESS.cityId RETIREMENT PHYSICAL QA FINALIZED**; **6.12A.9.4.5 PASS — BUSINESS.cityId RETIREMENT FINALIZED** (umbrella — **5A**, **5B**, **5C**, **5D1**, **5D2**, **5D3**, **5E** complete).
- **Checkpoint (docs closure):** `657cfc6f1ccad2cf469d0030ade0e0d9aab5146b`.
- **Scope:** **Docs-only closure** after completed physical/manual QA. **No** product-code, schema, migration, or DB changes in this commit. Temporary dev fixture helpers under **`infra/local-backups/a945e-*`** (uncommitted; preserved).
- **Fixture (dev, removed):** multi-city QA Business **`cmuiletaq0002ul380paca4ab`** (L1 Uralsk + L2 Aktobe); branch-scoped services/promotions; OWNER + CITY_ADMIN test accounts. **Fixture plan correction:** QA Business temporarily set from **FREE** → **BASIC** so **FREE `maxActivePromotions=1`** did not hide a branch promotion during QA — **fixture-only**, not a product defect.
- **Physical QA (Samsung SM-J610FN):** discovery/search/map one card per city; Uralsk default **L1** / Aktobe **L2**; branch switch; branch-effective catalog/promotions (**SELECTED + ALL** per branch); marker preview → detail context preserved; post–primary-promotion behavior unchanged for city/branch context. **Favorites:** **NOT TESTED** (auth required). **Reviews:** guest-readable; fixture had **zero** reviews.
- **Primary promotion (dev helper):** L1 → secondary, L2 Aktobe → **primary**; structural invariants PASS; **`Business.cityId`** absent.
- **API / authorization QA (real paths):** Admin **`GET /admin/businesses`** + content read — CITY_ADMIN visibility = **ANY BusinessLocation** in managed city (Uralsk via secondary L1; Aktobe via L2). Owner-equivalent gate **`GET /businesses/:id/locations`** — Uralsk CITY_ADMIN **403**, Aktobe **200** (**primary BL city**). OWNER membership **200**, both branches, business-wide. Public detail **`GET /businesses/:id?locationId=`** — default primary **L2**, explicit L1/L2, foreign BL id safe fallback to own primary; no cross-business leak; no empty **`cityId`** on responses.
- **Cleanup:** **`a945e-physical-cleanup.mjs`** — pre **110/112/110** primary BL → post canonical **109/110/109**; integrity audit PASS; seed CITY_ADMIN accounts preserved; D2 backup preserved (**596125** bytes).
- **Deferred:** **F.4** and post–**6.12A** contour work per roadmap — **not** auto-started.
- **Next:** Per **`docs/ai-project-context.md`** — **explicit agreement only** (no substage under **A.9.4.5** remains).

---

## 2026-09-26 — 6.12A.9.4.5D3 Post-cityId regression + fixture cutover + 5D closure

- **Status:** **6.12A.9.4.5D3 PASS — POST-cityId REGRESSION FINALIZED**; **6.12A.9.4.5D PASS — BUSINESS.cityId RETIREMENT FINALIZED**; **5E** not started.
- **Checkpoint (implementation):** `7a153cdf497c711c3aeda2b60cc72588f50d7859`.
- **Baseline (D3 start):** `68c395f96e1ef4bae58255936e0da26f53ea0e5e`; **5D1** `ffeffdc3d844a183e31f46d5f776c4b49e047209`; **5D2** `db82561a1dc101c1420a099a84ddb7547563f40d`.
- **Scope:** **`services/catalog-api`** — integration/unit spec fixture cutover for **POST-cityId** live dev DB; analytics dashboard mocks (**primary BL** timezone/city); catalog search util spec (**`locations.some`** city scope); dev codemod helpers **`5d3-strip-business-cityid-specs.mjs`** / **`5d3-fix-spec-indent.mjs`**. **No** product runtime changes; **no** schema/migration; **no** seed/integrity **`--apply`**; **no** **5E** physical QA.
- **Summary:** All active tests create **Business** shell without **`cityId`**; city membership via **primary/secondary BusinessLocation** (`specCreateInitialPrimary`, `createTestBusinessWithPrimary`, nested **`locations.create`**). **`Business.cityId`** column absent on dev DB and Prisma model. Public API **`cityId`** remains BL-derived projection. **5A/5B/5C** semantics unchanged from prior substages.
- **Verified:** **`npx prisma generate`**; **`prisma migrate status`** **47/47** applied; **`integrity:business-locations:audit`** PASS (**109/110**, zero/multi-primary **0**, BL hygiene PASS); full **`catalog-api`** Jest **205/205** suites, **1403/1403** tests (~36s, **`--runInBand`**); focused **5A/5B/5C** + integrity/visibility suites PASS; **`npm run build`** PASS; post-test DB counts restored to canonical baseline; D2 backup preserved (596125 bytes, untracked).
- **Deferred:** **6.12A.9.4.5E** physical/manual QA (explicit agreement only).
- **Next:** **6.12A.9.4.5E** when agreed (**not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.5D2 Business.cityId retirement (dev DB apply)

- **Status:** **6.12A.9.4.5D2 PASS — BUSINESS.cityId RETIRED FROM DEV DATABASE**; **5D3** not started.
- **Checkpoint (docs):** `db82561a1dc101c1420a099a84ddb7547563f40d`.
- **Baseline:** `18cb01c6d8c2128a629643e0e7e8a424bb52d4e2` (**5D1** closure); implementation **`ffeffdc3d844a183e31f46d5f776c4b49e047209`** unchanged.
- **Scope:** Dev **`qalago_dev`** only — fresh native **`pg_dump`** backup, **`prisma migrate deploy`** for **`20260926180000_stage_6_12a9_4_5d_business_city_id_retirement`**. No product code changes; no seed; no integrity **`--apply`**; no **5D3** / **5E**.
- **Summary:** **`Business.cityId`**, **`Business_cityId_fkey`**, and **`Business_cityId_status_idx`** removed from live dev DB. **BusinessLocation** city FK/indexes, PostGIS trigger/GiST, and independent city fields (**BusinessApplication**, **AdCampaign**, **AnalyticsEvent**) preserved. Entity counts unchanged (**109/110** businesses/locations, **109** primaries, **3** cities).
- **Backup (uncommitted):** `infra/local-backups/qalago_dev_native_pg18_pre_5d2_business_cityid_retirement_20260926T131630Z.dump` (596125 bytes; **`pg_dump` 0**, **`pg_restore --list` 0**, TOC **557** lines).
- **Verified:** pre-apply invariants green; **47/47** migrations applied; post-apply schema gate; **`integrity:business-locations:audit`** PASS; primary-city derivation **0** unresolved; ACTIVE primary **`cityId`** smoke **0** empty; **`npx prisma generate`**; **`npm run build`**; focused unit tests (physical normalization, primary sync util, visibility util).
- **Deferred:** **6.12A.9.4.5D3** — integration spec migration + full regression on POST-5D DB.
- **Next:** **6.12A.9.4.5D3** (explicit agreement only; **not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.5D1 Business.cityId retirement preparation (code/schema/tests; migration not applied)

- **Status:** **6.12A.9.4.5D1 PASS — BUSINESS.cityId RETIREMENT PREPARED, MIGRATION NOT APPLIED**; **5D2** not started.
- **Checkpoint (implementation):** `ffeffdc3d844a183e31f46d5f776c4b49e047209`.
- **Baseline:** `d7b039dd00d062d20622b8d24420194277afc7d8` (**5D PRE-MIGRATION GATE** acceptance).
- **Scope:** **`services/catalog-api`** — Prisma **Business** without **`cityId`** / **City.businesses** / **`Business_cityId_status_idx`**; forward migration **`20260926180000_stage_6_12a9_4_5d_business_city_id_retirement`** (**NOT APPLIED**); create/onboarding aggregate without parent city; primary promotion contact sync without city mirror; physical read normalization; access/reporting/monetization/moderation residuals; integrity CLI without parent mirror parity; seed/visibility tooling; focused specs. **No** `migrate deploy/dev`, **no** `db push`, **no** seed/integrity **`--apply`** on live dev DB.
- **Summary:** Repository **CODE/PRISMA TARGET = POST-cityId**; **LIVE DEV DB = PRE-5D** until **5D2** (column may still exist with legacy values). Public **`cityId`** remains BL-projected. **5A/5B/5C** semantics preserved. Deprecated **`businessMatchesApplicationDedupe`** and **`legacyBusinessCatalogCityScope`** removed.
- **Verified:** **`npx prisma generate`**; **`npm run build`**; focused Jest (primary sync util, physical normalization, access, **5C** scope, dedupe, visibility, campaign/analytics city utils); **`integrity:business-locations:audit`** read-only PASS (**109/110** businesses/locations).
- **Deferred:** **5D2** migration apply (requires fresh backup immediately before deploy); full dev DB integration specs that INSERT **Business** without **`cityId`** on **PRE-5D** schema; remaining integration spec **`prisma.business.create({ cityId })`** compile migration (~30 files).
- **Next:** **6.12A.9.4.5D2 — APPLY MIGRATION + POST-APPLY VERIFICATION** (explicit agreement only; **not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.5C Reporting / benchmark / moderation city semantics cutover

- **Status:** **6.12A.9.4.5C PASS — REPORTING / BENCHMARK / MODERATION PARENT-CITY READS RETIRED**; **A.9.4.5D** not started.
- **Checkpoint (implementation):** `e661f0bc50bdc363efd50865510c4a90c9d270af`.
- **Baseline:** `d57920aa144758455280caaffee2bb42e76ccfaa` (**A.9.4.5B** docs closure).
- **Scope:** **`services/catalog-api`** — category benchmark BL market membership; reporting scope explicit city filter; moderation target city via primary/branch BL; audit stamps (plans, team, reviews, claims, profile, admin review delete); analytics dashboard benchmark market from primary BL; **`business-context-city.util`**. **No** schema migration; **`Business.cityId`** retained.
- **Summary:** Benchmark peers qualify by **BusinessLocation presence** in market city. Reporting **`businessCityWhere`** unchanged (ANY-BL); business-scoped admin reports use **explicit `filters.cityId`**, not parent mirror. Moderation/audit attribution uses **primary BL** or **branch BL** (media); **`resolveBusinessAuditCityId`** for business-wide stamps. Remaining **`Business.cityId`** uses classified for **5D** compatibility (create/sync/integrity, deprecated dedupe helper, compatibility projection util, dev scripts).
- **Verified:** focused Jest (benchmark **6.6E**, **5C** scope, context util, moderation); **`npm run build`**; **`integrity:business-locations:audit`** read-only PASS.
- **Deferred:** **6.12A.9.4.5D PRE-MIGRATION READ-ONLY GATE** (column retirement); **5E** if scoped separately.
- **Next:** **6.12A.9.4.5D PRE-MIGRATION READ-ONLY GATE** only when explicitly agreed (**not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.5B Monetization / analytics parent-city fallback cutover

- **Status:** **6.12A.9.4.5B PASS — MONETIZATION / ANALYTICS PARENT-CITY FALLBACKS RETIRED**; **A.9.4.5C** not started.
- **Checkpoint (implementation):** `f459acd742f13b7406ef1ddc8be0da0408754a3d`.
- **Baseline:** `c96c3220f88d025528cf84c794f335e085aae678` (**A.9.4.5A** docs closure).
- **Scope:** **`services/catalog-api`** — `resolveCampaignMarketCityId` / `resolveAnalyticsEventCityId` / order provisioning / product purchase schedule; **`resolvePersistedOrderItemMarketCityId`** for purchase-time stable **`metadata.campaignCityId`**; **A.8.1** stale analytics spec corrected. **No** schema migration; **`Business.cityId`** column retained.
- **Summary:** Campaign market city = target/destination BL → explicit city (branch presence) → primary BL → fail closed. Analytics new events = explicit → BL → campaign → primary BL → omit; no parent **`Business.cityId`**. Orders/provisioning use persisted metadata before live resolver. Purchase schedule preview uses primary BL. **A.8.1** test debt closed (branch **`businessLocationId`** allowed).
- **Verified:** focused Jest (campaign/analytics utils, monetization suite, **A.8.1**, **analytics.service**); **`npm run build`**; **`integrity:business-locations:audit`** read-only PASS (109/110, mirror **0**, BL hygiene PASS).
- **Deferred:** **A.9.4.5C** reporting/benchmark/moderation **`Business.cityId`** stamps; **5D** column retirement.
- **Next:** **6.12A.9.4.5C** (explicit agreement only; **not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.5A CITY_ADMIN authorization semantics + A.9.4.4 formal closure

- **Status:** **6.12A.9.4.5A PASS — CITY_ADMIN AUTHORIZATION SEMANTICS FINALIZED**; **6.12A.9.4.4 PASS — LEGACY BUSINESS PHYSICAL GEO AUTHORITY RETIRED** (formal umbrella — geo columns dropped **C4**; **`Business.cityId`** is separate **A.9.4.5** debt). **A.9.4.5B** not started.
- **Checkpoint (implementation):** `a47c67268b4faddb1b15179b65c15efe9cfeb514`; **docs:** `8aa365f`.
- **Baseline:** `d34dc7071d12f0294371a6cde1b2258739d3406a` (**A.9.4.5** read-only audit acceptance).
- **Scope:** **`services/catalog-api`** — `CityScopeService.assertBusinessPrimaryLocationCityInAdminScope`; **`BusinessAccessService`** owner-equivalent **CITY_ADMIN** gate by **primary BL** city; preserve **ANY-BL** admin visibility; deprecate **`assertBusinessParentCityInAdminScope`** for auth; focused Jest + runtime multi-city integration spec; **`apps/admin-web`** primary-city labels on claims/order detail where **`business.city`** mirrors primary. **No** schema/migration; **no** **`Business.cityId`** removal; **no** monetization/analytics fallback cutover.
- **Summary:** Frozen city model: physical membership = **BL-only**; **`Business.cityId`** = compatibility mirror of primary BL until **5D**; public **`cityId`** = effective BL context. **CITY_ADMIN:** Admin staff sees businesses with **any** branch in scope; Business Web owner-equivalent access requires **primary** branch city in scope — secondary branch alone does not escalate. Primary promotion switches owner-equivalent scope; mirror **`Business.cityId`** sync unchanged. **A.9.4.4 closure:** **`address` / `latitude` / `longitude` / `location` / `locationSource`** are not **Business** storage/authority (**C4**).
- **Verified:** focused Jest (**city-scope**, **business-access**, **A.9.4.1A**, **A.9.4.5A** integration); **`npm run build`** catalog-api.
- **Deferred:** **6.12A.9.4.5B** monetization/analytics **`Business.cityId`** fallback cutover; **5C–5E**; **`stage-6-12a8-1-ad-campaign-location-context.spec.ts`** historical null **`businessLocationId`** expectation (**A.8.1** — fix before/during **5B**).
- **Next:** **6.12A.9.4.5B — MONETIZATION / ANALYTICS FALLBACK CUTOVER** (explicit agreement only; **not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.4C4C Post-migration regression + C4 closure

- **Status:** **6.12A.9.4.4C4C PASS — POST-MIGRATION REGRESSION FINALIZED**; **6.12A.9.4.4C4 PASS — LEGACY BUSINESS GEO STORAGE RETIRED** (subordinate: **C4A PASS** prepared `90cd95b…`; **C4B PASS** applied; **C4C PASS** regression finalized). **A.9.4.5** not started.
- **Checkpoint (implementation + docs):** `d7738c58a071a35537de66d5bb3d14e1877687ff`.
- **Baseline:** `431833b40531f0a3525c0096cf250087e6f419c7` (**C4B** docs).
- **Scope:** Post-C4 dev **`qalago_dev`** read-only schema re-verify; **`prisma migrate status`**; static retired-**Business**-geo recheck; full **`catalog-api`** Jest; focused BL/C1–C3/create/owner/discovery regressions; C2 **`integrity:business-locations:audit`** (no **`--apply`**); client static/build smoke; architecture alignment for **BL physical authority**; integration spec updates for post-C4 DB (no schema/migration edits).
- **Summary:** Dev DB post-C4 invariants hold (**109/110**, primary **109**, **`Business.cityId` NULL 0**, BL PostGIS + hygiene PASS). Active runtime paths use **BusinessLocation** projection; remaining spec failures classified **pre-existing** (**A.8.1** analytics `businessLocationId` count — product evolved post spec). Three parallel-test fixture businesses removed after suite (slug audit) to restore baseline counts. Preserved backup **`qalago_dev_native_pg18_pre_c4b_business_geo_retirement_20260926T084201Z.dump`** (600552 bytes, untracked).
- **Verified:** **`c4b-post-apply-readonly.mjs`** PASS; **46/46** migrations; **`npm test`** **201/202** suites (**1392/1393** tests — one **B** debt); **`npm run build`** catalog-api; **`flutter analyze`** (pre-existing info/warnings only).
- **Deferred:** **A.9.4.5** **`Business.cityId`** retirement; refresh **`stage-6-12a8-1-ad-campaign-location-context.spec.ts`** “historical null `businessLocationId`” assertion; optional Jest **`--runInBand`** CI note for dev DB integration isolation.
- **Next:** **A.9.4.4** substage review / **A.9.4.5** only when explicitly agreed (**not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.4C4B Business geo column retirement (dev DB apply)

- **Status:** **6.12A.9.4.4C4B PASS — BUSINESS GEO COLUMNS RETIRED FROM DEV DATABASE** (overall **A.9.4.4C4** not closed — **C4C** full regression remains).
- **Checkpoint (docs):** `713a53f8ad9f40f5acb622c76f60017f887b7b27`.
- **C4A implementation baseline:** `90cd95b89f0f72751df517c90a9785962a944024`.
- **Scope:** Dev **`qalago_dev`** only — fresh **`pg_dump`** custom backup, **`prisma migrate deploy`** for **`20260926120000_stage_6_12a9_4_4c4_business_geo_column_retirement`**. No product code/schema/migration SQL edits; no seed; no integrity **`--apply`**; **C4C not started**.
- **Summary:** Live DB post-C4: **Business** no longer stores **address/latitude/longitude/locationSource/location** or Business-only spatial trigger/GiST/function; **Business.cityId** + contact defaults retained; **BusinessLocation** PostGIS trigger/function/GiST/columns preserved; entity counts **109/110** unchanged.
- **Backup (uncommitted):** `infra/local-backups/qalago_dev_native_pg18_pre_c4b_business_geo_retirement_20260926T084201Z.dump` (~587 KiB; **`pg_restore --list`** verified).
- **Verified:** pre-apply PRE-C4 catalog + unique legacy-only **0**; post-apply catalog gate; **`integrity:business-locations:audit`** PASS; **`npm run build`**; **`prisma generate`**.
- **Next:** **6.12A.9.4.4C4C** — full regression on migrated DB (**not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.4C4A Destructive migration preparation (not applied)

- **Status:** **6.12A.9.4.4C4A PASS — DESTRUCTIVE MIGRATION PREPARED, NOT APPLIED** (overall **A.9.4.4C4** not closed — **C4B** apply + **C4C** regression remain).
- **Checkpoint (implementation):** `90cd95b89f0f72751df517c90a9785962a944024`.
- **Baseline:** `e79753709fdc564eb53028a77d111e883739a6cd` (**A.9.4.4C3** docs closure).
- **Scope:** **`services/catalog-api`** — Prisma **Business** model without five legacy geo fields; forward migration SQL **`20260926120000_stage_6_12a9_4_4c4_business_geo_column_retirement`** (created, **not applied**); retired INSERT bootstrap + legacy full geo mirror helpers; compatibility/create/seed/repair compile paths; integration spec fixtures migrated to post-C4 Prisma types; **BusinessLocation** spatial infra untouched. **No dev DB mutation**, **no seed**, **no `migrate deploy`**, **C4B not started**.
- **Summary:** Repository typechecks against post-C4 **Business** ( **`cityId` + contacts/defaults retained** ); public API physical fields remain BL-projected. Dev DB remains **PRE-C4** until **C4B** fresh backup + apply.
- **Verified:** **`npx tsc --noEmit`**, **`npm run build`**, **`prisma generate`**; focused unit Jest (primary-location util/aggregate/service, catalog-geo-query, dedupe, visibility guard); **`integrity:business-locations:audit`** read-only **PASS** (109/110, BL hygiene **0**).
- **Deferred:** **C4B** migration apply; **C4C** full integration/regression on migrated DB; runtime integration specs that INSERT **Business** without legacy NOT NULL columns until **C4B**.
- **Next:** **6.12A.9.4.4C4B** — fresh backup + destructive migration apply (**not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.4C3 Business creation cut over to BusinessLocation authority

- **Status:** **6.12A.9.4.4C3 PASS — BUSINESS CREATION CUT OVER TO BUSINESSLOCATION AUTHORITY** (overall **A.9.4.4C** not closed — **C4** schema/column drop remains).
- **Checkpoint (implementation):** `a78ff95457c10e7e31ccce846906e91a1b99f670`.
- **Baseline:** `3608a0036c3bb41ea730721da379a7c051068960` (**A.9.4.4C2** docs closure).
- **Scope:** **`services/catalog-api`** — create/onboarding/seed aggregate semantics; **`legacyBusinessInsertGeoBootstrapFromPrimaryPhysical`** boundary; seed rename **`upsertSeedBusinessWithPrimaryLocationInTx`**; admin/application paths unchanged API; **`prisma/seed.ts`**. No schema/migration, **C4** not started.
- **Summary:** Production create semantics: **Business** brand shell + authoritative **primary BusinessLocation** atomically; physical input terminates on BL. **INSERT-only** legacy geo on **Business** isolated in one helper until **C4** column drop; post-create sync remains **cityId + contacts** only (C1). Seed idempotent upsert updates primary BL without re-establishing Business geo authority. Tracked **5N QA** already uses **`createBusinessWithInitialPrimaryInTx`**.
- **Verified:** focused Jest (**C3**, **3B**, aggregate util, primary-location util/service, **C1**, **C2**); **`npm run build`**; **`integrity:business-locations:audit`** read-only before/after **PASS** (109/110, BL hygiene **0** violations); no dev DB seed/`--apply`.
- **Deferred:** **A.9.4.4C4** — drop **Business** geo columns/triggers; remove INSERT bootstrap boundary; **A.9.4.5** **`Business.cityId`**.
- **Next:** **6.12A.9.4.4C4** — destructive schema migration prep (**not auto-started**).

---

## 2026-09-26 — 6.12A.9.4.4C2 BusinessLocation-native integrity / repair

- **Status:** **6.12A.9.4.4C2 PASS — BUSINESSLOCATION-NATIVE INTEGRITY / REPAIR FINALIZED** (overall **A.9.4.4C** not closed — **C3** bootstrap + **C4** schema remain).
- **Checkpoint (implementation):** `10c767d272e0033b25fdc93938e62727f9f89beb`.
- **Baseline:** `cb458e5fe1135a80e58e2983d8994625c43502fa` (**A.9.4.4C1** docs alignment).
- **Scope:** **`services/catalog-api`** — integrity/repair tooling and parity test helpers only. No schema/migration, no public API change, **C3** not started.
- **Summary:** Integrity is **BusinessLocation-native**. Retired **Business** geo mirror fields (**address/lat/lng/locationSource/location**) are no longer invariants; **`parentCityMirrorMismatchCount`** tracks temporary **Business.cityId ↔ primary BL.cityId** compatibility until **A.9.4.5**. Zero-location → **MANUAL_REMEDIATION** only (**`--apply`** does not reconstruct BL from legacy **Business** geo). Zero-primary **`--apply`** promotes deterministic existing BL and syncs **city/contact compatibility** only (no legacy full geo mirror). **BL hygiene** metrics: empty address, partial/invalid coordinates, geography parity vs trigger semantics. Parity test util delegates to compatibility assertions (cityId + phone).
- **Verified:** focused Jest (**2A/2B**, **C1**, **C2**, integrity util, **4.4B** physical read specs); **`npm run build`**; **`integrity:business-locations:audit`** read-only before/after — **109/110** businesses/locations, structural **0** zero-location/zero-primary/multi-primary/**parentCityMirrorMismatch**, **BL hygiene PASS** (`validCoordsNullGeographyCount=0` on current dev DB; no **`--apply`** on dev DB).
- **Deferred:** **A.9.4.4C3** create/onboarding/seed bootstrap; **C4** column/trigger drop; **A.9.4.5** **`Business.cityId`**; **`syncBusinessLegacyFullMirrorFromPrimaryInTx`** retained for bootstrap/migration call sites only.
- **Next:** **6.12A.9.4.4C3** — create/bootstrap geo authority (**not auto-started**).

---

## 2026-09-25 — 6.12A.9.4.4C1 Stop normal Business geo mirror writes

- **Status:** **6.12A.9.4.4C1 PASS — NORMAL BUSINESS GEO MIRROR WRITES RETIRED** (overall **A.9.4.4C** not closed — **C2** integrity + **C3/C4** bootstrap/schema remain).
- **Checkpoint (implementation):** `80f678a9584f2614c1aaf029e56183c48315f1bb`.
- **Baseline:** `4fc0ffecc8db5fb390cf69b0f1d6dc61a338366c` (**A.9.4.4B** docs alignment).
- **Scope:** **`services/catalog-api`** — split primary-location mirror helpers; production paths sync **cityId + contacts** only from primary **BusinessLocation** → **Business**; **BL → Business** geo mirror retired; **Business → BL** contact sync no longer pushes stale **Business** geo; ownership-claim summaries use primary **BL** address. No schema/migration.
- **Summary:** **BusinessLocation** is the sole normal application write authority for **address/lat/lng/locationSource**. Owner **PATCH**, **BL CRUD**, and **set-primary** no longer mirror geo onto **Business** (legacy columns may drift until **C4**). **Integrity `--apply`** still uses legacy full geo mirror on zero-primary repair until **C2**. **CREATE** bootstrap geo on **Business** INSERT unchanged until **C3**.
- **Verified:** focused Jest (util, primary-location service, **C1** integration, **3A/3B** regression, ownership claims, **4.4B** normalization); **`npm run build`**; **`integrity:business-locations:audit`** read-only **PASS** (109/110, `mirrorMismatchCount=0`).
- **Deferred:** **A.9.4.4C2** integrity/repair redesign; **C3** create/seed bootstrap; **C4** column/trigger drop; **A.9.4.5** **`Business.cityId`**.
- **Next:** **6.12A.9.4.4C2** — integrity tooling transition (**not auto-started**).

---

## 2026-09-25 — 6.12A.9.4.4B Runtime Business geo read cutover

- **Status:** **6.12A.9.4.4B PASS — RUNTIME BUSINESS GEO READS CUT OVER TO BUSINESSLOCATION** (overall **A.9.4.4** not closed — **4.4C** mirror/column retirement remains).
- **Checkpoint (implementation):** `34032806ae08db5868c1a8d8fb78d31d95f8ebac`.
- **Baseline:** `df9a0d1017cc8ddfddfb6428735c212ee1437dbf` (**A.9.4.4A** docs alignment).
- **Scope:** **`services/catalog-api`** runtime read paths — list/detail/discovery/search/nearby/favorites/promotion feed/ad business cards; **`buildEffectivePhysicalDto`** / public physical normalization; Prisma selects drop legacy **Business** physical columns where outputs are BL-projected. No schema/migration, no mirror write removal, no **`Business.cityId`** retirement, no map renderer changes, no client changes.
- **Summary:** Production runtime physical fields (**address**, **latitude**, **longitude**, effective **cityId** on physical DTOs) resolve from **BusinessLocation** (primary / **contextLocationId** / detail **locationId**). Legacy **Business** geo is not an authoritative fallback (**fail-closed** empty geo when no branch). Public JSON shape preserved; discovery **Business-grain**, map **BL-grain**, favorites **Business-grain** unchanged. Transitional mirror writes and integrity/repair tooling still read **Business** mirror for comparison until **4.4C**.
- **Verified:** focused Jest (physical normalization util, effective physical, **A.9.3.1** integration, discovery **3.2**, promotions **7.8.3**, ad serving location, map spatial, **businesses.service** / membership); **`npm run build`**; **`integrity:business-locations:audit`** read-only **PASS** (109/110, `mirrorMismatchCount=0`); full suite **190/198** pass (**8** pre-existing env/DB/flaky failures unrelated to **4.4B**).
- **Deferred:** **A.9.4.4C** — remove mirror writes + legacy column migration; **A.9.4.5** **`Business.cityId`**; application/claim dedupe still compares **Business.address** (non-display).
- **Next:** **6.12A.9.4.4C** — mirror removal / column retirement (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.4A Rogue Business geo writer retirement

- **Status:** **6.12A.9.4.4A PASS — ROGUE BUSINESS GEO WRITER RETIRED** (overall **A.9.4.4** not closed — **4.4B** read cutover remains).
- **Checkpoint (implementation):** `cc7c0beead14b980a8e9db11c8346ca5eeea7141`.
- **Baseline:** `52079be146e00b35c3b2b3034d5b5415a712984c` (A.9.4.3 docs SHA alignment).
- **Scope:** **`scripts/sync-businesses-visibility.ts`**, **`src/scripts/sync-businesses-visibility.util.ts`**, unit tests. No schema/migration, no public read-path changes, no **BusinessLocation** geo repair added, **A.9.4.3** mirror writers unchanged.
- **Summary:** Dev **`npm run sync:businesses`** / root **`npm run dev:api:sync`** are **visibility/status-only** (non-**ACTIVE** → **ACTIVE**). Removed legacy city-center **Business** lat/lng backfill. Guardrail **`assertVisibilitySyncBusinessUpdateData`** blocks geo keys on planned updates. No **BusinessLocation** physical writes from this command.
- **Integrity (audit-only, dev DB):** before/after **PASS** — `businessCount` 109, `locationCount` 110, `zeroLocationCount` 0, `zeroPrimaryCount` 0, `multiPrimaryCount` 0, `mirrorMismatchCount` 0, `failedCount` 0.
- **Deferred:** **A.9.4.4B** runtime read cutover; **A.9.4.4C** mirror removal + column migration; **A.9.4.5** **`Business.cityId`**; transitional mirror/bootstrap/repair writers remain by design.
- **Next:** **6.12A.9.4.4B** — runtime read cutover (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.3D Physical writer QA closure

- **Status:** **6.12A.9.4.3D PASS — PHYSICAL WRITER QA FINALIZED**; **6.12A.9.4.3 CLOSED — BUSINESS PHYSICAL WRITERS MIGRATED TO BUSINESSLOCATION AUTHORITY**.
- **Checkpoint (docs closure):** `75d58f6bb477a0a295029a867fd225989544c172`.
- **Baseline (pre-physical-QA docs):** `4d0035363032d875091bf14cbec0fe27103e19ea` (**3C** docs follow-up).
- **Implementation checkpoints (unchanged):** **3A** `51e0b5bb502930ff43adf0e7f875b95137a12ae4` (owner primary physical write inversion); **3B** `cde02e6d0faee3b5b6831ba479d6f4dcdff14b17` (onboarding/create normalization); **3C** `91284804547a78c1b4b6521ffe648e63508c2fe9` (seed/dev writer normalization).
- **Scope:** Manual Business Web physical QA + read-only integrity audits + fixture cleanup (dev); local helpers **`infra/local-backups/a943d-physical-*`** (untracked). **No product-code / schema / test / DB fixture re-insert changes in this closure.**
- **Fixture (dev, cleaned):** Business **`cmugwtakv0002uls02y6oz9uo`** (`qa-a943d-physical-writer`, **QA A943D PHYSICAL WRITER**); owner **`cmugwtaih0000uls0ke7h3715`** (`+79990094301`); primary **L1** **`bl54ddf8bcb2145cd4ee2313`**; secondary **L2** **`cmugwtalt0004uls0ldvzpxgi`**; Uralsk.
- **Physical QA summary:** Initial profile showed primary **L1** (*A.9.4.3D QA Primary Branch*). Owner edited main Business profile → *Primary EDITED*; Locations UI **L1/L2** aligned; **F5** **PASS**. Secondary **L2** edited independently → *Secondary EDITED*; main profile stayed *Primary EDITED* (**secondary isolation**). **L2** promoted primary → Business mirror *Secondary EDITED* (**promotion mirror**). Owner edited main profile → *New Primary EDITED*; Locations UI: **L2** primary *New Primary EDITED*, **L1** non-primary *Primary EDITED* (**post-promotion owner write targets current primary**, not former primary); **F5** **PASS**.
- **Integrity:** Pre-cleanup audit **PASS** (`businessCount` 110, `locationCount` 112, `mirrorMismatchCount` 0, …). Fixture cleanup **PASS** — restored baseline **Business 109**, **ACTIVE 37**, **BL 110**, **multi-branch 1**, **primary 109**, **Users 24**, **memberships 40**. Post-cleanup audit **PASS** (`businessCount` 109, `locationCount` 110, …).
- **Track recap:** **3A** — owner **`PATCH`** primary physical fields authoritative on **primary BusinessLocation**; **3B** — application approval + Admin create via **`createBusinessWithInitialPrimary`**; **3C** — seed + **5N QA** aggregate helpers; **3D** — end-to-end owner writer behavior verified in browser.
- **Deferred:** **A.9.4.4** legacy geo writer audit/normalization (incl. **`scripts/sync-businesses-visibility.ts`** — still writes **Business** lat/lng directly; must be addressed before legacy geo storage retirement); **A.9.4.5** column retirement; **F.4**; **6.12B** import. Legacy **Business** physical columns and **`Business.cityId`** **not** retired.
- **Next:** **6.12A.9.4.4** — legacy geo / visibility writer hardening (agree before start; **not auto-started**).

---

## 2026-09-25 — 6.12A.9.4.3C Seed / dev writer normalization

- **Status:** **6.12A.9.4.3C PASS — SEED / DEV PHYSICAL WRITERS NORMALIZED** (overall **A.9.4.3** not closed — **3D** physical QA remains).
- **Checkpoint (implementation):** `91284804547a78c1b4b6521ffe648e63508c2fe9`.
- **Baseline:** `371a2a341666e61723bea81a7bda13eaf4dc6e35` (**A.9.4.3B** docs closure).
- **Scope:** **`prisma/seed.ts`**, **`scripts/stage-5n-qa-runtime.mjs`**, shared **`business-primary-location-aggregate.util.ts`** (production service delegates unchanged semantics); idempotency unit tests. No production API/schema changes.
- **Summary:** Tracked seed upserts use **`upsertSeedBusinessWithPrimaryMirrorInTx`** (primaryPhysical → primary BL → mirror); re-seed updates existing primary without duplicate branches; corrupt multi-primary fails with repair guidance. **5N QA** unowned business create uses **`createBusinessWithInitialPrimaryInTx`**. Production writers unchanged (**3A/3B**). Intentional corruption/repair fixtures exempt.
- **Verified:** aggregate util tests; **3A/3B/2B** regression; **`npm run build`**; **`integrity:business-locations:audit`** read-only **PASS** (no full seed run on dev DB).
- **Deferred:** **A.9.4.3D** physical QA; **A.9.4.4** / **A.9.4.5**; **F.4**; **6.12B** import; optional normalization of **`scripts/sync-businesses-visibility.ts`** (reported, out of scope).
- **Next:** **6.12A.9.4.3D** — physical QA (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.3B Onboarding / create writer normalization

- **Status:** **6.12A.9.4.3B PASS — ONBOARDING / CREATE PHYSICAL WRITERS NORMALIZED** (overall **A.9.4.3** not closed — **3C/3D** deferred).
- **Checkpoint (implementation):** `cde02e6d0faee3b5b6831ba479d6f4dcdff14b17`.
- **Baseline:** `3c20959cedc4cf105b664c87f6951070bec72521` (**A.9.4.3A** docs closure).
- **Scope:** **`services/catalog-api`** — shared **`createBusinessWithInitialPrimary`** aggregate (authoritative **`primaryPhysical`** → primary BL → Business mirror; NOT NULL bootstrap only); **application approval** + **Admin `POST /businesses`** refactored; tests. No schema/client/API shape changes.
- **Summary:** Production onboarding/create no longer treat Business row as physical authority; **`createInitialPrimary`** retained for **2A repair** and test fixtures only.
- **Verified:** focused Jest (**3B**, approval, admin create, rollback, **3A** regression, **2B**); **`npm run build`**; **`integrity:business-locations:audit`** read-only **PASS**.
- **Deferred:** **A.9.4.3C** seed/dev scripts; **A.9.4.3D** physical QA; **A.9.4.4** / **A.9.4.5**; **F.4**; **6.12B** import.
- **Next:** **6.12A.9.4.3C** — seed / dev writer normalization (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.3A Owner primary physical write inversion

- **Status:** **6.12A.9.4.3A PASS — OWNER PRIMARY PHYSICAL WRITE AUTHORITY INVERTED** (overall **A.9.4.3** not closed — **3B/3C/3D** deferred).
- **Checkpoint (implementation):** `51e0b5bb502930ff43adf0e7f875b95137a12ae4`.
- **Baseline:** `3a4bf89e2a14813f84b647f41088b3e4b97509f5` (**A.9.4.3** read-only audit closure).
- **Scope:** **`services/catalog-api`** — owner **`PATCH /businesses/:id`**: primary physical fields authoritative on **primary BusinessLocation** + **`syncBusinessFromPrimaryLocationRecord`**; **Business → primary BL** contact sync unchanged; aggregate lock + primary re-resolution; **`locationSource`** in **`PROFILE_FIELDS`**; focused tests. No schema/public JSON shape/client changes.
- **Summary:** Multi-city coordinate validation uses **primary BL `cityId`**; mixed business + physical PATCH atomic; concurrency vs **set-primary** tested; **`syncPrimaryFromBusinessRecord`** remains for contact/hours owner PATCH and **3B** transitional paths only (not owner physical authority).
- **Verified:** focused Jest (**A.3**, **3A**, permissions); **`npm run build`**; **`integrity:business-locations:audit`** read-only **PASS** (`mirrorMismatchCount=0`).
- **Deferred:** **A.9.4.3B** onboarding/create writer normalization; **A.9.4.3C** seed/dev scripts; **A.9.4.3D** physical QA; **A.9.4.4** / **A.9.4.5**; **F.4**.
- **Next:** **6.12A.9.4.3B** — onboarding/create writer normalization (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.2E BusinessLocation physical QA closure

- **Status:** **6.12A.9.4.2E PASS — PHYSICAL QA CLOSED**; **6.12A.9.4.2 PASS — BUSINESSLOCATION & PRIMARY INVARIANTS FINALIZED**.
- **Checkpoint (docs closure):** `b4ada073289c528e28cdd311a9adc7c68d39ed20`.
- **Baseline (pre-fixture docs):** `2e6a10e35ee7f3e3bdc10c1d9a020ce2cb07c8ea` (**2B** docs closure).
- **2B implementation checkpoint (unchanged):** `07e0a8cdc41c72f53821e57ed892337f5d886f05`.
- **Scope:** Physical/manual QA only — Business Web + catalog-api owner location API; fixture **`QA A942E INVARIANT PHYSICAL`** (`infra/local-backups/a942e-invariant-physical-*`, local/untracked); cleanup restored pre-insert counts. **No product-code changes.**
- **Summary:** OWNER OTP login **PASS**; two-branch list **PASS**; set **L2** primary **PASS**; F5 persistence **PASS**; DELETE primary while two branches → **409** `BUSINESS_LOCATION_PRIMARY_DELETE_BLOCKED` **PASS**; DELETE secondary **L1** → **200** **PASS**; DELETE sole remaining **L2** → **409** `BUSINESS_LOCATION_LAST_DELETE_BLOCKED` with **LAST** precedence over **PRIMARY** **PASS**; `integrity:business-locations:audit` **PASS** throughout; fixture cleanup idempotent after **L1** already removed in QA; post-cleanup counts **Business 109**, **ACTIVE 37**, **BL 110**, **multi-branch 1**, **primary 109**, **Users 24**, **memberships 40**.
- **2C:** **NOT REQUIRED** — **2A** audit/repair, **2B** aggregate lock + partial unique index, concurrency tests, and **2E** physical QA green; no new committed-state invariant gap observed.
- **Deferred:** **A.9.4.3** writer-migration audit/implementation; **F.4**; read-fallback removal; **2C** DB trigger (not approved).
- **Next:** **6.12A.9.4.3 READ-ONLY writer-migration audit** (agree before start; **not auto-started**).

---

## 2026-09-25 — 6.12A.9.4.2B BusinessLocation runtime invariant enforcement

- **Status:** **6.12A.9.4.2B PASS — RUNTIME INVARIANTS ENFORCED** (physical QA pending per closure policy).
- **Checkpoint (implementation):** `07e0a8cdc41c72f53821e57ed892337f5d886f05`.
- **Baseline:** `0c366ebdfedf134fc7aa97248e677d3348592d13` (**2A** docs); impl ancestor **`7909260…`**.
- **Scope:** **`services/catalog-api`** — `BusinessLocationService` aggregate locking, first-location primary + mirror, delete guards + stable **409** codes, primary-service invariant errors; **`stage-5n-qa-runtime.mjs`** minimal primary BL on create; tests. No schema/migration/trigger/Business Web redesign.
- **Summary:** Production location mutations cannot commit new zero-primary / last-delete states; **2A** remains repair path for existing corruption; **2C** not implemented.
- **Deferred:** **6.12A.9.4.2E** physical QA; read-fallback removal; **A.9.4.3**; **F.4**.
- **Next:** **2E physical QA** or **A.9.4.2 closure review** (agree before starting).

---

## 2026-09-25 — 6.12A.9.4.2A BusinessLocation integrity auditor & repair tooling

- **Status:** **6.12A.9.4.2A PASS — INTEGRITY TOOLING READY**.
- **Checkpoint (implementation):** `7909260e0b9c1a99fdb2fb0455d1e5a532d5c8bd`.
- **Baseline:** `a80827bf9d8491bbfec15d93eca19b468c659eb8` (**A.9.4.2** read-only audit).
- **Scope:** **`services/catalog-api`** — extend **`collectPrimaryIntegrityReport`**, **`business-location-integrity-repair.util`**, CLI **`scripts/dev/business-location-integrity.mjs`**, npm **`integrity:business-locations`**, tests. No schema/migration/service API changes.
- **Summary:** Default **DRY_RUN** (no DB writes); **`--apply`** explicit repair; **`--audit-only`** CI gate. Repairs: zero-primary → deterministic promote + **`syncBusinessFromPrimaryLocationRecord`**; zero-location → **`createInitialPrimary`** when mirror fields valid; multi-primary → **MANUAL_REMEDIATION**. **`qalago_dev` audited read-only post-impl** (no `--apply`).
- **Deferred:** **A.9.4.2B** service enforcement; **2C** DB trigger (not approved); **A.9.4.3**; **F.4**; **`stage-5n-qa-runtime.mjs`** zero-BL create (documented debt).
- **Next:** **6.12A.9.4.2B** service-enforcement implementation scope (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.1 City context hardening (1A + 1B)

- **Status:** **6.12A.9.4.1 PASS — NON-DISCOVERY CITY AUTHORITY HARDENED**.
- **Checkpoint (1B implementation):** `38d2a83b1a71fe4eaec23fec2a04467964b7cbed`.
- **Checkpoint (1A implementation):** `955f9d86c660d1019158236c4417cf337b13ae9d`.
- **Baseline (1B start):** `e0ed3dc45d261d0ca27f0e0d9eec2886263f1e2f` (**1A** docs follow-up).
- **Scope (1B):** **`services/catalog-api`** — campaign/order market city resolver, analytics event city attribution, BL-aware application dedupe, public top-level **`cityId`** physical projection, admin reporting business visibility via BL presence; focused tests. No schema/migration/client changes; **1A** auth semantics unchanged.
- **Summary (1B):** **`resolveCampaignMarketCityId`** (target/dest BL → explicit city + branch presence → primary BL → parent **`Business.cityId`** fallback); order/provisioning/quote/inventory aligned to resolved city; new organic events use **`resolveAnalyticsEventCityId`**; dedupe matches **`BusinessLocation`** in application city; **`projectPublicPhysicalReadFields`** includes branch-context **`cityId`**; **`reporting-scope.businessCityWhere`** uses **`locations.some(cityId)`** for admin business visibility (event-level analytics filters unchanged — business-grain rollups).
- **Deferred:** **A.9.4.2+** invariant audit; **A.9.4.3** application writer migration; **F.4**; schema/column retirement; **`product-purchase-state`** schedule preview may still read parent **`Business.cityId`** (debt).
- **Next:** **A.9.4.2 READ-ONLY invariant-hardening audit** (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.1A Admin city visibility & authorization hardening

- **Status:** **6.12A.9.4.1A PASS — ADMIN CITY AUTHORITY HARDENED**.
- **Checkpoint (implementation):** `955f9d86c660d1019158236c4417cf337b13ae9d`.
- **Baseline:** `dc6cc5622d431496ed010fb0dc79ae53d0dd65f6` (**A.9.4.0** policy gate).
- **Scope:** **`services/catalog-api`** — `CityScopeService`, Admin list/mutations, ownership claims, monetization Admin access asserts, moderation **`assertCityInAdminScope`**, application approval city gate; tests; architecture docs. No schema/migration/Flutter/Web.
- **Summary:** Admin **visibility** and staff **assertBusinessInAdminScope** now use **`businessId` + BusinessLocation presence** (`buildAdminBusinessScopeWhere`, indexed `locations.some`). **`BusinessAccessService.resolveAccess`** for **`CITY_ADMIN`** keeps **parent `Business.cityId`** via **`assertBusinessParentCityInAdminScope`** — secondary branch must **not** widen owner-route access (regression test). Application approval still **`application.cityId`**. Business-wide Admin mutations unchanged in semantics when BL-visible.
- **Deferred:** **A.9.4.1B** (campaign city, analytics filters, dedupe, public `cityId`, reporting `businessCityWhere`); full **A.9.4.1** closure; **A.9.4.2+**; **F.4**.
- **Next:** **6.12A.9.4.1B** implementation-scope confirmation / implementation (not auto-started).

---

## 2026-09-25 — 6.12A.9.4.0 Legacy physical retirement policy gate

- **Status:** **6.12A.9.4.0 PASS — RETIREMENT POLICY GATE FINALIZED**.
- **Checkpoint (docs):** `c69104a2e8bec634eba13fbb60b4bce306792297`.
- **Scope:** docs-only — **`docs/architecture/business-location.md`**, **`docs/architecture/api-contracts.md`**, **`docs/ai-project-context.md`**, **`docs/changelog.md`**; no product/schema/DB changes.
- **Summary:** Formalizes **A.9.4** boundary (retire physical-authority **`Business`** columns in staged migration; **KEEP** phone/whatsapp/website/instagram/workHours as domain/default); transitional **home/parent `Business.cityId`**; admin visibility vs mutation scope; monetization **`AdCampaign.cityId`**; analytics event city; onboarding/dedupe/invariant/cross-city/API compatibility/**`cityId`** projection policies; **PROPOSED** substages **A.9.4.1–A.9.4.5**; **F.4** independent of column drop.
- **Prior audit (read-only):** **6.12A.9.4 AUDIT PASS — PREREQUISITE HARDENING REQUIRED** (not an implementation checkpoint).
- **Deferred:** all **A.9.4.1+** implementation; **F.4**.
- **Next:** **6.12A.9.4.1 READ-ONLY implementation-scope audit** (recommended) — or explicit roadmap choice of **F.4** read-only audit first; not auto-started.

---

## 2026-09-25 — 6.12A.9.3.5 Business Web physical browser QA closure

- **Status:** **6.12A.9.3.5 PASS — BUSINESS WEB OWNER PHYSICAL CONTEXT FINALIZED**.
- **Checkpoint (physical QA / docs):** `6ee6ec8ece6f676a25841916f3738204ef298792`.
- **Implementation checkpoint (unchanged):** `9e00ef25afdd4974bcc084f0a4e5685040178dcd`.
- **Scope:** docs closure only; dev **`qalago_dev`** fixture **`QA A935 OWNER PHYSICAL`** verified/cleaned (untracked helpers under **`infra/local-backups/`** — not committed).
- **Physical QA (browser, user-confirmed):** OWNER primary-branch labeling + **«Управление всеми филиалами»**; L1/L2 list; secondary edit isolation; profile compatibility write → primary only; sibling unchanged; **set-primary** L2 → profile follows new primary; cross-session consistency; hours-only MANAGER (**`BUSINESS_HOURS_EDIT`**, no **`BUSINESS_PROFILE_EDIT`**) — profile fields read-only, hours PATCH/save without 403, F5 persistence, no branch create/edit/promote; OWNER re-login sees manager hours + primary context.
- **Central P1 (audit):** **CLOSED** — hours-only manager no longer triggers UI-generated forbidden profile payload during hours editing.
- **Fixture cleanup:** post-QA baseline restored exactly — Business **108**, ACTIVE **36**, BusinessLocation **108**, multi-branch **0**, primary **108**, Users **24**, BusinessMembership **40**; fixture IDs/marker absent.
- **Deferred:** branch DELETE UI; zero-primary repair UX; **A.9.4+** **`Business.cityId`** / legacy column retirement; **F.4** Consumer Web; pre-existing Business Web reviews-page i18n guard debt; production/cross-environment QA.
- **Next:** roadmap **F.4** / **A.9.4+** per agreement (not auto-started).

---

## 2026-09-25 — 6.12A.9.3.5 Business Web owner physical-context closure

- **Status:** **6.12A.9.3.5 IMPLEMENTATION PASS — PHYSICAL QA REQUIRED** (superseded by physical QA closure entry above).
- **Checkpoint (implementation):** `9e00ef25afdd4974bcc084f0a4e5685040178dcd`.
- **Scope:** **`apps/business-web`** only — permission-safe profile PATCH payloads, primary-branch UX copy/navigation, vitest; docs.
- **Summary:** Closes documented **`A.9.3.4+`** owner/web slice — hours-only managers no longer submit profile/physical fields; profile-only omit **`workHours`**; primary branch section + branches link; backend **A.3/A.4** sync unchanged.
- **Deferred:** physical browser QA; branch DELETE UI; zero-primary repair; **A.9.4+** legacy column retirement; **F.4**.
- **Next:** **6.12A.9.3.5 PHYSICAL BROWSER QA**; then roadmap **F.4** / **A.9.4+** per agreement (not auto-started).

---

## 2026-09-25 — 6.12A.9.3.4 Consumer Web physical browser QA closure

- **Status:** **6.12A.9.3.4 PASS — CONSUMER WEB PHYSICAL CONTEXT FINALIZED**.
- **Checkpoint (physical QA / docs):** `d572a8c0d43f90df7e55d1a4c922d30772e1ae8a`.
- **Implementation checkpoint (unchanged):** `b13bfa4b7b1a1507d5779d11c065e94c284a7fc4`.
- **Scope:** docs closure only; dev **`qalago_dev`** temporary multi-branch fixture inserted/verified/cleaned (untracked helpers under **`infra/local-backups/`**).
- **Physical QA (browser, user-confirmed):** Uralsk search **`L2 Secondary`** → L2 card address; card → detail **`?locationId=L2`** → L2 hero; branch switch L2→L1; direct detail without query → L1 primary; Back to search; reopen detail → L2 (no stale primary/cache); mobile ~390×844 smoke PASS.
- **QA-001:** **CLOSED** — Consumer Web physical-context mismatch (L2 discovery → L1 detail) resolved end-to-end.
- **Deferred:** F.4 full Business Pages / branch SEO; Consumer Web promotions/favorites/map; production QA.
- **Next:** roadmap **A.9.3.5+** / **F.4** (not auto-started — agree stage before implementation).

---

## 2026-09-25 — 6.12A.9.3.4 Consumer Web physical-context closure

- **Status:** **6.12A.9.3.4 IMPLEMENTATION PASS — PHYSICAL BROWSER QA REQUIRED**.
- **Checkpoint (implementation):** `b13bfa4b7b1a1507d5779d11c065e94c284a7fc4`.
- **Scope:** **`apps/consumer-web`** only — DTO, detail fetch/cache, discovery links, temporary detail **`locationId`** query, branch switcher links, vitest; docs.
- **Summary:** Discovery **`contextLocationId` → `/businesses/{id}?locationId=` → `GET /businesses/:id?locationId=`**; **`effectivePhysical`** hero; cache **`(businessId, locationId)`**; **QA-001 CLOSED** (L2 card/context mismatch at Web navigation layer). F.3 **noindex** unchanged; F.4 deferred.
- **Deferred:** physical browser QA; Consumer Web promotions/favorites/map; full catalog/gallery on detail; F.4 slug SEO.
- **Next:** **6.12A.9.3.4 PHYSICAL BROWSER QA** (multi-branch fixture plan if needed); then **A.9.3.5+** / **F.4** per roadmap.

---

## 2026-09-25 — 6.12A.9.3.3 Flutter physical-context closure

- **Status:** **6.12A.9.3.3 PASS — FLUTTER PHYSICAL CONTEXT FINALIZED**.
- **Checkpoint (implementation):** `6277e64fb4a1f1e4d82f39c1502eb26238c88508`.
- **Scope:** **`apps/mobile`** navigation + tests + docs only — no backend/schema/web changes.
- **Summary:** Canonical **`openBusinessFromFavorite`** encodes Business-grain favorites (omit route **`locationId`**); favorites screen uses helper; regression tests for favorites vs discovery/promotion URI rules; **QA-002 CLOSED / OBSOLETE** (favorites intentionally open canonical primary/effective branch — not branch bookmarks). Runtime branch behavior unchanged from pre-audit; physical QA not required.
- **Deferred:** **A.9.3.4+** Consumer Web physical-context; search merge dedupe-by-`business.id` (P2); notification producer branch context; F.6 deep links.
- **Next:** **6.12A.9.3.4** — Consumer Web physical-context migration (**do not start in this closure**).

---

## 2026-09-25 — Project context / AI handoff documentation sync

- **Status:** **CONTEXT SYNC — NO PRODUCT STAGE ADVANCED**.
- **Checkpoint (docs):** commit **`docs(context): synchronize QalaGo AI handoff state`** (see `git log -1 --oneline`).
- **Scope:** **`AGENTS.md`**, **`docs/ai-project-context.md`**, **`docs/changelog.md`**, minor **`docs/architecture/business-location.md`** drift fix only.
- **Summary:** Reconciled current-state handoff for new AI sessions: last **implementation** remains **6.12A.9.3.2b** (`c53af3c2d17b6922bbd10cb909006752463829e5`); **6.12A.9.3.3** recorded as **read-only audit PASS** (pending Flutter implementation — **not** implementation PASS); mandatory START/FINISH context protocol in **`AGENTS.md`**; **QA-002** reframed per audit (favorites Business-grain + omit `locationId`).
- **Product code / tests / DB:** unchanged.
- **Deferred:** unchanged from **A.9.3.2b** closure.
- **Next:** **6.12A.9.3.3 implementation** (Flutter — do not start in this docs-only closure).

---

## 2026-09-24 — 6.12A.9.3.2b Legacy Prisma geo filter cleanup

- **Status:** **6.12A.9.3.2b PASS — LEGACY PRISMA GEO FILTER REMOVED**.
- **Checkpoint (implementation):** `c53af3c2d17b6922bbd10cb909006752463829e5`.
- **Scope:** **catalog-api** `GET /businesses` routing only — no schema/clients/map.
- **Summary:** Removed **`appendMapCatalogFilters`** / parent **`Business.latitude/longitude`** from active discovery geo; **complete bbox** always uses **BL PostGIS** membership (including with accompanying lat/lng unless **nearest** or **explicit radius** owns geo); **`forMap=true` without bbox** uses **`businessMapReadyBranchInCityScope`** (valid branch coords in city); **`validStoredBusinessCoordinateWhere`** deprecated (tests only).
- **Deferred:** **A.9.3.3** Flutter discovery/favorites; **A.9.4** `Business.cityId` retirement.
- **Next:** **6.12A.9.3.3** — Flutter discovery/favorites physical-context migration.

---

## 2026-09-24 — 6.12A.9.3.2 Discovery SQL legacy physical-read cleanup

- **Status:** **6.12A.9.3.2 PASS — DISCOVERY SQL PHYSICAL READS NORMALIZED**.
- **Checkpoint (implementation):** `f2bbc9c8ca7ee40c89c99cff1740f81e286850f1`.
- **Scope:** **catalog-api runtime read/query only** — no schema/migration, no Flutter/map client changes, nearby/radius SQL shape preserved (BL-grain).
- **Summary:** Physical **address search** and **bbox membership** are **BusinessLocation-authoritative**; stale **`Business.address`** no longer creates text-search or SQL address predicates; legacy **bbox without `forMap=true`** remains **Business-grain** (one card max) but picks deterministic in-bbox branch (**primary first**, else stable branch order) and attaches **`contextLocationId`**; **`forMap=true` + bbox** unchanged (**Location-grain**, N rows); search relevance uses **`branchAddressMatch`** only for address tier; **`GET /promotions`** nested **`business`** physical fields follow promotion **`contextLocationId`** (A.9.3.1 projection reuse).
- **Compatibility:** bbox requests with **`forMap` omitted/false** still accepted (not 400); external unknown callers preserved at Business-grain.
- **Remaining legacy (explicit):** **`appendMapCatalogFilters`** + **`validStoredBusinessCoordinateWhere`** still gate some **bbox + lat/lng/radiusKm** Prisma paths on **`Business.latitude/longitude`** when PostGIS viewport path is bypassed — **A.9.3.2b** if full removal needed; **`Business.cityId`** column/global usage **not** retired (**A.9.4**).
- **Deferred:** **6.12A.9.3.3** Flutter discovery/favorites physical-context migration; **A.9.3.2b** Prisma lat/lng bbox fallback; **A.9.4** `Business.cityId` retirement.
- **Next:** **6.12A.9.3.3** — Flutter discovery/favorites physical-context migration (**do not start in this closure**).

---

## 2026-09-24 — 6.12A.9.3.1 Public API physical read normalization

- **Status:** **6.12A.9.3.1 PASS — PUBLIC PHYSICAL READS NORMALIZED**.
- **Checkpoint (implementation):** `f4154d9a06ae279e6a45f10eedee113de8660ac8`.
- **Scope:** **catalog-api read projection only** — no schema/migration, no write-path/SQL ranking changes, no Flutter/Consumer/Business/Admin edits.
- **Summary:** Shared **`business-physical-read-normalization.util`** projects top-level **`address` / coordinates / contacts / hours** from effective **BusinessLocation** (primary or **`contextLocationId`**) with brand-default fallback for contacts; **`GET /businesses`** (non-`forMap`), **`GET /businesses/:id`**, **`GET /favorites`** normalized; **`forMap=true`** unchanged (branch-grain presenter).
- **Performance:** one batched **`BusinessLocation.findMany`** per list/favorites page (no per-row location queries).
- **Deferred:** **A.9.3.2** SQL legacy reads; **A.9.3.3** Flutter favorites navigation (QA-002); **A.9.3.4+** web/owner UX; **A.9.4+** `cityId`/column retirement.
- **Next:** **6.12A.9.3.2** — discovery SQL legacy physical-read cleanup.

---

## 2026-09-24 — 6.12A.9.1 Single-primary service / integrity hardening

- **Status:** **6.12A.9.1 PASS — SINGLE-PRIMARY SERVICE/INTEGRITY HARDENING FINALIZED**.
- **Checkpoint (implementation):** documentation commit after tests (see git history for SHA).
- **Scope:** **No migration**, **no** new DB trigger/constraint, **no** production service behavior changes.
- **DB (unchanged):** partial unique index `BusinessLocation_businessId_isPrimary_key` guarantees **at most one** primary per `businessId`; **does not** guarantee at-least-one primary when locations exist.
- **Added:** integration tests — primary delete rejection; concurrent `set-primary` final state (exactly one primary + Business sync); zero-primary bypass fixture detected by auditor; aggregate PASS on `qalago_dev`.
- **Added:** read-only script `services/catalog-api/scripts/dev/audit-primary-integrity.mjs` (+ shared util) — exit **0** PASS / **1** FAIL; **no** `--fix`.
- **Deferred:** DB at-least-one-primary trigger; `Business.primaryBusinessLocationId`; optional stress concurrency harness.
- **Next:** **6.12A.9.3** — legacy physical-field consumer migration audit (**do not start in this closure**).

---

## 2026-09-24 — 6.12A.9.2B Local coordinate hygiene repair (qalago_dev)

- **Status:** **6.12A.9.2B PASS — LOCAL COORDINATE HYGIENE NORMALIZED** (database repair on **local `qalago_dev` only**; **not** production).
- **Checkpoint (docs):** documentation commit after repair (see git history for SHA).
- **Preflight (A.9.2A baseline):** 108 `BusinessLocation` rows — **VALID 37**, **MISSING_BOTH 26**, **OUT_OF_WORLD_RANGE 18**, **PARTIAL_LAT_ONLY 9**, **PARTIAL_LNG_ONLY 9**, **ZERO_ZERO 9**; safe repair set **45** (all **PENDING**, **0 ACTIVE** in target set).
- **Repair:** **45** invalid/partial/sentinel PENDING branch rows normalized to **`latitude = NULL`, `longitude = NULL`**; corresponding **primary `Business`** legacy coordinates synchronized in the **same transaction**; PostGIS triggers derived **`location = NULL`** on both tables; **no** valid coordinates destroyed (**37 VALID** unchanged); **no** geocoding or invented coordinates.
- **Intentionally unchanged:** **17 ACTIVE** primary locations remain **MISSING_BOTH** (QA/dev fixtures — separate fixture lifecycle / real-coordinate decision).
- **Post-repair classification:** **VALID 37**, **MISSING_BOTH 71**; invalid/partial/sentinel classes **0**; PostGIS mismatch **0**; primary integrity **108/108** exactly one primary; repair candidates **0** (idempotent).
- **Rollback artifact (local, untracked):** `infra/local-backups/a92b-coordinate-hygiene-before.json` (45-row snapshot; **not committed**).
- **Production:** requires its **own read-only A.9.2A-style classification** before any repair.
- **Deferred:** **6.12A.9.1** single-primary invariant hardening; ACTIVE QA fixture coordinates; production DB hygiene.
- **Next:** **6.12A.9.1** — single-primary invariant hardening audit/implementation planning (**do not implement in this closure**).

---

## 2026-09-24 — MAP-PERF.C3 CLOSED (native business layer + Android release path)

- **Status:** **MAP-PERF.C3 CLOSED — NATIVE BUSINESS LAYER AND ANDROID RELEASE PATH FINALIZED**.
- **Checkpoint (C3.5 wiring):** `4e96109e61abc284ff21a40066261ecd5dfa303a`.
- **Checkpoint (closure):** docs-only commit (see git history for SHA).
- **Track summary:** **C3.1** lifecycle/idempotency — automated + Android physical **PASS**. **C3.2** semantic GeoJSON dedup — automated + Android physical **PASS**. **C3.3** synthetic load QA **100–3000** features — automated **PASS** (not physical 3000 on device). **C3.4** Samsung debug APK physical **PASS**. **C3.5** Android release `--dart-define=QALAGO_NATIVE_MAP_BUSINESS_LAYER=true` documented (`4e96109…`). **C3.5R** Android **`flutter build apk --release`** Samsung smoke **PASS** (see below).
- **C3.5R physical (PASS):** Samsung **SM-J610FN**, Android **10** / API **29**; release APK with **`QALAGO_API_BASE_URL=http://192.168.8.101:3002/api/v1`** (local LAN QA only) + **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`**. Launch, home/catalog load, map open, native business markers, pan, zoom, cluster, business tap + preview, Map→Home→Map, user-location dot coexistence — **PASS**; no freeze/disappearance observed.
- **Production API observation (out of C3 scope):** release APK with **`QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1`** + native define **launched** but **data did not load**; **`curl https://api.qalago.kz/api/v1/health`** → host not resolved — **DNS/API deployment not present**; separate infrastructure work, **not** a MAP-PERF.C3 defect. **Authoritative Android store API URL in docs remains `https://api.qalago.kz/api/v1`.**
- **Production policy:** Android release/store → explicit **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`**; iOS release → **omit** native define until dedicated iOS physical QA; **code default remains `false`**; omitted define → legacy Flutter business overlay; **no** automatic native→overlay runtime fallback (optional hardening debt).
- **Deferred (separate tracks):** iOS native business-layer physical QA; production **`api.qalago.kz`** DNS/API deployment; optional native→Flutter overlay fallback; optional user-location visual puck enhancement.
- **Next:** none for MAP-PERF.C3 track.

---

## 2026-09-24 — MAP-PERF.C3.5 Android production release wiring

- **Status:** **MAP-PERF.C3.5 RELEASE WIRING IMPLEMENTED** (closure → **C3.5R** + track **CLOSED** above).
- **Checkpoint (implementation):** `4e96109e61abc284ff21a40066261ecd5dfa303a`.
- **Summary:** **Read-only audit:** global code default **`false`** retained; iOS physical QA required before global enable. **Implemented:** authoritative **Android** store/release commands now require explicit **`--dart-define=QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`** alongside production API URL in **`docs/deploy.md`**, **`docs/mobile/ANDROID_BUILD.md`**, **`apps/mobile/README.md`**. **iOS policy documented:** **omit** native business define on release until dedicated iOS QA (**`docs/mobile/IOS_BUILD_CHECKLIST.md`**). **No** Dart/map/controller changes; **no** runtime Platform gating; **no** native→overlay fallback added. Fail-safe: missing define → legacy Flutter business markers.
- **Physical QA:** **C3.5R** pending — Android **release** artifact build + Samsung smoke (not run in this stage).
- **Next:** **MAP-PERF.C3.5R** — Android release artifact + Samsung smoke; then C3.5 closure entry if PASS.

---

## 2026-09-24 — MAP-PERF.C3.4 Physical Samsung QA (native business layer)

- **Status:** **MAP-PERF.C3.4 PASS — PHYSICAL SAMSUNG QA FINALIZED**.
- **Checkpoint (APK / code under test):** `b350166824cbaa5efc7db852150046416587d0e9` (native business **C3.1** `68cca9fdb2a630bc242b6f4daba9213da9135352`, **C3.2** `b750fee7dec26d9a00e945b36ebc847424145a53`, load QA **C3.3** `a0ca0ce250bc6609db27ea0fe934221408728d2b`).
- **Checkpoint (documentation closure):** docs-only finalization commit (see git history for SHA).
- **Device:** Samsung **SM-J610FN**, Android **10** / API **29**.
- **APK (debug):** fresh build from HEAD above; **`QALAGO_DEV_HOST=172.158.10.133`**, **`QALAGO_DEV_LOGIN=true`**, **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`** (debug enable — **not** production-default).
- **Physical QA (PASS):**
  - Map open with native business layer enabled — **PASS**.
  - Initial **`geojsonSync requested features=0`** before catalog fetch completed (expected deferral / empty viewport); after fetch **`fetch SUCCESS count=15`** → **`geojsonSync features=15`**, **`businessLayer geojson applied epoch=1 features=15`** — **PASS** (not a C3 install defect).
  - Source/layers: **`qalago-businesses`**, **`qalago-business-clusters`**, **`qalago-business-cluster-count`**, **`qalago-business-unclustered`**, **`qalago-business-selected`** — **PASS**.
  - No **`CannotAddLayerException`**, duplicate **`qalago-business-*`**, or already-exists business-layer failure observed — **PASS** (**C3.1** lifecycle/idempotency on device).
  - Pan: markers geographically attached — **PASS**.
  - Zoom/cluster: correct render, no freeze/disappearance — **PASS**.
  - Unclustered tap: correct business selection / preview — **PASS**.
  - Cluster tap: expand/zoom, no crash — **PASS**.
  - Map → Home → Map re-entry: markers restored; new map instance installed source/layers; no duplicate-layer exception — **PASS**.
  - User location + business coexistence; re-entry **`userLocationLayer`** ready/updated — **PASS** (business GeoJSON not conflated with user layer).
  - Runtime payload updates (**15 → 10 → 14** features) without duplicate-layer failures — **PASS** (**C3.2** semantic sync on device).
- **Out of scope / not claimed:** **3000-feature** physical load (synthetic **C3.3** only); iOS physical validation; production default flip.
- **Production default:** **`QALAGO_NATIVE_MAP_BUSINESS_LAYER`** remains **`false`** pending **C3.5**.
- **Next:** **MAP-PERF.C3.5 — PRODUCTION DEFAULT / RELEASE WIRING DECISION**.

---

## 2026-09-24 — MAP-PERF.C3.3 Native business layer load / regression QA

- **Status:** **MAP-PERF.C3.3 AUTOMATED LOAD QA PASS — READY FOR C3.4 PHYSICAL QA**.
- **Checkpoint (implementation):** `a0ca0ce250bc6609db27ea0fe934221408728d2b`.
- **Summary:** Automated qualification at **100 / 500 / 1000 / 3000** BusinessLocation-grain synthetic fixtures (incl. **5×3 multi-branch** parents). **Correctness:** semantic dedup (20× same-semantic clone → **1** `setGeoJsonSource` per epoch), single-field content change (+1 then dedup), selection stress (**1000/3000** — **6** native applies for initial + 5 transitions), **10** style-epoch replays at **3000**, concurrent style/sync convergence, partial failure recovery (addSource/symbol/remove/setGeoJson), user-location isolation (**20** updates → business count unchanged), cluster **55/14** unchanged, tap multi-branch contract. **Dev-machine observations (not Samsung):** buildPayload median ~**1.2ms/3.9ms/3.0ms/14.5ms**; fingerprint median ~**0.3ms/1.4ms/1.3ms/5.0ms**; UTF-8 payload ~**23KB/112KB/224KB/677KB** at 100→3000. **Automated:** focused C3/regression **105/105 PASS**; full Flutter **1049/1049 PASS**. **`QALAGO_NATIVE_MAP_BUSINESS_LAYER`** default **still false**. **Production code:** unchanged (tests/helpers only).
- **Physical QA:** Samsung **C3.4** pending.
- **Next:** **C3.4** physical QA; **C3.5** production-default decision.

---

## 2026-09-24 — MAP-PERF.C3.2 Native business GeoJSON semantic dedup

- **Status:** **MAP-PERF.C3.2 AUTOMATED PASS — C3.3 LOAD/REGRESSION QA REQUIRED**.
- **Checkpoint (implementation):** `b750fee7dec26d9a00e945b36ebc847424145a53`.
- **Summary:** **Root cause:** `MapScreen.build` produced a new business FeatureCollection `Map` each rebuild; `MapLibreQalaGoMapView.didUpdateWidget` compared **reference** inequality → redundant `setGeoJsonSource` on unrelated rebuilds (e.g. user location) even when C2 suppressed fetches. **Fix:** deterministic **`QalaGoMapBusinessGeoJsonFingerprint`** (sorted segments: `locationId`, `businessId`, lng/lat, `categoryId`, `categoryKey`, `selected`); `BusinessMapGeoJsonBuilder.buildPayload()` + `NativeBusinessMapGeoJsonPayload`; widget passes **`businessGeoJsonFingerprint`**; controller **`syncBusinessGeoJson(..., contentFingerprint)`** skips native apply when fingerprint matches **current style epoch**; applied fingerprint recorded **only after successful** `setGeoJsonSource`; **style epoch reset** clears dedup so C3.1 style replay still pushes identical payload to new style. **`QALAGO_NATIVE_MAP_BUSINESS_LAYER`** default **still false**. **Automated:** Flutter **1027/1027 PASS** (focused C3.1/C3.2/map GeoJSON **45/45 PASS**).
- **Deferred:** MapScreen may still rebuild GeoJSON on unrelated rebuilds (Dart-side cost); selection still full-collection resync; **C3.3** load QA; **C3.4** Samsung physical QA; **C3.5** production-default decision.
- **Next:** **C3.3** load/regression QA; **C3.4** physical QA.

---

## 2026-09-24 — MAP-PERF.C3.1 Native business layer lifecycle (hotfix)

- **Status:** **MAP-PERF.C3.1 AUTOMATED PASS — PHYSICAL/LOAD QA STILL REQUIRED**.
- **Checkpoint (implementation):** `68cca9fdb2a630bc242b6f4daba9213da9135352`.
- **Summary:** **C3 audit:** duplicate **`CannotAddLayerException`** on **`qalago-business-*`** layers — Dart install flags, concurrent **`ensureLayers`/`syncBusinessGeoJson`/`onStyleLoaded`**, and tearDown/remove failures desynced from native style. **Fix:** serialized lifecycle queue + **style epoch**; **`getLayerIds`/`getSourceIds`** reconcile (maplibre_gl **0.27.1**); safe **already-exists** handling; partial-layer retry without re-adding successful layers; latest GeoJSON replay on style reload. **`QALAGO_NATIVE_MAP_BUSINESS_LAYER`** default **still false**. **C3.2** fingerprint/perf not in scope. **Automated:** Flutter **1011/1011 PASS**.
- **Physical QA:** pending (Samsung native-business APK).
- **Next:** **C3.4** physical QA; **C3.2** GeoJSON dedup optional; production-default decision **C3.5** separate.

---

## 2026-09-24 — MAP-PERF.C2 Physical QA (Samsung)

- **Status:** **MAP-PERF.C2 PASS — VIEWPORT HYSTERESIS FINALIZED**.
- **Checkpoint (implementation):** `3c86164ffcd9eafdf42536642de08635c30490ed` (docs follow-up **`93f8a04a2db5d864861358e306289417cb6e5de4`**).
- **Device:** Samsung **SM-J610FN**, Android **10** / API **29** (native-business-layer debug APK; **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`** — not a production-default decision).
- **Defect (C2.0):** **`lastFetchBounds`** stored **padded** fetched coverage, but fetch logic compared it to the **visible** viewport via absolute edge-delta thresholds → tiny/unchanged pans looked “outside” padded coverage and re-triggered pagination/network fetches.
- **Solution (implemented):** containment-based hysteresis — suppress fetch while **visible viewport ⊆ fetched padded coverage** (ε **`1e-7`**); fetch when viewport exits coverage; no coverage on error/cancel/stale/incomplete wave; incomplete **30-page** cap remains fetch-eligible; retry does not double-pad; scope reset preserved.
- **Automated:** focused C2/bounds tests **27/27 PASS** (not re-run for this closure).
- **Physical MAPDBG:**
  - **Small pan / inside coverage:** visible bounds inside **`lastFetchBounds`** → **`fetchNeeded=false`**, **`fetchSkipped`** — **PASS**.
  - **Larger pan / outside coverage:** viewport exited coverage → **`fetchNeeded=true`**, new padded bounds, fetch completed, **`lastFetchBounds`** updated — **PASS**.
  - **Interaction (incidental):** during MAP-LOCATION.2 QA, pan/zoom/re-entry showed no obvious map freeze — supplementary only, not exhaustive C2 matrix.
- **Out of scope / still open:** **MAP-PERF.C3** native business-layer hardening; **`CannotAddLayerException`** duplicate **`qalago-business-*`** layers (C3 audit).
- **Next:** **MAP-PERF.C3** read-only audit / hardening stage.

---

## 2026-09-24 — MAP-LOCATION.2 Physical QA (Samsung)

- **Status:** **MAP-LOCATION.2 PASS — USER LOCATION FINALIZED**.
- **Checkpoint (implementation):** `113a2b02b31b2e2d40dce3b4d23e62c69ebbebf1`.
- **Device:** Samsung **SM-J610FN**, Android **10** / API **29**.
- **APK (debug):** **`QALAGO_DEV_HOST=172.158.10.133`**, **`QALAGO_DEV_LOGIN=true`**, **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`**.
- **Physical QA (post hotfix):**
  - **Initial location:** blue user-location dot on map open **without** ~75 m movement — **PASS**.
  - **Slow pan:** dot geographically attached (not screen-fixed) — **PASS**.
  - **Zoom:** correct geographic anchor, no drift/jump — **PASS**.
  - **Fast pan:** after idle, dot still attached; no stale screen position — **PASS**.
  - **Map re-entry:** leave Map tab → return; dot restored automatically — **PASS**.
- **Out of scope (not tested / not closed here):** **C3** native business clustering; **`CannotAddLayerException`** duplicate **`qalago-business-*`** layers (separate stage).
- **Next:** **MAP-PERF.C3** / business-layer lifecycle audit; **MAP-PERF.C2** final closure remains separate.

---

## 2026-09-24 — MAP-LOCATION.2 User location bootstrap + native replay (hotfix)

- **Status:** **MAP-LOCATION.2 HOTFIX AUTOMATED PASS** (physical QA → closure entry above).
- **Checkpoint (implementation):** `113a2b02b31b2e2d40dce3b4d23e62c69ebbebf1`.
- **Summary:** MAP-LOCATION.2 audit: Samsung had permissions + fused last-known but native user layer only **cleared/initialized** (no **updated**). **Fix:** passive **`userLocationStream()`** bootstraps **`getLastKnownPosition()`**, bounded **`getCurrentPosition`** (**12s**), deduped emissions, then **`distanceFilter: 75`** stream; debug **`[UserLocation]`** bootstrap events. **MapLibre:** **`onStyleLoaded`** syncs **`widget.userLocation`** (not stale controller cache only); style reload replays current widget coordinate. **Automated:** Flutter **999/999 PASS**. **C2** / **C3** / business layers unchanged.
- **Physical QA:** **PASS** (Samsung SM-J610FN — see physical QA entry above).
- **Next:** **C3** duplicate business-layer errors; **C2** formal closure separate.

---

## 2026-09-24 — MAP-LOCATION.1 Native user location layer (hotfix)

- **Status:** **MAP-LOCATION.1 AUTOMATED PASS — NATIVE USER LOCATION LAYER IMPLEMENTED — PHYSICAL QA PENDING**.
- **Checkpoint (implementation):** `d71151bc902c1156e4e7909572bdc9d9c090b938`.
- **Summary:** Physical SM-J610FN desync: user dot was Flutter **`Positioned`** overlay + **`toScreenLocationBatch`** while businesses use native GeoJSON under **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`**. **Fix:** MapLibre dedicated **`qalago-user-location`** GeoJSON + **CircleLayer** (center-anchored, brand blue); **`myLocationEnabled`** stays **false**; **`userLocationProvider`** unchanged. **`resolveMapOverlayMarkers`** excludes **`__user_location__`** on MapLibre. **C2** / **C3** unchanged.
- **Physical QA:** pending (Samsung).
- **Next:** MAP-LOCATION physical closure; C3 clustering separate.

---

## 2026-09-24 — MAP-PERF.C2 Viewport fetch hysteresis (hotfix)

- **Status:** **MAP-PERF.C2 HOTFIX AUTOMATED PASS** (physical QA → closure entry above).
- **Checkpoint (implementation):** `3c86164ffcd9eafdf42536642de08635c30490ed`.
- **Summary:** **C2.0** confirmed **`mapBoundsFetchNeeded`** compared **padded `lastFetchBounds`** to **visible** viewport via edge deltas → identical idle re-fetched (up to **30×100** HTTP). **Fix:** **`mapViewportFetchSuppressed`** / **`mapBoundsVisibleWithinFetchedCoverage`** — suppress fetch while **visible ⊆ fetched padded coverage** (ε = **`1e-7`**). **12%** padding unchanged; city/scope reset clears coverage; failed/cancelled/stale fetches do not establish coverage; **30-page cap** without exhausting API **total** does not mark coverage complete. **C3** / map renderer / backend untouched.
- **Physical QA:** **PASS** (Samsung SM-J610FN — see physical QA entry above).
- **Next:** **MAP-PERF.C3** (separate); **6.12A.9.0** unchanged.

---

## 2026-09-24 — MAP-SEC.C1 Public business visibility (security hotfix)

- **Status:** **MAP-SEC.C1 PASS — PUBLIC BUSINESS VISIBILITY SECURED** (runtime-verified).
- **Checkpoint (implementation):** `a09679386eb4db9cb1d32f388857f0243e4524d3`.
- **Summary:** Runtime audit confirmed anonymous **`GET /api/v1/businesses`** could return **PENDING** businesses (incl. **`forMap=true`**) via **`?status=PENDING`**. **Fix:** public **`ListBusinessesQueryDto`** rejects non-ACTIVE **`status`** with **400**; **`BusinessesService.findAll`** asserts **ACTIVE-only** and hard-codes catalog/map/geo queries to **ACTIVE**. **`GET /businesses/:id`** and public content routes were already **ACTIVE-only** (404 for PENDING). **Admin** **`GET /admin/businesses`** unchanged (protected status filter).
- **Runtime retest (anonymous):** list/map **PENDING/BLOCKED** → **400**; default and **`status=ACTIVE`** → **200 ACTIVE only**.
- **Next:** MAP-SEC.C2/C3 remain separate; **6.12A.9.0** unchanged.

---

## 2026-09-24 — Stage 6.12A.8 FINAL — Ads / Analytics location & platform hooks

- **Status:** **6.12A.8 CLOSED — ADS / ANALYTICS LOCATION & PLATFORM HOOKS FINALIZED** (docs-only closure; **6.12A.8.FINAL** audit PASS).
- **Checkpoint (closure commit):** `61dad0b089c3e500a159cde18f81f183c9141ff0`.
- **Pre-closure docs HEAD:** `4516c523d3382a03d0f32e0dd33161147671b287`. **A.8.6 implementation (unchanged):** `ae20e929742658c145a2d20286533db87a3dc816`.
- **Summary — final architecture delivered:**
  - **A.8.1** — Nullable **`AdCampaign.targetBusinessLocationId`** / **`destinationBusinessLocationId`**; **`AnalyticsEvent.businessLocationId`** foundation; composite same-business FKs; analytics branch **`ON DELETE SET NULL`**.
  - **A.8.2** — Campaign location validation (same-business, city alignment, target/destination rules, PBA); order/provision path; safe branch delete / campaign ref clearing.
  - **A.8.3** — Shared branch-aware ad serving; runtime destination resolution; branch-effective payloads; five placements (**HOME_VIP_BANNER**, **CATEGORY_TOP**, **CATEGORY_BOOST**, **HOME_FEATURED**, **HOME_PROMOTIONS**).
  - **A.8.4** — Flutter branch-aware ad navigation; VIP promotion hotfix (`f1d03c8`); **A.8.4.PHYSICAL** Samsung QA PASS; post-QA fixture cleanup.
  - **A.8.5** — Organic + ad analytics branch attribution; same-business validation; **`AD_SERVED`** runtime branch; client **`AD_*`** explicit destination only; **no** historical branch backfill.
  - **A.8.6** — **`IOS` | `ANDROID` | `WEB` | `UNKNOWN`** ad platform on serve + client ad events; shared Flutter **`qalagoAnalyticsPlatform()`**; **no** migration; **no** historical platform backfill.
- **Final stable contract (grain):** **Business** = brand identity; **BusinessLocation** = physical branch; **AdCampaign.businessId** = owner; **target** = eligibility branch; **destination** = configured landing; **runtime destination** = serve engine output; **`AnalyticsEvent.businessLocationId`** = application branch context (**not GPS**); **`AnalyticsEvent.platform`** = optional client runtime enum; discovery cards **Business-grain**; map **Location-grain**; favorites/reviews/membership **Business-grain**.
- **Final audit:** no **P0/P1** integrity blockers; cross-business campaign/analytics branch mismatches **0** (dev read-only); **A.8.7 NOT required**.
- **Physical QA:** **A.8.4.PHYSICAL** PASS (HOME_FEATURED, CATEGORY_TOP, HOME_PROMOTIONS, VIP BUSINESS, VIP PROMOTION + hotfix retest). **A.8.5/A.8.6** — automated only (non-visible metadata). No additional physical QA in FINAL audit.
- **Test debt (not architecture):** **A8F-001** — legacy **A.8.1** runtime spec assumes all historical **`businessLocationId`** null; post–A.8.5 valid branch events exist. Focused A.8 regression at FINAL audit: **73 PASS / 1 FAIL** (stale assertion). Last full Flutter at **A.8.6:** **955/955 PASS**. Full current A.8 backend suite **not claimed green**.
- **Deferred (not A.8 blockers):** Consumer Web ads/analytics; campaign channel **ALL | APP | WEB**; **WEB_MOBILE/WEB_DESKTOP**; branch/platform analytics dashboards; creative-level analytics; serve-session bridge for runtime-only client **AD_*** branch; **A85-004** VIEW_BUSINESS branch-switch dedupe semantics.
- **Next:** **6.12A.9.0** — READ-ONLY audit: legacy **Business** physical fields / deprecation (do not start A.9 implementation in this closure).

---

## 2026-09-24 — Stage 6.12A.8.6 Ad analytics platform attribution

- **Status:** **6.12A.8.6 PASS — AD ANALYTICS PLATFORM ATTRIBUTION IMPLEMENTED** (automated; no physical QA).
- **Checkpoint (commit):** `ae20e929742658c145a2d20286533db87a3dc816`.
- **Summary:** Reused existing **`AnalyticsPlatform`** (`IOS` | `ANDROID` | `WEB` | `UNKNOWN`) on **`AnalyticsEvent.platform`** for ad parity — **no migration**. Flutter **`qalagoAnalyticsPlatform()`** shared by organic + ad **`sendAdEvent`** + **`serveAds`**. Backend: optional **`platform`** on **`TrackAdEventDto`** and **`ServeAdsQueryDto`**; **`AD_SERVED`** from serve hint; client **`AD_*`** from event body. Omitted → **`null`** (not coerced to UNKNOWN). **A.8.5** `businessLocationId` unchanged. **No** historical backfill; **no** Consumer Web ads; **no** campaign channel targeting; **no** analytics UI.
- **Deferred:** ALL/APP/WEB campaign channel; WEB_MOBILE/WEB_DESKTOP split; platform breakdown UI; Consumer Web ad implementation.
- **Next:** follow-on monetization/analytics stages as scheduled (not A.8.7 in this closure).

---

## 2026-09-24 — Stage 6.12A.8.5 Analytics location attribution

- **Status:** **6.12A.8.5 PASS — ANALYTICS LOCATION ATTRIBUTION IMPLEMENTED** (automated; no physical QA).
- **Summary:** **`AnalyticsEvent.businessLocationId`** = attributable application branch context (not GPS). **Organic** `POST /analytics/events` accepts optional **`businessLocationId`** with same-business validation; Flutter detail/contact/discovery/catalog/promo producers send effective/`contextLocationId` branch. **Ad** events: **`AD_SERVED`** stores A.8.3 resolved destination at serve; client **`AD_*`** events derive branch from explicit campaign **destination** only (no serve-session cache). **No** historical backfill; **no** owner/admin branch UI; **no** Consumer Web analytics; **platform** ad parity deferred **A.8.6**.
- **Next:** **6.12A.8.6** — analytics platform parity (optional); branch breakdown UI later.

---

## 2026-09-24 — Stage 6.12A.8.4.PHYSICAL branch-aware ad navigation (Samsung)

- **Status:** **6.12A.8.4.PHYSICAL PASS — BRANCH-AWARE AD NAVIGATION FINALIZED**.
- **Checkpoint (implementation, unchanged):** `f1d03c8ded7c316fe111f1904affbee6ab143b4e` (VIP PROMOTION hotfix); A.8.4 nav `a7806bb006c16fcfe6d1c1a12a6a89645b449b34`.
- **Physical device:** Samsung **SM-J610FN**, Android 10 / API 29, serial **651368a1**.
- **QA matrix:** **QA-1** HOME_FEATURED → L2 **PASS**; **QA-2** CATEGORY_TOP → L2 **PASS**; **QA-3** HOME_PROMOTIONS → L2 **PASS**; **QA-4** VIP BUSINESS → L2 **PASS**; **QA-5** VIP PROMOTION — initial **FAIL** (banner visible, tap no navigation); hotfix APK retest → Bar Code 51 L2 **PASS**; **QA-6** L2 detail → switch L1 (effective address) → back once → Home **PASS** (no stale branch in tested flow).
- **QA-5 root cause:** VIP serve **`creative.targetType=PROMOTION`** + **`targetId`** without embedded **`promotion`** object; A.8.4 **`openPromotionFromAdItem`** returned when **`toPromotionModel()`** null.
- **Fixture:** Dev DB A.8.4 physical fixture inserted for Bar Code 51 (`cmpn1wnq1000iult8yj6a06q7`, L1 `bl7085ee9a617ae8b64026db`, temp L2 `cmuekpm660001ulzouphv3fdk`); **`a84-physical-ad-qa-fixture-cleanup.mjs`** run post-QA — temp L2 removed, QA campaigns/creatives/promotion/PBA removed, legacy VIP statuses restored; baseline verify: **1** Bar Code location (L1), **qaPromotions 0**, **qaCreatives 0**, **barCodeCampaignsWithBranch 0**, legacy VIP **ACTIVE**, **adCampaignTotal 20**, **activeCampaignCount 2**.
- **Automated regression (post-cleanup):** catalog-api A.8.1–A.8.3 / ad-serving specs **44/44**; Flutter **`test/ads`** **42/42**.
- **Next:** **6.12A.8.5** analytics branch attribution (**not started** in this closure).

---

## 2026-09-24 — Stage 6.12A.8.4.HOTFIX VIP promotion ad navigation

- **Status:** **CLOSED** — physical retest PASS; see **6.12A.8.4.PHYSICAL**.
- **Checkpoint (implementation):** `f1d03c8ded7c316fe111f1904affbee6ab143b4e`.
- **Summary:** Samsung physical QA found VIP **PROMOTION** taps no-op: VIP serve includes `creative.targetType/targetId` but **no** `promotion` object; A.8.4 `openPromotionFromAdItem` required `toPromotionModel()`. **Fix:** guarded fallback opens **Business** via `item.business.id` + backend `resolvedDestinationLocationId` when VIP promotion creative contract matches; promotion-rich HOME_PROMOTIONS path unchanged.
- **Next:** **6.12A.8.4.PHYSICAL** (completed).

---

## 2026-09-24 — Stage 6.12A.8.4 Flutter branch-aware ad navigation

- **Status:** **6.12A.8.4 PASS — FLUTTER AD BRANCH NAVIGATION IMPLEMENTED**.
- **Checkpoint (implementation):** `a7806bb006c16fcfe6d1c1a12a6a89645b449b34`.
- **Summary:**
  - **`AdItemModel.resolvedDestinationLocationId`** + **`ad_navigation.dart`** — canonical `destinationLocationId ?? contextLocationId`; no client branch/PBA/city logic.
  - All Business-opening ad placements (HOME_FEATURED, CATEGORY_TOP/BOOST via shared section, HOME_PROMOTIONS, VIP BUSINESS/PROMOTION) pass **`selectedLocationId`** into existing **`openBusiness` / `openBusinessFromPromotion`** AD source; **EXTERNAL_URL** unchanged.
  - **`openBusinessFromPromotion`** accepts optional explicit `selectedLocationId` (organic promotion cards unchanged).
- **Findings:** **A8-001 CLOSED**. **A8-002 FULLY CLOSED** (server + client branch preservation). **A8-003** remains closed. No analytics branch attribution (**A.8.5**). No physical Samsung QA in this stage.
- **Next:** **6.12A.8.5** — analytics branch attribution.

---

## 2026-09-24 — Stage 6.12A.8.3 Branch-aware ad serving

- **Status:** **6.12A.8.3 PASS — BRANCH-AWARE AD SERVING IMPLEMENTED**.
- **Checkpoint (implementation):** `c6728dc1d48f0d81a2c23641624dcaa3b8ae3f7c`.
- **Summary:**
  - **`batchResolveAdServeLocationContexts` / `resolveAdDestinationLocationId`** — shared serving engine: target branch eligibility, deterministic destination (explicit → target → promotion PBA → A.7.9.3A city context), runtime **PBA** re-check for **PROMOTED_PROMOTION**, fail-closed per campaign before rotation.
  - **Serve DTO:** `destinationLocationId` + `contextLocationId` populated (equal when set); **branch-effective** business card physical fields for non-VIP-minimal payloads; **`business.id` unchanged**.
  - **Rotation:** invalid branch campaigns filtered pre-rotation; **`recordServe` / `servedCount`** only after successful item build.
- **Findings:** **A8-002** **server-side CLOSED** (serve excludes invalid promotion/branch); **user tap** still **A.8.4**. **A8-001** **OPEN**. **A8-003** **CLOSED** (serve physical card branch-effective). **A8-004** runtime uses **BusinessLocation.cityId** for branch-aware serve; legacy null/null + provision **Business.cityId** unchanged.
- **Env debt:** Windows **`prisma generate` EPERM** if DLL locked; dev PostGIS **27-row** geo drift (A.9) unchanged.
- **Next:** **6.12A.8.4** — Flutter branch-aware ad navigation.

---

## 2026-09-24 — Stage 6.12A.8.2 Campaign location validation + provisioning

- **Status:** **6.12A.8.2 PASS — CAMPAIGN LOCATION VALIDATION IMPLEMENTED**.
- **Checkpoint (implementation):** `d10447a52cede7ffafaf6542887cd30bdf592570`.
- **Summary:**
  - **`validateAndResolveCampaignLocationContext`** — same-business branch ownership, **campaign.cityId ↔ BusinessLocation.cityId** alignment, **target ≠ destination** rejected when both set, **PROMOTED_PROMOTION** + **PBA** rules (`isPromotionEffectiveAtLocation`), single selected branch auto-destination at provision/order when exactly one eligible branch in city.
  - **Order + provisioning:** optional `targetBusinessLocationId` / `destinationBusinessLocationId` on `CreateOrderItemDto` / `CreateOrderDto`; validated at order build + `CampaignProvisioningService.createCampaignForProduct`; stored on `AdCampaign` + order item metadata.
  - **Branch delete:** `clearAdCampaignBranchReferencesBeforeDelete` in transaction before location delete; clears nullable campaign refs when safe; **Conflict** when multi-branch promotion campaign would become ambiguous.
  - **Legacy:** null location fields unchanged for existing campaigns; **Business.cityId** still drives default `campaign.cityId` when no branch input (A.8.4/A.8.3 serve/nav still open).
- **Findings:** **A8-002** configuration/PBA protection **partial** (stored campaigns validated; **serve + tap** still A.8.3/A.8.4). **A8-001** **OPEN**. **A8-004** location-aware path fixed; legacy Business.cityId default remains until multi-city purchase UX.
- **Next:** **6.12A.8.3** — branch-aware ad serving.

---

## 2026-09-24 — Stage 6.12A.8.1 Ads / Analytics location context (schema foundation)

- **Status:** **6.12A.8.1 PASS — LOCATION CONTEXT FOUNDATION IMPLEMENTED** (schema + contracts; **no serving/navigation/analytics client behavior yet**).
- **Checkpoint (implementation):** `028aa96bfc58bd27dde8e70558dda9ce528c2ff5`.
- **Summary:**
  - **A.8.0 accepted:** AdCampaign stays **Business-owned**; separate optional **target** (serve narrowing), **destination** (tap branch), **analytics branch context** (interaction attribution, not user GPS).
  - **Prisma:** nullable `AdCampaign.targetBusinessLocationId`, `AdCampaign.destinationBusinessLocationId`; nullable `AnalyticsEvent.businessLocationId`; **AdCampaign** composite same-business FKs `(businessId, locationId)` → `BusinessLocation` with **`ON DELETE RESTRICT`** (composite `SET NULL` incompatible with required `businessId`); **AnalyticsEvent** single-column FK `businessLocationId` → `BusinessLocation.id` with **`ON DELETE SET NULL`**; indexes on campaign location columns + analytics `(businessLocationId,type,createdAt)` and `(campaignId,businessLocationId)`.
  - **Migration:** `20260924120000_stage_6_12a8_1_ad_analytics_location_context` + `20260924121500_stage_6_12a8_1_fk_semantics_fix` — additive/nullable; existing rows unchanged (dev snapshot: **20** campaigns, **6132** analytics events, all new location fields **NULL**).
  - **API contracts:** serve items expose nullable `destinationLocationId` / `contextLocationId` (**null until A.8.3**); campaign list/detail expose nullable target/destination IDs; organic `businessLocationId` on `POST /analytics/events` **deferred to A.8.5**; ad events still **no client location**.
  - **Flutter:** `AdItemModel` parses optional serve location fields only (no navigation change).
- **Deferred / not in this stage:** serving resolution, provisioning validation, PBA at serve, Flutter ad tap branch, Business/Admin branch pickers, ALL/APP/WEB channel, WEB_MOBILE/WEB_DESKTOP split, AD_* platform enrichment (**A.8.6**).
- **Open findings (unchanged):** **A8-001** ad tap loses branch; **A8-002** promotion ad may resolve wrong branch — fix in **A.8.3/A.8.4/A.8.2**.
- **Next:** **6.12A.8.2** — campaign location validation / provisioning.

---

## 2026-09-24 — Stage 6.12A.8.0 Ads / Analytics location hooks (read-only audit)

- **Status:** **6.12A.8.0 AUDIT PASS — IMPLEMENTATION PLAN READY** (read-only; no code).
- **Checkpoint:** `743da5dac1995bcc17e573917c12ff9a6228e4b6`.
- **Summary:** Inventory of ads + analytics domains; confirmed **Business-grain** campaign ownership; no `BusinessLocation` dimension today; recommended nullable target/destination + optional `AnalyticsEvent.businessLocationId`; staged plan **A.8.1–A.8.8**.
- **Next:** **6.12A.8.1** (this stage).

---

## 2026-09-24 — Stage 6.12A.7.QA Final BusinessLocation E2E architecture audit

- **Status:** **6.12A.7.QA AUDIT PASS — READY FOR A.8** (read-only audit; **no new physical QA**).
- **Checkpoint (docs):** `c16d934053dd71e60b6d400d3d5100364339a8ce`.
- **Summary:**
  - **Verdict:** **Business** = brand identity; **BusinessLocation** = physical branch; normal discovery = **Business-grain** + optional **`contextLocationId`**; **map** = **BusinessLocation-grain**; detail = **`Business.id`** + selected **`locationId`**; physical/contacts/hours/coords = location-effective; **SIBA/PBA** branch catalog/promotions; shared + branch **media** contract valid; **favorites/reviews/membership/plans** remain **Business-grain**.
  - **Security/integrity:** **no P0**; **no confirmed P1**; no cross-business location **IDOR** in static review; composite **`(businessId, locationId)`** FKs on media/SIBA/PBA.
  - **Dev DB snapshot (read-only):** 108 **Business**, 108 **BusinessLocation**; **no multi-location business** after A.7.9.6 fixture cleanup — multi-branch correctness relies on **automated tests** + **previously documented Samsung physical QA**, not re-run in A.7.QA.
- **Findings (recorded, not implemented):** **QA-001** P2 Consumer Web temp detail uses legacy **`business.address`** → **F.4**; **QA-002** P2 Flutter favorites open without **`contextLocationId`** → small Flutter/discovery remediation; **QA-003** P3 27 BL rows lat/lng without geography → **A.9**/ops backfill; **QA-004** P3 single-primary app-only → **A.9**; **QA-005** P2 promotions invalid-`locationId` doc vs primary-fallback → docs contract fix; **QA-006** DEFERRED ads/analytics no location dimension → **A.8**; **QA-007** DEFERRED Admin no full branch CRUD → ops backlog; **QA-008** DEFERRED legacy **Business** physical columns → **A.9**.
- **Release gate:** A.7 architecture complete **YES**; P0 **NO**; P1 **NO**; remediation required before A.8 **NO**; ready for A.8 **YES**; legacy Business physical deprecation remains **A.9**.
- **Next:** **6.12A.8** — Ads / Analytics location hooks.

---

## 2026-09-24 — Stage 6.12A.7.9.6 Physical discovery QA (closure)

- **Status:** **6.12A.7.9.6 PASS — PHYSICAL DISCOVERY QA FINALIZED**.
- **Checkpoint (implementation, unchanged):** branch switch `4a24b43c008b78c1e14979dbf8c18d1f44c4ae8a`; detail navigation `d7b25ea82a0d3a08359374c2b3be2af44f7db1b9`.
- **Summary:**
  - **Fixture:** controlled two-branch **Bar Code 51** dev fixture (`cmpn1wnq1000iult8yj6a06q7`, L1 `bl7085ee9a617ae8b64026db`, temp L2 `cmue301ys0001ulx8t3dkoyey`) used for Samsung **SM-J610FN** physical QA; **no branch-specific media fixture** (A.7.7 architecture only; shared brand media unchanged).
  - **Physical QA PASS (Samsung):** in-detail **L1↔L2** branch switching; map **Location-grain** (two markers during fixture); discovery **Business-grain** identity/context; **full catalog** L1/L2 isolation; **full business promotions** L1/L2 isolation + **Happy Hour** ALL-branches; favorites/reviews **Business-grain** across branches; back-stack/context preserved; **no stale L2 physical leak** after return to L1.
  - **Gaps found in physical QA (fixed before closure):** (1) no in-detail branch switch — hotfix `4a24b43`; (2) catalog/promotions navigation overflow-only + global promotions route — hotfix `d7b25ea`.
  - **Cleanup:** `infra/local-backups/a796-physical-qa-fixture-cleanup.mjs` — removed QA catalog/promo rows, temp L2; **baseline restored** (1 location, 2 service items, 1 promotion, 4 shared `BusinessImage` rows).
  - **Post-cleanup verify:** DB baseline + **`GET /businesses/:id/locations/public`** (1× L1); catalog **2** items; promotions **Happy Hour** only; discovery **1** Bar Code 51 card; map geo **1** geocoded location row for business.
- **Tests (regression, post-cleanup):** catalog-api Jest **111/111 PASS** (A.7.6–A.7.9 + effective-* pattern); map viewport **10/10 PASS**; Flutter focused **38/38 PASS** (branch switch, navigation, effective catalog/physical).
- **Deferred:** none for **A.7.9.6**; branch-specific **media** physical QA remains covered by **A.7.7** closure, not re-tested here.
- **Next:** **A.7.QA** / **A.8** per roadmap (not started in this task).

---

## 2026-09-23 — Stage 6.12A.7.9.6 Detail navigation (catalog + promotions hotfix #2)

- **Status:** **6.12A.7.9.6 DETAIL NAVIGATION HOTFIX IMPLEMENTED — WAITING FOR PHYSICAL QA** (stage **not** PASS).
- **Checkpoint (implementation):** `d7b25ea82a0d3a08359374c2b3be2af44f7db1b9`.
- **Summary:**
  - **Physical QA finding:** catalog/promotions full-list affordances only when preview overflow; promotions overflow routed to global **`/promotions`** (lost **`Business.id`** + branch); promotion tiles looked tappable but analytics-only.
  - **Flutter:** always-on section navigation for non-empty catalog/promotions; **`BusinessPromotionsScreen`** at **`/business/:id/promotions?locationId=`**; promotion tile opens business promotions list + keeps **`PROMOTION_VIEW`** analytics; catalog item preview taps open full catalog.
  - **Backend:** **`GET /businesses/:id/promotions`** reuses A.7.8 branch eligibility + public promotion rules (no schema change); **`api-contracts.md`** updated.
  - **Unchanged:** map, reviews/favorites grain, A.7.9.6 dev DB fixture (not cleaned), global city **`/promotions`** feed purpose.
- **Tests:** backend Jest **7/7 PASS** on **`stage-6-12a7-8-3-effective-catalog-promotions`**; Flutter **914 PASS** (incl. **`business_detail_navigation_test.dart`**); **`flutter analyze`** — pre-existing warnings/infos only (no new errors from this hotfix).
- **APK:** debug with **`QALAGO_DEV_HOST=192.168.8.101`**, **`QALAGO_DEV_LOGIN=true`**, **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`**.
- **Deferred:** Samsung physical re-QA (L1/L2 catalog + promotions navigation, Happy Hour ALL branches).
- **Next:** Physical closure of **6.12A.7.9.6**.

---

## 2026-09-23 — Stage 6.12A.7.9.6 Business Detail branch switching (hotfix)

- **Status:** **6.12A.7.9.6 BRANCH SWITCH HOTFIX IMPLEMENTED — WAITING FOR PHYSICAL QA** (stage **not** PASS).
- **Checkpoint (implementation):** `4a24b43c008b78c1e14979dbf8c18d1f44c4ae8a`.
- **Summary:**
  - **Physical QA finding:** Bar Code 51 two-branch fixture worked via map/L2 detail, but **no in-detail L1↔L2 switch**; read-only audit: A.6 **«Филиалы»** section was **display-only** (no tap), branch list could stay stale/hidden.
  - **Flutter:** interactive branch cards in **`BusinessBranchesSection`**; **`switchBusinessDetailBranch`** uses **`context.replace`** on same `/business/:id` route (preserves **`source`** / **`searchQuery`**); detail route **`ValueKey(businessId|locationId)`** for clean recompute; one-time per-session refresh of **`businessPublicBranchesProvider`** on first detail open; minimal loading/retry for branch list failures (detail still usable).
  - **Unchanged:** backend contracts, map, reviews/favorites **Business.id** grain, A.7.9.6 dev DB fixture (not cleaned).
- **Tests:** Flutter **907** PASS (incl. **`business_detail_branch_switch_test.dart`**); **`flutter analyze`** — see implementation report.
- **APK:** debug build with `QALAGO_DEV_HOST=172.158.10.133`, `QALAGO_DEV_LOGIN=true`, `QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`.
- **Deferred:** Samsung physical re-QA (L1↔L2 from detail, stale-state, branch list visibility); fixture cleanup after acceptance.
- **Next:** Physical closure of **6.12A.7.9.6**.

---

## 2026-09-23 — Stage 6.12A.7.9.5 Flutter discovery location context

- **Status:** **6.12A.7.9.5 PASS — FLUTTER DISCOVERY LOCATION CONTEXT IMPLEMENTED** (automated only; physical QA → **A.7.9.6**).
- **Checkpoint (implementation):** `10985a4dfe7b90fc2374a104101c92576bed8594`.
- **Summary:**
  - Parse **`contextLocationId`** on **`BusinessModel`** + **`PromotionModel`**; **`openBusinessFromDiscovery`** / **`openBusinessFromPromotion`** pass **`locationId`** query to existing detail route.
  - Wired search, category/subcategory, home nearby/popular/recommended, promotions; **map unchanged** (`locationId` from marker).
  - **`businessWithDistance`** preserves discovery context; no client branch fallback.
- **Deferred:** **A.7.9.6** Samsung physical QA (L1/L2 search/category/nearby/promo).
- **Next:** **6.12A.7.9.6** — physical closure.

---

## 2026-09-23 — Stage 6.12A.7.9.4 branch-aware promotion discovery

- **Status:** **6.12A.7.9.4 PASS — BRANCH-AWARE PROMOTION DISCOVERY IMPLEMENTED**.
- **Checkpoint (implementation):** `005735a17a0423fa71414588d61553b19e450ec3`.
- **Summary:**
  - **`GET /promotions`** city feed: **ALL/SELECTED PBA** city eligibility; **`Business.cityId`** removed as physical rule; Promotion-grain pagination unchanged.
  - Additive **`contextLocationId`** (batch PBA + reuse A.7.9.3A city context for ALL).
  - Owner CRUD, map, Flutter, search untouched.
- **Deferred:** **A.7.9.5** Flutter promotion navigation; geo promotion feed.
- **Next:** **6.12A.7.9.5** — client propagation.

---

## 2026-09-23 — Stage 6.12A.7.9.3B branch-aware search

- **Status:** **6.12A.7.9.3B PASS — BRANCH-AWARE SEARCH IMPLEMENTED**.
- **Checkpoint (implementation):** `5841f557337d22c438a36feac09bb792d07314e5`.
- **Summary:**
  - **`BusinessLocation.address`** ILIKE in requested city; business-grain **`EXISTS`** / Prisma `locations.some`.
  - **ServiceItem** search: **ALL** (0 SIBA) vs **SELECTED** (≥1 SIBA) city honesty; plan/visibility rules unchanged.
  - Search **`contextLocationId`**: geo **>** SELECTED item branch **>** branch address **>** generic city (A.7.9.3A).
  - **A.7.9.3A** city membership unchanged; ranking not redesigned; map/promotions/Flutter untouched.
- **Deferred:** **A.7.9.4** promotions branch city; **A.7.9.5** Flutter navigation; pg_trgm / search perf if profiling warrants.
- **Next:** **6.12A.7.9.4** — promotions discovery grain.

---

## 2026-09-23 — Stage 6.12A.7.9.3A BusinessLocation city membership + city context

- **Status:** **6.12A.7.9.3A PASS — BUSINESSLOCATION CITY MEMBERSHIP + CITY CONTEXT IMPLEMENTED**.
- **Checkpoint (implementation):** `5f05d76183534057310ca41a72a07389bee47a9d`.
- **Summary:**
  - Normal discovery city eligibility: **`BusinessLocation.cityId = C`** (`locations.some` / branch geo SQL); **no** `Business.cityId` OR fallback.
  - Non-geo lists attach **`contextLocationId`** (deterministic branch in city); batch **`businessLocation.findMany`** — no N+1.
  - Nearby/radius: **`bl.cityId`** on PostGIS nearest (A.7.9.2 invariants preserved).
  - **`recommended/me`**, search service scope, rating/popular/recommended paths migrated atomically.
  - **No** branch-address search, SIBA search honesty, promotions, map, Flutter (→ **A.7.9.3B+**).
- **Deferred:** **A.7.9.3B** search branch address + ServiceItem branch honesty; **A.7.9.4** promotions; **A.7.9.5** Flutter; prod/staging parity gate before production cutover.
- **Next:** **6.12A.7.9.3B** — search depth.

---

## 2026-09-23 — Stage 6.12A.7.9.2 nearby nearest-branch discovery

- **Status:** **6.12A.7.9.2 PASS — NEARBY NEAREST-BRANCH DISCOVERY IMPLEMENTED**.
- **Checkpoint (implementation):** `421e1e244638ac5871ec3b3eeb3d66c4097d7a21`.
- **Summary:**
  - **`GET /businesses`** nearby paths (`sort=nearest`, explicit **`radiusKm`**, default geo nearest): PostGIS on **`BusinessLocation.location`**; **`DISTINCT ON (businessId)`** nearest branch; business-grain pagination; additive **`contextLocationId`** + aligned **`distanceMeters`**.
  - Legacy **`Business.location`** not used for radius/membership; businesses without geocoded branches excluded (no fake **`contextLocationId`**).
  - City filter unchanged (**`Business.cityId`**); map **`forMap`**, search/category city, promotions untouched.
  - Tests: **`stage-6-12a7-9-2-nearby-branch-discovery.spec.ts`**, radius/nearest PostGIS specs updated; **`api-contracts.md`**, **`ai-project-context.md`**.
- **Deferred:** **A.7.9.3** city membership cutover; **A.7.9.4** promotions; **A.7.9.5** Flutter propagation.
- **Next:** **6.12A.7.9.3** — BusinessLocation-aware city membership.

---

## 2026-09-23 — Stage 6.12A.7.9.1 discovery location context foundation

- **Status:** **6.12A.7.9.1 PASS — DISCOVERY LOCATION CONTEXT FOUNDATION IMPLEMENTED**.
- **Checkpoint (implementation):** `1111948f71b776832d8c3b29473d003d429cdabb`.
- **Summary:**
  - Additive public discovery field **`contextLocationId`** on **`GET /businesses`** map rows (real **BusinessLocation** only); **`locationId`** map contract unchanged.
  - Normal business-grain list/search/category/nearest **unchanged** — **`contextLocationId` omitted** (legacy **`distanceMeters`** without branch context remains valid until **A.7.9.2**).
  - Internal helpers: **`BusinessDiscoveryContext`**, distance/branch invariant checks; **city membership policy** helpers (**legacy `Business.cityId`** vs **physical `BusinessLocation.cityId` presence**) — **not** wired into production filters yet.
  - **`docs/architecture/api-contracts.md`** updated (current vs **A.7.9.2+** planned invariant). **`packages/shared-types`** **`BusinessListItem`** extended additively.
  - **No** Prisma/migration; **no** Flutter/search/category/nearby/promotions/map query changes.
- **Deferred:** **A.7.9.2** nearest-per-business PostGIS; **A.7.9.3** city cutover; **A.7.9.4** promotions eligibility; **A.7.9.5** Flutter navigation propagation.
- **Next:** **6.12A.7.9.2** — nearby nearest-location-per-Business.

---

## 2026-09-23 — Stage 6.12A.7.8 CLOSED — branch catalog / promotions architecture finalized

- **Status:** **6.12A.7.8 CLOSED — BRANCH CATALOG / PROMOTIONS ARCHITECTURE FINALIZED**.
- **Checkpoint (final audit):** `19c504ce8e23476562e1b71a92349738ebee233e` (docs lineage only; **does not redefine** substage implementation SHAs).
- **Substages (implementation checkpoints preserved):**
  - **A.7.8.0** — architecture audit PASS (recorded under **A.7.8.1** entry).
  - **A.7.8.1** — `079ba3eb920eabb2993a504b00d6b96d278bcd53`.
  - **A.7.8.2** — `904b9b5fd4145838db213c4f4709781294064a32`.
  - **A.7.8.3** — `e24fdf1f604be22d9fda0dbadb85c9ef97032aa0`.
  - **A.7.8.4** — `d23e1d7fb9a5bd2cc77edcb03f2d495e57c51d96`.
  - **A.7.8.5** — `644809c57566a71d5a8eeb72d53edc8fa37ca2d8` (physical closure **2026-09-23**).
  - **A.7.8.6** — `e3c33188298bb64708e784c0d05ef1ac284f7550`.
- **Architecture (final):**
  - **ServiceMenuGroup:** business-wide (no branch scope).
  - **ServiceItem** / **Promotion:** business entities with M2M branch availability (**`ServiceItemBranchAvailability`**, **`PromotionBranchAvailability`**).
  - **Semantics:** **0** assignment rows = **ALL** branches; **≥1** = **SELECTED** only.
  - **Integrity:** composite same-business FKs; entity delete **CASCADE**; **`BusinessLocation`** delete **RESTRICT** (no silent SELECTED → ALL broadening).
- **Owner:** **`CATALOG_EDIT`** / **`PROMOTIONS_EDIT`**; ALL/SELECTED; same-business validation; transactional assignment replacement; PATCH omits unchanged **`branchAvailability`**; **Business Web** owner surface; **Admin is not** a branch-availability editor.
- **Public:** detail **`effectiveCatalog`** / **`effectivePromotions`** + **`activeLocationId`**; branch filter **before** tier/plan cap and preview/pagination; invalid/foreign **`locationId`** uses existing physical resolver fallback; legacy business-wide previews retained for compatibility.
- **Flutter:** branch-effective detail + scoped full catalog (**`locationId`** in query/provider identity; state reset on branch change); effective empty arrays authoritative; legacy fallback only when effective block absent. **Samsung SM-J610FN** (Android 10 / API 29) physical QA PASS (L1/L2, sibling exclusion, L1↔L2, no stale mutable catalog state); **Bar Code 51** QA785 fixture cleaned (dev DB). **Full public catalog pagination not physically claimed** (automated coverage only).
- **Admin:** read-only **`GET /admin/businesses/:businessId/content`** — **`BUSINESS_VIEW`**, city scope, human-readable ALL/SELECTED (unavailable branch stays SELECTED); no owner mutation gates; no branch editing.
- **Final regression (audit, not full green):** backend **163** suites / **1155** tests — **1153 PASS**, **2 FAIL** (shared dev-DB invariants only: **A.2** location backfill parity; **A.7.8.1** global-empty SIBA/PBA on shared DB — **not** A.7.8 logic regressions). **Admin Web** **70/70** PASS. **Business Web** **183/185** PASS (2 pre-existing reviews-page i18n guard). **Flutter** **893/893** PASS. Builds: **catalog-api**, **admin-web**, **business-web** PASS.
- **Dev DB hygiene (non-blocking debt):** shared dev DB observed **4** global **SIBA** rows during audit (ownership not proven Bar Code 51); **no cleanup in this closure**. Retain **A.2** backfill parity drift debt.
- **Map hotfix (separate, closed):** implementation **`936028f6e21890bae29312b6388318e5f0eebca9`**, closure **`ff2e4d9e21c1aabb0f0450df1ce55fcd3f50705d`** — **not** A.7.8 checkpoints; **MAPDBG** retained temporarily.
- **Deferred (non-blockers):** Admin **PROMOTION** structured moderation / **`promotionTarget`**; global/city **`GET /promotions`** + broader discovery/search branch grain → **A.7.9**; full catalog pagination physical QA; owner **Flutter** branch availability editing; **`assertCanAddServiceItem`** on owner create debt; **MAPDBG** removal; shared dev DB hygiene; Business Web reviews-page i18n guard.
- **Next:** **6.12A.7.9** — discovery grain (read-only audit first per track discipline).

---

## 2026-09-23 — Stage 6.12A.7.8.6 Admin Web branch catalog / promotion visibility

- **Status:** **6.12A.7.8.6 PASS — ADMIN WEB BRANCH CATALOG / PROMOTION VISIBILITY IMPLEMENTED**.
- **Checkpoint (implementation):** `e3c33188298bb64708e784c0d05ef1ac284f7550`.
- **Summary:**
  - Additive staff read-only **`GET /admin/businesses/:businessId/content`** — **`StaffPermission.BUSINESS_VIEW`** + **`CITY_ADMIN`** city scope; **not** owner **`CATALOG_EDIT` / `PROMOTIONS_EDIT`** gates.
  - Returns business context, **ServiceItem** + **Promotion** lists with server-resolved **`branchScope`** (`ALL` / `SELECTED`, human-readable branch rows, unavailable branch preserved as **SELECTED**).
  - **Admin Web** inspection route **`/dashboard/businesses/[id]/content`** (dashboard **«Контент»** link); RU/KK scope labels; **read-only** (no branch editing).
  - **Unchanged:** 0-row = ALL semantics; no Prisma schema/migration; public effective catalog/promotions; owner Business Web editor; media moderation **A.7.7.6**.
- **Deferred:** Admin **PROMOTION** moderation structured detail / **`promotionTarget`** enrichment.
- **Next:** **6.12A.7.9** discovery grain (read-only audit first).

---

## 2026-09-23 — Stage 6.12A.7.8.5 Flutter branch catalog / promotions — physical closure

- **Status:** **6.12A.7.8.5 PHYSICAL QA PASS — FLUTTER BRANCH CATALOG / PROMOTIONS CLOSED**.
- **Checkpoint (implementation):** `644809c57566a71d5a8eeb72d53edc8fa37ca2d8` (unchanged; docs/changelog lineage also includes `6aeac309461e0bc6bde9db24a78e98198d39060e`).
- **Summary:**
  - **Automated (at implementation checkpoint):** effective **`effectiveCatalog`** / **`effectivePromotions`** on business detail; detail route preserves **`businessId` + `locationId`**; full catalog route preserves **`locationId`**; **`BusinessCatalogQuery`** identity includes **`locationId`**; mutable catalog pagination/search/section state resets on branch scope change; effective block with empty items is authoritative; legacy fallback only when effective block absent; no sibling merge; reviews/favorites/analytics remain **Business**-scoped; global promotions list remains business-grain — **891** Flutter tests PASS at **`644809c`** (do not conflate with later map hotfix regression count).
  - **Physical QA (Samsung SM-J610FN, Android 10 / API 29):** dev **Bar Code 51** temporary L1/L2 **QA785** fixture — **L2** detail showed QA785 L2 ONLY PROMO, L1 L2 ITEM, L2 ONLY ITEM, SHARED ITEM; excluded L1 ONLY ITEM. **L1** detail showed QA785 L1 ONLY PROMO, L1 L2 ITEM, L1 ONLY ITEM, SHARED ITEM; excluded L2 ONLY ITEM. Repeated **L1 → L2** and **L2 → L1** PASS; no sibling branch leakage; no stale mutable catalog state. Owner **«Редактировать»** opened business-wide management catalog (expected; not a public effective-catalog leak). **Full public catalog route pagination not physically demonstrated** (automated-test covered only).
  - **Separate map viewport hotfix:** discovered during device QA; implemented **`936028f6e21890bae29312b6388318e5f0eebca9`**, physically closed **`ff2e4d9e21c1aabb0f0450df1ce55fcd3f50705d`** — does **not** redefine **A.7.8.5** implementation checkpoint; later Flutter suite **893** PASS at map hotfix (regression only).
  - **QA fixture cleanup (dev DB only):** PASS — removed 4 QA785 **ServiceItem**, 4 **ServiceItemBranchAvailability**, 2 QA promotions, 2 **PromotionBranchAvailability**, temporary L2; permanent **Bar Code 51** restored (1 primary L1, 2 catalog items, 0 assignments, Happy Hour only, 4 brand **BusinessImage**); API sanity PASS; no QA785 / temporary L2 leakage; **12** pre-existing **AnalyticsEvent** rows preserved (**11** `catalogItemId` + **1** `promotionId` nulled via **ON DELETE SET NULL**; business analytics total **264** unchanged). No production data implication.
  - **MAPDBG** retained temporarily (not removed in this closure).
- **Deferred:** remove MAPDBG after broader map QA; **A.7.9** discovery grain; branch-aware business promotion list endpoint.
- **Next:** **6.12A.7.9** discovery/search/home/map feed grain (read-only audit first per track discipline).

---

## 2026-09-23 — Map viewport refresh hotfix (projection decouple)

- **Status:** **MAP VIEWPORT REFRESH HOTFIX — PHYSICAL QA PASS — CLOSED**.
- **Checkpoint (implementation):** `936028f6e21890bae29312b6388318e5f0eebca9`.
- **Summary:**
  - **Root cause (physical MAPDBG):** `_onCameraIdle` awaited `_finalizeMarkerProjection()` (~10.7s on SM-J610FN) before `readVisibleBounds` / `MapBusinessesNotifier.onViewportIdle`.
  - **Fix:** propagate visible bounds + viewport fetch first; run overlay projection via `_runOverlayProjectionAfterCameraIdle()` without blocking data refresh.
  - **Physical QA (Samsung SM-J610FN, Android 10 / API 29):** diagnostic APK; initial map load PASS; pan PASS — MAPDBG order `cameraIdle START` → `visibleBounds` → `onViewportIdle` → `fetch START` → `cameraIdle END` → `projectionFinalize START/END` (fetch no longer blocked by projection); empty viewport PASS (`visibleBusinessCount=0`, `geojsonSync featureCount=0`, old markers removed); return to populated viewport PASS (populated → empty → populated, no stale markers).
  - **Unchanged:** backend; **BusinessLocation** map grain; hysteresis / bbox padding (0.12) / notifier cache merge.
  - **MAPDBG** retained temporarily (not removed in hotfix closure).
- **Deferred:** remove MAPDBG after broader map QA.
- **Next:** closed under separate hotfix; **6.12A.7.8.5** physical catalog/promotions closure recorded separately (does not merge checkpoints).

---

## 2026-09-22 — Stage 6.12A.7.8.5 Flutter branch catalog / promotions integration

- **Status:** **6.12A.7.8.5 IMPLEMENTED (automated)** — consumer **Flutter** consumes **`effectiveCatalog`** / **`effectivePromotions`** on business detail + scoped full catalog; **physical closure:** see **2026-09-23** entry above.
- **Checkpoint (implementation):** `644809c57566a71d5a8eeb72d53edc8fa37ca2d8`.
- **Summary:**
  - Detail preview uses **`effectiveCatalog`** / **`effectivePromotions`** when present (empty effective ≠ missing; no merge with legacy previews).
  - Full catalog route passes **`locationId`** from backend-resolved scope; **`BusinessCatalogQuery`** + local pagination keyed by **`businessId|locationId`** (A.7.7.5-style isolation).
  - **`GET /businesses/:id/catalog?locationId=`** on paginated loads; legacy catalog without branch context unchanged.
  - Map → detail **`locationId`** flow unchanged; global **`/promotions`** feed unchanged.
- **Deferred:** **A.7.9** discovery grain; branch-aware business promotion list endpoint (physical QA closed **2026-09-23**).
- **Next:** superseded by **2026-09-23** physical closure entry.

---

## 2026-09-22 — Stage 6.12A.7.8.4 Business Web branch availability UX

- **Status:** **6.12A.7.8.4 IMPLEMENTED** — owner **Business Web** catalog + promotions **branch availability** controls (ALL / SELECTED); no backend/public surface changes.
- **Checkpoint (implementation):** `d23e1d7fb9a5bd2cc77edcb03f2d495e57c51d96`.
- **Summary:**
  - **Service item** create/edit + **promotion** create/edit submit **`branchAvailability`** per **A.7.8.2**; edit PATCH **omits** unchanged assignments.
  - Reuses **`listBusinessLocations`** + shared **`formatBranchAvailabilityLabel`**; edit loads assignments via **`GET /service-items/manage/:businessId`** when paginated menu rows omit them.
  - **Missing branch** safety: blocked submit + localized unavailable state (no silent ALL broadening).
  - RU/KK copy; focused **Vitest** + existing Business Web regression tests.
- **Deferred:** **A.7.8.5** Flutter branch catalog/promotions; **A.7.9** discovery grain; ServiceItem create cap debt.
- **Next:** **6.12A.7.8.5** — Flutter branch catalog / promotions integration.

---

## 2026-09-22 — Stage 6.12A.7.8.3 public effective catalog / promotions

- **Status:** **6.12A.7.8.3 IMPLEMENTED** — public **branch-aware** catalog/promotions on business detail + scoped full catalog; legacy previews unchanged.
- **Checkpoint (implementation):** `e24fdf1f604be22d9fda0dbadb85c9ef97032aa0`.
- **Summary:**
  - **`GET /businesses/:id?locationId=`** adds **`effectiveCatalog`** + **`effectivePromotions`** (`activeLocationId` aligned with **`effectivePhysical`** / **`effectiveMedia`**).
  - Branch rule: **0** assignments → all branches; **≥1** → active location only; then existing **`isActive`/section/plan cap** pipeline (**branch before cap**).
  - **`GET /businesses/:id/catalog?locationId=`** branch-effective paginated catalog; **without** `locationId` = legacy business-wide.
  - Legacy **`catalogPreview`**, **`promotionsPreview`**, **`GET /promotions`**, **`/service-menu`**, **`/service-items`** unchanged.
- **Deferred:** **A.7.9** discovery/search/home/map feed grain; **A.7.8.4** Business Web branch UX; per-branch price/order; ServiceItem create cap debt.
- **Next:** **6.12A.7.8.4** — Business Web branch availability UX.

---

## 2026-09-22 — Stage 6.12A.7.8.2 owner backend branch availability management

- **Status:** **6.12A.7.8.2 IMPLEMENTED** — owner/staff **management contract only** (no public branch filtering).
- **Checkpoint (implementation):** `904b9b5fd4145838db213c4f4709781294064a32`.
- **Summary:**
  - Additive **`branchAvailability`** on ServiceItem/Promotion owner create/update/read: `{ mode: "ALL" | "SELECTED", locationIds: [] }`.
  - **ALL** → zero DB assignment rows; **SELECTED** → validated same-business `BusinessLocation` ids; omitted on create = ALL; omitted on PATCH = unchanged assignments.
  - Atomic Prisma transactions for entity + assignment replacement; **CATALOG_EDIT** / **PROMOTIONS_EDIT** unchanged.
  - **DELETE** `/businesses/:businessId/locations/:locationId` (non-primary): **409** `BUSINESS_LOCATION_DELETE_BLOCKED` when assignments (or other FK refs) block delete — no FK behavior change from A.7.8.1.
  - Public catalog/promotions/discovery unchanged (**A.7.8.3** next).
- **Deferred:** Public **effectiveCatalog** / **effectivePromotions**; Flutter/Business Web/Admin/Consumer UI; **ServiceItem create** still does not call `assertCanAddServiceItem` (pre-existing plan cap debt).
- **Next:** **6.12A.7.8.3** — public effective catalog/promotions contract.

---

## 2026-09-22 — Stage 6.12A.7.8.1 branch availability data foundation

- **Status:** **6.12A.7.8.1 IMPLEMENTED** — branch availability **data foundation** (Prisma/DB only; no API/UI behavior change).
- **Checkpoint (implementation):** `079ba3eb920eabb2993a504b00d6b96d278bcd53`.
- **Summary:**
  - **A.7.8.0 audit PASS** — M2M branch availability for **ServiceItem** and **Promotion**; **ServiceMenuGroup** remains business-wide.
  - New tables **`ServiceItemBranchAvailability`**, **`PromotionBranchAvailability`** (availability only; no per-branch price/title overrides).
  - **Semantics:** zero assignment rows = available at **all** `BusinessLocation`s; ≥1 row = **only** listed branches. **No backfill** — legacy rows keep business-wide availability.
  - **DB integrity:** composite FKs `(businessId, serviceItemId|promotionId|locationId)` → **`@@unique([businessId, id])`** on parent entities; duplicate `(entityId, locationId)` prevented; **BusinessLocation** delete **RESTRICT** while assignments exist (avoids silent broadening when last assignment would CASCADE away).
  - **Runtime DB tests** A–M (same-business assign, cross-business reject, cascade on entity/business delete, location RESTRICT, zero-row contract).
- **Deferred:** **A.7.8.2** owner/backend assignment management; **effectiveCatalog** / **effectivePromotions** public filtering; Flutter/Business Web/Admin/Consumer UI.
- **Next:** **6.12A.7.8.2** — owner/backend branch assignment management.

---

## 2026-09-22 — Stage 6.12A.7.7 CLOSED — branch media architecture finalized

- **Status:** **6.12A.7.7 CLOSED** — BRANCH MEDIA ARCHITECTURE FINALIZED.
- **Checkpoint (closure):** `dc4bb13b638b07c55c2f7248f11dab8af949d310`.
- **Summary (track):**
  - **A.7.7.1** — **`BusinessImage.locationId`** nullable; shared vs branch; same-business composite FK integrity.
  - **A.7.7.2** — Owner branch-aware list/attach/delete/cover; **`moderationHidden`** excluded from public reads.
  - **A.7.7.3** — Public **`effectiveMedia`** + **`GET /photos?locationId=`** (branch-first + shared; sibling exclusion).
  - **A.7.7.4** — **Business Web** shared/branch media management UX.
  - **A.7.7.5** — **Flutter** consumer integration; Hotfix 1 full-gallery isolation; **Samsung SM-J610FN physical QA PASS**.
  - **A.7.7.6** — **Admin Web** **`MEDIA`** moderation **`mediaTarget`** + shared/branch labels; moderation semantics unchanged.
  - **Final closure audit:** **PASS** — no architecture blockers for track close.
- **Invariants (retain):** **`Business.id`** = brand identity (reviews/favorites/analytics); **`BusinessLocation.id` / `locationId`** = branch context; shared media **`locationId = null`**; branch media scoped to owning location; public branch view = active branch + shared brand only (no sibling inheritance); **`effectiveMedia`** = branch-aware public source of truth; legacy **`galleryPreview`** compatibility-only (not branch truth); **`Business.coverImageUrl`** brand-level.
- **Deferred (not blockers):** legacy business-wide **`galleryPreview`**; full Admin gallery manager; Admin upload/reorder; owner Flutter branch upload; Consumer Web branch media (**F.4**); image orphan-file GC; media reorder API/UX; explicit branch cover persistence; branch-level moderation status; CDN/object storage migration.
- **Next:** **6.12A.7.8** — catalog / promotions branch scope — **start with read-only architecture audit** (ServiceMenuGroup / ServiceItem / Promotion shared-vs-branch scoping before schema changes). **Do not implement in closure task.**

---

## 2026-09-22 — Stage 6.12A.7.7.6 Admin Web branch media visibility

- **Status:** 6.12A.7.7.6 IMPLEMENTED — closed under **6.12A.7.7** (see closure entry).
- **Checkpoint (implementation):** `3c61e5d`.
- **Summary:**
  - **Audit:** Admin Web had no `BusinessImage` gallery; **`MEDIA`** moderation cases were the only staff surface for reported business photos (backend `MEDIA_HIDE`/`MEDIA_RESTORE` existed; UI was review-only).
  - **API (additive):** `GET /admin/moderation/cases/:id` adds optional **`mediaTarget`** (`locationId`, branch address/city/`isPrimary`, `branchUnavailable`) — no schema/migration changes.
  - **Admin UI:** moderation case detail shows photo preview + **Общие фото** vs **Филиал: {address}** scope before actions; **`MEDIA_HIDE`/`MEDIA_RESTORE`** wired; RU/KK label helpers.
  - **Moderation semantics:** actions still target **`BusinessImage.id`** via case `targetId`; no branch-level moderation status.
- **Deferred:** full Admin gallery manager, upload/reorder (see **6.12A.7.7** closure deferred list).
- **Next:** _(track closed — A.7.8)_.

---

## 2026-09-22 — Stage 6.12A.7.7.5 physical QA closure (Flutter branch media)

- **Status:** **6.12A.7.7.5 PHYSICAL QA PASS** — Flutter consumer branch media closed for this stage.
- **Checkpoint (implementation):** `d30e55d5c2acbabb01aa804a8fff6ac6b5979fb9`.
- **Checkpoint (hotfix 1):** `d5a498ffa2d655c03afcad00edb7a5160b2513a5`.
- **Summary (physical):**
  - **Device:** Samsung **SM-J610FN**, Android 10; fresh Hotfix 1 debug APK (`adb install -r`); catalog API **`http://172.158.10.133:3002/api/v1`**; **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`**.
  - **Bar Code 51** (`cmpn1wnq1000iult8yj6a06q7`): **L1** / **L2** branch media isolation verified both directions — branch hero + full gallery show own branch + shared brand only; **QA L1** / **QA L2** excluded on sibling branch.
  - **Shared brand** images visible on both branches; **full gallery branch switching** verified after Hotfix 1.
  - **API alignment:** L2 detail **`effectivePhysical.locationId`** and **`effectiveMedia.activeLocationId`** = L2; L2 **`/photos?locationId=`** excluded sibling branch QA rows (pre-cleanup).
  - **Local QA fixture** removed post-pass (3 `BusinessImage` rows + `uploads/qa-a775/*.png`); legacy brand images, cover, L1/L2 locations unchanged.
- **Deferred:** broader **A.7.7** track items outside this stage (e.g. Admin/Consumer Web media, owner Flutter upload scope); **F.4** URL architecture unchanged.
- **Next:** planned A.7.7+ / admin-media stages per roadmap.

---

## 2026-09-22 — Hotfix 6.12A.7.7.5.1 Flutter full gallery branch isolation

- **Status:** A.7.7.5 HOTFIX 1 IMPLEMENTED — **physical retest PASS** (see physical QA closure entry above).
- **Checkpoint (hotfix):** `d5a498ffa2d655c03afcad00edb7a5160b2513a5`.
- **Summary:**
  - **Root cause:** `BusinessPhotosScreen` kept mutable `_items` across visits to the same route (`/business/:id/photos`); seeding ran only when `_page == 1 && _items.isEmpty`, so opening L2 after L1 left stale L1 rows in the grid while detail/hero used fresh `effectiveMedia`.
  - **Fix:** scope key `businessId|locationId`; router `ValueKey` on gallery screen; page 1 always renders provider rows; pagination accumulation reset on scope change; regression tests L1↔L2.
  - **Backend:** unchanged (L2 `/photos?locationId=` already correct on server).
- **Deferred:** _(none — retest completed in physical QA closure)_.
- **Next:** _(closed with A.7.7.5 physical QA)_.

---

## 2026-09-22 — Stage 6.12A.7.7.5 Flutter branch media integration

- **Status:** 6.12A.7.7.5 IMPLEMENTED — **PHYSICAL QA PASS** (Samsung branch media + Hotfix 1 gallery isolation).
- **Checkpoint (implementation):** `d30e55d5c2acbabb01aa804a8fff6ac6b5979fb9`.
- **Summary:**
  - **Flutter detail:** consumes backend **`effectiveMedia`** for hero + preview strip when present; legacy **`coverImageUrl`/`galleryPreview`** fallback unchanged.
  - **Full gallery:** **`GET /businesses/:id/photos?locationId=`** carries active branch from detail; router preserves query.
  - **Dedupe:** cover URL not duplicated in carousel when already in preview items.
  - **Physical QA:** completed in separate closure entry (Samsung SM-J610FN).
- **Deferred:** Consumer Web F.4; owner Flutter upload scope; Admin/Consumer branch media surfaces (outside A.7.7.5).
- **Next:** roadmap stages after A.7.7.5 closure.

---

## 2026-09-22 — Stage 6.12A.7.7.4 Business Web branch media UX

- **Status:** 6.12A.7.7.4 IMPLEMENTED — READY FOR FLUTTER INTEGRATION (mobile not in this stage).
- **Checkpoint (implementation):** `a88e31e48a9f8e108ac1b8fbf583a92709a9c8fe`.
- **Summary:**
  - **Business Web `/business/[id]/media`:** scope selector — **Общие фото** (brand) vs per-**BusinessLocation**; list uses **`scope=brand`** or **`locationId`** (A.7.7.2 management API).
  - **Upload/attach:** passes **`locationId`** for branch scope; brand cover action only in shared scope; plan quota uses **`usage.photos`** (Business-wide).
  - **RU/KK** strings via **`locale.ts`**; no backend/schema changes.
- **Deferred:** Flutter **`effectiveMedia`** consumption, Admin/Consumer Web, reorder, explicit branch cover UI.
- **Next:** mobile detail/gallery wiring to **`effectiveMedia`**.

---

## 2026-09-22 — Stage 6.12A.7.7.3 effective public media contract

- **Status:** 6.12A.7.7.3 IMPLEMENTED — READY FOR OWNER/UI INTEGRATION (Flutter/Business Web not in this stage).
- **Checkpoint (implementation):** `bd3136d867670d4bbe107c3635f98f7d6a061544`.
- **Summary:**
  - **`effectiveMedia`** on **`GET /businesses/:id?locationId=`** — active branch + shared brand images only; branch-first ordering; read-only branch hero **`coverImageUrl`**; uses same active-location resolver as **`effectivePhysical`**.
  - **`GET /businesses/:id/photos?locationId=`** — same resolver/ordering; legacy **`/photos`** without query stays Business-wide.
  - **Single helper:** `business-effective-media.util.ts` shared by detail + photos; moderation → order → plan cap unchanged Business-wide.
  - **Legacy preserved:** top-level **`coverImageUrl`**, **`galleryPreview`**, **`/photos`** without `locationId`.
- **Deferred:** Flutter/Business Web/Admin/Consumer UI wiring — **A.7.7.4+**; explicit branch cover column — not this stage.
- **Next:** client integration against **`effectiveMedia`**.

---

## 2026-09-22 — Stage 6.12A.7.7.2 branch media management + public moderation

- **Status:** 6.12A.7.7.2 IMPLEMENTED — READY FOR A.7.7.3 (public branch gallery).
- **Checkpoint (implementation):** `917b6e62a4d572013215ed4a0fa10f372c7c608d`.
- **Summary:**
  - **Attach/list:** optional **`locationId`** on `POST /uploads/business/:businessId`; validated same-business; **`asCover`** only for shared (`locationId` null); management list filters `scope=all|brand` or `locationId`.
  - **Brand cover:** delete repoint and set-cover use **shared images only**; branch rows cannot set **`Business.coverImageUrl`**.
  - **Public safety:** **`galleryPreview`** and **`GET /businesses/:id/photos`** exclude **`moderationHidden`** before plan cap (owner management list unchanged).
  - **Plan limits:** remain Business-wide (shared + branches).
- **Deferred:** **`effectiveMedia`**, branch-aware public gallery merge, branch hero — **A.7.7.3**.
- **Next:** A.7.7.3 public branch media resolution.

---

## 2026-09-22 — Stage 6.12A.7.7.1 branch media data foundation

- **Status:** 6.12A.7.7.1 IMPLEMENTED — READY FOR A.7.7.2 (API/read path).
- **Checkpoint (implementation):** `5cda615e9175f4792058c3bf7483d79b8839ba94`.
- **Summary:**
  - **Schema:** nullable **`BusinessImage.locationId`** — `null` = shared/brand image; non-null = scoped to **`BusinessLocation`**.
  - **Integrity:** composite FK **`(businessId, locationId)` → `BusinessLocation(businessId, id)`**; **`@@unique([businessId, id])`** on locations; **`ON DELETE RESTRICT`** on branch (no silent promotion to brand).
  - **Migration:** all existing rows remain **`locationId = NULL`**; counts preserved.
  - **Tests:** runtime integrity spec (shared, same-business branch, cross-business reject, Business cascade, location RESTRICT).
- **Deferred (A.7.7.2):** upload/attach `locationId`, public **`moderationHidden`** filter, **`effectiveMedia`** / scoped gallery — **no public API behavior change in 7.7.1**.
- **Next:** A.7.7.2 scoped management + public read path.

---

## 2026-09-22 — Stage 6.12A.7.6 effective physical contract (Business detail)

- **Status:** 6.12A.7.6 PHYSICAL QA PASS — STAGE CLOSED, READY FOR A.7.7.
- **Checkpoint (implementation):** `63a0c46de62be31ca00530611ba27cd751e067cf`.
- **Summary:**
  - **API:** additive `GET /businesses/:id?locationId=`; response **`activeLocationId`** + **`effectivePhysical`** (server resolver; invalid/foreign `locationId` → primary fallback, no cross-business leak).
  - **Flutter detail:** consumes **`effectivePhysical`** for address/route/mini-map/contacts/hours/open status; **`Business.id`** unchanged for favorites/reviews/brand sections.
  - **Consumer Web:** shared DTO typing extended (additive); F.4 branch SEO pages not started.
  - **Physical QA (Samsung SM-J610FN / Android 10):** map → Bar Code 51 (`cmpn1wnq1000iult8yj6a06q7`) → L2 (`cmubk34fk0001uls458d1nta9`) → full detail PASS — L2 remained active; top address L2/Абая (not primary L1); schedule/status, phone, route, WhatsApp, website, Instagram actions confirmed. Path: **`locationId` → detail API → `effectivePhysical` → Flutter physical context**.
  - **Unchanged (by design):** gallery/catalog/promotions/reviews/favorites remain **Business-grain**; branch media/catalog not location-aware.
  - **QA fixture:** L2 retained for A.7.7+ multi-branch testing (local A.1/A.2 exact-count tests may still fail — not modified).
- **Deferred:** branch-level media/catalog/promotions/reviews/favorites grain (A.7.7+ / F.4).
- **Next:** 6.12A.7.7 (per roadmap).

---

## 2026-09-22 — Stage 6.12A.7.4 FINALIZED (multi-branch map physical QA)

- **Status:** 6.12A.7.4 FINALIZED — READY FOR A.7.6 EFFECTIVE PHYSICAL CONTRACT.
- **Checkpoint (implementation/cleanup):** `eb48d4860e77e109a58286f25574a0894ee73625` (changelog + A.7.4 closure; A74MAP never committed, removed from working tree before finalize).
- **Summary:**
  - **Physical QA (Samsung SM-J610FN):** native MapLibre business layer confirmed; one Business → multiple **BusinessLocation** markers (Bar Code 51 L1+L2); map fetch → parse → state → GeoJSON → source/layers pipeline observed (16 viewport features in instrumented run).
  - **Hotfix 2:** `GET /businesses/:id/locations/public` route shadowing fixed (`cd66f7d8`); unauthenticated public branches list returns L1+L2.
  - **Cleanup:** temporary `[A74MAP]` runtime instrumentation removed from Flutter; local capture `infra/local-backups/samsung-a74map-logcat.txt` retained uncommitted.
  - **QA fixture:** L2 `cmubk34fk0001uls458d1nta9` intentionally retained for A.7.6+ branch QA (may skew local A.1/A.2 exact-count tests — not weakened in this stage).
  - **Deferred:** effective physical contract for detail (hours/socials/media/catalog/promotions branch-aware) → **A.7.6+**; A.7.5 branch content architecture audit PASS (read-only, no commit); F.4 / full branch content not complete.
- **Next:** 6.12A.7.6 effective physical contract (backend DTO + client wiring).

---

## 2026-09-22 — Stage 6.12A.7.4 Hotfix 2 (public locations route shadowing)

- **Status:** 6.12A.7.4 HOTFIX 2 IMPLEMENTED — READY FOR SAMSUNG DETAIL RE-QA (backend restart on LAN API).
- **Checkpoint (implementation):** `cd66f7d8` (see git `cd66f7d…`).
- **Summary:**
  - **Root cause:** `GET /businesses/:id/locations/public` was shadowed by authenticated `GET :businessId/locations/:locationId` (`locationId = "public"`) → mobile `businessPublicBranchesProvider` never received L1+L2 → detail fell back to primary address despite correct `locationId` query.
  - **Fix:** register `@Public() @Get(':id/locations/public')` **before** dynamic location routes in `businesses.controller.ts`; URL unchanged.
  - **Tests:** HTTP/controller regression (`stage-6-12a7-4-public-locations-http.spec.ts`) — unauthenticated 200 + L1/L2 ids; protected single-location 401; optional QA DB fixture assertion.
- **Mobile:** no Flutter changes; installed APK at `1cd345b…` sufficient after backend fix (no rebuild required for this hotfix).
- **Deferred:** Samsung physical detail re-QA; QA L2 cleanup after acceptance; fixture geocode label mismatch.
- **Next:** Samsung map L2 → detail re-QA on `192.168.8.101:3002`.

---

## 2026-09-22 — Stage 6.12A.7.4 Physical QA hotfix (category map + branch detail)

- **Status:** 6.12A.7.4 HOTFIX IMPLEMENTED — READY FOR SAMSUNG PHYSICAL RE-QA.
- **Checkpoint (implementation):** `1cd345b8` (see git `1cd345b…`).
- **Summary:**
  - **Category map:** GeoJSON/native layer uses **`mapLayerItems`** (`lastFetchBounds`) so multi-branch businesses are not hidden by tighter **`visibleBounds`** after category scope entry.
  - **Detail handoff:** optional query **`locationId`** on `/business/:id`; branch address/route/coordinates via public locations + **`resolveActiveBusinessPhysicalContext`**; reviews/favorites stay **Business.id**.
  - **Tests:** catalog-api category map row assertion hardened; Flutter **850** passed; focused map/detail tests added.
- **Deferred:** physical re-QA on Samsung; native layer dart-define build hardening; QA fixture geocode label mismatch.
- **Next:** Samsung physical re-QA; L2 cleanup after acceptance.

---

## 2026-09-21 — Stage 6.12A.7.2 Flutter map BusinessLocation marker identity

- **Status:** 6.12A.7.2 PASS — READY FOR A.7 AUTOMATED REGRESSION / PHYSICAL QA GATE.
- **Checkpoint (implementation):** `ab48d0421939d49a48c3c828672c5af3cfdb8dcf`.
- **Summary:**
  - **Flutter map:** physical marker identity = **`locationId`** (fallback `id` for legacy rows); **`BusinessModel.id`** remains **Business.id** for detail/reviews/favorites/analytics.
  - **State / GeoJSON / selection:** `byLocationId` storage, merge/dedup by physical key; `Feature.id` + `properties.locationId` = physical key; `properties.businessId` = Business.id; preview and directions use selected location row.
  - **Unchanged:** backend A.7.1; MapLibre/style; geocoding; web apps; reviews/favorites scope.
- **Tests:** Flutter **845** passed, **0** failed; `flutter analyze` **184** issues, **0** errors; debug APK build PASS.
- **Deferred:** physical multi-branch map QA on device; optional analytics `locationId`.
- **Next:** A.7 automated regression / physical QA gate.

---

## 2026-09-21 — Stage 6.12A.7.1 BusinessLocation map viewport backend cutover

- **Status:** 6.12A.7.1 PASS — READY FOR A.7.2.
- **Checkpoint (implementation):** `0d8a772ceeb6133a2cbe7ce3f59e9877628c5bf4`.
- **Summary:**
  - **`GET /businesses` + `forMap=true` + bbox:** PostGIS grain switches to **`BusinessLocation.location`** joined to parent **`Business`**; one list row per qualifying branch.
  - **Contract:** **`id`** remains **Business.id**; additive **`locationId`** = **BusinessLocation.id**; branch physical fields (`cityId`, address, coordinates, contacts, `workHours`) from location row; brand/taxonomy/status/plan display from Business.
  - **City filter (map viewport):** **`BusinessLocation.cityId`** (branch city).
  - **Unchanged:** nearest/radius/search/category **Business-grain** discovery; Flutter map marker identity (**A.7.2**); MapLibre/style; geocoding; schema/migrations; ads/plans/reviews/favorites scope.
- **Tests:** catalog-api Jest **1046** / **148** suites (incl. `stage-6-12a7-1-map-location-viewport` **10** cases); prior 6.11C geo suites PASS.
- **Deferred:** A.7.2 Flutter GeoJSON/selection/route cutover; optional discovery location-grain migration (product decision).
- **Next:** 6.12A.7.2 Flutter map marker identity.

---

## 2026-09-21 — Dev CORS: LAN 172.x for physical-device web

- **Status:** local-dev only.
- **Summary:** catalog-api development CORS now allows `http://172.x.x.x` origins (plus existing localhost / 192.168 / 10.x) and explicit `CORS_ORIGINS`, so Flutter web on a LAN IP works from a phone. Production still uses the allow-list only.
- **Files:** `services/catalog-api/src/main.ts`.
- **Deferred:** none.

---

## 2026-09-21 — Stage 6.12A.6 BusinessLocation Flutter & Consumer client integration

- **Status:** 6.12A.6 PASS — READY FOR A.7.
- **Checkpoint:** `fc13f679df138a92e122e1a7ea9ab7fdc78a67b6`.
- **Summary:**
  - **Public read:** `GET /businesses/:id/locations/public` (`@Public`, ACTIVE business only); `PublicBusinessLocationResponseDto` (no timestamps/provenance); management mutations stay authenticated.
  - **Flutter:** `BusinessBranchLocation`, public fetch, consumer detail **Филиалы** when multiple branches; legacy Business top-level fields unchanged; map unchanged.
  - **Consumer Web:** typed client + branch section on temporary `/businesses/[id]`; F.3 noindex preserved; no F.4 SEO URLs.
  - **Docs / AI context:** A.6 strategy; F.3, shared APK/Web data, full advertising future architecture in `docs/ai-project-context.md`.
  - **Unchanged:** discovery/search/category, map/PostGIS, Business Web owner UX, Admin read-only panel, ads implementation.
- **Tests:** catalog-api Jest **1036** / **147** suites (incl. `stage-6-12a6-public-locations`); Flutter `business_branch_location_test`; Consumer Web vitest **58** PASS.
- **Build:** Consumer Web `next build` PASS; Flutter analyze on new widgets PASS.
- **Database:** test fixtures cleaned in specs; production baseline unchanged unless noted in report.
- **Deferred:** A.7 map cutover; F.4 public business pages; location DELETE.
- **Next:** 6.12A.7 map/PostGIS cutover.

---

## 2026-09-21 — Stage 6.12A.5 BusinessLocation owner & admin management UX

- **Status:** 6.12A.5 PASS — READY FOR A.6.
- **Checkpoint:** `d8904a7472d5501e9bb8cf7d272e2aa8f1886b89`.
- **Summary:**
  - **Business Web:** `/business/[id]/locations` (“Филиалы” nav); list/create/edit/set-primary via A.4 endpoints; cross-city city selector from `listCities()`; reuses `BusinessLocationField`; **`isPrimary`** badge; confirm before set-primary; **`refreshBusinesses`** after primary switch / primary edit; **no DELETE**.
  - **Admin Web:** read-only branch list on approved application detail (`BusinessLocationsReadonly`); staff uses same locations list API; **no admin edit UI**.
  - **Docs:** `business-location.md` A.5 section; **`docs/ai-project-context.md`** + AGENTS maintenance note.
  - **Unchanged:** catalog-api backend, consumer-web, map/PostGIS, Flutter, ads, public discovery.
- **Tests:** business-web vitest (incl. `business-locations`, nav localization); admin-web vitest **53** PASS; business-web **build PASS**; admin-web **build PASS**. Pre-existing business-web hardcoded-UI guard failures on `reviews/page.tsx` (not A.5 scope).
- **Database:** persistent branches not created for demo; baseline **31/31/31** unchanged.
- **Deferred:** A.6 Flutter; A.7 map; location DELETE/archive; F.4 public branch URLs.
- **Next:** 6.12A.6 client consumption (Flutter).

---

## 2026-09-21 — Stage 6.12A.4 BusinessLocation management API

- **Status:** 6.12A.4 PASS — READY FOR A.5.
- **Checkpoint:** `d5958ba5e6623c35deabf8f0b28df04ba89400cc`.
- **Summary:**
  - Authenticated management API: list/get/create/patch locations under `/businesses/:businessId/locations`; **`POST …/set-primary`** for explicit primary switch.
  - Cross-city secondaries supported; create leaves legacy `Business` unchanged; primary PATCH / set-primary / legacy Business PATCH keep **bidirectional** physical sync (A.3 services extended).
  - Permissions: existing `BUSINESS_PROFILE_EDIT` / `BUSINESS_HOURS_EDIT`; BusinessMembership remains **Business-scoped** (no branch managers).
  - **DELETE/archive deferred**; public discovery/map unchanged (primary `Business` fields only).
  - **No schema migration**; Prisma validate/generate/migrate up to date (41 migrations).
- **Tests:** catalog-api Jest **1032** / **146** suites (incl. `stage-6-12a4-business-location-crud`); local DB integrity baseline **31/31/31**.
- **Deferred:** A.5 owner/admin location UX; discovery/map cutover; location DELETE/archive.
- **Next:** 6.12A.5 location management UX.

---

## 2026-09-21 — Stage 6.12A.3 primary location compatibility layer

- **Status:** 6.12A.3 PASS — READY FOR A.4.
- **Checkpoint:** `43fe98742a09ce8443f4bee6e5af25f64631d913`.
- **Summary:**
  - **`BusinessPrimaryLocationService`**: resolve primary (`isPrimary` only), `createInitialPrimary`, `syncPrimaryFromBusinessRecord`; synchronized physical fields on legacy writes.
  - **Production creates:** admin import (`BusinessesService.create`) and business-application **approval** atomically create **Business + one primary BusinessLocation** (deterministic id aligned with A.2 backfill).
  - **Owner PATCH `/businesses/:id`:** physical-field patches update Business and primary location in **one transaction**; brand-only patches skip location writes; partial PATCH semantics preserved.
  - **Public API unchanged** — list/detail still read top-level **Business** physical fields; **map** still uses **`Business.location`**; no location CRUD endpoints.
  - **Prisma generate:** PASS after stopping local `catalog-api` dev processes (Windows EPERM on `query_engine-windows.dll.node`); validate + migrate status up to date; **no new migration**.
- **Tests:** catalog-api Jest **1018** / **145** suites (incl. `business-primary-location.service`, `stage-6-12a3-business-location-sync`); local DB integrity **31/31/31**, missing/multi primary **0**.
- **Deferred:** A.4 BusinessLocation CRUD + multi-branch public contracts.
- **Next:** 6.12A.4 location-aware APIs.

---

## 2026-09-21 — Stage 6.12A.2 BusinessLocation 1:1 backfill

- **Status:** 6.12A.2 PASS — READY FOR A.3.
- **Checkpoint:** `1477d77d84e674a946798cc32e327568b1b50dae`.
- **Summary:**
  - Idempotent migration **`20260921190000_stage_6_12a2_business_location_backfill`**: one **primary** `BusinessLocation` per existing `Business` (physical fields copied; geography via location trigger).
  - **No `Business` row updates**; APIs/map still read legacy `Business` physical columns.
  - Local integrity: **31** businesses → **31** locations, **31** primary; field/geo parity **0** mismatches; partial/invalid coords **0**.
  - **Gap until A.3:** new Business creates (application approval, admin import) do not auto-create locations.
- **Tests:** catalog-api Jest **1005** (incl. `stage-6-12a2-business-location-backfill`); migrate status up to date.
- **Deferred:** A.3 compatibility read/write + primary sync on create/update.
- **Next:** 6.12A.3 compatibility layer.

---

## 2026-09-21 — Stage 6.12A.1 BusinessLocation database foundation

- **Status:** 6.12A.1 PASS — READY FOR A.2.
- **Checkpoint:** `e4734968e66056110445f274c71ec0124e22cf65`.
- **Summary:**
  - Additive **`BusinessLocation`** model (1:N under `Business`): city, address, coordinates, `locationSource`, `workHours`, contacts, **`isPrimary`** with partial unique index.
  - PostGIS foundation: geography column, isolated sync trigger, GiST index; **map/catalog still use `Business.location`**.
  - **No backfill** — table empty until A.2; legacy **`Business` physical fields unchanged**; no public API/DTO/client changes.
  - Docs: `docs/architecture/business-location.md`; api-contracts internal note.
  - Local migration history: reconciled orphan E.5 record + applied `20260921160000_stage_6_11e5_push_device` before A.1 migrate.
- **Tests:** catalog-api Jest **999** (incl. `stage-6-12a1-business-location-foundation`); `prisma validate` OK; migrate status up to date.
- **Deferred:** A.2 1:1 backfill + primary rows; location APIs; map cutover; F.4 URLs.
- **Next:** 6.12A.2 backfill + primary location invariants.

---

## 2026-09-21 — Stage 6.12A.0 BusinessLocation architecture audit

- **Status:** 6.12A.0 AUDIT PASS — READY TO DESIGN A.1.
- **Checkpoint:** none (read-only audit; recorded at A.1 closure).
- **Summary:** Repository audit — Business = brand + embedded place; 1→N `BusinessLocation` target; reviews/favorites/membership/plans stay on Business for MVP; map cutover isolated; primary-location compat strategy. Full findings in session A.0 report.
- **Next:** 6.12A.1 additive schema.

---

## 2026-09-21 — Stage 6.11F.3 SEO infrastructure

- **Status:** 6.11F.3 PASS — READY FOR 6.12A.
- **Checkpoint:** `ed67a6f07a955f7bf51d00f64d3699340171f2ae`.
- **Summary:**
  - Canonical origin via `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` / `getConsumerWebOrigin()`; `buildCanonicalUrl()` for city/category/subcategory paths and pagination (`?page=N` when N > 1).
  - Root + discovery **metadata** (RU/KK from cookie), Open Graph / Twitter basics; **search** and temporary **`/businesses/{id}`** → `noindex, follow` (no fake business canonical).
  - **`app/robots.ts`**: allow public discovery, disallow `/businesses/`, sitemap URL; **`app/sitemap.ts`** from `GET /cities`, `GET /categories?citySlug=`, subcategories (no search/legacy/business ID routes).
  - JSON-LD: **WebSite** (root), **BreadcrumbList** on categories/category/subcategory; visible breadcrumbs; React `cache()` dedupe for catalog fetches.
  - Docs: `docs/architecture/public-consumer-web.md` (F.3 section); locale-neutral canonicals — **hreflang deferred to F.5**.
- **Tests/build:** consumer-web vitest **56**; `check:ui-strings` OK; `next build` OK (`/robots.txt`, `/sitemap.xml` routes present).
- **Deferred:** final business/branch canonical URLs (**6.12A** + **F.4**); hreflang/locale URLs (**F.5**); LocalBusiness / SearchAction schema; OG image assets (**F.7/F.8**).
- **Next:** **6.12A BusinessLocation** (not F.4 yet).

---

## 2026-09-21 — Stage 6.11F.2 City & category discovery

- **Status:** 6.11F.2 PASS — READY FOR F.3.
- **Checkpoint:** `7f84e30baae743605f6c82d249bec6b789042c86`.
- **Summary:**
  - City-aware routes: `/{citySlug}`, `/{citySlug}/categories`, `/{citySlug}/{categorySlug}`, `/{citySlug}/{categorySlug}/{subcategorySlug}`, `/{citySlug}/search?q=`.
  - Root `/` permanent redirect → `/uralsk`; legacy `/categories` + `/categories/[id]` → default city slug routes.
  - Reserved segments (`categories`, `search`, …); category resolution server-side from public city category list; invalid city/category/subcategory → 404.
  - City switcher from `GET /cities`; search GET form; pagination `?page=`; public business cards → temporary `/businesses/{id}` links.
  - Search route `force-dynamic`; catalog routes keep F.1 ISR policy.
- **Tests/build:** consumer-web vitest **40**; `check:ui-strings` OK; `next build` OK.
- **Deferred:** SEO metadata/robots/canonical (F.3); business slug URLs (6.12A + F.4); locale URL prefixes (F.5).
- **Next:** 6.11F.3 SEO infrastructure.

---

## 2026-09-21 — Stage 6.11F.1 Public Web foundation

- **Status:** 6.11F.1 PASS — READY FOR F.2.
- **Checkpoint:** `18ff50ce92faf2b44a5f9768d668b513869ba658`.
- **Summary:**
  - Public **PublicShell** (nav, footer legal links via `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL`), Montserrat + design tokens (`--blue`, `--accent`).
  - Central **public-config**, **cache-policy** (ISR-friendly fetches; layout `revalidate = 60`; removed page `force-dynamic`).
  - Root **`npm run dev:consumer`**; `start-all.ps1` + CORS/env examples for port 3005.
  - Docs: `docs/architecture/public-consumer-web.md`; consumer-web README; `.gitignore` for `.next`.
  - Tests: consumer-web **30** vitest; `check:ui-strings` OK; **next build** OK.
- **Deferred:** city/category slug routes (F.2), SEO metadata/sitemap (F.3), rich business pages until after **6.12A**, legal pages on public host (F.7).
- **Next:** 6.11F.2 City/category discovery.

---

## 2026-09-21 — Stage 6.11F.0 Public Web / SEO / Deep Links architecture audit

- **Status:** 6.11F.0 AUDIT PASS — ROADMAP REORDER REQUIRED (read-only; **no commit**).
- **Checkpoint:** `ec633c4dd1acf773b3d8ebd0b0152b1f6630ec8f` (unchanged; audit at accepted 6.11E HEAD).
- **Summary:**
  - Preserve and extend `apps/consumer-web` (Next.js 15 App Router); do not spawn a second public site.
  - Consumer web = partial discovery MVP (categories + minimal business); public catalog API sufficient for SSR without JWT.
  - Slugs exist in DB (City/Category/Business); web routes still use internal IDs; no RU/KK SEO URL architecture; no Universal/App Links.
  - Final public business/branch URL architecture **deferred until Stage 6.12A BusinessLocation**.
- **Roadmap (approved order):** F.1 → F.2 → F.3 → **6.12A** → F.4 → F.5 → F.6 → F.7 → F.8.
- **Next:** 6.11F.1 Public Web foundation.

---

## 2026-09-21 — Stage 6.11E.6 notifications final QA & release gate

- **Status:** 6.11E.6 AUTOMATED PASS — **IN-APP NOTIFICATIONS FINALIZED**; live FCM/APNs **not** physically verified.
- **Checkpoint:** `ec633c4dd1acf773b3d8ebd0b0152b1f6630ec8f`.
- **Verified (automated):** Single architecture (`NotificationsService` + post-commit push); backend/Flutter notification test suites; Firebase-less debug APK build.
- **Documented:** `docs/architecture/notifications-final-architecture.md` (canonical in-app notification, external Firebase gate).
- **Physical QA closure (Samsung, in-app — post-commit, no separate product commit):** inbox RU/KK; read/unread; badge; structured `NEW_REVIEW` navigation (dev fixture); Back navigation; legacy NULL-target rows remain mark-read only; Mark All Read; refresh/pagination; map regression smoke. **Live production push delivery not tested.**
- **Deferred / debt:** push via best-effort post-commit `setImmediate` (no durable outbox); no push preferences; server-side background push locale TBD; local Prisma migration-history drift around obsolete E.5A migration name — reconcile before `migrate deploy`; Firebase/APNs provider config + live delivery QA = external production gate.
- **Next:** 6.11F.0 (completed) → 6.11F.1.

## 2026-09-21 — Stage 6.11E.5 push readiness & device registration

- **Checkpoint:** `c7d2ee37e88a0758e5994961eb0f263424d9eb14`.
- **Added:** `PushDevice` model; `POST/DELETE /notifications/devices`; FCM delivery abstraction (`PUSH_ENABLED`, Noop vs Firebase Admin); post-commit push dispatch (never inside Prisma transactions).
- **Added:** Flutter `firebase_core` / `firebase_messaging` foundation, token register/revoke on auth lifecycle, push tap → E.4 navigation whitelist.
- **Requires external config:** Firebase project (`google-services.json`, `GoogleService-Info.plist`, service account); Apple Push capability / APNs key for iOS live delivery.
- **Deferred:** preference center, marketing/guest push, delivery outbox analytics (E.6+).

## 2026-09-21 — Stage 6.11E.4 notification routing & deep links

- **Checkpoint:** `d337b8f8a20742d8d655f420ec12d02823897af4`.
- **Added:** Central `resolveNotificationDestination` + `navigateNotificationDestination` for typed in-app routes from `type`/`targetType`/`targetId`.
- **Changed:** Inbox tap marks read (optimistic) then pushes canonical consumer/owner screens; double-tap guard; entity-unavailable snackbar.
- **Deferred:** push/FCM (E.5); Web deep links.

## 2026-09-21 — Stage 6.11E.3 notification inbox UX & localization

- **Checkpoint:** `47a3b42b492f91338013223ebd0fc7c7cb81f427`.
- **Added:** Flutter `NotificationPresentation` layer (type + payload → RU/KK templates); shared paginated inbox (`NotificationsInboxBody`) for consumer and owner.
- **Changed:** Inbox pagination (20/page, load-more, refresh, empty/error/retry states); unread styling; mark read / mark all with optimistic rollback; badge refresh via `unreadNotificationsProvider`.
- **Deferred:** notification tap navigation (E.4); push (E.5); Business Web full localized rendering.

## 2026-09-21 — Stage 6.11E.2 notification domain producers

- **Checkpoint:** `3c5b545866c55961f8eb95061826dfcf0b0210a7`.
- **Added:** Review alerts to membership-aware recipients; moderation `REVIEW_HIDDEN` / `REVIEW_RESTORED`; explicit application/claim/invitation/ad types.
- **Changed:** Plan expiry notification guarded by conditional tier transition (`updateMany` count).
- **Docs:** `docs/architecture/notification-producers.md` producer matrix.

## 2026-09-21 — Stage 6.11E.1 notifications data & API integrity

- **Checkpoint:** `3e80b0e56ec8cf42b1e36486ea44d4d17cc6a720`.
- **Note:** No separate **6.11E.0** substage commit or doc in repository; notification series begins at E.1.
- **Added:** `NotificationTargetType`, optional `targetType` / `targetId` / `payload` on `Notification`; index `(userId, createdAt DESC)`.
- **Changed:** `GET /notifications` returns paginated `{ items, pagination }` (default limit 20, max 50); stable mark-read DTOs.
- **Fixed:** Notification creation participates in Prisma transactions for business applications and ownership claims.
- **Changed:** Existing producers attach structured targets for new rows; Flutter/Business Web consume paginated API and canonical `NEW_REVIEW` type labels.

## 2026-09-21 — Stage 6.11D.5 physical QA hotfix 1 (duplicate report UX)

- **Checkpoint:** `c6eda65aae55efbf38263f9897feb28b1ba83cf9`.
- **Fixed:** `ProductionExceptionFilter` now preserves `code` on HTTP exception responses so mobile receives `REPORT_ALREADY_SUBMITTED` on 409.
- **Fixed:** Shared `extractApiErrorCode` for Dio error parsing in review report flow.

## 2026-09-21 — Stage 6.11D.5 reviews & trust release gate

- **Status:** 6.11D.5 CODE PASS — Reviews & Trust series accepted for 6.11E (automated release gate).
- **Checkpoint:** `508f294be6f4367c3b795c96c7b5c974efc0ec89` (release blocker fix); hotfix `c6eda65…` (duplicate report UX).
- **Fixed:** `PATCH /reviews/:id/reply` no longer requires global `BUSINESS` role; USER managers with `REVIEWS_REPLY` reach service membership checks (D.5 release blocker).
- **Verified:** DB invariants, automated test suites, map non-regression for D.1–D.4 scope.
- **Physical QA:** Dedicated Samsung closure entry for reviews **not recorded** in repo docs; treat device QA as part of release gate unless a future stage adds explicit sign-off.

## 2026-09-21 — Stage 6.11D.4 consumer reviews UX & trust polish

- **Checkpoint:** `afb4592b8bd6da9ce4c9ebbbfe3ccef871dc1373`.
- **Added:** Flutter `/business/:id/reviews` paginated screen; Business Detail “all reviews” entry; shared consumer review card with company reply label.
- **Added:** Mobile create/edit/delete/report flows wired to D.1–D.3 APIs with RU/KK l10n and error-code mapping.
- **Changed:** Admin moderation case detail — removed dead manual status PATCH UI; status follows moderation actions.
- **Deferred:** immutable report snapshot; historical manager self-reviews cleanup.

## 2026-09-21 — Stage 6.11D.3 review moderation & reports workflow

- **Checkpoint:** `b30c9dcb63bd82ab9084c6d710d70270f782236d`.
- **Added:** Enriched `GET /admin/moderation/cases/:id` with linked reports, action history, and live `reviewTarget` state (business, reviewer, lifecycle, public visibility).
- **Added:** Required moderator `internalNote` for `REVIEW_HIDE` / `REVIEW_RESTORE`; admin case UI wired to record actions with confirmation and loading states.
- **Changed:** `POST /reports` for `REVIEW` rejects soft-deleted targets; moderation-hidden reviews remain reportable.
- **Changed:** Admin hard delete review writes `REVIEW_DELETE` audit before removal.
- **Added:** Business Web “report review” via generic `POST /reports`; Flutter `ContentReportRepository` foundation.
- **Deferred:** Immutable report-time review text snapshot; full consumer report UX (D.4).

## 2026-09-20 — Stage 6.11D.2 review lifecycle & abuse protection

- **Checkpoint:** `af052207443453d1428d05100860b9614a405d5b`.
- **Added:** `Review.deletedAt` soft delete; public predicate includes `deletedAt = null`.
- **Added:** `PATCH /reviews/:id`, `DELETE /reviews/:id`; POST restores soft-deleted row (same id; preserves `moderationHidden`).
- **Added:** Self-review block (`REVIEW_SELF_REVIEW_FORBIDDEN`); review mutation rate limits; audit `REVIEW_CREATE/UPDATE/DELETE/RESTORE`.
- **Changed:** Plain-text normalization (trim, NFC, max 2000); mobile profile edit/delete; rating-only reviews allowed on mobile.
- **Deferred:** admin moderation UI, consumer report UX, full reviews list screen (D.3/D.4).

## 2026-09-20 — Stage 6.11D.1 review data & rating integrity

- **Checkpoint:** `9d09c1fc8336e2319a6a7e32f378d21d322e34c1`.
- **Note:** No separate **6.11D.0** substage in repository.
- **Added:** `@@unique([userId, businessId])` and PostgreSQL CHECK `rating` 1..5 on `Review`.
- **Added:** Central public review filter (`moderationHidden = false`) for list, preview, counts, and aggregates.
- **Added:** `ReviewAggregationService`; business detail exposes authoritative `averageRating` / `reviewCount`.
- **Changed:** `GET /reviews` paginated envelope (`items`, `pagination`); duplicate create → 409 `REVIEW_ALREADY_EXISTS`.
- **Changed:** Flutter business detail header uses API rating/count (not preview average).
- **Deferred:** self-review block, soft delete, edit/delete, rate limits (Stage 6.11D.2+).

## 2026-09-20 — Stage 6.11C.6H PRE-CLOSURE FIX 1 map empty semantics + road widths

- Mobile: `EmptyCityView` on map uses `cityCatalogTotalProvider` (city-wide); viewport PostGIS total renamed to `viewportTotal` so empty viewport ≠ empty city.
- Mobile: QalaGo Light `line-width` scaling multiplies interpolate/step **stop outputs** only (MapLibre-valid; no `['*', zoom-expr, scale]`).
- Future: C.6H remains blocked until full closure checklist; no new backend city count API (reused lightweight catalog total).

## 2026-09-20 — Stage 6.11C.6F.2 FIX 3 public MapLibre style mutation

- Mobile: QalaGo Light merges live layer snapshots then uses public `MapLibreMapController.setLayerProperties` (no private `_maplibrePlatform` dynamic access; fixes Samsung NoSuchMethodError).
- Future: none; closes physical style-load failure from C.6G.

## 2026-09-19 — Stage 6.11C.6F.2 FIX 2 QalaGo Light legibility tuning

- Mobile: paint-only style updates (`skipNulls`) preserve Liberty line-width/text-field; stronger buildings; scaled road widths; safer street-label colors.
- Future: Samsung re-QA z14–18+ hierarchy.

## 2026-09-19 — Stage 6.11C.6F.2 FIX 1 street labels + housenumber stack

- Mobile: stop symbol-layer QalaGo Light paint (restores Liberty `text-field`); insert `qalago-housenumber` below `highway-name-*` anchor.
- Future: Samsung re-QA z14–18+ street vs housenumber hierarchy.

## 2026-09-19 — Stage 6.11C.6F.2 QalaGo Light style + house numbers

- Mobile: `QalaGoMapLightStyle` runtime paint on verified Liberty layers; `QalaGoMapHouseNumbers` symbol layer from OpenMapTiles `housenumber` (z16+, city-agnostic).
- Docs: `docs/mobile/qalago-map-light-style.md`.
- Future: physical Samsung visual QA; pinned production style after ops review.

## 2026-09-19 — Stage 6.11C.6F.1 commercial basemap POI suppression

- Mobile: `QalaGoMapBasemapHardening` runs once per MapLibre style load before native business layers; merges OpenFreeMap Liberty `poi_r1` / `poi_r7` / `poi_r20` filters with city-agnostic OpenMapTiles class/subclass commercial deny policy (transit/airport/housenumber untouched).
- Future: C.6F.2 QalaGo Light + house-number labels; C.6F full visual redesign.

## 2026-09-19 — Stage 6.11C.6E map selection and interaction parity

- Mobile: single `_selectedBusinessId` path for native tap, list, preview close; cluster tap clears stale preview; viewport/catalog selection reconciliation; Flutter semantics on preview/list/search.
- Limitation: native MapLibre circle markers are not individual Flutter semantics nodes (documented).
- Future: C.6F basemap/POI visual work.

## 2026-09-19 — Stage 6.11C.6D FIX 1 native cluster pipeline reliability

- Mobile: defer clustered GeoJSON source until features exist; per-layer install with retry; FIX1 constant cluster radius + Noto count labels; omit `clusterMinPoints` on wire (native default 2).
- Future: restore step radius tuning after physical PASS; C.6E/C.6F unchanged.

## 2026-09-19 — Stage 6.11C.6D native map business clustering

- Mobile: clustered GeoJSON source, cluster circle/count layers, cluster tap → `getClusterExpansionZoom` with fallback; C.6C individual/selected layers preserved.
- Future: basemap POI (C.6F), native a11y (C.6E).

## 2026-09-19 — Stage 6.11C.6C native unclustered map businesses

- Mobile: MapLibre CircleLayer business points, selection highlight layer, feature tap → MapScreen selection; overlay business pins hidden when `QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`. Source `cluster: false` until C.6D.
- Future: cluster layers/UX (C.6D), TalkBack on native points (C.6E), basemap POI suppression (C.6F).

## 2026-09-19 — Stage 6.11C.6B native map business layer foundation

- Mobile: `BusinessMapGeoJsonBuilder`, MapLibre `QalaGoMapBusinessLayerController`, clustered source config, `QALAGO_NATIVE_MAP_BUSINESS_LAYER` flag (default off). Overlay markers unchanged by default.
- Future: C.6C unclustered native rendering + taps; C.6D cluster UI; selection styling via GeoJSON `selected` property (not feature-state).

---

---

---

---

---

## 2026-09-19 — Stage 6.11C.5G.1: Explicit Search location UX

- Search radius (3/5/10/15 km) and nearest sort request user GPS via explicit permission flow; no city-center substitute for selected distance.
- Localized feedback for denied, deniedForever (open settings), and disabled location services.

## 2026-09-19 — Stage 6.11C.5F.1: PostGIS integration test isolation

- C.5C/C.5D runtime DB fixtures use Prisma interactive transaction client (`tx`) so rollback aborts writes; per-test slug-scoped `finally` cleanup as safety net.
- Future: optional dedicated integration DB if parallel Jest workers ever share mutable geo fixtures.

## 2026-09-19 — Stage 6.11C.5E: PostGIS map viewport bbox

- `forMap` + bbox: `ST_Intersects` on `Business.location` with SQL pagination; lat/lng API unchanged. No new index.

## 2026-09-19 — Stage 6.11C.5D closure: radiusKm filter independent of sort

- Explicit `radiusKm` + user geo applies PostGIS `ST_DWithin` for recommended/rating/popular/search, not only `sort=nearest`.

## 2026-09-19 — Stage 6.11C.5D: PostGIS nearest / radius catalog queries

- `GET /businesses` nearest path: SQL `ST_DWithin` + `ST_DDistance`, paginated in DB; lat/lng API unchanged. Map bbox still lat/lng (C.5E).

## 2026-09-19 — Stage 6.11C.5C: Business spatial location + trigger + GiST

- Migration: nullable `Business.location` geography(Point,4326), trigger `business_derive_location_from_coordinates`, backfill, partial GiST `Business_location_gist_idx`. Lat/lng remain authoritative; API unchanged. Docs: `docs/architecture/business-spatial-location.md`. C.5D/E query migration deferred.

## 2026-09-18 — Stage 6.11C.5B: PostGIS infrastructure (extension only)

- Docker dev/staging/prod compose: `postgis/postgis:16-3.4-alpine` (PG16); migration `CREATE EXTENSION IF NOT EXISTS postgis`; docs `docs/infra/postgis-local.md`. No `Business.location` yet (C.5C).

## 2026-09-18 — Stage 6.11C.5A: catalog geo query validation & baseline

- `GET /businesses`: hardened user geo pair + `radiusKm` rules, map bbox max viewport spans, server-side invalid stored coordinate filter for map/bbox; performance baseline documented for in-memory nearest (PostGIS deferred C.5B–D).
- Docs: `docs/architecture/catalog-geo-query.md`, `api-contracts.md`.

## 2026-09-18 — Stage 6.11C.4: MapLibre overlay marker camera sync (bridge)

- Mobile MapLibre: reproject Flutter overlay business pins during camera pan/zoom (`trackCameraPosition`, throttled `toScreenLocationBatch`, stale-result guard); catalog viewport fetch remains on camera idle only.
- Future: native GeoJSON/SymbolLayer + clustering (6.11C.6), not overlay polling at scale.

## 2026-09-18 — Stage 6.11C.4: DEV/QA MapLibre basemap (OpenFreeMap Liberty)

- Mobile: default MapLibre style URL changed from MapLibre `demotiles` demo to **OpenFreeMap Liberty** (`https://tiles.openfreemap.org/styles/liberty`) after physical QA on Samsung SM-J610FN (Android 10): demotiles showed blank geographic vectors; Liberty renders roads/buildings/labels on Map tab and business location picker.
- `QALAGO_MAP_STYLE_URL` dart-define override unchanged. MapLibre remains the default runtime renderer on device; `flutter_map` fallback unchanged.
- Attribution bar updated for OpenFreeMap / OpenMapTiles / OpenStreetMap (DEV style compliance).
- **Not** production basemap approval: public OpenFreeMap has no SLA; production provider decision remains deferred (6.11C+).

## 2026-09-18 — Stage 6.11C.4 hotfix: Geocoding city-boundary safety

- City model: `geocodingMin/MaxLat/Lng` for provider-neutral search bounds (uralsk, aktobe, shymkent seeded).
- Geocoding: MapTiler `bbox`, post-provider autocomplete filter, reverse + persistence validation against selected city.
- Mobile/Business Web: reverse geocoding passes `citySlug`; localized out-of-bounds picker error (RU/KK).
- Future: tune bounds per city from operator QA; PostGIS search remains C.5.

## 2026-09-18 — Stage 6.11C.4: Address geocoding and business location picker

- Backend: provider-neutral geocoding API (MapTiler or mock), application/business coordinate persistence, approval pipeline, validation — see `docs/architecture/geocoding.md`.
- Mobile: debounced address autocomplete, MapLibre center-pin location picker, BusinessApply + OwnerEdit integration (RU/KK l10n).
- Business Web: Leaflet location picker component, onboarding apply + business profile; Admin: application coordinate preview.
- Future: PostGIS search (6.11C.5); production MapTiler key and live KZ quality verification by operator.

## 2026-09-17 — Stage 6.11C.3: MapLibre business discovery hardening

- Mobile: viewport-aware map business loading (`MapBusinessesNotifier`) with camera-idle bounds, padded bbox fetch, multi-page dedupe (removes silent 100-business cap), stale-request protection, city/category scope invalidation, invalid-coordinate filtering.
- Map abstraction: `QalaGoMapBounds`, `readVisibleBounds()`, `onCameraIdle` on both MapLibre and flutter_map adapters; MapLibre disables rotate/tilt for overlay marker accuracy.
- Catalog API: optional `forMap` + bbox query params (`minLat`/`maxLat`/`minLng`/`maxLng`) — map-only non-null coordinate filter; search/list semantics unchanged when omitted.
- Future: native MapLibre symbol layers + clustering (6.11C.6), PostGIS bbox (6.11C.5), geocoding/location picker (6.11C.4).

## 2026-09-17 — Stage 6.11C.2: MapLibre renderer integration (Flutter)

- Added `maplibre_gl` ^0.27.1 behind existing QalaGo map abstraction; flutter_map OSM fallback retained.
- Renderer selection via `QALAGO_MAP_RENDERER` / `QALAGO_MAP_STYLE_URL` dart-defines; default MapLibre at runtime, flutter_map in widget tests.
- MapLibre markers use Flutter widget overlay projected with `toScreenLocationBatch` (same QalaGoMapMarker children as fallback).
- Default style: MapLibre demo tiles — development/QA only until production tile provider (6.11C+).

## 2026-09-17 — Stage 6.11C.1: Map provider abstraction (Flutter)

- Mobile: `core/map` SDK-neutral coordinate, camera, marker, controller, and `QalaGoMapView` with flutter_map OSM adapter.
- MapScreen and business detail mini-map refactored to abstraction; behavior unchanged.
- Future: MapLibre renderer behind same contract (6.11C.2); geocoding/location picker unchanged.

## 2026-09-17 — Stage 6.11B.6: Recent searches & catalog suggestions

- **Added:** Local recent search history (SharedPreferences, max 10, deduped, clear action) on empty Search; RU/KK strings.
- **Added:** In-client taxonomy suggestions (categories + one-time subcategory prefetch per city) with exact/prefix/contains ordering; tap commits canonical `GET /businesses?search=`.
- **Preserved:** 320ms debounce, pagination/generation guards, SEARCH analytics on committed searches only; no backend/API changes.
- **Deferred:** Service-item and business-title suggestions (no lightweight client vocabulary without new endpoint).

## 2026-09-17 — Stage 6.11B.5: Search relevance & DB pagination

- **Added:** Organic discovery (`sort=recommended`, no text query) uses PostgreSQL `ORDER BY title, id` with `skip`/`take` and separate `count` for `meta.total` (no full-city load for page 1).
- **Added:** Text search + recommended uses deterministic relevance tiers (exact/prefix/contains title → taxonomy → visible service title → description fields) before pagination; plan-neutral tie-break `title` + `id`.
- **Preserved:** Service-item eligibility via bounded visibility resolver + `OR id IN (...)` before pagination (6.11B.2); rating/popular/nearest remain in-memory with existing semantics.
- **Future:** DB-level relevance pagination for text search (raw SQL / indexed fields); PostGIS or aggregate columns for nearest/rating/popular at scale.

## 2026-09-17 — Stage 6.11B.4: Search filters, sorting & pagination

- **Added:** Consumer sort menu (recommended / nearby / rating / popular) mapped to `BusinessCatalogSort` API values; compact filters bar + bottom sheet (category, subcategory, radius).
- **Added:** Search pagination page size 20, load-more (scroll threshold + button), deduped append, next-page error/retry, `_loadMoreGeneration` stale-page guard.
- **Preserved:** 6.11B.3 generation/cancel semantics; SEARCH analytics on debounced query only (not per page).
- **Future:** DB relevance/pagination (6.11B.5); search history/suggestions (6.11B.6).

## 2026-09-17 — Stage 6.11B.3: Consumer mobile search UX & state

- **Added:** SearchScreen initial / continue-typing / active pane modes; min free-text length 2; localized empty hints and load-error copy (RU/KK).
- **Added:** Stale-result guard via fetch generation + verified results; Dio `CancelToken` on `businessesProvider` dispose; `suppressNetwork` idle queries.
- **Tests:** `search_screen_state_test.dart` (stale response, clear/filter in-flight, retry, keyboard submit, 320dp KK 2.0).
- **Future:** Sort UI + load-more (6.11B.4); search history/suggestions (6.11B.6); maps/geo UX (6.11C).

## 2026-09-17 — Stage 6.11B.2: Multilingual search integrity

- **Fixed:** Global `GET /businesses?search=` service-item matching now uses the same plan-cap + catalog sort as consumer catalog (two-query bounded resolver; no N+1).
- **Added:** Shared `public-catalog-service-items.util`; integration tests in `stage-6-11b2-search-integrity.spec.ts`.
- **Future:** DB-level list pagination/relevance (6.11B.5); SearchScreen UX (6.11B.3+).

## 2026-09-17 — Stage 6.11B.1: Search backend foundation

- **Added:** `GET /businesses?search=` multilingual catalog discovery (business fields, category/subcategory RU+KK, public service items RU+KK); query normalization util; max search length 100; per-business catalog search includes `titleKk` / `descriptionKk`.
- **Docs:** `api-contracts.md` search semantics.
- **Future:** DB-level pagination/relevance (6.11B.5); plan-tier catalog slot limits in global service-item match; SearchScreen UX (6.11B.3+).

## 2026-09-17 — Stage 6.11A.UI.10B.3: Android startup closure

- Pre-12 native splash: solid `#F7FAFC` only (no bitmap); removed unused splash wordmark PNG.
- City catalog: API failure falls back to existing offline taxonomy (onboarding no longer blocked).

---

## 2026-09-17 — Stage 6.11A.UI.10B.2: Android native splash scaling fix

- Trim opaque black canvas from native splash wordmark; inset-based ~30% width layout.
- Night-mode launch theme aligned to light `#F7FAFC` splash (no dark flash).

---

## 2026-09-17 — Stage 6.11A.UI.10B.1: Physical Android splash branding fix

- Remove default Flutter `ic_launcher` from native splash; pre-12 QalaGo wordmark on `#F7FAFC`.
- Android 12+ minimal primary-brand splash icon (compact symbol still deferred).
- Larger wordmark on Flutter startup surface and Welcome (~30–35% width).

---

## 2026-09-17 — Stage 6.11A.UI.10B: Launch experience & first-run (mobile)

- First-run Welcome (RU/KK) + city confirmation; onboarding version 1 in SharedPreferences.
- Branded startup surface (ReleaseShell + router `/startup`); approved wordmark in consumer headers.
- Passive location on Home (no automatic permission prompt); Android/iOS launch background alignment.
- Future: compact Android 12 splash symbol, store/adaptive icons.

---

## 2026-09-16 — Stage 6.11A.UI.6B: Favorites, Profile, Auth UI (mobile)

- **Changed**: Favorites/Profile/Login aligned to QalaGo design system; guest favorites/profile flows; empty favorites CTA to Categories; favorite remove analytics + error feedback; profile avatar on main card; logout confirmation; guest language + business entries; iOS Apple-before-Google provider order; neutral Google button (no unofficial logo art).
- **Changed**: `/profile/language` public for guest language selection (routing only).
- **Future**: UI.7+ polish; 6.11E notifications settings; provider activation external.

## 2026-09-16 — Stage 6.11A.UI.6B.1: Favorites / Profile / Auth QA closure (mobile)

- **Added**: Consumer tests for favorite remove success/failure analytics, OWNER/MANAGER/multi-business profile, auth flag matrix, redirect regression, logout confirm, and 320×KK×2.0 spot checks.
- **Fixed**: Profile/legal responsive overflow on narrow widths and large text (header, user card, menu/business rows, logout/delete actions).

## 2026-09-16 — Stage 6.11A.UI.5B.1: Business Detail visual closure (mobile)

- **Changed**: Hero, identity, and contacts blocks on Business Detail aligned to QalaGo tokens (overlay, 48dp hero controls, typography/spacing, informational contact rows).
- **Added**: Widget tests for primary intent layout (320 KK textScale 2.0 + additional widths) and minimal-detail regression.

## 2026-09-16 — Stage 6.11A.UI.5B: Business cards & detail intents (mobile)

- **Changed**: Shared `BusinessCard` with `standard`, `compactHorizontal`, and `compactVertical` layouts (QalaGo tokens, image placeholder, semantics); Home Nearby/Popular use compact variants; Popular decorative favorite removed.
- **Changed**: Business Detail primary intent row uses `Wrap` (no `FittedBox` on labels), 48dp targets, QalaGo styling.
- **Future**: UI.6 Favorites redesign; verified/public-data/report-error product+backend; category title locale on list payloads.

## 2026-09-16 — Stage 6.11A.UI.4F: Global Search UI/UX (mobile)

- **Changed**: Consumer `/search` layout aligned with Home/Categories (SafeArea, 20px rhythm, back + `QalagoSearchField`); category scope chip; honest result count when total &gt; loaded page; retain prior results while refetching; stale `SEARCH_PERFORMED` guard.
- **Future**: 6.11B search quality (relevance, KK/service indexing, pagination); optional recent searches product decision.

## 2026-09-16 — Stage 6.10D.2: Business Web UX / localization / discoverability

- **Changed**: User-visible «Сообщения» → «Уведомления» / «Хабарландырулар» (`/messages` route kept); notification dates use RU/KK locale formatting.
- **Fixed**: Organic promotion status tags, reviews count copy, onboarding city/rejection labels, plan Analytics 360 label, checkout RU-only fragments.
- **Added**: Permission-filtered sidebar entries for Media (`PHOTOS_EDIT`) and Reviews (`REVIEWS_REPLY`).
- **Future**: 6.10D.QA closure QA; remaining P2/P3 cabinet polish.

## 2026-09-16 — Stage 6.10D.1: Business Web mobile nav & error hygiene

- **Added**: Mobile drawer for existing `BusinessShell` sidebar below 900px (menu control, backdrop, Escape, route-close); RU/KK `shellOpenNavigation` / `shellCloseNavigation`.
- **Fixed**: P1 owner routes use centralized `parseApiError` / `mapLoginRouteError` with technical error sanitization in `parseApiErrorMessage`.
- **Future**: 6.10D.2 UX/localization/discoverability (messages rename, sidebar links, hardcoded RU cleanup).

## 2026-09-16 — Stage 6.10C.QA: Business cabinet closure QA

- **Business Web**: profile subcategory chips use `subcategoryDisplayName` (KK with RU fallback); regression tests.
- **6.10C**: cabinet completion block closed after 6.10C.1–6.10C.2 + targeted QA.

## 2026-09-16 — Stage 6.10C.2: Flutter owner subcategory profile parity

- **Flutter Owner**: subcategory multi-select on business profile edit via existing `GET /categories/:id/subcategories` and `PATCH subcategoryIds`; `BUSINESS_PROFILE_EDIT` gating; zero-subcategory empty state; profile PATCH omits `subcategoryIds` (separate save, Business Web parity).
- **Future**: 6.10C closure QA; maps/geolocation audit (6.11C.0).

## 2026-09-16 — Stage 6.10C.1: Business Web catalog & promotion edit parity

- **Business Web**: edit overlays for organic `ServiceItem` and `Promotion` via existing PATCH APIs; `CATALOG_EDIT` / `PROMOTIONS_EDIT` UX gating; semantic RU/KK keys; safe `parseApiError` on promotions mutations.
- **API**: manage menu item list includes `titleKk` / `descriptionKk` for owner prefill (additive response fields).
- **Future**: Flutter owner profile taxonomy parity (6.10C.2); remaining Business Cabinet P1 gaps from audit.

## 2026-09-15 — Stage 6.10B.QA: Cross-platform RU/KZ localization QA

- **Cities**: migration + seed backfill `shymkent.nameKk = Шымкент`; Flutter offline city taxonomy documents API-aligned fallbacks.
- **Defect fixes**: Flutter owner promotion limit snackbar → l10n; Business Web plan quota lines → semantic `locale.ts` keys (menu/promotions/media).
- **Docs**: glossary city rule; multilingual-content QA closure notes.
- **Future**: hash-like Business Web keys (bulk rename deferred); physical-device QA before release.

## 2026-09-15 — Stage 6.10B.6: Multilingual content model (RU/KZ data)

- **Schema**: optional `ServiceItem.titleKk/descriptionKk`, `Promotion.titleKk/descriptionKk`; City `nameKk` backfill migration for seeded cities; Business brand `title` unchanged.
- **API**: localized-content resolver; PATCH-isolated optional KK fields; city `nameKk` on business payloads.
- **Clients**: Flutter `localized_content.dart` + city display from API; Consumer Web home tagline from `/cities/:slug`; Business Web city chip.
- **Docs**: `docs/localization/multilingual-content-model.md`.
- **Future**: approved KK legal texts; search on KK business fields.
- **Closure (6.10B.6)**: owner KK fields (Flutter + Business Web create forms), consumer display resolver wired on Flutter; PATCH isolation tests; full backend regression.

## 2026-09-15 — Stage 6.10B.5: Business Web RU-KK localization

- **Business Web**: full owner-facing UI RU/KK via `apps/business-web/lib/locale.ts` (~500+ keys), `lib/presentation.ts` mappers, SSR `LocaleProvider` + `qalago_locale` cookie, language switcher in shell topbar and legal chrome.
- **Guard**: `lib/hardcoded-ui-guard.ts`, `npm run check:ui-strings`, `lib/i18n.test.ts`; legal page bodies (`terms`, `privacy`, `account-deletion`) allowlisted — RU legal text unchanged.
- **Future**: locale-prefixed URLs + hreflang (Stage 6.11F); KK legal copy; improve KK coverage for generated hash keys; ESLint CLI migration for `npm run lint`.

## 2026-09-15 — Stage 6.10B.4: Consumer Web RU-KK localization

- **Consumer Web**: centralized `UI_LABELS` in `apps/consumer-web/lib/locale.ts`; SSR `html lang`, localized metadata via `generateMetadata`, `qalago_locale` cookie unchanged.
- **Routes**: Home, categories, category/subcategory businesses, business detail, `not-found`, `error` chrome localized; category/subcategory `nameRu`/`nameKk` unchanged.
- **Guard**: `lib/hardcoded-ui-guard.ts`, `npm run check:ui-strings`, vitest coverage in `lib/i18n.test.ts`.
- **Future**: locale-prefixed URLs + hreflang (Stage 6.11F); Business Web (6.10B.5); `City.nameKk` content model.

## 2026-09-15 — Stage 6.10B.3: Owner / business cabinet RU-KK localization

- **Migrated**: `lib/features/owner` (dashboard, edit, gallery, menu, promotions, reviews, analytics, plan, settings, team, messages, help), monetization purchase UI, centralized `owner_l10n.dart` for plan tiers, statuses, permissions, ads products.
- **Guard**: `stage610b3ScanRoots` includes consumer + owner; removed broad `/owner/` and `monetization` exclusions.
- **Tests**: `test/owner/localization_stage_6_10b3_test.dart`; updated owner unit tests for `AppLocalizations` parameters.
- **Future**: multilingual business-authored content (City.nameKk, promotion/service copy); Business/Admin Web.

## 2026-09-15 — Stage 6.10B.2: Consumer UI l10n migration (map, business, profile, onboarding)

- **Migrated**: map, promotions, notifications, business catalog/photos/details, profile sub-screens, business onboarding flow, shared widgets (city picker, empty city, legal links, search field, business card), consumer ad widgets; `onboarding_errors` / `onboarding_labels` delegate to `onboarding_l10n`.
- **Guard**: `stage610b2ScanRoots` covers consumer `lib/features` (excl. owner/admin/monetization), `lib/core/auth`, `lib/core/release`, `lib/shared/widgets`, `lib/features/ads/widgets`; allowlist `dev_quick_login_panel`, `category_discovery_strings` only.
- **Tests**: `test/consumer/localization_stage_6_10b2_test.dart` (RU/KK keys, scanner, release/auth prompt samples).
- **Future**: owner/monetization cabinets; RBAC permission copy in `role_permissions`; city `nameKk` in pickers when API ready.

## 2026-09-14 — Stage 6.10B.1: Consumer mobile RU/KK localization foundation

- **Added**: Flutter `gen_l10n` (`app_ru.arb`, `app_kk.arb`), `context.l10n`, persisted locale (`qalago_ui_locale`), profile language screen, API/load error mapping, glossary, scoped hardcoded-string guard.
- **Localized (consumer)**: shell nav, home, categories discovery, profile/settings entry, login OTP/social shell, favorites shell, business detail primary actions (partial sections remain).
- **Future**: complete search/map/business-detail/reviews/promotions/onboarding strings; owner/monetization cabinet; city `nameKk` when API provides it; expand scanner roots.

## 2026-09-14 — Stage 6.10B: Category RU/KZ localization and consumer web parity

- Prisma `Category.nameRu` / `Category.nameKk` with migration backfill; `title` kept as legacy alias of `nameRu`.
- Public category API exposes `nameRu`, `nameKk`, `title`, `icon`, `iconUrl`.
- Flutter category labels use `displayName` + `appLocaleCodeProvider` (not hardcoded RU on category screens).
- Consumer Web: RU/KZ cookie locale, localized category/subcategory labels, category → subcategory → business list + minimal business detail route.
- Admin dashboard: edit category RU/KZ names; icon upload unchanged.

## 2026-09-14 — Admin Web: canonical TOTP MFA enrollment on `/mfa/setup`

- `/mfa/setup` and `/settings/security` use shared `StaffMfaEnrollment` (QR via `qrcode.react`, Authenticator TOTP, recovery codes once).
- Session restore via `POST /api/auth/refresh` when access token is memory-only; login honors `?next=/mfa/setup`.
- LOCAL mode: voluntary enrollment stays TOTP (not SMS); no redirect away from `/mfa/setup` when MFA is optional.
- Future: optional BFF proxy for enroll routes if CORS/cookie policy changes.

## 2026-09-13 — Stage 6.10A: Category icon system & home category UI

- Consumer API: `iconUrl` on categories/subcategories (alias of `icon`); ordering unchanged (`sortOrder`, city order).
- Mobile: home icon grid + «Ещё», all-categories and subcategory icon grids, safe fallbacks.
- Admin: category/subcategory icon upload & remove via hardened uploads pipeline.
- New `apps/consumer-web` for public category browsing (icon grid parity with mobile).
- Docs: `docs/catalog/stage-6-10a-category-icons.md`.

## 2026-09-13 — Stage 6.9.1.2: Staff MFA & SUPER_ADMIN recovery hardening

- TOTP MFA, encrypted secrets, recovery codes, login challenge, MFA step-up, admin reset, emergency CLI.
- Admin-web `/mfa/setup`, login MFA screen, `/settings/security`.
- Docs: `docs/security/staff-mfa.md`, `staff-mfa-recovery.md`.

## 2026-09-13 — Stage 6.9.2.1: Admin Reports UI & executive dashboard

- Admin-web `/reports/*` — KPI cards, filters (URL query), recharts, role-aware nav, export UX, no raw JSON for operators.
- Docs: `docs/admin/reporting-ui.md`.

## 2026-09-13 — Stage 6.9.2: Admin reporting & staff oversight foundation

- `REPORT_*` permissions in `@qalago/shared-types`; module `services/catalog-api/src/modules/admin-reporting/` (scope, query, read-only endpoints, CSV export).
- Admin-web `/reports` with role-filtered nav; docs `docs/admin/reporting.md`, `report-access-matrix.md`, `docs/security/staff-oversight.md`.
- **STAFF MFA still PENDING** — no MFA compliance metrics in staff reports.

## 2026-09-13 — Stage 6.9.1.1: Staff permission guard & step-up hardening

- `@RequireStaffPermission` / `@AdminStaffRoute` / `@RequireStaffStepUp` on staff admin controllers; legacy `updateUserRole` limited to USER/BUSINESS.
- JWT staff session binding (`sid`); disabled staff and revoked sessions fail access + refresh immediately.
- OTP step-up: `POST /auth/staff/step-up`, TTL **600s**; audit `STAFF_STEP_UP_VERIFIED`. **STAFF MFA PENDING.**
- Docs: `staff-step-up.md`, `staff-roles-inventory.md`, api-contracts staff section.

## 2026-09-13 — Stage 6.9.1: Staff RBAC & SUPER_ADMIN access foundation

- Added `StaffAccess`, `StaffCityScope`, extended `UserRole` staff roles, staff audit actions, migration `20260913030000_stage_6_9_1_staff_rbac`.
- Central permission registry in `@qalago/shared-types` (`staff-permissions.ts`); staff admin API `/admin/staff/*` (SUPER_ADMIN); admin-web `/staff`.
- Hardened bootstrap CLI + `StaffAccess` sync; payment confirm requires `PAYMENT_CONFIRM`; moderation business restore preserves pre-hide status.
- Docs: `docs/security/staff-rbac.md`, `super-admin-bootstrap.md`, `admin-access.md`.
- Future: MFA/step-up enforcement, broader `@RequireStaffPermission` on all admin routes.

## 2026-09-12 — Stage 6.9: Legal, safety & moderation foundation

- Backend: legal documents/acceptance, data-rights requests, content reports, moderation cases/actions/appeals, government requests & security incidents (SUPER_ADMIN), account deletion hardening (sessions, avatar, ownership code).
- Admin Web: moderation + legal admin sections; feature flags `legalCenterEnabled`, `reportingEnabled`, `dataRightsEnabled` (default OFF).
- Docs: `docs/legal/*`, `docs/safety/moderation-system.md`; **LEGAL_REVIEW_REQUIRED** for published policy text and retention law.

## 2026-09-12 — Stage 6.8D.1: Flutter regression suite closure

- Fixed stale `widget_test.dart` smoke: stub release gate + home providers so canonical Home search hint is reachable without live app-config network.
- Full Flutter suite green (331 tests).

## 2026-09-12 — Stage 6.8D: Google & Apple auth integration foundation

- Production architecture: server-side Google ID token and Apple identity token verification, `AuthIdentity` mapping, `issueQalaGoSession`, no email auto-linking, tombstone/inactive gates, rate limits, fail-closed prod config.
- Flutter: Google/Apple adapters, login UX gated by app-config + env + platform; Apple optional first-login display name; secure storage session unchanged.
- Docs: `docs/auth/stage-6-8d-google-apple-auth.md`, `provider-setup-checklist.md`, `provider-auth-threat-model.md`.
- **Integration foundation complete** — real Google/Apple login with production credentials and physical devices not verified in this stage.

## 2026-09-12 — Stage 6.8C.1.2: Category map scope fix

- Category → Map with «Все» now scopes by `categoryId` only; global bottom-nav Map stays city-wide.
- Feature flag OFF still applies category map scope; subcategory filter only when flag ON.

## 2026-09-12 — Stage 6.8C.1.1: Subcategory map integration closure

- Flutter Map reuses catalog `subcategoryId` when opened from category with a subcategory chip selected (flag ON); bottom nav clears ephemeral scope.
- Closure QA: avatar URL blocked on PATCH; regression specs; map unit tests.

## 2026-09-12 — Stage 6.8C.1: Subcategories & user profile photo

- Prisma: `Subcategory`, `BusinessSubcategory`, `User.avatarUrl`; idempotent seed taxonomy (RU/KK).
- Feature flag `subcategoriesEnabled` (global OFF); public/admin subcategory APIs; business filter `subcategoryId`.
- User avatar POST/DELETE `/users/me/avatar` with sharp WebP normalize and upload hardening.
- Mobile category chips + profile avatar; Admin/Business web taxonomy editors.
- Docs: `docs/catalog/stage-6-8c-1-subcategories-and-user-avatar.md`.
- Future: subcategory ad targeting, 6.8D OAuth avatars, enable flag per city rollout.

## 2026-09-12 — Stage 6.8C: Release architecture foundation

- Shared release types; semver/update-mode utilities; `GET /app-config` and `/version`.
- Prisma runtime config: release settings, feature flags, city overrides; maintenance guard.
- SUPER_ADMIN release APIs + audit; `QALAGO_ENV` with production fail-closed.
- Flutter: config cache, maintenance/required/optional screens, client version headers.
- Docs under `docs/release/*`.
- Future: admin UI for release settings, VPS/store rollout (7.x), OAuth flags (6.8D).

## 2026-09-11 — Stage 6.8B: Local security hardening

- Production fail-closed: weak secrets, DEV login, mock checkout, AI internal token, CORS wildcard.
- Auth: `AuthSession` refresh rotation (hashed tokens), short access JWT, logout/revocation APIs.
- Admin/Business Web: HttpOnly refresh cookie via Next BFF; access token memory-only.
- Mobile: secure storage for refresh; Dio refresh-on-401.
- AI orchestrator: token required (explicit dev open flag); tightened CORS; constant-time compare.
- Uploads: magic-byte validation, business-scoped uploads, rate limits.
- Redis-ready rate limit store; Helmet + production error filter; log redaction util.
- Docs: `docs/security/stage-6-8b-local-security-hardening.md`, backup/incident runbooks.
- Future: 6.8C infra/CSP, 6.8D OAuth hardening, 7.x mandatory Redis/backups.

## 2026-09-11 — Stage 6.8A: Local security readiness audit

- Read-only security audit across monorepo (auth, RBAC, IDOR patterns, uploads, CORS, deps, Docker, AI orchestrator, mobile/web token storage).
- Risk register and release blockers in `docs/security/stage-6-8a-local-security-audit.md`.
- npm audit: 19 findings (1 critical in Next.js chain); no code hardening in this stage.
- Future: Stage 6.8B ordered hardening (secrets, deps, tokens, rate limits, uploads, headers).

## 2026-09-11 — Stage 6.7QA: Monetization + category adversarial QA

- Added regression suites: `stage-6-7qa-purchase-adversarial`, `stage-6-7qa-category-discovery`, `stage-6-7qa-package-inventory`; Flutter `category_discovery_qa_test.dart`.
- catalog-api **681** tests passing; no integrity defects found in 6.7B/C/D scope.
- Docs: `docs/monetization/stage-6-7qa-final-qa.md` (concurrency limits, limit=100 note, idempotency semantics).
- Future: PostgreSQL parallel tests for last-slot race; DB pagination for large catalogs.

## 2026-09-11 — Stage 6.7D: Advertising and category discovery UX

- Consumer category screen: «Рекомендуем» (organic), «Продвигаемые места» (paid), «Все места» with session sort chips (`recommended` / `nearest` / `rating` / `popular`).
- `GET /businesses?sort=` organic comparators; default geo → nearest, else title recommended.
- Owner UX: `GET /monetization/purchase-states`, quote/package schedule preview; Flutter + Business Web product cards.
- Docs: `docs/monetization/stage-6-7d-advertising-category-ux.md`; API contracts updated.
- Future: 6.7QA adversarial monetization/category tests on device.

## 2026-09-11 — Stage 6.7C: Package and city inventory integrity

- Immutable `packageSnapshot` / `lineSnapshot` on `OrderItem`; provisioning uses snapshots only.
- `AdPlacementCityConfig` for per-city capacity; `AdInventoryReservation` (HELD/CONVERTED/EXPIRED/CANCELLED) with configurable TTL.
- Schedule-after renewal for business-scope placements; capacity counts campaigns + active holds.
- `AdCampaign.promotionId` FK; payment confirm revalidates schedules after expired holds.
- Docs: `docs/monetization/stage-6-7c-package-inventory.md`.
- Future: monetization UX (6.7D), adversarial QA (6.7QA), ad bonus spend.

## 2026-09-11 — Stage 6.7B: Monetization purchase integrity core

- Central purchase scopes + same-business overlap checks (409 `PURCHASE_CONFLICT` with `reasonCode`).
- Pending-order dedupe and optional checkout `idempotencyKey` on `Payment`.
- Transaction-safe placement availability counts; VIP capacity isolated per `cityId`.
- Category/promotion validation on direct `createOrder`; package lines validated inside checkout transaction.
- Docs: `docs/monetization/stage-6-7b-purchase-integrity-core.md` (+ 6.7A audit retained).
- Future: package snapshots, promotion on campaign, inventory reservation, renewal UX (6.7C–6.7D).

## 2026-09-10 — Stage 6.6QA: Analytics 360 final QA

- Adversarial regression suite `analytics-stage-6-6qa-final.spec.ts` (entitlements, downgrade leakage, privacy thresholds, export auth, rollup-first 365).
- Fixes: CSV export requires `ANALYTICS_VIEW` + `ANALYTICS_EXPORT`; conversion `rate` null when views=0 (no fake 0%).
- Docs: `docs/analytics/stage-6-6qa-final-qa.md`.

## 2026-09-10 — Stage 6.6F: Analytics reporting & export foundation

- Canonical `buildBusinessAnalyticsReport` (CUSTOM/WEEKLY/MONTHLY completed local periods) reuses dashboard rollup semantics; CSV serializes report payload.
- Export: PRO/VIP + `ANALYTICS_EXPORT`, UTF-8 BOM, semicolon delimiter, formula-injection safe cells, period range in filename, `Cache-Control: private, no-store`.
- Docs: `docs/analytics/stage-6-6f-reporting-export.md`.
- Будущее: email/PDF/scheduler delivery (6.6QA+), public GET `/report` if needed.

## 2026-09-10 — Stage 6.6E: VIP benchmark & recommendations

- Rollup-backed category benchmark (`AnalyticsDailyMetric.groupBy`): same city + primary category, ACTIVE peers, subject excluded, same local period; min 5 peers; per-metric min 5 for CTR/conversion averages.
- Deterministic VIP recommendations (max 5): visibility, CTR, intent conversion, search, promotions visibility, returning views, popular hours; centralized thresholds in `analytics-insights.constants.ts`; no LLM, no named competitors.
- Shared types: additive optional fields on `AnalyticsBenchmarkDto` / `AnalyticsRecommendationDto`.
- Docs: `docs/analytics/stage-6-6e-benchmark-recommendations.md`.
- Будущее: cohort median; lost-demand analytics (explicitly deferred); promotion/catalog action instrumentation.

## 2026-09-10 — Stage 6.6D: Business Web Analytics 360

- Rebuilt `/statistics` with Analytics 360 sections, backend-driven capabilities/lockedSections, PRO+ export, manager `ANALYTICS_EXPORT`, intent actions, funnel, VIP audience/content.
- Added `analytics-360-dashboard` component, extended `AnalyticsDashboard` types and `analytics-utils` tests.
- Docs: `docs/analytics/stage-6-6d-business-web-analytics.md`.

## 2026-09-10 — Final mobile UI screen-by-screen cleanup

- Migrated consumer/owner/profile/auth/onboarding screens from ad-hoc greys and hex literals to `AppTheme` + `ColorScheme` tokens; added surface/status/search tokens and `QalagoSearchField`.
- Unified search UI on home, categories, search, promotions; extended `app_theme_test` (scaffold, search field, card @320).
- Docs: `docs/mobile/ui-design-system-consistency.md` § Final screen-by-screen cleanup.

## 2026-09-10 — Mobile navigation & back behavior

- Shared `navigation_utils` (pop vs source-aware fallback); consistent `BackButton` on search, category, business subpages, owner screens; business detail deep-link fallback by traffic source.
- Docs: `docs/mobile/navigation-consistency.md`; tests `test/navigation/navigation_utils_test.dart`.

## 2026-09-10 — Mobile UI design system consistency

- Expanded `AppTheme.light` (buttons, inputs, chips, dialogs, sheets, snackbars); `QalagoTheme` extensions; consumer shell nav + shared widgets aligned to `ColorScheme`.
- Docs: `docs/mobile/ui-design-system-consistency.md`; widget tests `test/core/app_theme_test.dart`.
- Будущее: migrate remaining screen-level `AppTheme.kzBlue` tints to `primarySurfaceTint` opportunistically.

## 2026-09-10 — Stage 6.6C: Flutter Owner Analytics 360 UI

- Owner statistics screen restructured (Обзор / Привлечение / Аудитория / Контент / рекомендации); capabilities-driven period selector, PRO+ CSV export with RBAC, compact upgrade UX, hour-only popular times, promotion/catalog actions-unavailable copy.
- Docs: `docs/analytics/stage-6-6c-flutter-analytics-ui.md`; Flutter tests in `owner_analytics_test.dart`.
- Будущее: 6.6D (Business Web analytics); weekday heatmap when rollup ready; review analytics if added to API.

## 2026-09-10 — Stage 6.6B: Analytics entitlements & backend security

- Canonical plan capabilities (`impressions`, `ctr`, `audience`, `catalogAnalytics`, `visitorMetrics`, `promotionBreakdown`); overview/section server-side gating; BASIC period comparison; PRO export + `reportExport` on PREMIUM/VIP.
- Docs: `docs/analytics/stage-6-6b-entitlements.md`.
- Будущее: 6.6C UI for PRO export and upgrade UX.

## 2026-09-10 — Stage 6.6A.1: Analytics action semantics fix

- Canonical **business intent actions** exclude `PROMOTION_VIEW`, `FAVORITE_REMOVE`, and content events; shared util + dashboard/summary/trends alignment.
- Docs: canonical definition in `docs/analytics/stage-6-6a-dashboard-data-layer.md`.

## 2026-09-10 — Stage 6.6A: Analytics 360 dashboard data layer

- `GET /analytics/business/:id/dashboard` reads historical metrics from `AnalyticsDailyMetric` / `AnalyticsDailyDimensionMetric` (365d without raw scan); ≤90d raw fallback when rollups empty.
- Extended overview (impressions, CTR, conversion, UV/session approx + period distinct ≤90d), audience NEW/RETURNING view counts, promotion/catalog breakdowns with honest action unavailability.
- Local timezone trends aligned with rollup `metricDate`; docs: `docs/analytics/stage-6-6a-dashboard-data-layer.md`.
- Будущее: session funnel, lost demand, weekday popular times rollup, benchmark on rollups (6.6E).

## 2026-09-10 — Stage 6.5.2: Mobile owner team management

- Flutter: экран «Команда» для OWNER (`/owner/team`), invite/edit/suspend/revoke, лимиты из plan API, presets прав, mobile `/invite/:token` accept flow.
- Docs: `docs/mobile/stage-6-5-2-owner-team-management.md`.
- Будущее: App Links для invite, audit history в mobile, transactional email.

## 2026-09-10 — Stage 6.5.1: Analytics instrumentation completion

- Flutter: map impressions (`MapBusinessPreviewImpression`, list viewability), catalog (`TrackedCatalogItemCard`), reviews (`ReviewsViewTracker`, `REVIEW_CREATED` after API success).
- Search funnel: `discoverySurface=SEARCH_RESULTS` on open, `SEARCH_PERFORMED` from search UI, visitor/session on views.
- Backend: `AnalyticsBusinessVisitor` + `visitorType` on `VIEW_BUSINESS`; `VISITOR_TYPE` rollup dimension.
- Tests: full Flutter suite + search funnel / visitor-type backend specs.
- **Future:** Analytics 360 UI (6.6), `CATALOG_ITEM_ACTION` when UI adds meaningful actions.

## 2026-09-10 — Stage 6.5: Analytics data foundation

- Extended `AnalyticsEvent` (promotionId, catalogItemId, clientEventId, visitorHash, discoverySurface, platform, isInternal).
- Added `AnalyticsDailyMetric` + `AnalyticsDailyDimensionMetric` with timezone-aware rollup job.
- Organic ingest: whitelist, idempotency, internal-traffic exclusion, promotion/catalog validation.
- Fixed `popularTimes` to use `City.timezone` (not UTC).
- Flutter: visitor/session providers, impression tracking, promotionId on promotion views.
- Docs: `docs/analytics/stage-6-5-analytics-data-foundation.md`.
- **Future:** Analytics 360 UI (6.6), scheduled raw-event retention job, new/returning visitor dimension.

## 2026-09-10 — Stage 6.4: Subscription plan redesign

- **Сделано:** Canonical `PLAN_CATALOG` (FREE/BASIC/PREMIUM/VIP → Бесплатный/Бизнес/PRO/VIP); manager limits; review-reply entitlement; monthly ad bonus in catalog (display only); ad discount derived from catalog; consumer plan badge removed; Business/Admin/Flutter plan UX; docs + monthly ad bonus design note.
- **Политика:** subscription ≠ organic ranking; downgrade preserves content; no ad wallet ledger in 6.4.
- **На будущее:** Analytics 360 (6.5/6.6), monthly ad bonus accounting, extended styling UI.

## 2026-09-10 — Stage 6.3: Privacy, terms, account deletion & store compliance foundation

- **Сделано:** Public `/privacy`, `/terms`, `/account-deletion` (Business Web); Flutter/Business Web legal links and login consent; privacy data inventory; Google Play / Apple privacy drafts; store checklists; legal-review-required registry.
- **Политика:** тексты отражают фактическое поведение репозитория; placeholders для оператора/контактов; без вымышленных legal claims.
- **На будущее:** юридическая экспертиза, deploy qalago.kz, Apple revocation, in-app report review, kk translation.

## 2026-09-10 — Stage 6.2B7: Auth migration finalization

- **Сделано:** Social-first auth policy documented; OTP independently disableable (backend + Business Web client flag); production validation requires ≥1 auth method; admin `authMethods` visibility; JWT guard tests; auth collision/tombstone tests; all-auth-off UX; invitation rate-limit IP fix.
- **Политика:** Google/Apple primary; OTP transitional; no auto-linking; tombstones enforced; legacy phone invites require OTP path.
- **На будущее:** real provider E2E, Apple revocation, admin social login, distributed rate limits, provider linking UX.

## 2026-09-10 — Stage 6.2B6: Team invitations (email + secure token)

- **Сделано:** Email-based manager invitations with cryptographically secure one-time tokens; `tokenHash` only in DB; `POST /invitations/resolve` and `/invitations/accept`; Business Web team page (copy link) and `/invite/[token]` acceptance flow; legacy phone invitations preserved via `claimPendingInvitations`; 7-day TTL; login redirect preservation.
- **Политика:** token possession + authenticated user + explicit accept; invitation email — контекст доставки, не auth identity; без email auto-link.
- **На будущее:** transactional email provider, Flutter deep links, stricter optional email-match signal (non-blocking).

## 2026-09-10 — Stage 6.2B5: Business Web social authentication

- **Сделано:** Google/Apple login на Business Web; GIS + Apple JS; state/nonce; existing JWT session; OTP fallback.
- **На будущее:** real OAuth credentials, Apple revocation, httpOnly cookie hardening, B6 team invites.

## 2026-09-10 — Stage 6.2B4: Flutter social authentication

- **Сделано:** Google/Apple login на Flutter; provider gateways; `AuthRepository.signInWithGoogle/Apple`; credential-gated dart-define flags; OTP fallback; guest-first UX preserved.
- **На будущее:** real OAuth credentials, B5 Business Web, Apple revocation.

## 2026-09-10 — Stage 6.2B3: Apple backend authentication

- **Сделано:** `POST /auth/apple`; Apple JWKS verification via `jose`; `AppleIdentityTokenVerifierService`; shared `SocialAuthLoginService`; relay email support; partial AuthIdentity metadata updates; Apple production config validation; Google DI runtime fix.
- **На будущее:** B4 Flutter social UI, B5 Business Web, Apple token revocation (App Store compliance).

## 2026-09-09 — Stage 6.2B2: Google backend authentication

- **Сделано:** `POST /auth/google`; `google-auth-library` ID token verification; `GoogleAuthLoginService`; IP rate limiting; production Google client ID validation; tombstone/inactive-user enforcement; no email auto-link.
- **На будущее:** B3 Apple backend, B4 Flutter Google UI, B5 Business Web Google UI.

## 2026-09-09 — Stage 6.2B1: Social auth identity foundation

- **Сделано:** `AuthProvider` enum; `AuthIdentity` + `AuthIdentityTombstone` models; `User.phone` nullable; optional `User.email`; `AuthIdentityService`; account deletion tombstones external identities; JWT/AuthUser optional phone; feature flags `OTP_AUTH_ENABLED`, `GOOGLE_AUTH_ENABLED`, `APPLE_AUTH_ENABLED`; OTP routes gated when disabled; client null-safe phone display.
- **На будущее:** B2 Google verification, B3 Apple verification, B4–B5 client social login, B6 phone-based invitation redesign.

## 2026-09-09 — Stage 6.0.1: Production safety prerequisites

- **Сделано:** fail-closed CORS в production; OTP send/verify rate limiting (in-process, Redis-ready abstraction); mock plan checkout заблокирован в production (backend + Flutter + Business Web); production env validation (`JWT_SECRET`, `CORS_ORIGINS`, `OTP_DEBUG`, `DEV_LOGIN_ENABLED`); `DELETE /users/me` self-service account deletion (hybrid anonymize/deactivate); safe SUPER_ADMIN bootstrap script (`bootstrap:super-admin`); analytics ingest IP rate limit; permission error sanitization (`REVIEWS_REPLY`); deploy docs — **never seed production**.
- **На будущее (Stage 6.1+):** Redis-backed rate limits; real SMS; Android/iOS signing; S3 uploads; Nginx/TLS; store billing; privacy/terms legal text.

## 2026-09-09 — Hotfix: VIP creative moderation lifecycle sync

- **Сделано:** `POST /monetization/creatives/:id/submit` (`DRAFT`/`REJECTED` → `PENDING`, ADS_MANAGE); VIP campaign при оплате с `DRAFT` креативом → `SCHEDULED` (не `PENDING_MODERATION`); submit синхронизирует кампанию в `PENDING_MODERATION`; admin approve/reject только для `PENDING`; Business Web — «Отправить на модерацию», корректный «Фактический период»; Admin Web — подсказка для `DRAFT`; +11 backend tests (405 total).
- **На будущее:** submit из Flutter owner UI; data repair script для legacy `PENDING_MODERATION`+`DRAFT` пар.

## 2026-09-09 — Stage 5N.QA: Manual E2E verification (runtime)

- **Сделано:** runtime QA script `services/catalog-api/scripts/stage-5n-qa-runtime.mjs` + fixture audit `stage-5n-qa-fixtures.mjs`; DEV stack verified (API :3002, Admin :3001, Business :3003, Flutter :8080); HTTP smoke on all web apps; API paths for application/claim lifecycle, POST `/businesses` matrix, PAYMENTS_VIEW RBAC, CITY_ADMIN scope, stale moderation, rate limit 429, accountType attack; **P1 fix:** `BusinessAccessService.assertBusinessPermission` возвращает generic `Insufficient permissions` вместо `Missing permission: PAYMENTS_VIEW` (+1 regression test, backend 394/394).
- **Manual UI:** PARTIAL — browser automation недоступна в Cursor; Flutter/Admin/Business Web flows покрыты automated unit tests + API runtime; responsive/guest redirect/nav smoke не выполнялись в реальном браузере.
- **На будущее:** Playwright smoke для onboarding/plan RBAC; перезапуск API или отдельные QA phones между прогонами runtime script (in-memory rate limit).

## 2026-09-09 — Stage 5N.5: Business onboarding security hardening

- **Сделано:** `POST /businesses` закрыт для обычных пользователей (только ADMIN/SUPER_ADMIN import); `accountType=business` больше не повышает роль; удалены мёртвые client `createBusiness`; rate limits на create/submit applications и ownership claims (429, env-config); Flutter session cleanup через `userScopedCacheCleanupProvider` + auth-gated onboarding providers; PAYMENTS_VIEW RBAC на Business Web сохранён и расширен тестами; backend +7 тестов (393 total).
- **На будущее:** read-only plan limits endpoint для менеджеров каталога без PAYMENTS_VIEW; постепенный отказ от `@Roles(BUSINESS)` на контроллерах.

## 2026-09-09 — Business Web: plan page access (PAYMENTS_VIEW)

- **Сделано:** страница «Тариф» и связанные экраны проверяют `PAYMENTS_VIEW` перед запросом `/businesses/:id/plan`; пункт меню «Тариф» скрывается для менеджеров без права; вместо JSON-403 показывается понятное сообщение на русском; checkout тарифа доступен только владельцу.
- **На будущее:** отдельный read-only эндпоинт лимитов тарифа для менеджеров каталога/акций без доступа к платежам.

## 2026-09-09 — Stage 5N.4: Client business onboarding

**Added**
- Flutter: «Для бизнеса» profile section, `/business/start|search|apply|applications|claims`, claim CTA on business detail
- Business Web: `/onboarding/*` (search, apply, claims, applications), zero-business empty states
- Auth UX: removed account-type selector; login always as User (`accountType=user` internally)
- Onboarding uses `BusinessApplication` + `OwnershipClaim` APIs (no direct `POST /businesses` in new flows)

**Legacy preserved**
- `UserRole.BUSINESS`, `Business.ownerId`, backend `POST /businesses` unchanged
- Legacy BUSINESS users and repository helpers remain for compatibility

**Deferred**
- Stage 5N.5 verification/rate limits/cleanup; phone OTP auto-approval; document KYC

---

## 2026-09-09 — Stage 5N.3: Admin business request moderation UI

**Added**
- Admin Web «Заявки бизнеса»: `/business-requests/applications`, `/business-requests/claims` (+ detail routes)
- Paginated queues with status filters (default `PENDING`), city scope via shell picker (ADMIN/SUPER_ADMIN) or locked city (CITY_ADMIN)
- Approve/reject dialogs with Russian copy, rejection reason validation (3–500), 409 stale-state handling
- Pending count badges on nav + sub-tabs; vitest coverage for utils/API query mapping

**Not implemented**
- Consumer/business onboarding (5N.4), verification/rate limits (5N.5), dedicated admin business detail deep link

---

## 2026-09-09 — Stage 5N.2: Business ownership claim backend foundation

**Added**
- `BusinessOwnershipClaim` model + migrations (`PENDING/APPROVED/REJECTED/CANCELLED`)
- User API: `POST /businesses/:id/ownership-claims`, `GET /ownership-claims/my`, read, cancel
- Admin API: `/admin/ownership-claims/*` (list, approve, reject)
- Partial unique index: one PENDING claim per `(businessId, claimantUserId)`
- Approval transaction: ACTIVE OWNER membership; `ownerId` set only if null; plan/content preserved
- Audit actions: `BUSINESS_OWNERSHIP_CLAIM_SUBMIT/APPROVE/REJECT/CANCEL`
- MVP verification: `MANUAL` only (no phone auto-approval, no documents)

**Deferred**
- Admin Web UI (5N.3), client onboarding (5N.4), rate limiting (5N.5)

---

## 2026-09-09 — Stage 5N.1: Business application backend foundation

**Added**
- `BusinessApplication` model + migrations (`BusinessApplicationStatus`: DRAFT/PENDING/APPROVED/REJECTED/CANCELLED)
- User API: `/business-applications/*` (create, edit, submit, cancel)
- Admin API: `/admin/business-applications/*` (list, approve, reject)
- Dedupe fingerprint (`dedupeKey`) + partial unique index for active DRAFT/PENDING per applicant
- Approval transaction: Business + ACTIVE OWNER membership + `ownerId` + AuditLog; applicant stays `USER`
- Audit actions: `BUSINESS_APPLICATION_SUBMIT/APPROVE/REJECT/CANCEL`
- P0 fix: membership-authoritative owner access (revoked `ownerId` bypass closed)

**Legacy**
- `POST /businesses` marked deprecated; kept for Flutter/Business Web until Stage 5N.4

**Deferred**
- Ownership claims (5N.2), Admin moderation UI (5N.3), client onboarding (5N.4), rate limiting (5N.5)

---

## 2026-09-08 — Stage 5M.4.1: SUPER_ADMIN verification checkpoint

**Verified**
- Backend 346/346; 11 migrations; catalog-api restarted after schema change
- Manual API QA: SUPER_ADMIN role assignment, audit log, ADMIN denial, CITY_ADMIN scope, self-demotion block
- Git tag `stage-5m4-checkpoint` on `1f726b5` (+ docs commit if any)

**Known unrelated:** Flutter `auth_session_test.dart` (3 failures)

---

## 2026-09-08 — Stage 5M.4: SUPER_ADMIN system role governance

**Added**
- `UserRole.SUPER_ADMIN`; migrations `20260908190000_stage_5m4_super_admin` + `20260908190001_stage_5m4_super_admin_migrate`
- Existing `ADMIN` users migrated → `SUPER_ADMIN` (privilege preserved)
- `SystemAccessService` + `RolesGuard` hierarchy (SUPER_ADMIN inherits ADMIN ops, not vice versa)
- Role change: **SUPER_ADMIN only**; self-change denied; last-SUPER_ADMIN demotion blocked
- Governance: city create/update, global category create/delete → SUPER_ADMIN
- Operational ADMIN: moderation, payments, audit read, category update
- Dev seed: `+77000000001` SUPER_ADMIN, `+77000000005` ADMIN

**Deferred**
- MODERATOR role
- USER_STATUS_CHANGE endpoint

---

## 2026-09-08 — Documentation sync through Stage 5M.3

**Updated**
- `README.md`, `docs/PROJECT_STATUS.md`, `docs/README.md` — checkpoint `2bacbb3`, 9 migrations, 5M.3 complete
- `scripts/dev/SETUP.md`, `docs/deploy.md` — `migrate deploy` workflow, DATABASE_URL Windows pitfall, production safety
- `docs/stage-5l-rbac-audit.md` — marked HISTORICAL/SUPERSEDED
- `docs/architecture/business-membership.md` — AuditLog implemented; deferred items clarified

**Policy**
- Stage 6 not started; SUPER_ADMIN / MODERATOR not implemented
- No historic AuditLog backfill

---

## 2026-09-08 — Stage 5M.3: Audit log foundation

**Added**
- Prisma `AuditLog` model + migration `20260908180000_stage_5m3_audit_log` (9 migrations total)
- Central `AuditLogService` — server-side actor, role snapshot, safe metadata, transaction support
- Wired mutations: team, business profile/hours, catalog, photos, promotions, review replies, plans, ad orders/payments/creatives/campaigns, user role, cities, categories
- `GET /admin/audit-logs` (ADMIN global, CITY_ADMIN city-scoped)
- `GET /businesses/:id/team/audit` (OWNER only)
- Admin Web `/audit-logs`; Business Web team history block

**Policy**
- Append-only; no backfill of historic actions; retention TBD
- Not mixed with `AnalyticsEvent`; secrets/PII excluded from metadata
- Critical mutations (team invite existing user, role change, payment confirm, invitation accept) logged in same DB transaction where practical

**Deferred**
- `USER_STATUS_CHANGE` / `PAYMENT_REJECT` — no admin endpoints yet
- SUPER_ADMIN / MODERATOR roles

---

## 2026-09-08 — Stage 5M.2.1: Prisma & runtime verification

**Verified**
- Migration `20260908160000_stage_5m2_business_permissions` applied (8/8 migrations, DB up to date)
- Owner invariant: 17 businesses with ownerId → 17 ACTIVE OWNER memberships (0 missing)
- 44-scenario API runtime QA (owner/manager/invitations/cross-business/cross-city)
- Expired invitation not claimed; live permission grant/revoke without relogin

**Fix**
- `RolesGuard`: USER may reach `@Roles(BUSINESS…)` routes; `BusinessAccessService` enforces permissions
- `scripts/dev/SETUP.md`: document PowerShell `DATABASE_URL` shell override pitfall

**Root cause (Stage 5M.2 Prisma CLI failure)**
- `.env` was valid; stale `$env:DATABASE_URL` in PowerShell had leading `"` and overrode `.env`
- PostgreSQL: native local instance on `localhost:5432` (Docker not installed on dev machine)

**Manual UI QA:** Flutter/Business Web browser walkthrough not run; client unit tests + API QA executed.

---

## 2026-09-08 — Stage 5M.2: Business team & manager permissions

**Сделано**
- Prisma: `BusinessPermission` enum, `BusinessMembership.permissions[]`, `BusinessInvitation`
- Migration `20260908160000_stage_5m2_business_permissions`
- `BusinessAccessService`: `resolveAccess`, `assertOwner`, `assertBusinessPermission`; MANAGER granular access
- Field-level PATCH business authorization (profile vs hours)
- Team API: list / invite / update / revoke invitation
- Phone invitations: existing user → ACTIVE MANAGER; unknown → PENDING invite, claim on OTP login
- `GET /businesses/my`: `{ items: [{ business, access }] }` — OWNER + ACTIVE MANAGER
- Services wired: catalog, photos, promotions, reviews, analytics, export, ads, payments
- Shared types: `BusinessPermission` + RU labels
- Flutter: membership-based cabinet gate, permission-aware owner nav, tests
- Business Web: accessible-business gate, team UI «Сотрудники», permission nav, tests

**Инварианты**
- OWNER implicit all permissions; not stored
- Team management owner-only
- JWT без permissions
- Plan limits still server-side

**На будущее**
- Flutter owner team UI (optional P2)
- ~~Full AuditLog for team ops~~ → implemented in Stage 5M.3

---

## 2026-09-08 — Stage 5M.1: Business membership foundation

**Сделано**
- Prisma: `BusinessMembership` + enums `BusinessMembershipRole` / `BusinessMembershipStatus`
- Backfill: каждый `Business.ownerId != null` → ACTIVE OWNER membership
- `BusinessMembershipService` + dual-read в `BusinessAccessService`
- Создание бизнеса: транзакция ownerId + membership
- `GET /businesses/my`: legacy ownerId OR ACTIVE OWNER membership (dedupe)
- Seed: upsert membership для seeded owners
- Документация: `docs/architecture/business-membership.md`

**Инварианты**
- `UserRole` ≠ `BusinessMembershipRole`
- MANAGER в enum, но без прав в 5M.1
- JWT без membership claims

**На будущее (Stage 5M.2)**
- MANAGER permissions, invitations, team UI

---

## 2026-09-08 — Stage 5M.0: Authorization P0 hardening

**Сделано**
- `BusinessAccessService` — единая проверка ADMIN / CITY_ADMIN (managedCityId) / BUSINESS owner
- CITY_ADMIN scope на PATCH business, analytics/export, catalog, promotions, reviews reply, plans, uploads, monetization
- `POST /uploads` ограничен ролями BUSINESS / CITY_ADMIN / ADMIN
- AI: service token (`X-QalaGo-Service-Token`), proxy через catalog-api (`/ai/*`, `/admin/ai/*`)

**Инварианты**
- CITY_ADMIN не выходит за managedCityId
- Секрет сервиса не попадает в browser/mobile bundle

---

## 2026-09-08 — Stage 5L: RBAC & access control audit

**Сделано**
- Полный аудит текущих ролей, ownership, guards и client/server authorization
- Access matrix, gap matrix, migration strategy → `docs/stage-5l-rbac-audit.md`

**На будущее (Stage 5M)**
- BusinessMembership, fine-grained permissions, CITY_ADMIN scope fixes

---

## 2026-09-08 — Stage 5K.1: Flutter native analytics CSV share

**Сделано**
- Native Android/iOS: backend CSV → app temp file → system share sheet (`share_plus` + `path_provider`)
- Filename sanitization, temp cleanup, dismiss ≠ error UX
- Flutter Web regression preserved (browser download)

**На будущее**
- Optional native “save to Downloads” without share sheet (P2)

---

## 2026-09-08 — Stage 5K: VIP business analytics CSV export

**Сделано**
- `GET /analytics/business/:businessId/export` — VIP-only CSV from canonical dashboard builder
- Semicolon delimiter, UTF-8 BOM, formula-injection safe escaping
- Business Web + Flutter Owner: «Скачать CSV» with period selector

**На будущее**
- PDF export deferred; campaign analytics export deferred (P2)

---

## 2026-09-07 — Stage 5J: privacy-safe audience geography analytics

**Сделано**
- `AnalyticsEvent.audienceDistanceBucket` — coarse enum only (no raw GPS on server)
- Flutter computes bucket locally from actual user position + business coords; passive read (no new permission prompt)
- VIP dashboard: «Аудитория по расстоянию» with `MIN_AUDIENCE_GEOGRAPHY_SAMPLE = 10`
- Business Web + Flutter Owner parity; privacy explanation copy

**На будущее**
- Stage 6 remains deferred

---

## 2026-09-07 — DEV quick-login shortcuts for seed users

**Сделано**
- Flutter: панель «DEV: быстрый вход без SMS» на главной и экране входа (chips: Test User, Business Owner, Admin, City Admin)
- Admin Web + Business Web: кнопки быстрого dev-login на `/login`
- `start-all.ps1`: `DEV_LOGIN_ENABLED=true` для API, `NEXT_PUBLIC_QALAGO_DEV_LOGIN=true` для Admin/Business/Mobile

**На будущее**
- Убрать перед production; не включать флаги на staging/prod

---

## 2026-09-07 — Stage 5I: business search query analytics

**Сделано**
- `AnalyticsEvent.searchQuery` (nullable) on `VIEW_BUSINESS` when `trafficSource=SEARCH`
- Query normalization (trim, collapse spaces, lowercase, min 2 / max 100 chars)
- PREMIUM/VIP dashboard: top 10 queries, threshold count ≥ 3, `otherCount` bucket
- Flutter Search passes effective result-set query via `openBusiness(..., searchQuery:)`
- Business Web + Flutter owner: «По каким запросам вас находят»

**Privacy**
- Aggregate only; no user identity in owner API
- Low-frequency queries hidden below threshold (not exposed individually)

**DEFERRED**
- Audience geography analytics
- Query clustering / typo normalization

---

## 2026-09-07 — Stage 5H: real business traffic source attribution

**Сделано**
- `BusinessTrafficSource` enum on `AnalyticsEvent.trafficSource` (nullable, additive migration)
- `POST /analytics/events` accepts optional `trafficSource` on `VIEW_BUSINESS`
- PREMIUM/VIP dashboard aggregates organic `VIEW_BUSINESS` by source; legacy null → UNKNOWN
- Flutter consumer passes explicit source on every business-detail navigation
- Business Web + Flutter owner show «Источники просмотров» breakdown

**Semantics**
- One business open → one `VIEW_BUSINESS` with source metadata
- Paid ad tap: `AD_CARD_OPEN` (campaign) + `VIEW_BUSINESS source=AD` (business analytics) — not duplicate views
- `AD` in source breakdown = business opens from paid placements; campaign metrics remain separate

**DEFERRED**
- Search-query analytics (which search term)
- Consumer web attribution (enum ready for future web client)

---

## 2026-09-06 — Stage 5G.1: Flutter owner catalog pagination

**Сделано**
- Flutter Owner menu uses paginated `GET /service-menu/manage/:businessId/items`
- Server-side search, section filter, load-more (20/page), business switch reset
- Plan usage display from existing `businessPlanProvider`

**DEFERRED**
- Flutter owner full section CRUD (Business Web)

---

## 2026-09-06 — DEV login without SMS (development only)

**Сделано**
- `POST /auth/dev-login` — passwordless phone login when `DEV_LOGIN_ENABLED=true`; returns 404 when disabled
- Shared `completeLogin()` for OTP verify and DEV login (same JWT/session)
- Flutter: `QALAGO_DEV_LOGIN` dart-define + «Войти без SMS» button
- Business Web: `NEXT_PUBLIC_QALAGO_DEV_LOGIN` + equivalent button

**WARNING:** NEVER set `DEV_LOGIN_ENABLED=true` in production.

---

## 2026-09-06 — Stage 5G: scalable business catalog & gallery

**Сделано**
- Public `GET /businesses/:id` returns bounded previews (`galleryPreview`, `catalogPreview`, `promotionsPreview`, `reviewsPreview`) — fixed limits independent of plan
- New public endpoints: `GET /businesses/:id/catalog` (pagination, section filter, search), `GET /businesses/:id/photos` (pagination)
- Owner paginated management: `GET /service-menu/manage/:businessId/items`
- Catalog sections reuse `ServiceMenuGroup` + `ServiceItem.groupId` (nullable; delete group → SET NULL)
- Flutter consumer: detail previews, `/business/:id/catalog`, `/business/:id/photos`
- Business Web owner menu: pagination, search, section filter, group CRUD
- Flutter owner: section assignment on items (existing group dropdown)
- Backend regression tests for VIP-scale content vs bounded previews

**DEFERRED**
- Public consumer web (no app in repo) — backend contract ready
- Flutter owner full section CRUD (primary in Business Web)
- Thumbnail/CDN pipeline (document as P2 if absent)

**На будущее**
- Public web consumer catalog/gallery screens when consumer web app exists
- Optional catalog item detail / item-open analytics event

---

## 2026-09-06 — Stage 5F: business analytics parity (Web + Mobile Owner)

**Сделано**
- Backend: unified `GET /analytics/business/:id/dashboard` contract; plan entitlements as source of truth
- Tier windows: FREE/BASIC 30d, PREMIUM 90d, VIP 365d; locked metrics not returned in API
- FREE: views + daily view trend; BASIC+: customer actions; PREMIUM+: sources/conversion/comparison; VIP: popular times/benchmark/recommendations
- Business Web `/statistics`: tiered KPIs, locked sections, upgrade CTA → `/plan`, organic vs ad split
- Flutter Owner `/owner/analytics/:businessId`: same contract, drawer entry, business switch invalidation
- Tests: backend capabilities, web analytics-utils, Flutter owner analytics entitlement matrix

**Feature matrix (Stage 5F)**

| Feature | Backend | Web | Mobile |
|---------|---------|-----|--------|
| Views | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Actions | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| View/action trends | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Traffic sources | PARTIAL (deferred UI; no fake attribution) | IMPLEMENTED | IMPLEMENTED |
| Conversion | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Period comparison | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Popular times | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Category benchmark | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Recommendations | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Search queries | DEFERRED | DEFERRED | DEFERRED |
| Audience geography | DEFERRED | DEFERRED | DEFERRED |
| Ad campaign analytics | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |

**Заложить на будущее**
- Referrer/source tracking on organic events for multi-source breakdown
- Search-query and service-level analytics when event schema supports them
- Report export (VIP, platform-appropriate)

---

## 2026-09-06 — Stage 5E: guest, auth & profile polish

**Сделано**
- Login: KZ phone normalization, production copy, resend cooldown, guest CTA, no demo OTP UI
- Safe login redirect validation (`sanitizeLoginRedirect`) — blocks open redirects
- Session: logout → `/home`, user-scoped provider invalidation, 401 → guest mode
- City across login: preserve session city, sync to profile on login
- Profile guest: city picker, help/about; profile/city works for guest + auth
- Help: removed dev/placeholder contacts; permissions test accounts debug-only

**Заложить на будущее (Stage 6)**
- Real production SMS provider integration
- OTP rate limiting on backend
- Legal/privacy documents in About

---

## 2026-09-06 — Stage 5D: promotions, favorites & map

**Сделано**
- `/promotions`: city-scoped active feed, real expiry labels, differentiated empty/error states, client-side active guard
- Favorites: filter by selected city (client-side on complete user list), real «Недавние»/«По названию» sort, three empty states, BusinessCard + remove sync
- Map: city-wide businesses (`mapBusinessesProvider`, limit 100), marker preview sheet with «Подробнее», GPS/city camera fallback, OSM attribution, error banner without hiding map
- Backend: favorites response includes `business.city` for city filtering
- Tests: consumer_discovery_utils + promotions/favorites/map widget tests

**Заложить на будущее**
- Server-side favorites `citySlug` filter if user lists grow large
- Map pagination beyond 100 markers per city
- Map clustering if marker density becomes unusable

---

## 2026-09-06 — Stage 5C: consumer business detail

**Сделано**
- Business Detail: IA reorder (identity → actions → description → promotions → menu → hours → contacts → mini-map → gallery → reviews)
- Safe URL helpers: phone, WhatsApp (KZ 8→7), website, Instagram, route (coords or address)
- WEBSITE_CLICK / INSTAGRAM_CLICK organic analytics (Prisma enum + Flutter tracking)
- VIEW_BUSINESS once-per-open via initState guard
- Open/closed badge from workHours + city timezone (Asia/Oral UTC+5); hours hidden when absent
- Promotions: active filter, expiry label, PROMOTION_VIEW on tap
- Gallery fullscreen viewer; mini-map (flutter_map, OSM)
- No plan tier badges; «Нет отзывов» instead of fake rating; owner edit only for own business
- Public detail enforces plan limits via existing backend findOne (photos/promotions/menu)

**Заложить на будуще**
- Full IANA timezone library for multi-city expansion beyond KZ UTC+5
- Favorites city filter (Stage 5A P1)
- Similar businesses / booking (Stage 5D+)

---

## 2026-09-06 — Stage 5B: consumer categories, search & filters

**Сделано**
- Categories screen: title, city context, local category-name filter, explicit «Поиск заведений» CTA
- Category businesses: city-wide organic list (removed hidden 3 km default); city in app bar and section subtitle
- Search: radius filter (3/5/10/15 km + «Весь город»), category chips with clear, active filter summary + reset
- Deep links: `/search?q=&categoryId=&radiusKm=`; whole city omits geo params
- Search uses `BusinessCard`; result count from API meta; differentiated empty/error states
- Paid CATEGORY_TOP / CATEGORY_BOOST dedupe preserved; organic sort unchanged (no plan tier)
- Deferred: open-now, rating, promotion filters (no reliable backend support)
- Consumer tests expanded (search filters, category dedupe, guest search widgets)

**Заложить на будущее**
- Backend openNow / minRating / hasPromotion filters
- Category business counts without N+1
- Search debounce cancellation on dispose edge cases

---

## 2026-09-06 — Stage 5A: guest-first consumer Home & discovery

**Сделано**
- Guest-first routing: browse Home, categories, map, search, business, promotions без JWT
- «Продолжить как гость» → `/home` без demo auto-login
- Auth gates: favorites, review submit, profile edit, notifications, owner/admin routes
- Guest profile и favorites с CTA «Войти»
- API config через `--dart-define` (`QALAGO_API_BASE_URL`, `QALAGO_AI_BASE_URL`, `QALAGO_DEV_HOST`)
- Home: organic «Рекомендуем» + paid «Продвигаемые места»; dedupe HOME_FEATURED из organic
- Удалены consumer TOP/VIP organic copy и plan badges на organic cards
- Search geo parity: `nearbySearchPositionProvider`
- Bottom nav: no false tab highlight on search/business/promotions
- COMING_SOON badge «Скоро» в city picker
- Consumer tests (45 total)

**Заложить на будущее**
- Anonymous organic analytics (backend auth policy)
- Home dedupe across VIP/promotions paid slots
- Favorites city filter for authed users

---

## 2026-09-06 — Stage 4E: business owner experience unification

**Сделано**
- Единая IA кабинета: Обзор, Мой бизнес, Товары и услуги, Акции, Реклама и продвижение, Статистика, Тариф, Настройки
- business-web: обновлён dashboard (лимиты тарифа, кампании, быстрые действия), `/statistics`, hub «Мой бизнес», метки фото over-limit, лимиты меню, FAQ без legacy Pro/TOP
- Flutter owner: drawer «Обзор» + «Реклама и продвижение», plan usage на dashboard, VIP disclaimer, единые RU labels кампаний
- `lib/owner-utils.ts` + тесты: plan usage, VIP/moderation copy, photo publish state

**Заложить на будущее**
- Отдельная глобальная аналитика бизнеса beyond `/analytics/business/:id/summary`
- Business switcher в Flutter sub-screens (URL-bound routes)

---

## 2026-09-06 — Stage 4B.2: VIP inventory reservation + order validation

**Сделано**
- `HOME_VIP_BANNER`: capacity учитывает `ACTIVE`, `SCHEDULED`, `PENDING_MODERATION` (paid VIP на модерации резервирует слот)
- Остальные placements: capacity без изменений (`ACTIVE`, `SCHEDULED`)
- Order creation: `creativeId` обязателен для direct `VIP_BANNER` и пакетов с VIP (`MAX`, `NEW_PLACE`); `START` / `BUSINESS` без creative
- Provisioning VIP: всегда проверка availability + owned creative; `CREATIVE_REQUIRED` / `CREATIVE_NOT_OWNED`
- REJECTED creative → campaign `REJECTED` → слот освобождается (без refund-логики)
- Serve без изменений: только `ACTIVE` + approved creative
- Тесты `stage-4b2-vip-inventory.spec.ts`; DEV E2E `scripts/stage-4b2-e2e.ts`

**Заложить на будущее**
- Явная политика resubmit после REJECTED (edit creative → повторная модерация vs новый заказ)

---

## 2026-09-06 — Stage 4D: business-web monetization UI

**Сделано**
- `apps/business-web`: полный owner-flow монетизации — обзор, каталог продуктов/пакетов, VIP-креатив, checkout (manual payment), заказы и кампании с analytics
- Расширен `ownerApi`: product/campaign/creative endpoints, типы `MonetizationOrder.campaigns`, campaign analytics
- `lib/monetization-utils.ts` + vitest: owner-facing RU labels, formatters, `packageHasVip`
- Навигация: footer «Реклама и продвижение» → `/monetization`; plan label → «Тариф»; CTA «Продвинуть акцию» на promotions
- Цены только через `POST /monetization/quote`; без fake payment success

**Заложить на будущее**
- Online payment provider (Kaspi/Stripe) в checkout
- Owner pause/resume campaigns (сейчас только admin)

---

## 2026-09-06 — Stage 4B.1: package VIP creative activation

**Сделано**
- Package orders принимают `creativeId` / `promotionId` / `desiredStartAt` в metadata
- VIP_BANNER в MAX/NEW_PLACE: `PENDING_MODERATION` до одобрения linked creative; остальные items активируются сразу
- Duration на approval из `PromotionPackageItem` (NEW_PLACE VIP 7d vs order 14d)
- Idempotency: повторный provision/payment confirm не дублирует кампании; повторный approve не сдвигает даты
- Flutter: package → VIP creative → confirm; notice + CTA для пакетов с VIP
- Admin: VIP campaign/order — creative, moderation, requested vs actual start

**Заложить на будущее**
- Post-payment creative link API (если pay-first без creativeId)
- VIP inventory reservation во время moderation (сейчас PENDING_MODERATION не резервирует слот)

---

## 2026-09-06 — Stage 4C.1: subscription / organic visibility cleanup

**Сделано**
- `recommended()` cold start: organic title order, no `isFeatured` filter
- Public `GET /businesses?featured=true` ignored (legacy param deprecated)
- AI orchestrator + ai-core: neutral recommendation reasons, organic fallback
- Flutter fallback: no `featured: true`, no isFeatured-based reason
- Plan activation regression tests (no isFeatured/featuredSlot/AdCampaign)
- Deprecated `isFeatured` / `featuredSlot` documented in schema + api-contracts
- PostgreSQL backup procedure: `docs/infra/postgresql-backup.md`

**Заложить на будущее**
- Stage 4B.1 unchanged

---

## 2026-09-06 — Stage 4C.1: preserve content on downgrade / expiry

**Сделано**
- Удалён `archiveExcessPromotions` — downgrade/expiry больше не меняет status акций
- Entitlement layer: public API ограничивает photos, service menu, promotions по текущему тарифу; DB records сохраняются
- `GET /businesses/:id`, public menu, promotion feed/list — server-side caps
- Optional JWT на `@Public` routes для owner bypass в promotion list
- Owner plan API/UI: `entitlements` (total / published / overLimitNotice) — Flutter + business-web
- Tests: `plan-downgrade-entitlements.spec.ts`, расширен `plan-entitlements.util.spec.ts`

**Заложить на будущее**
- Stage 4B.1 без изменений

---

## 2026-09-06 — Этап 4C: FREE / BASIC / PREMIUM / VIP subscriptions

**Сделано**
- Prisma migration `20260906000000_business_plan_tier_stage_4c`: safe enum swap BASIC→FREE, PRO→PREMIUM, TOP_CITY→VIP; default `FREE`
- `PlanLimitsService` / `PLAN_CATALOG` — единый backend source of truth (цены, лимиты, ad discounts 0/5/10/15%)
- Backend enforcement: photos, service items, active promotions; expiry paid → FREE
- Organic ranking plan-neutral (`compareBusinessCatalogRank` = title; geo = distance + title)
- Subscription activation no longer sets `isFeatured` / `featuredSlot`; city promotion feed decoupled from plan tier
- Analytics tiers: BASIC (7d summary), EXTENDED (30d + trends), FULL (365d + trends)
- Flutter owner plan UI (4 tiers), badges, VIP disclaimer; `business_rank.dart` plan-neutral
- Admin + business-web plan selectors updated; `packages/shared-types` plan DTOs
- DEV seed: `qa-plan-free/basic/premium/vip` businesses
- Tests: backend 122, Flutter 36, admin vitest 10

**Checkpoint**
- Tag: `checkpoint-stage-4c-pre-migration`
- Pre-migration counts: `services/catalog-api/scripts/stage-4c-pre-migration-counts.json`

**Заложить на будущее**
- Stage 4B.1: package VIP creative linking; real payments; price editor

---

**Сделано**
- `apps/admin-web` — раздел «Монетизация»: обзор, заказы, оплаты, кампании, креативы, placements
- Manual payment confirm с idempotency (`alreadyPaid`), VIP preview, campaign pause/resume/cancel
- Read-only каталог цен и пакетов на странице placements
- Backend (без schema): `GET /admin/monetization/creatives`, `GET /admin/monetization/placements`, enriched admin order/payment responses
- Vitest: `monetization-utils.test.ts` (labels, formatters, action matrix)

**Сохранено без изменений**
- Prisma schema, payment gateway, consumer Flutter, owner monetization flow

**Заложить на будущее**
- Stage 4C: price editor; backend filters for campaign status; audit trail; campaign analytics charts

---

## 2026-09-05 — Этап 4A: Business monetization UI (owner)

**Сделано**
- Owner flow: «Продвинуть бизнес» → products/packages → quote → order → campaigns → analytics
- `features/owner/monetization/` — models, labels, formatters, providers, 8 screens
- `CatalogRepository` — monetization API methods (products, quote, orders, campaigns, creatives)
- Dashboard CTA + «Мои продвижения»; plan screen link to monetization
- VIP creative editor + preview (`VipBannerAd.previewMode`)
- Business switcher invalidates monetization providers
- 12 monetization unit tests (29 total Flutter tests)

**Сохранено без изменений**
- Backend schema, Stage 3B consumer ads, organic API, legacy plan mock-checkout

**Заложить на будущее**
- Stage 4B admin payment confirm UI; widget tests for promote flow screens

---

## 2026-09-05 — Этап 3C: Flutter cross-platform build & QA prep

**Сделано**
- Environment audit: Flutter 3.41.7, Dart 3.11.5; Android SDK/JDK absent on audit machine
- `docs/mobile/ANDROID_BUILD.md` — SDK setup, API matrix, build commands, DEV localhost notes
- `docs/mobile/IOS_BUILD_CHECKLIST.md` — Mac/Xcode checklist (static audit only)
- Real HTTP smoke: all 5 ad placements + event POST against DEV backend
- `flutter clean` → analyze (0 errors) → test (17/17) → `flutter build web` OK
- Backend regression: 109 tests + monorepo build OK
- Minor fix: unused import in `test/ads/ad_models_test.dart`

**Заложить на будущее**
- Install Android Studio + SDK; run `flutter build apk --debug` on device/emulator
- Mac/Xcode iOS build verification; add `INTERNET` to main AndroidManifest before release
- DEV cleartext ATS/network config for Android/iOS physical devices
- `--dart-define` API URL for emulator (`10.0.2.2`) without code edits

---

## 2026-09-05 — Этап 3B: Flutter ad integration

**Сделано**
- Mobile: `features/ads/` — sessionId, serve providers, viewability tracker, VIP banner, sponsored business/promotion blocks
- Home: HOME_VIP_BANNER, HOME_PROMOTIONS, HOME_FEATURED (отдельно от organic)
- Category: CATEGORY_TOP, CATEGORY_BOOST + dedup organic list
- `CatalogRepository.serveAds` / `sendAdEvent` (best-effort, failure isolation)
- `BusinessCard.sponsored` optional label; `visibility_detector` for >=50%/1s impressions
- 16 Flutter tests (ads/)

**Сохранено без изменений**
- Organic `GET /businesses`, backend schema/API, admin/business web, go_router structure

**Заложить на будущее**
- Owner campaign analytics screen; widget tests for VIP/sponsored UI with demo seed

---

## 2026-09-05 — Этап 3A: ad serving, fair rotation, analytics

**Сделано**
- `AdRotationService` — fairSort по `qualifiedImpressions/weight`, tie-break hash(sessionId+campaignId+scope), CATEGORY_TOP position 1 через `lastTopPositionAt`
- `AdServingService` — `GET /monetization/ads/serve` (public), фильтры кампаний, AD_SERVED + servedCount
- `AdEventsService` — `POST /monetization/ads/events`, dedupe AD_IMPRESSION 30 мин, click/action counters
- `AdAnalyticsService` — CTR, action groupBy; owner + admin analytics endpoints
- `CampaignExpirationScheduler` — cron */5 min → COMPLETED
- In-memory rate limit guard (120 req/min/IP) для ad events
- `scripts/seed-monetization-demo.ts`, npm script `seed:monetization-demo`
- 34+ unit tests (rotation, serving, events, analytics, expiration)
- Docs: `MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `schema.prisma` (no migration), `GET /businesses`, `business-rank.util.ts`, Flutter/admin/business web

**Заложить на будущее**
- Flutter widgets, period-scoped aggregates from events, Redis optional upgrade

---

## 2026-09-05 — Этап 2: backend monetization core

**Сделано**
- NestJS module `src/modules/monetization/` — catalog, pricing, availability, orders, manual payments, campaign provisioning, creatives
- Public API: products, packages; owner API: quote, orders, campaigns, creatives
- Admin API: orders, payments (manual confirm), campaigns (pause/resume/cancel), creative moderation
- Pricing precedence (city/category/placement/global), legacy plan discounts (BASIC 0%, PRO 10%, TOP_CITY 15%)
- Package pricing without plan discount; idempotent manual payment confirm
- PostgreSQL advisory lock for placement race protection
- Seed: `PromotionPackageItem` for START/BUSINESS/MAX/NEW_PLACE, `PACKAGE` product
- 42 unit tests (pricing, orders, payments, campaigns, availability, RBAC)
- Docs: `docs/MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `PlanPayment`, mock checkout, `/plans`, `business-rank.util.ts`, schema (no new migration)

**Заложить на будущее**
- Этап 3: ad serving, fair rotation, impression/click analytics

---

## 2026-09-05 — Этап 1: campaign-based monetization schema (additive)

**Сделано**
- Новые модели: `AdPlacement`, `MonetizationProduct`, `ProductPrice`, `Order`, `OrderItem`, `Payment`, `AdCreative`, `AdCampaign`, `AdCampaignPlacement`, `PromotionPackage`, `PromotionPackageItem`
- `AnalyticsEvent`: nullable `campaignId`, `placementId`, `sessionId`; enum AD_* values
- Migration `20260905120000_monetization_campaign_architecture` (create-only, не применена автоматически)
- Seed catalog: placements, products, Uralsk prices, packages (`seed-monetization.ts`)

**Сохранено без изменений**
- `Business.planTier`, `planExpiresAt`, `isFeatured`, `featuredSlot`, `PlanPayment`, `PlanLimitsService`

**Заложить на будущее**
- Этап 2: backend services/API для orders/campaigns

---

**Причина**
- Дашборд owner фильтровал акции как `Map`, API возвращает `PromotionModel` → всегда «Нет активных акций»
- FitLife (Базовый тариф): акция на **карточке заведения**, но **не в ленте города** — это по тарифу

**Сделано**
- Исправлен `ownerDashboardProvider`, единые хелперы статуса/дат акций
- Подсказка: «Видна на карточке · не в ленте города (Базовый тариф)»

---

**Причина расхождения**
- Админка показывает **все статусы** (PENDING, ACTIVE, BLOCKED); публичный API — только **ACTIVE**
- Новые заведения от владельцев создаются как **PENDING** до кнопки «Одобрить»
- «Рядом с вами» и категории фильтруют **радиус 3 км** от GPS; если браузер дал координаты **далеко от выбранного города** — список пустой, хотя в админке заведения есть

**Сделано**
- Mobile: если GPS дальше 25 км от центра выбранного города — поиск от **центра города**
- Скрипт `npm run dev:api:sync` — активирует PENDING (status-only; **A.9.4.4A** убрал backfill координат на **Business**)
- Admin: колонка **«Приложение»** — «В приложении» / «Не в приложении»
- Dev: `npm run dev:restart`, `scripts/dev/restart-all.ps1`, таблица портов в SETUP.md

---

**Сделано**
- Экран категории и блок **«Рядом с вами»** на главной: радиус **3 км** от точки пользователя (GPS или центр города)
- Три блока: **Топ города** → **VIP · Pro** → **Все остальные** (по расстоянию)
- На карточках показывается расстояние, если API вернул `distanceMeters`

**Заложить на будущее**
- Единый вид списка «рядом» на home / search / category

---

## 2026-09-04 — Сортировка каталога по тарифам

**Сделано**
- `GET /businesses`: порядок TOP → PRO → BASIC (с учётом `planExpiresAt`, `featuredSlot`)
- Geo-поиск: сначала тариф, затем расстояние внутри одного tier
- `GET /businesses/recommended/me` — та же сортировка
- Mobile: бейджи **Топ** (TOP_CITY) и **VIP** (PRO)

**Заложить на будущее**
- Денormalized `catalogRank` в БД для больших городов

---

## 2026-09-04 — Mobile owner cabinet parity with business-web

**Сделано**
- Дашборд владельца: KPI за 7 дней, график просмотров, % профиля, тариф, активные акции
- Экраны: `/owner/plan`, `/owner/messages`, `/owner/settings`, `/owner/help`
- Боковое меню кабинета (как навигация business-web)
- Лимиты тарифа в галерее и акциях (как на web)
- API в mobile: `fetchPlans`, `fetchBusinessPlan`, `mockPlanCheckout`

**Заложить на будущее**
- Push-дублирование in-app сообщений
- Видео в галерее

---

## 2026-09-04 — Выбор типа аккаунта при регистрации

**Сделано**
- `POST /auth/verify-code`: опциональный `accountType` (`user` | `business`)
- Новый пользователь получает роль `USER` или `BUSINESS`; существующий `USER` может апгрейдиться до `BUSINESS`
- Mobile: выбор «Пользователь / Бизнес» на экране входа; после входа бизнес → `/owner`
- Business-web: выбор типа на странице логина (по умолчанию «Бизнес»)

**Заложить на будущее**
- Отдельный onboarding для бизнеса без заведения (сразу на форму регистрации)

---

## 2026-09-04 — Phase 2: launchStatus городов + уведомления тарифов

**Сделано**
- `City.launchStatus`: `COMING_SOON` | `LIVE` — admin UI, API cities
- Mobile: другой текст заглушки для городов «скоро откроется»
- In-app уведомления: `PLAN_ACTIVATED`, `PLAN_EXPIRED` при подключении и истечении тарифа
- FAQ по тарифам в business-web «Помощь»

**Заложить на будущее**
- Push (FCM) дублирует in-app уведомления
- Авто-перевод города в LIVE при N заведениях

---

## 2026-09-04 — Тарифы для бизнеса (Basic / Pro / Топ города)

**Сделано**
- Тарифы в БД: `Business.planTier`, `planExpiresAt`, история `PlanPayment` (mock)
- Каталог тарифов и лимиты в `PlanLimitsService`
- API: `GET /plans`, `GET /businesses/:id/plan`, `POST /businesses/:id/plan/mock-checkout`
- Ограничения: фото, активные акции, глубина аналитики, акции в городской ленте
- После mock-оплаты: VIP (`isFeatured`), слот топа для «Топ города»
- Business-web: страница тарифов с кнопкой «Подключить (тест)», дашборд показывает текущий план
- Admin-web: колонка «Тариф», назначение через `PATCH /admin/businesses/:id/plan`
- Автодаунгрейд истёкшего тарифа; лимит фото на странице «Фото» в кабинете
- Инструкция по тарифам: `docs/product/business-tariffs.md`
- Уточнённые лимиты акций: срок, лента, антиспам; даунгрейд лишних акций в DRAFT

**Лимиты**

| | Базовый | Pro | Топ города |
|---|---------|-----|------------|
| Цена | 0 | 9 900 ₸/30 дн. | 19 900 ₸/30 дн. |
| Фото | 5 | ∞ | ∞ |
| Активные акции | 1 | 5 | 10 |
| В ленте города одновременно | 0 | 2 | 5 |
| Срок одной акции | 14 дн. | 90 дн. | 90 дн. |
| Новых акций в день | 1 | 3 | 5 |
| Аналитика | 7 дней | 90 дней | 90 дней |
| VIP в выдаче | нет | да | да |
| Слот «топ города» | нет | нет | да |

**Заложить на будущее**
- Реальная оплата (Kaspi / карта) и webhooks
- Cron даунгрейда при истечении + push-уведомление владельцу
- Лимиты меню/услуг, AI-описания для Top

---

## 2026-09-04 — Mobile: синхронизация города на карте

**Сделано**
- Шапка карты (CityPill) всегда видна и обновляется при смене города
- Карта перелетает к координатам выбранного города (`centerLat/centerLng` из API)
- `CityState` хранит координаты центра; picker передаёт их при выборе
- Единый `invalidateCityScopedProviders` при смене города

---

## 2026-09-04 — Mobile: экран «пустой город»

**Сделано**
- Виджет `EmptyCityView` — «{город} скоро в QalaGo»
- Кнопки: **Выбрать другой город** и **Добавить заведение**
- Показывается на **Главной**, **Категории** и **Карте**, если в городе 0 активных заведений
- Провайдер `cityCatalogTotalProvider` — лёгкая проверка через `meta.total`

**Заложить на будущее**
- Порог «мало контента» (например < 5 заведений) — мягкая подсказка вместо полной заглушки
- Push/email «город запущен» пользователям, выбравшим город заранее
- Admin-флаг `launchStatus: coming_soon | live` вместо только подсчёта бизнесов

---

## 2026-09-04 — Bootstrap категорий + скрытие per-city

**Сделано**
- При `POST /admin/cities` — автокопирование порядка категорий из Уральска
- `CategoryCityOrder.isHidden` — скрыть категорию только в одном городе
- API: `PATCH /admin/categories/:id/city-visibility`
- Admin-web: кнопка «Скрыть/Показать» в категориях; проверка дубликата slug при создании города
- Mobile получает уже отфильтрованный список через `GET /categories?citySlug=`

**Заложить на будущее**
- Копировать порядок из выбранного города (не только uralsk)
- Drag-and-drop сортировка категорий
- Экран «скоро откроем» для пустого города без заведений

---

## 2026-09-04 — Admin: автоподсказки города + координаты

**Сделано**
- API: `GET /admin/geo/search?q=` — geocoding через OpenStreetMap (Nominatim), только ADMIN
- Admin-web: при вводе названия города — выпадающий список подсказок
- При выборе автозаполняются: название, slug, широта, долгота, timezone

**Заложить на будущее**
- Кэш geocoding-ответов на backend (rate limit Nominatim: 1 req/s)
- Платный fallback: Google Places / 2GIS для точности по KZ
- Карта-превью выбранной точки перед сохранением
- Валидация: город уже существует в БД → предупреждение до POST

---

## 2026-09-04 — Admin: управление городами

**Сделано**
- API: `GET/POST /admin/cities`, `PATCH /admin/cities/:id` (только роль **ADMIN**)
- Admin-web: вкладка **«Города»** — форма создания, список, активация/скрытие
- Поля города: `slug`, `nameRu`, `nameKk`, координаты центра, `timezone`, `isActive`
- Автоподсказка slug из названия (транслит)
- Контракт: `docs/architecture/api-contracts.md`, RBAC обновлён

**Заложить на будущее (города)**
| Тема | Зачем |
|------|--------|
| **Bootstrap контента** | При создании города — seed категорий-порядка, demo-бизнесы, VIP-слоты |
| **CITY_ADMIN при запуске** | Wizard: создать город → назначить модератора → checklist перед `isActive` |
| **Границы города** | GeoJSON полигон / `radiusKm` для карты и фильтра «рядом» |
| **Feature flags per city** | Бронирование, доставка, акции — включать по городам |
| **Локализация** | Обязательный `nameKk`, контент на kk для App Store / законодательства |
| **Аналитика** | Дашборд KPI отдельно по городу, воронка запуска |
| **Юридическое** | Оферта, реквизиты, support-контакты per city |
| **Кэш/CDN** | Инвалидация списка городов в mobile/web после POST/PATCH |
| **Миграция slug** | Запретить смену slug после запуска или soft-redirect старых ссылок |
| **Очередь модерации** | Пустой город: UX «скоро откроем» vs полный каталог |

---

## 2026-09-04 — Порядок категорий per-city

**Сделано**
- Таблица `CategoryCityOrder`, API `GET /categories?citySlug=`, admin city-order
- Admin-web: порядок категорий для выбранного города
- Mobile: категории запрашиваются с `citySlug` текущего города

**Заложить на будущее**
- Скрытие категории в конкретном городе (`isVisible` в `CategoryCityOrder`)
- Drag-and-drop сортировка в admin-web
- Копирование порядка из другого города

---

## 2026-09-03 — Admin-web polish + mobile UX

**Сделано**
- Admin shell, KPI, pagination, VIP slots, category inline edit, CITY_ADMIN scope
- Mobile: city picker, owner reviews, search, promotions filters
- Business-web: settings, register, brand theme

**Заложить на будущее**
- Admin-web: split на отдельные routes вместо одной dashboard-страницы
- Geocoding при создании бизнеса (lat/lng из адреса)

---

## Как добавлять записи

```markdown
## YYYY-MM-DD — Краткий заголовок

**Сделано**
- ...

**Заложить на будущее**
- ...
```

Обязательно при каждой заметной фиче (см. `AGENTS.md`).
