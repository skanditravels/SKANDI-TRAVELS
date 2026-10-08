# SKANDI INFO / LOG — Booking V12

- Runtime: `/src/pages/Booking.e8twe.js`, state box `#bookingFlowStates`; shared search handoff `public/bookingSearch.js`; authentication popup `public/customerAuthUi.js` remains canonical.
- Facade: unchanged `backend/SKANDI_CORE/customerBooking.web.js`; implementation: `customerBooking.js`, `bookingMapper.js`, `bookingCart.js`, `bookingSecurity.js`, `bookingReconciliation.js`, corrected `duffelAir.js`, corrected `duffelGround.js`, existing `stripeClient.js`, `supabaseServer.js`.
- Database: existing owned `booking_carts`, cart-item/payment repositories and confirmed-cart ALTEA handoff; no SQL/schema/RLS changes. Database transport, ownership checks and traveler encryption remain canonical.
- Authorization: public search; cart creation requires a resolved server member; cart reads and booking mutations retain SiteMember and owned-cart checks. Client-supplied IDs, amounts, step names and payment messages are never payment authority.
- Sequence: `stateOffer → stateExtras → stateTransfer → stateApis → stateSeatMap → statePayment → stateConfirmation`. Optional `stateDocuments` remains reachable after confirmation. The duplicate confirmation in the request is represented by one existing confirmation state.
- Required editor migration: the published seat state is currently named `seatMapEmbed`. Rename that **state** to `stateSeatMap`; keep HTML component `#seatmapEmbed`. The prior controller's `stateSeats` does not exist on the published page. Missing states now produce an explicit installation error.
- Lifecycle: existing state READY/LOADED contracts remain; `BOOKING_HOST_READY`, `BOOKING_STEP_ACTIVE`, `BOOKING_STEP_INACTIVE`, `BOOKING_RETRY`, and request IDs provide reconnect/recovery. READY retries are read-only; hidden-state mutations, duplicate in-flight actions and forward URL jumps are blocked. Uncertain writes are checked before resubmission.
- Search contract: `BOOKING_SEARCH_LOADING`, `BOOKING_SEARCH_RESULTS`, `BOOKING_SEARCH_SELECT`, `BOOKING_SEARCH_REFRESH`, `BOOKING_BACK_TO_RESULTS`; stateOffer displays results and then the selected cart. Selection resolves only an ID from the controller's current server results.
- Hotel-only carts now begin at Offer, show real empty extras/transfer states, collect the provider-quoted guest count, and show a seats-not-applicable state before Payment. The core never requests airline seats for hotel-only carts.
- Payment recovery retrieves the existing owned PaymentIntent through the canonical Stripe client. The iframe accepts an already authorized intent only for server-side completion; it does not reauthorize it. Processing/reconciliation remains in Payment; only server `Confirmed` status can open Confirmation. Stripe return URL includes the cart ID.
- Transfer limitation: the existing canonical transfer service currently returns no options; users see Transfer and explicitly continue without a transfer. No fictitious transfer service was added.
- Duffel contract status: 2026-10-08 repair keeps the existing provider/client/booking ownership boundaries while preserving current Duffel v2 data that was previously discarded. Air order services are now retained and booked baggage services are combined with included segment baggage for the effective order-level baggage view while the original included allowance is preserved separately. Stays quote `rooms` is normalized as an integer per the current Duffel v2 quote schema. Additional documented Air, Stays and Cars fields are retained without adding parallel database tables.
- Status: **STATICALLY VERIFIED** against the current repository source and current Duffel API documentation; JavaScript syntax and export compatibility checked locally. **REQUIRES LIVE TEST** in Wix/Duffel test mode after installation. This source package has not been deployed.
- Source authority: `skanditravels/SKANDI-TRAVELS`, `main`, commit `a57c32b2631ac083fddefe0c5058ad8dd6bda56b` inspected on 2026-10-08. Existing approved source history is preserved below.
- Last inspected: 2026-10-08 UTC. Supabase booking/inventory schema and current Duffel Air/Stays/Cars contracts were inspected read-only. No GitHub, Wix, Duffel booking or database writes were performed.
- Ownership: HTML → postMessage → Wix page controller → `backend/SKANDI_CORE/*.web.js` → canonical core/client → Supabase / existing providers. The site master retains global header/footer, account and settings ownership.

