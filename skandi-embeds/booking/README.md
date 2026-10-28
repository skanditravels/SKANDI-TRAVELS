# Booking page source

The passenger booking journey is one Wix page at `/booking` with one HTML component: `#bookingFlowEmbed`. Offer search, extras, hotel, transfer, traveler details, seats, payment, confirmation and documents are internal views rendered inside this embed. They are not separate Wix pages or separate HTML components.

## Canonical build input

- `skandi-booking-flow.html` contains all journey view markup and external script dependencies.
- `skandi-booking-flow.css` contains the full booking interface styling.
- `skandi-booking-flow.js` is the single merged journey runtime sidecar.

The `bookingFlow` entry in `src/public/siteMap.js` maps `/booking`, `#bookingFlowEmbed`, the existing Wix controller and this one source triplet. The builder compiles one page to `dist/booking/index.html`.

The Stripe.js dependency stays as a direct script include in the HTML source. The local JavaScript sidecar is supplied to the builder from Git; it is not a second Wix embed.

## Historical source

The former per-step files under `components/` and the duplicate merged copies under `html-ref/` are retained for provenance only. They are superseded by the canonical triplet above and are not individual routes, active Wix components or build inputs. The complete intended Wix HTML remains documented in `HTML_REF/skandi/Booking/README.md`.

The old `/offers` landing route is retired. Passengers now start or resume the complete booking journey at `/booking`.
