# travel-info

## Reference documents

- [HTML_REF/skandi/Travel Info.md](references/skandi-travel-info-md/README.md)

## Change log

- 2026-11-05 — Transfer links open the existing Transfer Information directory using the canonical Travel Info query view. The Wix page controller passes the requested section to the embed; airport context is retained in links. The legacy `/transfers` Wix redirect, publishing and live verification remain outstanding.

- 2026-11-07 — Expanded the canonical published-inventory projection with public hotel amenities, room details, board, policies and practical tour and transfer information. Internal notes and supplier-only fields are excluded. Existing Travel Info sections remain authoritative when already supplied. Live verification requires publication.

## INFO / LOG — 2026-11-11

2026-11-11 — Integrated the supplied responsive layout, searchable airline baggage finder and mobile cabin/walkthrough enhancements. Baggage is read only from the existing published-airline payload; absent details remain unavailable. The page-specific Alexandra launcher was removed, while existing support links remain. Source-tested; live inventory and Wix verification remain required.


## INFO / LOG — 2026-11-27

- Reviewed the live SAS guide and A350-900 aircraft entry. The guide now shows one fare's baggage allowance alongside route-level check-in deadlines. Cabin classes and onboard services have their own tab. The fleet list shows model names.
- Walkaround is a single camera with an aircraft and scene selector. Move points follow staff-authored links. Notes and seat-row close-ups open in the camera. The Previous view control restores the scene and its camera position. Historic cabin images, scene links, and points are read from the same aircraft bundle. A point's coordinates match the full primary image at every width.
- The active sources are the Travel Info triplet and its existing script companions. Aircraft messages use the request ID and airline key returned by the existing Travel Info Wix controller. The response uses the public aircraft facade and published inventory.

- Wix Preview exposed an older SAS link whose label named a different cabin from its destination. Movement controls now use the linked scene title. Matching scene names receive view numbers so customers can distinguish the options.

### Travel Info directory and guides

- 2026-11-27 — The live directory repeated several navigation sections. Opening a hotel guide reproduced a renderer error that also affected the shared transfer, tour, activity, ticket and help views. The active embed uses one search and one category directory. Travel help can be filtered by trip stage.
- Airports group published information under Terminals & check-in, Getting there, Airport services and Flight Info. The Flight Info tab still requests departures and arrivals through the existing Wix controller. Stay times and address, transfer pickup and timing, experience meeting points and ticket entry rules appear at the top of their respective guides when published.
- Hotels, transfers, tours, activities and tickets come from the published Inventory Control projection. Help content comes from the existing Travel Help topics and articles. Staff set airport guide details in Airport guide, hotels in Property Director, and transfer and experience details in Product details.
- Release through the existing Travel Info and Inventory Control receivers. Publish `src/backend/SKANDI_CORE/publicContentInventoryProjection.js` from the linked Wix code branch for additional details already stored in inventory, including hotel addresses and tour meeting points. Verify an airport departure and arrival, a hotel, a transfer and a help article in Wix after publication.

### Inventory branding

- The carrier or airport guide displays the selected Logo. The directory and search use the selected Thumbnail. A custom logo also works as a compact mark when there is no custom thumbnail. Logo and thumbnail assets are kept out of the guide's hero image selection.
- The Flight Info board uses the same published carrier branding as Flight Status. Hotel and other product directory cards use the assigned thumbnail from Inventory Control. Existing receivers serve the compiled pages.

### Swedavia airport information · 2026-11-28

- Published Swedavia airport guides can show dining, shops and passenger services with opening hours and locations, parking and an official booking link, and scheduled direct destinations with operators. The parking block sends travelers to Swedavia to check availability for their dates. Published airport records and SKANDI media still come from Inventory Control. Flight Info uses the separately configured AirLabs board.
- WaitTime v2 covers ARN, BMA and GOT. The wait panel requests the feed when opened or refreshed, uses airport-local time, and displays only estimates with a measurement from the past five minutes. Provider overflow suppresses the estimate. The backend shares one request per endpoint per Wix runtime during the one-minute wait cache. AirportInfo responses are cached for 10–60 minutes and available provider languages for six hours. See the [Swedavia API guides](https://apideveloper.swedavia.se/documentation) and [subscription usage limits](https://apideveloper.swedavia.se/faq).
- The existing page controller handles `TRAVEL_INFO_SWEDAVIA_REQUEST` and replies with `TRAVEL_INFO_SWEDAVIA_RESULT` using the same request ID, airport, language and scope. `src/backend/SKANDI_CORE/swedaviaAirports.web.js` allows public reads through the fixed airport and endpoint allowlists in `swedaviaAirports.js`. It fetches provider data on demand without storing it in Supabase.
- Add separate Wix Secrets Manager entries `SWEDAVIA_AIRPORT_INFO_SUBSCRIPTION_KEY` and `SWEDAVIA_WAIT_TIME_SUBSCRIPTION_KEY` for the corresponding Swedavia products. Publish the two backend files and `src/pages/Travel Info.m43d6.js` along with the source release. The installed receiver uses the standard GitHub build. Verify actual provider responses in Wix at release.