## CHANGE LOG — 2026-10-08 UTC — Duffel v2 field-preservation repair

- `backend/SKANDI_CORE/duffelAir.js` preserves documented offer emissions, tax breakdown, loyalty support, private fares, payment/service intent data, slice conditions/comparison keys, segment stops, cabin amenities, service metadata and richer order servicing state without changing the existing exports or request endpoints.
- Duffel order `services` are preserved. For order responses, purchased baggage services are joined to their passenger/segment and exposed in the effective `baggages` collection used by the existing SKANDI reservation baggage consumer. The original segment allowance remains available as `includedBaggages`, and the purchased service objects remain available as `bookedBaggageServices` and top-level `services`.
- `backend/SKANDI_CORE/duffelGround.js` corrects Stays v2 quote `rooms` from an array assumption to an integer and retains documented monetary currencies, deposits, commissions, negotiated/public rate data and current Cars quote/booking identifiers and state.
- Existing Supabase first-class booking fields remain unchanged. Provider detail continues to persist through the existing canonical payload/component paths; no new table, duplicate provider store, RLS change or schema migration is required for this repair.
- Existing page message names, state IDs, facade exports, Stripe authorization flow, reconciliation behavior and provider mutation retry rules are unchanged.

## Current state map

| Step | State | HTML component | Complete source |
| --- | --- | --- | --- |
| offer | `stateOffer` | `#bookingOfferEmbed` | `embed/Booking/offer.html` |
| extras | `stateExtras` | `#bookingExtrasEmbed` | `embed/Booking/extras.html` |
| transfer | `stateTransfer` | `#signatureTransferEmbed` | `embed/Booking/transfer.html` |
| apis | `stateApis` | `#apisHtml` | `embed/Booking/apis.html` |
| seats | `stateSeatMap` | `#seatmapEmbed` | `embed/Booking/seats.html` |
| payment | `statePayment` | `#paymentEmbed` | `embed/Booking/payment.html` |
| confirmation | `stateConfirmation` | `#confirmationEmbed` | `embed/Booking/confirmation.html` |
| Documents (optional) | `stateDocuments` | `#bookingDocumentsEmbed` | Existing unchanged source |

## Verification — 2026-10-07 UTC

**VERIFIED locally: 47 checks passed.** Syntax/import/export checks cover all changed modules, all inline scripts and all six merged templates. jsdom checks cover Country catalog rendering, scoped hotel navigation, iframe handshake, Home handoff, result selection, both required checkout sequences, missing states, ownership in the real hotel core with simulated repositories, duplicate actions, errors, seat skip, payment resume and false-confirmation rejection. Published page configuration and catalog were inspected read-only.

**REQUIRES LIVE TEST:** Wix build/publication, real iframe origin and sizing, mobile/desktop visual layout, Wix login/session handoff, live Duffel search/quotes, Stripe test authorization/3DS, supplier confirmation and downstream confirmed-cart processing. No paid booking or production mutation was performed. Local simulated adapters do not prove live integration.

## CHANGE LOG — 2026-10-07 UTC

Search results now reside in stateOffer; all seven requested states are mandatory for supported flight/package/hotel checkout. Hotel-specific paths and existing payment recovery are extended in the canonical core. The old direct hotel-to-payment and automatic transfer skip behavior below is superseded.

## Preserved history — superseded architecture/status

# SKANDI Booking Flow — B-011.1

## INFO / LOG

- **Status:** `B-011.1 — STATICALLY VERIFIED / LIVE END-TO-END TEST REQUIRED`
- **Route:** `/booking`
- **Wix page:** `Booking.e8twe`
- **State box:** `#bookingFlowStates`
- **Controller:** `/src/pages/Booking.e8twe.js`
- **Canonical public facade:** `/src/backend/SKANDI_CORE/customerBooking.web.js`
- **Canonical core:** `/src/backend/SKANDI_CORE/customerBooking.js`
- **Booking repository:** `/src/backend/SKANDI_CORE/bookingCart.js`
- **Booking mapper:** `/src/backend/SKANDI_CORE/bookingMapper.js`
- **Traveler encryption:** `/src/backend/SKANDI_CORE/bookingSecurity.js`
- **Reconciliation:** `/src/backend/SKANDI_CORE/bookingReconciliation.js`
- **Flight/hotel provider:** Duffel
- **Payment provider:** Stripe
- **Customer → ALTEA handoff:** confirmed `booking_carts`
- **Last verified:** `2026-09-24`

