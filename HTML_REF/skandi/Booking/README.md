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
