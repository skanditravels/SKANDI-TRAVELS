# Tours & Activities — INFO / LOG

> Current document: `skandi-embeds/tours/README.md`. Original reference: `HTML_REF/skandi/Tours & Activities.md`.


STATUS: REQUIRES LIVE TEST
SLUG: /tours-activities
WIX PAGE: Tours & Activities.jxipw
AREA: SKANDI
LIVE HTML: Replacement required in `#toursActivitiesHtml` (this reference contains the complete replacement)
ELEMENT: #toursActivitiesHtml
CANONICAL PAGE CONTROLLER: `src/pages/Tours & Activities.jxipw.js`
V12 FACADE: `src/backend/SKANDI_CORE/toursActivities.web.js`
V12 CORE: `src/backend/SKANDI_CORE/toursActivities.js`
DATA AUTHORITY: Supabase `inventory_public_entities_v`, `inventory_dated_inventory`, `customer_favorites` via `SKANDI_CORE/supabaseServer.js`; Wix Members session for saving favourites.
READ ACCESS: Public. WRITE ACCESS: Authenticated Wix member for saving a favourite. No tour booking/payment write is enabled without confirmed fulfillment ownership.
CONTRACT: Embed emits `TOURS_READY`, `TOURS_SEARCH`, `TOURS_ACTIVITY_OPEN`, `TOURS_NEARBY_SEARCH`, `TOURS_BOOK_ACTIVITY`, `TOURS_FAVORITE`, `TOURS_NAVIGATE`, `UPDATE_SETTINGS`; parent replies with `TOURS_BOOTSTRAP_RESULT`, `TOURS_SEARCH_RESULT`, `TOURS_ACTIVITY_RESULT`, `TOURS_NEARBY_RESULT`, `TOURS_BOOK_RESULT`, `TOURS_FAVORITE_RESULT`, `TOURS_ERROR`, `CUSTOMER_HEADER_STATE`.

## Preserved prior notes

- 2026-09-16: Original HTML_REF last synced; status NEEDS REVIEW.
- 2026-09-17 15:47 — Owner: “This page's pagecode is still using old paths and backends. Review. backend/destinationInventory.web , backend/FINAL/toursActivitiesService.web are wrong.”

## V12 change log

- 2026-10-23: Replaced legacy page imports with canonical `SKANDI_CORE` façade/core; preserved Wix HTML element and original message names. Removed fabricated destinations, availability and prices from runtime. Reads only published Inventory products and configured future dated departures. Localized content, category filtering, detail display and real price/currency are based on canonical Inventory. Optional customer favourites are member-owned and persisted to the existing table. Removed static fabricated times and unsupported exchange-rate assumptions. Fixed missing integrated shell DOM lookups. Checkout stays unavailable until an approved live tour fulfillment/payment integration exists. No external code, database or deployed site has been modified by this package.


- 2026-10-28 UTC — Updated `skandi-embeds/tours/skandi-tours.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Tours & Activities** (`/tours`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

- 2026-11-05 — Canonical route changed to /tours-activities; activities shares that route. Existing historical entries describe the superseded /tours route. Wix path and live links still require verification.

## Open issues / live verification

- As checked 2026-10-23, one public `GUIDED_TOUR` exists; its only dated departure is 2026-10-03 and is in the past. The live page should therefore show the product but no bookable departure. No fabricated future schedule is added.
- Nearby discovery cannot operate because no verified geospatial coordinates contract is established; the backend returns a visible `TOURS_GEO_NOT_CONFIGURED` error rather than false results.
- Full online tour fulfillment and payment are not connected: catalog/dated Inventory is not a supplier reservation confirmation. Booking remains explicitly disabled.
- Test Wix Studio publish, viewer events, Wix member login and RLS-backed favourites in the actual site environment.

## LIVE HTML — Complete intended replacement

> The matching executable source is maintained in this page folder.
