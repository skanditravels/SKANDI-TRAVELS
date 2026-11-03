# Passport & Visa

> Current document: `skandi-embeds/passport-visa/README.md`. Original reference: `HTML_REF/skandi/Passport & Visa.md`.


## INFO / LOG

- **Status:** V12 UX / presentation upgrade prepared — REQUIRES LIVE TEST
- **System:** SKANDI customer website
- **Route:** `/travel-info/passport-visa`
- **Wix page:** `Passport & Visa.zohjw`
- **HTML component:** `#passportVisaEmbed`
- **HTML child source:** `SKANDI_PASSPORT_VISA_PAGE`
- **Page controller:** `/src/pages/Passport & Visa.zohjw.js`
- **Canonical facade:** `/src/backend/SKANDI_CORE/publicContent.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/publicContent.js`
- **Backend/data owner:** `backend/SKANDI_CORE/publicContent.web → publicContent`
- **Supabase resources:** `travel_requirements`, `travel_info_articles`, `inventory_public_entities_v` through the existing canonical public-content core
- **External provider boundary:** existing approved travel-requirements adapter used by `searchPublicTravelRequirementsCore`; no provider client is added in this page
- **Authentication/authorization:** public read surface; backend web methods remain `Permissions.Anyone`
- **Global header/footer:** `masterPage.js`
- **Cross-layer messages:** `PASSPORT_VISA_READY`, `PASSPORT_VISA_REFRESH`, `PASSPORT_VISA_LOADING`, `PASSPORT_VISA_DATA`, `PASSPORT_VISA_SEARCH`, `PASSPORT_VISA_SEARCHING`, `PASSPORT_VISA_SEARCH_RESULT`, `PASSPORT_VISA_SEARCH_ERROR`, `PASSPORT_VISA_ERROR`, `PASSPORT_VISA_NAVIGATE`, `PASSPORT_VISA_HOST_READY`
- **Runtime source version:** `V12-PASSPORT-VISA-2026.10.11`
- **Last source verification:** `2026-10-11`, repository `skanditravels/SKANDI-TRAVELS`, branch `main`, HEAD `5b88f891be2b2565e16b94b87545f8e763d98418`

### 2026-10-11 — V12 page upgrade

- Upgraded the customer experience without forcing the page into the exact section layout used by other Travel Info pages. The page keeps its own Passport & Visa information architecture while using the established V12 colors, typography, surfaces, spacing, borders and interaction language.
- Rebuilt the hero as a dedicated travel-document experience with a three-step pre-travel explanation rather than copying another page's hero composition.
- Rebuilt the requirements checker with clearer required/optional fields, keyboard support, accessible live status, date validation, reset behavior and explicit provider/guidance distinction.
- Preserved the exact existing Wix/controller/backend message contract and all canonical V12 backend ownership. No new table, provider, facade, client or duplicate data service is introduced.
- Improved result rendering so connected-provider fields, SKANDI fallback guidance, notices and final-authority guidance are visibly separated.
- Upgraded published destination guidance with a local filter and progressive reveal instead of rendering a large unfiltered wall of destination cards.
- Added the previously documented Travel Info return control to the actual executable markup and kept navigation on the existing `PASSPORT_VISA_NAVIGATE` contract.
- Preserved the page's safety language: a missing or fallback result is not represented as a live Timatic/IATA boarding decision, and final entry/transit decisions remain with official authorities and the operating carrier.
- No `LIVE`, `READY`, `SYNC` or similar decorative status pills were added.

### B-011.3 changes — preserved history

- Kept this as a **separate Travel Info page**. No merged topic-switching page is used.
- Applied the shared B-011 customer palette used by Home and global chrome.
- Added a restrained Travel Info return rail rather than an internal four-topic switcher.
- Restyled the photographic hero into the common Travel Info B-011 treatment.
- Standardized section widths to 1180px, typography scale, card radii, borders, shadows, search panels, CTAs, FAQs and responsive behavior.
- Preserved the supplied page content and functional IDs.
- Preserved existing data/message contracts where this page already has a Wix page bridge.
- Added stable section/content hooks to the hero for the later Presentation Registry pass.
- Did not add page-owned global header/footer.
- Did not add a new database table, RPC, backend service or provider.

### Live data chain

`#passportVisaEmbed`
→ `/src/pages/Passport & Visa.zohjw.js`
→ `getPublicPassportVisaPayload` / `searchPublicTravelRequirements`
→ `/src/backend/SKANDI_CORE/publicContent.web.js`
→ `/src/backend/SKANDI_CORE/publicContent.js`
→ Supabase Travel Info / Inventory public projections and the existing approved travel-requirements provider adapter.

### Verification state

- **STATICALLY VERIFIED:** current `main` page controller still uses `#passportVisaEmbed`, `SKANDI_PASSPORT_VISA_PAGE`, `SKANDI_WIX_PARENT`, `getPublicPassportVisaPayload`, `searchPublicTravelRequirements`, `PASSPORT_VISA_*` message types and the canonical `backend/SKANDI_CORE/publicContent.web` import.
- **STATICALLY VERIFIED:** current facade exports both frontend-callable methods used by the page controller with public-read permissions.
- **STATICALLY VERIFIED:** this HTML's executable JavaScript parses successfully and its dynamic content is escaped before rendering.
- **REQUIRES LIVE TEST:** Wix embed replacement, published backend proxy availability, external travel-requirements provider state, actual Supabase content returned, responsive layout inside the live Wix page, and end-to-end navigation.

---


- 2026-10-28 UTC — Updated `skandi-embeds/passport-visa/skandi-passport-visa.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Passport & Visa** (`/travel-info/passport-visa`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
