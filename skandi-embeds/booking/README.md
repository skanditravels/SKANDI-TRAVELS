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

## Flight results — 2026-11-09

Flight-only results group offers by their complete, provider-identified itinerary and currency. Each outbound or return leg shows local times, duration, stops and available connection times. The customer opens flight details and selects a class and a provider-returned fare; the selected offer ID continues through the existing cart and price refresh. Round trips remain complete supplier offers: outbound and return flights from different offers are not combined.

When requested, the booking host asks the existing Duffel Air client for upsell offers. The backend refreshes the original offer, verifies the current search and exact segment identity, and excludes expired or mismatched alternatives. Airlines may not provide upsells or all cabins. Aircraft, operating carrier, meal details, baggage, conditions and estimated total CO₂ are displayed only when supplied; the CO₂ estimate covers all travelers on the whole offer. Search and booking must be tested in the published environment; prices can change when an offer is refreshed.

City and airport selection types travel with the existing search context. A city code may match a provider airport in that city, while a specifically selected airport must match that airport. The existing receiver and cart ownership boundary are unchanged.

