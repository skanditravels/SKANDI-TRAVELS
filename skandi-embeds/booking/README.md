# Booking page source

The passenger booking journey is one Wix page at `/booking` with one HTML component: `#bookingFlowEmbed`. Offer search, extras, hotel, transfer, traveler details, seats, payment, confirmation and documents are internal views rendered inside this embed. They are not separate Wix pages or separate HTML components.

## Canonical build input

- `skandi-booking-flow.html` contains all journey view markup and external script dependencies.
- `skandi-booking-flow.css` contains the full booking interface styling.
- `skandi-booking-flow.js` is the single merged journey runtime sidecar.

The `bookingFlow` entry in `src/public/siteMap.js` maps `/booking`, `#bookingFlowEmbed`, the existing Wix controller and this one source triplet. The builder compiles one page to `dist/booking/index.html`.

The Stripe.js dependency stays as a direct script include in the HTML source. The local JavaScript sidecar is supplied to the builder from Git; it is not a second Wix embed.

## Historical source

The former per-step files under `components/` and the duplicate merged copies under `html-ref/` are retained for provenance only. They are superseded by the canonical triplet above and are not individual routes, active Wix components or build inputs. The historical consolidated HTML is retained in the reference document below; it is superseded by the active triplet above.

The old `/offers` landing route is retired. Passengers now start or resume the complete booking journey at `/booking`.

## Reference documents

- [HTML_REF/skandi/Booking/README.md](references/skandi-booking-readme-md/README.md)

## Backend dependency and recovery

The booking web module loads the confirmation email service, which requires `@wix/automations`. The dependency, npm lockfile and Wix-generated dependency lock and metadata are kept at the repository root. The connected Wix runtime must resolve the dependency when the site is published; a Git build alone does not verify the published runtime.

When a search expires, the booking view provides a route back to Home. Provider failures are shown as unavailable rather than as an empty set of offers; partial results remain selectable and the search can be retried. The page keeps its existing `#bookingFlowEmbed` receiver and booking message contracts.

## Flight results — earlier implementation, superseded below

Flight-only results grouped offers by their complete, provider-identified itinerary and currency. Each outbound or return leg shows local times, duration, stops and available connection times. The customer opens flight details and selects a class and a provider-returned fare; the selected offer ID continues through the existing cart and price refresh. Round trips remain complete supplier offers: outbound and return flights from different offers are not combined.

When requested, the booking host asks the existing Duffel Air client for upsell offers. The backend refreshes the original offer, verifies the current search and exact segment identity, and excludes expired or mismatched alternatives. Airlines may not provide upsells or all cabins. Aircraft, operating carrier, meal details, baggage, conditions and estimated total CO₂ are displayed only when supplied; the CO₂ estimate covers all travelers on the whole offer. Search and booking must be tested in the published environment; prices can change when an offer is refreshed.

City and airport selection types travel with the existing search context. A city code may match a provider airport in that city, while a specifically selected airport must match that airport. The existing receiver and cart ownership boundary are unchanged.


## Flight results and Travel Planner — 2026-11-09

Flight-only results now show one outbound row per distinct flight and currency. Filters cover stops, available marketing airlines and available classes; sorting includes SKANDI suggestion, price, duration and departure. Selecting **Select Flights** opens the classes returned by the search and the existing upsell service in Economy-to-First order, initially selecting the searched class when available. Ticket cards show provider-supplied baggage, conditions and the complete-trip price. The class filter initially presents the chosen class and its price. Missing information is identified, not fabricated.

A round-trip outbound ticket is a client-side planning selection. Only return flights found in complete supplier offers with the same outbound flight, outbound fare, conditions and currency are shown. Selecting the return submits that real complete offer ID through the existing host and owned-cart/price-refresh validation. The initial outbound selection does not create an owned cart, reserve a flight or imply a standalone one-way price. The planner shows the lowest matching full-trip starting price, then the current cart quote and supplier-provided extras and seat prices as the customer proceeds. Extras and seats may be repriced during checkout; taxes already included in the cart total are not added again.

Recommendations consider distinct full itineraries and offering airlines in the search currency with known valid prices and total flight durations. A candidate must be within both the lowest-priced and fastest ten percent (rounded up, including ties) and belong to a published, active and customer-visible airline in the canonical inventory. Qualifying airlines rank Excelsior, Signature, Select, then Partner. The catalog supplies only airline code and tier to the search response; if classification data cannot be read or no flight meets all criteria, flights remain available and no suggestion is invented. Other currencies are not compared. The criteria are calculated across returned search results, not the airline's entire inventory.

