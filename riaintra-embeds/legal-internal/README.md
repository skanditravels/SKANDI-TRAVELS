# SKANDI INFO / LOG — V12 DOCUMENT SYSTEM CONVERGENCE

> Current document: `riaintra-embeds/legal-internal/README.md`. Original reference: `HTML_REF/riaintra/RIAINTRA Legal.md`.


## CHANGE LOG (append-only)

- 2026-10-28 UTC — Updated `skandi-embeds/legal-internal/skandi-legal-internal.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **RIAINTRA Legal** (`/riaintra/success-factors/legal-internal`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.


- Source identity: `/HTML_REF/riaintra/RIAINTRA Legal.md`.
- Display/page name: RIAINTRA Legal.
- System area: `RIAINTRA`.
- Wix controller: `/src/pages/RIAINTRA Legal.xvi17.js`.
- Route/context: `/riaintra/success-factors/legal-internal`.
- Wix HTML element: `#internalLegalHubEmbed`.
- Child source: `SKANDI_INTERNAL_LEGAL_HUB`; parent source: `SKANDI_WIX_PARENT`.
- Current status: **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Wix installation/publication.
- Source-of-truth status: complete intended V12 HTML payload below.
- Canonical ownership: `backend/SKANDI_CORE/policyControl.web.js` → `policyControl.js` → published internal `legal_policies`.
- Authentication/authorization: public customer surfaces retain the existing customer/member boundary; internal surfaces require canonical `staffAuth` server authorization. Client-provided roles are not authority.
- Database verification: relevant tables/columns were inspected read-only against the active SKANDI Supabase project on 2026-10-13. No database rows, schema, policies or storage objects were changed.
- Document source archive: the supplied Dropbox folder could not be opened from the available runtime. No Dropbox document content was guessed or imported. The existing Supabase catalog remains authoritative for document definitions/rules until those source files are explicitly ingested.
- Last verified: 2026-10-13 UTC.
- Change log:
  - 2026-10-13 — Converged this surface onto `backend/SKANDI_CORE`, removed legacy/missing backend namespace dependency, preserved supplied HTML design/behavior, and documented the complete runtime chain.

## COMPLETE INTENDED HTML

> The matching executable source is maintained in this page folder.
