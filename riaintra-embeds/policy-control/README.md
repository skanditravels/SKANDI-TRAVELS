# SKANDI INFO / LOG — V12 DOCUMENT SYSTEM CONVERGENCE

> Current document: `riaintra-embeds/policy-control/README.md`. Original reference: `HTML_REF/riaintra/Policy Control.md`.


## CHANGE LOG (append-only)

- 2026-10-28 UTC — Updated `skandi-embeds/policy-control/skandi-policy-control.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Policy Control** (`/riaintra/success-factors/policy-control`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.


- Source identity: `/HTML_REF/riaintra/Policy Control.md`.
- Display/page name: Policy Control.
- System area: `RIAINTRA`.
- Wix controller: `/src/pages/Policy Control.ec9p4.js`.
- Route/context: `/riaintra/success-factors/policy-control`.
- Wix HTML element: `#policyControlEmbed`.
- Child source: `SKANDI_POLICY_CONTROL`; parent source: `SKANDI_WIX_PARENT`.
- Current status: **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Wix installation/publication.
- Source-of-truth status: complete intended V12 HTML payload below.
- Canonical ownership: `backend/SKANDI_CORE/policyControl.web.js` → `policyControl.js` → `legal_policies` / `legal_policy_revisions`.
- Authentication/authorization: public customer surfaces retain the existing customer/member boundary; internal surfaces require canonical `staffAuth` server authorization. Client-provided roles are not authority.
- Database verification: relevant tables/columns were inspected read-only against the active SKANDI Supabase project on 2026-10-13. No database rows, schema, policies or storage objects were changed.
- Document source archive: the supplied Dropbox folder could not be opened from the available runtime. No Dropbox document content was guessed or imported. The existing Supabase catalog remains authoritative for document definitions/rules until those source files are explicitly ingested.
- Last verified: 2026-10-13 UTC.
- Change log:
  - 2026-10-20 — Controlled-policy Markdown and OCR-layout import repair: supports explicit YAML scalar metadata, Policy Control labels, non-binding provenance, source/live version conflict safeguards, complete controlled source body recognition, numbered sections and lettered subsections, semantic bullet lists and paragraphs; retains no-header mobile editor and existing V12 backend contracts. Source reference: ST-LGL-003_skandi-travels-cookies-policy.md. STATICALLY VERIFIED; REQUIRES LIVE TEST after Wix publication.
  - 2026-10-13 — Converged this surface onto `backend/SKANDI_CORE`, removed legacy/missing backend namespace dependency, preserved supplied HTML design/behavior, and documented the complete runtime chain.
  - 2026-10-20 — Upgraded complete intended HTML embed to a responsive Policy Control editor. Introduced evidence-based, review-before-apply browser document extraction (PDF/DOCX/text/HTML/images), optional client-side OCR of image-only PDF pages, safe date normalization, hierarchical sections, field confidence/source display, and unsaved import drafts. Preserved existing page-controller message names, canonical V12 data/auth boundaries, revision history, publish/archive/delete, and controlled link restrictions. No runtime/backend files or Supabase records were changed. Local Chromium mobile/desktop mock-bridge checks passed; live Wix and external CDN/OCR availability require live tests.
  - 2026-10-22 — New Policy session and unsaved-navigation guard: dedicated create-state banner, Save/Discard/Keep Editing confirmation when opening a different document, creating another policy, or leaving to Documents. Explicit save versus publish confirmation tied to V12 returned status/timestamp, and failed writes never display success. Existing controller, import, editor, preview, revision history and Supabase contracts unchanged. STATICALLY VERIFIED; REQUIRES LIVE TEST for Wix published backend persistence.
  - 2026-10-20 — Removed the embedded Policy Control branded application header (logo, title, clock and staff display) at request. The existing action toolbar now anchors to the top; mobile workspace navigation tracks actual toolbar height when wrapping. Preserved all editing, import, source-review, publication, history, preview, backend message contracts and permissions. Static source/browser checks performed; live Wix publication requires live test.

## Current V12 Implementation / Verification

- Runtime installation: replace the **complete live Wix HTML** in `#policyControlEmbed` with `embed/Policy Control.html`.
- HTML_REF is reference/documentation only; it **must not** be placed in the Wix HTML component.
- Existing Wix page controller: `/src/pages/Policy Control.ec9p4.js`, unchanged. The controller exports/uses the existing `POLICY_READY`, `POLICY_BOOTSTRAP`, `POLICY_LIST_REQUEST`, `POLICY_GET_REQUEST`, `POLICY_SAVE_REQUEST`, `POLICY_PUBLISH_REQUEST`, `POLICY_ARCHIVE_REQUEST`, `POLICY_DELETE_REQUEST`, `POLICY_PDF_REGENERATE_REQUEST` contracts and their responses.
- Existing facade: `backend/SKANDI_CORE/policyControl.web.js`, unchanged. Backend core: `backend/SKANDI_CORE/policyControl.js`, unchanged.
- Database read-only review: `legal_policies` and `legal_policy_revisions` exist. Existing `staffAuth` permission enforcement is unchanged. No schema or SQL migration is required.
- Source text extraction stays in the browser. No imported source file or extracted text is sent to a third-party AI service by this implementation. Third-party JavaScript/WASM assets (PDF.js, Mammoth, Tesseract) are fetched at runtime from their stated CDNs. Some browser/client configurations may block web workers or downloads; those cases display errors rather than claiming successful extraction.
- Import accuracy: only explicit evidence-based values are suggested and visible for review. Dates that cannot be interpreted unambiguously are not populated automatically. The user approves which fields to apply. Imported drafts are not written to Supabase until explicit Save, and never automatically published.
- PDFs without text use local Tesseract OCR when available; OCR for long PDFs may be slow. Up to 80 pages of a PDF are processed in this browser iteration, with explicit partial-import warning if longer.
- PDF regeneration uses the existing V12 backend contract, which may return a pending state while the canonical PDF renderer is unconfigured. This HTML does not fabricate a generated PDF.
- **STATICALLY VERIFIED:** JavaScript syntax with Node.js, DOM creation and functional import workflow under Chromium at 390px and 1440px viewports using a simulated authorized Wix parent response; repository controller message/export shapes inspected.
- **REQUIRES LIVE TEST:** Wix embedded HTML component source parity, published page controller and backend exports, authenticated site-member/staff session, Supabase write/revision behavior, CDN script availability and browser OCR/worker behavior.

## COMPLETE INTENDED HTML

> The matching executable source is maintained in this page folder.
