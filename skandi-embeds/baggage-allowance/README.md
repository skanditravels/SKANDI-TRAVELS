# Baggage Allowance

> Current document: `skandi-embeds/baggage-allowance/README.md`. Original reference: `HTML_REF/skandi/Baggage Allowance.md`.


## INFO / LOG

- **Status:** V12 Baggage Allowance page + packing-list repair prepared — REQUIRES LIVE TEST
- **System:** SKANDI customer website
- **Route:** `/travel-info/baggage-allowance`
- **Wix page:** `Baggage Allowance.tf8xc`
- **HTML component:** `#baggageInfoEmbed`
- **HTML child source:** `SKANDI_BAGGAGE_PAGE`
- **Page controller:** /src/pages/Baggage Allowance.tf8xc.js
- **Backend/data owner:** `backend/SKANDI_CORE/publicContent.web.js` → `getPublicBaggagePayload` → `publicContent.js` / canonical Travel Info airline projection
- **Global header/footer and CONTENT_AUTO resize owner:** `/src/pages/masterPage.js`
- **Version:** `V12-BAGGAGE-2026.10.11`
- **Last verified:** 2026-10-11
- **Source baseline:** `skanditravels/SKANDI-TRAVELS`, branch `main`, HEAD `04f8206e857c329f5f55d75085a4a8080171ff2e`

### Architecture

`#baggageInfoEmbed`
→ `SKANDI_BAGGAGE_PAGE`
→ /src/pages/Baggage Allowance.tf8xc.js
→ `backend/SKANDI_CORE/publicContent.web.js` → `getPublicBaggagePayload` → `publicContent.js` / canonical Travel Info airline projection
→ existing canonical providers / Supabase where applicable.

The page remains a customer CONTENT_AUTO route. Wix/browser owns vertical scrolling. The child HTML measures its real content height and posts `SKANDI_CONTENT_RESIZE`; `masterPage.js` is the parent-side allowlisted height owner and clamps 680–30000 px. Page and hidden-view opens continue to use the approved global `SKANDI_SCROLL_TOP` contract.

### Change log

- **2026-09-25 — B-011.3:** Separate Travel Info page retained; shared B-011 styling, Travel Info return-rail styling, airline baggage search, existing IDs and current page/backend contracts preserved.
- **2026-10-11 — V12 full correctness audit repair:** Restored the actual Travel Info return rail referenced by B-011.3 documentation; added CONTENT_AUTO document-height reporting and `SKANDI_SCROLL_TOP` handling; synchronized public-data language requests with global master settings; and restricted dynamically rendered airline logo/website URLs to HTTPS. At that time the canonical route still used the historical misspelling `/travel-info/baggage-allowence`.
- **2026-10-11 — V12 dedicated Baggage Allowance repair:** Corrected the canonical public route to `/travel-info/baggage-allowance`; redesigned the page to the current Travel Info V12 visual language; retained the canonical `getPublicBaggagePayload` airline-data chain; expanded airline selection into a full database-backed baggage detail surface; added overall baggage/special-item guidance; and added a local dynamic packing-list builder driven by destination label, departure date + selected hemisphere season, trip length, traveler ages, trip style, laundry access and expected conditions. The packing tool does not create a new database, provider, weather claim or editable reference-data authority. Travel Info now redirects all baggage actions to this page rather than rendering duplicate inline guidance.


- 2026-10-28 UTC — Updated `skandi-embeds/baggage-allowance/skandi-baggage-allowance.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Baggage Allowance** (`/travel-info/baggage-allowance`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

### Verification

STATICALLY VERIFIED:
- complete supplied HTML source inspected
- inline JavaScript syntax checked
- IDs and message contracts checked against the current page/controller architecture
- corrected canonical route checked against the supplied `siteMap.js` replacement
- CONTENT_AUTO sizing and global scroll-to-top contracts checked
- no new database table, backend namespace, provider client or permission boundary introduced

REQUIRES LIVE TEST:
- published Wix HTML-component resizing and section growth
- new `/travel-info/baggage-allowance` Wix route publication/redirect behavior
- live backend/provider/Supabase responses where applicable
- final browser behavior across Wix Studio breakpoints
- global customer language and navigation behavior after publication

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
