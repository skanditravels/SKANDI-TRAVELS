# INFO / LOG — Hotel List

- Route `/destinations/explore/hotel-list`, registered in `src/public/siteMap.js`.
- Wix HTML component `#hotelsEmbed`. `Hotel List.iqhpp.js` binds the existing destination flow bridge for this route. The shared receiver loads the generated Hotel List build.
- The supplied Area Hotels reference informs the list layout. The current embed uses global chrome and published inventory, including the catalog's images, property information and scopes. The supplied preview properties and preview prices were excluded.
- Direct hotel links carry the published property ID and readable slug. Country, destination and area query parameters scope the hotel directory. The same route renders a selected property's detail view when opened from a link.
- Detail and list booking controls use the canonical `/booking` session handoff. A mapped hotel is searched by its Duffel accommodation ID. Add flights supplies the origin and uses the property's linked airport. Unlinked hotels keep their published detail and show “Booking not available.”
- 2026-11-06 — Added the route, listing, property detail, filters, canonical search handoff and links from Explore and the atlas. The original entry identified `#areaHotelsHtml` as the component; the later verification below supersedes that identification. Live booking requires a verified Duffel hotel mapping.
- 2026-11-07 — Wix Studio identifies `#areaHotelsHtml` as the page and `#hotelsEmbed` as its HTML component. Corrected the route and controller binding to the component. Expanded the property detail presentation using published inventory, including rooms, amenities and policies.