The `/booking` controller, `#bookingFlowEmbed` receiver, route registry, authentication and cart message contracts remain unchanged. Git build results do not prove that Wix has loaded the changed backend or published the current receiver output. Test a real search and a complete checkout in the target Wix environment before claiming end-to-end validation.

## Guest booking and checkout safety — 2026-11-09

This section supersedes the earlier statement that booking authentication is unchanged. A customer may create a flight, hotel or flight-and-hotel cart without signing in. Signed-in carts remain scoped to their Wix member. A guest cart is scoped to a cryptographically random capability: its hash and seven-day expiry are stored in the existing cart payload, while the capability itself stays in the site's session storage. Every visitor-facing cart operation rechecks ownership. It is never sent to the embedded page or placed in a URL. The same browser tab can resume after reload or card verification; opening the booking in another tab or device does not confer access. A guest who loses the session must contact support with their booking reference. Standalone car rental remains on its existing member-only flow.

The traveler step restores the owner's saved details and booking contact; flight-only bookings no longer encounter an unrelated hotel screen, and the currently unconnected experiences screen is not presented. Payment, supplier ordering and reconciliation retain the existing server-side pricing and authorization checks. An atomic cart-state transition permits only one request to create an order; recovery requires supplier order metadata to match the cart and its payment. Package reconciliation does not finalize only its flight component. A supplier rejection only permits another payment attempt after cancellation of the previous authorization is verified; otherwise the booking remains in review. Editing is blocked while a payment session is active.

The existing SKANDI | Travel | Booking Confirmation Wix automation was a draft at the time of this change. Its trigger ID matches the configured SKANDI_BOOKING_CONFIRMATION_TRIGGER_ID secret, and its email action addresses the customerEmail trigger field. Its draft contact mapping and template were adjusted to match the actual confirmation payload and previewed with synthetic guest data. No message had been sent at that time. The guest email contains the confirmed itinerary, booking reference, price and any available fare-change/refund conditions; guest support links do not require a member account.

Guest payment is deliberately fail-closed until the confirmation automation is active and its end-to-end delivery has been verified. The backend requires the Wix secret SKANDI_GUEST_BOOKING_CONFIRMATION_READY to have the value true; an absent or different value prevents guest payment without affecting existing member checkout. Set that flag only after verifying the configured automation, recipient mapping, email content and delivery. Remove or reset it if confirmation delivery is no longer reliable. The site already has the #bookingFlowEmbed receiver; this change does not require a new HTML component. A GitHub build or an email preview does not verify the published Wix runtime, Stripe, Duffel, or actual email delivery.

### Deployment verification — 2026-11-09

The booking source was merged and the Wix site was published after the successful repository build. The booking confirmation automation was activated. A direct email-template test with fictional guest data was received at the site contact address and rendered the booking reference and traveler details.

A direct Wix REST custom-trigger test returned `FAILED_PRECONDITION` (HTTP 428); the separate test-mode activation did not establish delivery through the published Velo backend. This does not establish why the trigger failed or whether Wix's site runtime behaves identically. Keep `SKANDI_GUEST_BOOKING_CONFIRMATION_READY` unset until a synthetic guest test from the published Velo runtime confirms the complete trigger-to-recipient path. The live Stripe and supplier checkout paths also require separate verification. No real booking or charge was made during this test.

Wix's generic automation validator reported warnings that `customerEmail` and other mapped email fields are absent from the static trigger schema. The custom trigger's builder-defined payload may be handled separately; the warnings and their relationship to the rejected REST trigger require runtime investigation rather than an assumed fix.

### Confirmation follow-up — 2026-11-09

A follow-up formats `bookingDate` as `YYYY-MM-DD` and `confirmationDate` as a UTC timestamp without fractional seconds, matching the formats accepted by the configured trigger; invalid dates are omitted. With those formats, both a direct Wix trigger request and a synthetic backend-only Velo test returned successfully. Trigger acceptance is not proof of email delivery. The separate template test was received, but no delivery of a trigger-generated synthetic confirmation was verified. Wix reported the test recipient's deliverability status as `BOUNCED`; the cause has not been established. The temporary diagnostic was removed after testing. Keep the guest-payment readiness secret unset until a trigger-generated confirmation reaches an approved recipient and the published booking flow is verified.

## INFO / LOG — 2026-11-11

2026-11-11 — Integrated the supplied mobile progress header, responsive layout and collapsible filters/planner into the existing single booking flow. The controls reflect the existing journey and do not own a second cart or alter payment/provider contracts. Source-tested; actual Wix, Stripe, Duffel and confirmation delivery require live verification.
