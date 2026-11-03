# Legal

> Current document: `skandi-embeds/legal/README.md`. Original reference: `HTML_REF/skandi/Legal.md`.


## INFO / LOG

- **Current status:** `B-011.1 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/about/legal`
- **Wix page:** `Legal.nvnld`
- **HTML component:** `#legalHubEmbed`
- **HTML child source:** `SKANDI_LEGAL_HUB`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Linked page controller:** `/src/pages/Legal.nvnld.js`
- **Canonical public facade:** `/src/backend/SKANDI_CORE/legalPolicy.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/legalPolicy.js`
- **Canonical database transport:** `/src/backend/SKANDI_CORE/supabaseServer.js`
- **Operational data authority:** Supabase `public.legal_policies`
- **Editorial/control owner:** Policy Control (same `legal_policies` records)
- **Public policy detail route:** `/about/legal/policies`
- **Global customer header/footer:** `masterPage.js`; this embed does not own global chrome.
- **Last verified:** `2026-09-24`

### Source-of-truth mismatch found and resolved for this page

The supplied Legal HTML performed a browser-side `fetch()` directly to:

`https://www.skanditravels.com/_functions/legalHub`

while the current `Legal.nvnld.js` page controller only handled embed height.

That does not match the B-011 architecture. The current repository also contains a separate legacy `Policy Documents.bd8ok.js` implementation importing `backend/LEGAL/legalPolicyService.web`, but that legacy backend namespace is absent from the current repository and is marked for domain convergence.

B-011.1 resolves the **public `/about/legal` page** by introducing the proper canonical chain below rather than retaining either browser HTTP-function access or a legacy backend namespace.

### Canonical B-011.1 chain

`#legalHubEmbed`
→ `postMessage`
→ `/src/pages/Legal.nvnld.js`
→ `backend/SKANDI_CORE/legalPolicy.web`
→ `backend/SKANDI_CORE/legalPolicy`
→ `backend/SKANDI_CORE/supabaseServer`
→ Supabase `public.legal_policies`

### Policy visibility rules

Only records matching all of the following are exposed:

- `scope = external`
- `status = Published`
- `active = true`
- `deleted_at IS NULL`

The public payload does not expose policy body HTML, approval identity, revision snapshots, internal review fields or deleted records.

### Live database verification

At build verification time, `public.legal_policies` contained **7** records and `public.legal_policy_revisions` contained **26** records.

The published public set included Accessibility, Cookies, Payment Terms, Privacy Policy, Travel Booking Terms, Website Disclaimer, and a Swedish package-travel consumer-rights document.

No database record was created, edited or deleted by this package.

### B-011.1 presentation changes

- Exact Home/customer B-011 palette:
  - `#022e64` navy
  - `#0b3a7a` secondary navy
  - `#285ca8` soft blue
  - `#d7e6ff` light blue
  - `#f6faff` pale
  - `#f7faff` page background
  - `#dbe3ef` border
  - `#eef2f7` soft border
  - `#111` primary text
  - `#555` body text
  - `#667085` muted text
  - `#5FC7CF` cyan.
- Premium global-chrome support colors retained for continuity with header/footer: ink, ink-soft, aqua-soft, ivory, porcelain and champagne.
- Replaced the older centered gradient banner with the lighter editorial Home-aligned hero.
- Rebuilt frequently requested documents as restrained B-011 cards.
- Rebuilt the complete public-policy library as a pale content rail with compact document rows.
- Search remains client-side over the public-safe payload.
- All internal policy navigation now goes through `LEGAL_NAVIGATE` and the Wix page controller; iframe `_top` navigation was removed.
- Removed direct browser call to `/_functions/legalHub`.
- Added stable Presentation Registry hooks for static Legal headings/sections only.
- Dynamic legal documents remain Policy Control / `legal_policies` owned.

### Important architectural scope

This package converges the **customer-facing Legal Hub**.

The existing repository page `/src/pages/Policy Control.ec9p4.js` still imports the legacy/missing `backend/FINAL/policyControl.web` namespace. Policy Control itself therefore remains a separate domain-convergence task. This package does not silently invent its mutation API.

The customer Legal page is nevertheless now reading the canonical `legal_policies` source that Policy Control is intended to manage.

### Message contracts

HTML → page:
- `LEGAL_HUB_READY`
- `LEGAL_HUB_REFRESH`
- `LEGAL_HUB_HEIGHT`
- `LEGAL_NAVIGATE`

Page → HTML:
- `LEGAL_HUB_PARENT_READY`
- `LEGAL_HUB_DATA`
- `LEGAL_HUB_ERROR`

---


- 2026-10-28 UTC — Updated `skandi-embeds/legal/skandi-legal.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Legal Information** (`/about/legal`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE


## APPROVED REPAIR LOG — 2026-10-03 UTC

Policy Documents.bd8ok.js now imports getPublicLegalHub from the existing canonical legalPolicy.web boundary. LEGAL_HUB_DATA/error contract remains unchanged. Internal legal services remain missing; Policy Documents route ownership requires live verification. Source changes prepared; not deployed.


### V12 public legal presentation update — 2026-10-20 UTC

- Confirmed `/src/pages/Legal.nvnld.js` bridges use the current canonical `backend/SKANDI_CORE/legalPolicy.web.js` facade and `legalPolicy.js` public projection. The established public scope/published/active filter, document selector, navigation, PDF link, and acknowledgement submission contracts remain unchanged.
- Updated the complete Wix HTML payload for `#legalHubEmbed` to a restrained SKANDI navy and cyan legal-document design with larger body text, document headings, controls, accessible mobile sizes and mobile table/rail containment. Existing global Wix header/footer remain owned by `masterPage.js`; no second site header is introduced.
- Added a bounded, idempotent initial `READY` message retry to recover when the child iframe starts before the Wix page controller has registered its listener. This retries only the existing message contract; it does not bypass the canonical backend or create local legal records.
- IMPORTANT ROUTE NOTE: The verified canonical V12 route registry currently defines `/about/legal`, NOT the abbreviated `/legal` aliases. Wix page slugs/redirects must be configured separately if `/legal` or `/legal/policies` are explicitly required. No unapproved route mutation is included.
- **STATICALLY VERIFIED** against the current GitHub `main` HTML message contract and backend imports. **REQUIRES LIVE TEST** in the published Wix page for actual data loading, navigation, sizing, PDF links and any required acknowledgement.

> The matching executable source is maintained in this page folder.
