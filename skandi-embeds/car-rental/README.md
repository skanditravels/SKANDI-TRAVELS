# Car Rental

> Current document: `skandi-embeds/car-rental/README.md`. Original reference: `HTML_REF/skandi/Car Rental.md`.


## CHANGE LOG (append-only)

- 2026-10-28 UTC — Updated `skandi-embeds/car-rental/skandi-car-rental.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Car Rental** (`/car-rental`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.


STATUS: NEEDS REVIEW
SLUG: /car-rental
WIX PAGE: Car Rental.i9rnb
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #carRentalEmbed
B-011 VERSION: B-011.1
LAST SYNCED: 2026-09-25

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

### COMMENT SECTION
1. 9/17 1:07PM "Page is not ready style wise. Not planning to change data, see script as definite /Samuel"
2. 9/25 B-011.1: Complete Car Rental presentation rebuild. Existing SKANDI_CAR_RENTAL bridge names, Wix page ID, Duffel Cards search/quote/payment contracts and owned-cart backend are preserved. The page now uses an asymmetric rental-service layout rather than the standard SKANDI hero/card pattern. Fixed the existing checkout payload mismatch by sending `termsAccepted` and `privacyPoliciesAccepted`, which the canonical customerBooking backend already requires. Also prevents `reconciliationRequired` from being presented as a confirmed booking.
3.
***END***

## B-011 OWNERSHIP

- Route: `/car-rental`
- Wix page controller: `/src/pages/Car Rental.i9rnb.js`
- HTML Component: `#carRentalEmbed`
- HTML source: `SKANDI_CAR_RENTAL`
- Parent source: `SKANDI_WIX_PARENT`
- Canonical frontend facade: `/src/backend/SKANDI_CORE/customerBooking.web.js`
- Canonical orchestration core: `/src/backend/SKANDI_CORE/customerBooking.js`
- Canonical Duffel Ground provider module: `/src/backend/SKANDI_CORE/duffelGround.js`
- Customer header/footer: global `masterPage.js`; not duplicated in this embed.

## VERIFIED RUNTIME CHAIN

`#carRentalEmbed`
→ `/src/pages/Car Rental.i9rnb.js`
→ `backend/SKANDI_CORE/customerBooking.web`
→ `backend/SKANDI_CORE/customerBooking`
→ `backend/SKANDI_CORE/duffelGround`
→ Duffel Cars

The canonical backend does not require replacement. The Wix page controller is updated only to add the B-011.1 version marker and dynamic `CAR_RENTAL_HEIGHT` handling required by the longer responsive embed.

## PRESERVED CHILD → PARENT CONTRACTS

- `CAR_RENTAL_READY`
- `CAR_RENTAL_SEARCH`
- `CAR_RENTAL_REPRICE`
- `CAR_RENTAL_PREPARE_SUPPLIER_PAYMENT`
- `CAR_RENTAL_BOOK`
- `CAR_RENTAL_NAVIGATE`
- `CAR_RENTAL_HEIGHT`

## PRESERVED PARENT → CHILD CONTRACTS

- `CAR_RENTAL_BOOTSTRAP`
- `CAR_RENTAL_SEARCH_RESULT`
- `CAR_RENTAL_REPRICE_RESULT`
- `CAR_RENTAL_OFFER_RESULT`
- `CAR_RENTAL_SUPPLIER_PAYMENT_READY`
- `CAR_RENTAL_BOOKING_RESULT`
- `CAR_RENTAL_ERROR`

## VERIFIED PROVIDER FIELDS USED

Search/result cards use only normalized fields already exposed by `duffelGround`:
- rate/offer ID
- total amount/currency
- payment type
- supplier name/logo
- pickup/drop-off location
- vehicle name/code/category/type/transmission/fuel
- maximum passengers
- air conditioning
- baggage
- vehicle image URLs.

Final quote uses:
- pickup/drop-off date/time
- conditions
- privacy policies
- total amount/currency
- payment type
- supplier and vehicle information.

## FUNCTIONAL CORRECTIONS IN B-011.1

The prior HTML validated the supplier privacy checkboxes and booking terms visually but did not send the backend-required acknowledgement flags. The canonical backend requires:

- `termsAccepted === true`
- either `privacyPoliciesAccepted === true` or individual privacy-policy acceptances.

B-011.1 sends both only after the customer has completed the visible acknowledgements.

The prior HTML also treated every `CAR_RENTAL_BOOKING_RESULT` as confirmation. The canonical backend can return `reconciliationRequired: true` when a provider outcome is uncertain. B-011.1 now instructs the customer not to retry and does not display a false confirmation.

## DESIGN RESEARCH TRANSLATED INTO SKANDI

Common current rental-site patterns were used as structural research rather than visual copying:

- search/reservation is a primary page object
- pick-up/return location and date/time are visible immediately
- same/different return is a first-class control
- driver age/residency are part of the initial quote context
- trust/service propositions sit directly after the reservation entry point
- fleet/category storytelling follows the search experience
- results prioritize vehicle, supplier, key attributes, payment type and total price
- booking moves into a clear review/driver/terms/payment sequence
- existing-rental management remains easy to reach.

The resulting SKANDI page deliberately uses an asymmetric editorial + reservation-desk hero, a rental-confidence strip, a live garage-style result list, a review checkout and editorial fleet/road-readiness sections instead of repeating the standard SKANDI page layout.

## PRESENTATION REGISTRY HOOKS

Stable static hooks are included for future Presentation Registry ownership:
- `car-rental-hero`
- `car-rental-search`
- `car-rental-confidence`
- `car-rental-editorial`
- `car-rental-fleet`
- `car-rental-process`
- `car-rental-road-ready`

No parallel content registry or browser-side Supabase access is introduced.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
