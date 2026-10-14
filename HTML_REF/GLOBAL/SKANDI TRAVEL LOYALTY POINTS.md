# SKANDI TRAVEL LOYALTY POINTS

STATUS: V12 STATICALLY VERIFIED — REQUIRES LIVE TEST
AREA: GLOBAL / SKANDI CLUB / BOOKING / ALTEA RESERVATIONS
VERSION: V12-TRAVEL-LOYALTY-2026-10-14
LIVE HTML: NO HTML REPLACEMENT REQUIRED

## INFO

Canonical ownership remains:

Customer booking / ALTEA Reservations → `altea_bookings` → deferred travel accrual metadata → Wix Loyalty → immutable `skandi_points_ledger`.

Travel points are earned when a confirmed travel booking is created for an active SKANDI Club member, but they are not added to the member's available account balance at purchase time. The booking stores a `PENDING` `payload.loyaltyAccrual` record containing the locked tier multiplier, eligible booking amount, calculated points, last itinerary activity date, release date and deterministic transaction ID.

The release date is the calendar day after the booking's final known itinerary activity. The hourly backend release job re-checks `altea_segments`, `altea_booking_components`, the booking dates and current booking status before posting. If a booking is cancelled/refunded before release, no points are posted. If the itinerary is extended before release, the release date moves with the final activity.

Wix Loyalty is the points-account authority. On release, the job resolves the member's Wix Loyalty account and calls Wix Loyalty `earnPoints()` using the deterministic SKANDI travel transaction ID as the idempotency key. Only after that succeeds is the immutable `skandi_points_ledger` entry inserted as `POSTED`.

Both customer-facing bookings and ALTEA-created Reservations use the same rule because accrual preparation is attached to the canonical `altea_bookings` lifecycle rather than either frontend.

Existing customer My Profile and ALTEA points totals continue to read `skandi_points_ledger`, so pending travel accruals do not increase the visible/available balance. Once released, the same posted ledger entry becomes visible to both surfaces.

## POINT CALCULATION

Current source-of-truth Club tiers provide an earning multiplier. This implementation uses one base SKANDI Point per USD of the confirmed booking total, multiplied by the member's Club tier multiplier and rounded to the nearest whole point. The multiplier is locked when the booking becomes confirmed so a later tier change does not retroactively change the booking's earning rate. If the confirmed booking total changes before release, points are recalculated from the revised eligible total using the locked multiplier.

## RELEASE SAFEGUARDS

- Never post at booking confirmation.
- Never post before the calendar day after the latest itinerary activity.
- Re-evaluate segment/component end dates before release.
- Do not post cancelled, refunded, rejected or void bookings.
- Use one deterministic transaction ID per booking.
- Use the same deterministic value as Wix Loyalty idempotency key.
- Do not insert `skandi_points_ledger` until Wix Loyalty confirms the earn operation.
- Preserve manual ALTEA Club adjustments as a separate audited flow.

## CHANGE LOG

### 2026-10-14 — Deferred travel points lifecycle repair

- Added canonical deferred travel accrual metadata to `altea_bookings.payload.loyaltyAccrual` for confirmed Club-member travel bookings.
- Added final-itinerary-date revalidation across booking dates, ALTEA segments and booking components.
- Added hourly release processing through `backend/SKANDI_CORE/travelLoyalty.js`.
- Added Wix Loyalty account posting with idempotent `earnPoints()` before creation of the immutable SKANDI points ledger row.
- Kept customer booking and ALTEA Reservations on one shared lifecycle.
- No customer-facing HTML or ALTEA Reservations HTML replacement is required for the runtime calculation fix.
- Wix Loyalty Program must be installed and ACTIVE on the SKANDI TRAVELS site and Club members must have Wix Loyalty accounts before pending travel points can release.

### 2026-10-14 — Wix compile / deployment repair

- Restored the canonical `platformValidation.js` and `platformErrors.js` modules required by the V12 SKANDI_CORE import chain.
- Made custom error metadata access safe for Wix's stricter JavaScript type checker; no error contract or public message behavior was removed.
- Added explicit defaults to optional destructured Supabase transport inputs so Wix does not emit binding-initializer diagnostics.
- Preserved `magazine_manager` as an approved canonical schema; the live Supabase schema exists and must be exposed through the Data API rather than removed or duplicated into `public`.
- Removed direct `error.code` access from deferred travel-point release handling and routed coded errors through the canonical platform error helper.
- No travel-points earning, pending, release-date, cancellation, idempotency or ALTEA ownership rule changed.
- STATICALLY VERIFIED; REQUIRES LIVE TEST after Wix replacement/publish, Supabase Data API schema exposure, and Wix Loyalty installation/configuration.
