# SKANDI INFO / LOG — V12 journey integration

## 2026-11-06 — Explore map and hotel-list route

Explore renders a MapLibre map under Destinations with the selected country's published coordinates. The map pins show catalog destinations and areas with coordinates. When those places have no coordinates, the map can show linked published airports. A list of links remains available if the map cannot start. Hotels opens the new `/destinations/explore/hotel-list` route, scoped to the selected country, destination or area.

2026-11-06 — The requested Wix controller, component and canonical route are `Explore.nxtpn.js`, `#exploreEmbed` and `/destinations/explore`. The existing country experience is retained; its combined destination/hotel journey and Wix publication still require implementation and verification. The earlier names below are historical.

> Current document: `skandi-embeds/country/README.md`. Original reference: `HTML_REF/skandi/Country.md`.


- Source identity: `/HTML_REF/skandi/Country.md`. System: SKANDI. Complete intended source; HTML_REF is never imported at runtime.
- Page: Country; `/src/pages/Country.nxtpn.js`; observed route `/destinations/country`; observed component `#countryDestinationHtml`.
- Entry without a country displays the published country chooser; `?country=<slug>` loads that country. The same complete template is included in the merged Our Destinations shell.
- Data owner: unchanged `backend/SKANDI_CORE/destinationFlow.web.js` → `destinationFlow.js` → existing `inventory_public_entities_v`. Current read-only catalog: 6 countries, 4 destinations, 2 areas and 2 hotels; no synthetic country, hotel, price or location is substituted.
- Shared UI modules: `public/destinationFlowBridge.js`, existing `public/destinationContent.js`, `public/bookingSearch.js` and unchanged `public/siteMap.js`. Public catalog reads remain unauthenticated; booking ownership is enforced by the existing SiteMember facade/core.
- Booking handoff: searches go to `/booking?step=offer&searchId=...`. Only sanitized criteria are kept in Wix browser-session storage for up to two hours; provider offers, prices, login and owned cart creation are resolved in the Booking controller/core. A search URL is tied to its browser session and is not a shareable itinerary.
- Open data dependency: both current hotels (Scandic Continental and Scandic Luleå) lack a verified `details.providerAccommodationId` / `details.duffelAccommodationId`. Property-specific availability stops with an explicit error until Inventory contains the correct provider mapping. Location-based hotel searches remain available. This package does not guess IDs or modify Inventory.
- Contract: `COUNTRY_READY`, `COUNTRY_HOST_READY`, `COUNTRY_PAGE_RESULT`, `UPDATE_SETTINGS`, `COUNTRY_SELECT_COUNTRY`, `COUNTRY_NAVIGATE`, `COUNTRY_SEARCH_OFFERS`, legacy `COUNTRY_SELECT_OFFER`, `RESIZE_IFRAME`, `COUNTRY_ERROR`. `BOOKING_SEARCH_NAVIGATING` acknowledges handoff. Messages require the actual parent window and expected source; referrer-derived target origins are not used.
- Runtime finding: the supplied/published Country embed matches the previous repaired source; its published facade proxy exists. Catalog data is present. The exact original live browser failure was not reproduced in a browser. This replacement removes the inferred-origin dependency, binds the observed ID and retains explicit loading, retry, directory and error states.
- Status: **VERIFIED locally** with Node.js + jsdom and simulated Wix/provider adapters; **STATICALLY VERIFIED** import/export and message contracts; **REQUIRES LIVE TEST** in Wix after installation. This source package has not been deployed.
- Source authority: `skanditravels/SKANDI-TRAVELS`, `main`, commit `e8dd84a3af35797062be60f021cba83a4fc21bf6`, compared with the supplied complete HTML and approved Home/Country V12 repairs. Existing approved source history is preserved below.
- Last inspected: 2026-10-07 UTC. Published route/component configuration, Home/Country proxy exports, and Supabase public catalog/schema were inspected read-only. No GitHub, Wix or database writes were performed.
- Ownership: HTML → postMessage → Wix page controller → `backend/SKANDI_CORE/*.web.js` → canonical core/client → Supabase / existing providers. The site master retains global header/footer, account and settings ownership.

## Preserved history — earlier architecture/status is superseded above

# INFO / LOG — COUNTRY

