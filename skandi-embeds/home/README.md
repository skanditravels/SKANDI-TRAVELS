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
