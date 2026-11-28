# home

## Reference documents

- [HTML_REF/skandi/Home.md](references/skandi-home-md/README.md)
- [HTML_REF/skandi/Home Card Pricing.md](references/skandi-home-card-pricing-md/README.md)

## INFO / LOG — 2026-11-09

The active Home source is `skandi-home.{html,css,js}`. Flight-only From and To fields use the existing published location catalogue and debounced Duffel place suggestions through `Home.n73w8.js` and `travelReference.web`. Multi-airport cities and specific airports remain distinct through the booking handoff. The historical reference remains historical; no destination, hotel or package content ownership changes.

## INFO / LOG — 2026-11-11

2026-11-11 — Integrated the supplied Home mobile presentation and touch interactions into the canonical Home source. Traveler summaries derive from existing counters; calendar and search state remain with the existing Home flow. No message contracts or content owners changed. Source-tested; live Wix/provider validation remains required.

## INFO / LOG — 2026-11-27

The live desktop calendar opened behind the trust cards, and Wix Mobile Preview showed the fixed navigation covering Apply Dates. The calendar now expands below its date field, keeps its controls visible, and uses two months on wide screens and one on narrow screens. Apply saves the selected range. Closing the picker discards the draft. Search uses the complete selected range.

Hotels and SKANDI Collection now expose the same traveler and age controls as the other search tabs. Airport suggestions expand within the form on mobile and preserve the keyboard selection when provider results arrive. Distinct destinations that share an airport remain selectable. Home continues to send the selected trip to the existing `/booking` flow through `Home.n73w8.js`.

## INFO / LOG — Homepage and trip planning

Home at / opens on Flight + Hotel, with Flights and Hotels available alongside it. The calendar starts empty and commits only an applied date range. Travelers, ages, room count and applicable flight options share a single disclosure. SKANDI Collection links to its own published page, and the existing Signature form can reopen saved Signature searches.

A single discovery section uses published Inventory Control cards and suppresses duplicate titles and images. Each shown estimate includes its dates, travelers and eligible pricing basis. Media Control owns the hero image and editorial text through the public presentation bridge. VOY contributes at most one story from a published issue.

Home and Booking use the existing booking search handoff. A recent search keeps travel criteria for up to 30 days in the browser. A resumable draft stays in the same tab, and the cart capability stays private to Booking. Signed-in My Trips uses the existing account and booking ownership. Explore anywhere uses published destinations and opens a date draft for the chosen month and stay length. Its optional budget filters comparable live Flight + Hotel totals in Booking. Empty results let travelers try adjacent dates with the rest of their criteria carried forward.

The active receivers remain #htmlHome and #bookingFlowEmbed. The existing builder supplies these pages and the VOY reader. Wix runtime and live-provider behavior are verified separately from the build.