- Source file identity: `/HTML_REF/skandi/Country.md`
- Display page: Country. System: SKANDI. Version: V12-COUNTRY-2026.10.06.
- Wix controller: `/src/pages/Country.nxtpn.js`.
- Route: `/destinations/country?country=<published-country-slug>`; the published Wix page map was inspected on 2026-10-06. Without a country, show the published country chooser.
- Wix HTML component: the existing component receives this complete HTML. The controller discovers HtmlComponent instances and binds only the component sending `SKANDI_DYNAMIC_COUNTRY_PAGE` READY/UPDATE_SETTINGS. No element ID rename or guessed alias is required; the actual installed ID needs live verification.
- Source-of-truth status: complete user-supplied Country HTML, repaired below. Original CSS and ten-language I18N dictionary retained; narrow operational CSS added. This is the intended V12 source, not a claim of published byte equivalence.
- Facades: `backend/SKANDI_CORE/destinationFlow.web` (`getDestinationFlowCatalog`); `backend/SKANDI_CORE/customerBooking.web` (`searchUnifiedOffers`, `createBookingCartFromOffer`).
- Implementations: `destinationFlow.js`, `customerBooking.js`, canonical booking mappers/repository and Duffel modules. No new backend, client, database query or permission was introduced.
- Shared presentation: `public/destinationContent.js`, extracted from the existing Our Destinations controller and now consumed by both controllers. Routes remain in `public/siteMap.js`; login uses `public/customerAuthUi.js`.
- Supabase: existing `inventory_public_entities_v` public catalog; its columns and PUBLISHED/active/customer_visible projection were inspected read-only. Existing booking ownership and provider persistence remain behind customerBooking.
- Providers: canonical Duffel flight/stays package search and booking validation. No direct browser provider or Supabase access.
- Auth: public catalog/search; the existing backend controls customer identity, cart ownership and offer validation. Sign-in uses the established popup. The page navigates only after the backend returns a cart ID. Messages and client-supplied prices are not authorization.
- Message sources: child `SKANDI_DYNAMIC_COUNTRY_PAGE`, parent `SKANDI_WIX_PARENT`. Request IDs correlate page, search and selection results. The page handles COUNTRY_READY, UPDATE_SETTINGS, COUNTRY_SELECT_COUNTRY, COUNTRY_SEARCH_OFFERS, COUNTRY_SELECT_OFFER, COUNTRY_NAVIGATE, RESIZE_IFRAME. Responses: COUNTRY_HOST_READY, COUNTRY_PAGE_RESULT, COUNTRY_OFFERS_RESULT, COUNTRY_NAVIGATE_TO_OFFER, COUNTRY_ERROR.
- Global chrome/session/settings: masterPage owns header/footer. MASTER_CONFIG_REQUEST, SKANDI_MASTER_CONFIG and CUSTOMER_SETTINGS_STATE/SAVED remain global. A settings save uses the existing header UPDATE_SETTINGS contract; the Country controller does not duplicate global auth/newsletter handlers.
- Failure behavior: bounded read/search requests; read-only READY retries; correlated stale-result rejection; cart selection locked during login and creation, with no automatic mutation retry. Missing content/media/climate is shown as unavailable; no demo records or invented prices.
- Shared projection changes: missing translated fields fall back to stored English values; climate supports Inventory field names (avg_high_c, avg_low_c, daylight_hours, precipitation_mm), retaining unknown metrics as null.
- Verification status: see the package validation report for local execution. REQUIRES LIVE TEST: actual Wix component registration, iframe sizing, published bytes, customer popup/session and Duffel search/cart creation. No Wix/GitHub/Supabase mutation was performed.
- Last inspected: 2026-10-06 UTC.

## CHANGE LOG

- Supplied baseline — standalone Country HTML retained the existing design and ten-language dictionary, but referenced removed footer elements during startup. The old Country controller imported getCountryPage/searchCountryOffers which do not exist in the canonical destinationFlow facade.
- 2026-10-06 UTC — V12 repairs startup and the source handshake, routes the published Country page correctly, reuses canonical public-catalog projections, adds a country-scoped arrival-airport selector, and connects real package offers to the canonical booking cart. The old missing-method contract is superseded by getDestinationFlowCatalog + shared presentation and customerBooking. Our Destinations now imports the extracted shared functions; its complete HTML bytes remain unchanged.


- 2026-10-28 UTC — Updated `skandi-embeds/country/skandi-country.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Destinations** (`/destinations/country`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE HTML


## CHANGE LOG — 2026-10-07 UTC

Unified the Country controller with the existing destination catalog projections. Preserved the supplied design and translations, displayed all six real country choices in local execution, included published destinations below area parents, and routed searches to Booking stateOffer. The global site settings dialog remains master-owned; the embed does not open a second welcome dialog.

## COMPLETE INTENDED HTML

> The matching executable source is maintained in this page folder.
