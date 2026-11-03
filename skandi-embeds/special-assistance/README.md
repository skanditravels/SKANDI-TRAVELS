# INFO / LOG — Special Assistance

> Current document: `skandi-embeds/special-assistance/README.md`. Original reference: `HTML_REF/skandi/Special Assistance.md`.


- SOURCE FILE: `/HTML_REF/skandi/Special Assistance.md`
- DISPLAY / PAGE NAME: Special Assistance
- SYSTEM AREA: SKANDI
- WIX ROUTE / SLUG: `/travel-info/special-assistance`
- WIX PAGE: existing Wix Special Assistance page; no page-specific controller filename is committed in current GitHub `main`.
- WIX HTML ELEMENT: existing Special Assistance page HTML component; canonical element ID is not present in the current repository/source registry and is intentionally not invented.
- HTML CHILD SOURCE: `SKANDI_ASSISTANCE_PAGE`
- CURRENT STATUS: V12 DYNAMIC SPECIAL ASSISTANCE / ACCESSIBILITY CONVERGENCE PREPARED — REQUIRES LIVE TEST
- SOURCE-OF-TRUTH STATUS: AUTHORITATIVE intended V12 embed payload for the existing Special Assistance page.
- BRIDGE: `/src/pages/masterPage.js` — existing global HTML-component wiring now handles only `SKANDI_ASSISTANCE_PAGE` data/navigation/CONTENT_AUTO resize messages because no page-specific Special Assistance controller exists in current `main`.
- CANONICAL WEB FACADE: `/src/backend/SKANDI_CORE/publicContent.web.js` — existing `getPublicTravelInfoPayload` public facade; no new backend facade.
- CANONICAL CORE: `/src/backend/SKANDI_CORE/publicContent.js` with `/src/backend/SKANDI_CORE/publicContentInventoryProjection.js`.
- SHARED DATABASE TRANSPORT: `/src/backend/SKANDI_CORE/supabaseServer.js`.
- SUPABASE / INVENTORY AUTHORITY: airlines from `travel_info_airlines.inventory_details`, airports from `travel_info_airports.inventory_details`, and HOTEL / TRANSFER / GUIDED_TOUR / ACTIVITY / PARTNER_TICKET records from `inventory_public_entities_v` / canonical Inventory details. The page filters only assistance-related published fields already projected by the canonical public-content chain.
- AUTHORIZATION: unchanged. The page uses the existing `Permissions.Anyone` public-content facade and receives only the same public/customer-visible published projection already used by Travel Info. No secret, service role, RLS bypass or privileged record is exposed to the embed.
- MESSAGE CONTRACTS: child → parent `SPECIAL_ASSISTANCE_READY`, `SPECIAL_ASSISTANCE_REFRESH`, `SPECIAL_ASSISTANCE_NAVIGATE`, `SKANDI_CONTENT_RESIZE`, `MASTER_CONFIG_REQUEST`; parent → child `SPECIAL_ASSISTANCE_DATA`, `SPECIAL_ASSISTANCE_ERROR`, `SKANDI_MASTER_CONFIG`, `SKANDI_SCROLL_TOP`.
- ARCHITECTURAL NOTES: the embed does not query Supabase directly and does not create a second content store. Dynamic cards are generated from canonical airline, airport, hotel, transfer, tour/activity and ticket records only when assistance/accessibility-related fields are actually published. Missing fields are displayed as missing information, never as a claim that a service is unavailable.
- OPEN ISSUE / LIVE DEPENDENCY: current repository does not identify the Special Assistance Wix HTML-component ID. The runtime replacement must therefore be pasted into the existing HTML component on the `/travel-info/special-assistance` page, and live Wix acceptance is required for master-page message wiring and CONTENT_AUTO height behavior.
- LAST VERIFIED: 2026-10-11 — repo `skanditravels/SKANDI-TRAVELS`, branch `main`, HEAD `8ac77cf2bfa3ef90ffd0ebcb420bc101aed7aa6a`; pre-repair Special Assistance blob `eccd8f269ae62d83d709063b0bece7f9e115bec1`; current master-page blob `953d0a998c415d481272c5ee75263cb02f457a46`; public-content core/facade and Inventory projection inspected.

## CHANGE LOG
- 2026-10-11 — V12 dynamic Special Assistance convergence: rebuilt the page in the current Travel Info visual language, retained overall accessibility/mobility/medical planning information, and added a database-backed Accessibility Directory. The directory reads the existing canonical public Travel Info payload and surfaces assistance-related fields from published airlines, airports, hotels, transfers, tours, activities and ticket records. Relevant published assistance articles are also surfaced. No capability is fabricated when a field is absent. Because current `main` has no page-specific Special Assistance controller or canonical component ID, the existing global `masterPage.js` HTML wiring is minimally extended for this source only to load `getPublicTravelInfoPayload`, navigate safely and honor CONTENT_AUTO resize. No database/provider schema or data mutation is included. STATICALLY VERIFIED; REQUIRES LIVE TEST after Wix replacement/publication.
- 2026-09-25 — B-011.3 design/style convergence: kept Special Assistance as a separate Travel Info page, applied shared customer palette, return rail, Travel Info hero/card/CTA/FAQ styling, preserved EN/SV static content and did not create a database/backend implementation at that time. Superseded by the 2026-10-11 V12 dynamic convergence for presentation and data loading; retained here as implementation history.


- 2026-10-28 UTC — Updated `skandi-embeds/special-assistance/skandi-special-assistance.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Special Assistance** (`/travel-info/special-assistance`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