## State map

| Step | State | HTML component | Child source |
| --- | --- | --- | --- |
| Offer | `stateOffer` | `#bookingOfferEmbed` | `SKANDI_BOOKING_OFFER` |
| Extras | `stateExtras` | `#bookingExtrasEmbed` | `SKANDI_BOOKING_EXTRAS` |
| Transfer | `stateTransfer` | `#signatureTransferEmbed` | `SKANDI_SIGNATURE_TRANSFER` |
| Travelers / APIS | `stateApis` | `#apisHtml` | `SKANDI_BOOKING_APIS_V2` |
| Seats | `stateSeats` | `#seatmapEmbed` | `SKANDI_BOOKING_SEATMAP` |
| Payment | `statePayment` | `#paymentEmbed` | `SKANDI_BOOKING_PAYMENT` |
| Confirmation | `stateConfirmation` | `#confirmationEmbed` | `SKANDI_BOOKING_CONFIRMATION_V2` |
| Documents | `stateDocuments` | `#bookingDocumentsEmbed` | `SKANDI_BOOKING_DOCUMENTS` |

## B-011.1 corrections

1. **Extras payload mismatch fixed.**
   The canonical backend returns `items`, not `extras`; the HTML now reads `items` and sends only validated service IDs + quantities.

2. **Traveler/APIS payload corrected.**
   The page now preserves Duffel passenger IDs and sends the title values (`mr`, `ms`, `mrs`, `miss`, `dr`) and gender values (`m`, `f`) required by `bookingMapper`.

3. **Hotel-only traveler flow corrected.**
   Hotel carts render guest/contact fields and continue directly to Payment rather than trying to use a flight seat map.

4. **Seat map contract corrected.**
   The canonical backend returns `seatMaps[]` and each seat exposes `availableServices[]`; the HTML no longer expects the old `seatmap.segments` / `seat.services` structure.

5. **Stripe manual-capture state corrected.**
   Payment authorization now accepts Stripe `requires_capture` as the expected successful authorization state before server-side booking commit. The previous UI incorrectly required `succeeded`, which conflicts with the canonical supplier-first/manual-capture backend.

6. **Documents contract corrected.**
   The canonical backend returns `documents.confirmation`, `documents.itinerary`, and `documents.eTickets`; the Documents HTML now renders those exact structures.

7. **Confirmation field names corrected.**
   Flight segments use canonical `departingAt` / `arrivingAt` and carrier objects; hotel confirmation renders from `stayBooking`.

8. **Safe booking resume added.**
   Initial state follows the canonical cart `flow.currentStep` / status and does not use a URL query to jump ahead of the persisted cart.

9. **Reconciliation behavior corrected.**
   If a supplier commit returns `reconciliationRequired`, the controller remains in Payment and tells the customer not to pay again rather than navigating to Confirmation.

10. **Critical backend syntax defect fixed.**
    Current repository `bookingMapper.js` contains a malformed import:
    `backend/SKANDI_CORE/platformValidation.;`
    B-011.1 restores the canonical extensionless import:
    `backend/SKANDI_CORE/platformValidation`

## Transfer status

The current canonical core returns no live Signature transfer options and `storeBookingExtrasCore()` currently returns `requiresSignatureTransfer: false`.

Therefore the normal live flow skips Transfer and goes Extras → Travelers. The Transfer state remains fully synchronized for future canonical transfer inventory without inventing a second transfer source.

## No backend business-rule rewrite

`customerBooking.js` and `customerBooking.web.js` are not replaced by this package. Their current canonical exports were verified against the page controller.

The only backend file modified is `bookingMapper.js`, because the current repository copy has a syntax-invalid import.
