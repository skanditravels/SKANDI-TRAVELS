# SKANDI INFO / LOG — OUR NETWORK + DESTINATIONS MERGED DISCOVERY

## 2026-11-10 — Map controls and network overview

The map title, view modes, search, region filters and optional map key now sit in a single responsive control panel instead of overlapping independent overlays. All four map modes remain available on mobile. The large destination-list overlay and the Trusted Connections chapter moved to the compact network overview on `/about`; the existing accessible map directory and booking handoff remain. This supersedes the older in-page directory and airline-chapter descriptions below. Map records and the existing Wix bridge remain owned by the canonical public network projection. The About page controller supplies that same projection to its new overview.

## 2026-11-06 — Current atlas and public links

The live catalog includes airports and airlines in addition to destinations, hotels and routes. The Wix facade now passes all five collections through. The map uses a lighter OpenFreeMap base, retains readable geographic labels and resolves overlapping map features in one click handler. Desktop detail actions retain their handlers and hotel clusters expand with the current MapLibre API.

Selecting a pin sets `/destinations?pin=<type>:<public-key>` in the top-level Wix URL. A fresh page load restores the selection from Wix. Directory links use the same contract. Collection cards open their specific hotel at `/destinations/explore/hotel-list` using the published hotel ID. The earlier paths below are retained as history.

> Current document: `skandi-embeds/destinations/README.md`. Original reference: `HTML_REF/skandi/Our Destinations.md`.


- Source identity: `/HTML_REF/skandi/Our Destinations.md`. System: SKANDI. Complete intended source; HTML_REF is never imported at runtime.
- Page: Our Destinations; `/src/pages/Our Destinations.wfe5g.js`; route `/destinations`; Wix HTML element `#htmlSkandiMap`.
- Current role: canonical top-level destination/network discovery surface. The existing Our Network map, layout, controls, Collection and airline content are preserved. A new `See our full Destinations list` control opens an in-code full-page directory without leaving the embed.
- Directory behavior: countries are sorted A–Z; destinations are sorted A–Z within each country. Country names navigate to the existing Country route `/destinations/country?country=<slug>`. Destination names navigate to `/destinations/country/destination?country=<slug>&destination=<slug>`.
- Merge boundary: `/src/pages/Our Destinations.ctnh1.js` redirects only the bare `/destinations` index to this page. Existing query-driven destination-flow states remain bound to the unchanged destination flow so Country, Destination, Area, Hotel List and Hotel Detail behavior is preserved.
- Data owner: unchanged `backend/SKANDI_CORE/networkMap.web.js` → `networkMap.js` → `publicContent` RPC boundary → existing public Supabase content RPC. No direct browser database/provider access was added.
- Runtime contract: child `SKANDI_PUBLIC_NETWORK_MAP`, parent `SKANDI_WIX_PARENT`; existing `SKANDI_MAP_READY`, `SKANDI_MAP_REFRESH`, `SKANDI_MAP_DATA`, `SKANDI_MAP_ERROR`, navigation/state/analytics messages remain unchanged.
- Source authority: the user-supplied complete Our Network HTML dated 2026-10-13 is the visual/source baseline for this merge and supersedes older Git bytes where they differ. Existing map design, responsive behavior, IDs, message names and navigation contracts are preserved.
- Verification: **STATICALLY VERIFIED** — complete HTML parsed, IDs checked for duplicates, inline JavaScript syntax checked with Node, and the unchanged Wix page-controller/backend contract was inspected. **REQUIRES LIVE TEST** — Wix embed replacement, published map payload, navigation to live Country/Destination pages and responsive browser behavior.
- No GitHub, Wix, Google Drive or Supabase writes were performed.
- Last inspected: 2026-10-13 UTC.

## PRESERVED HISTORY

# Our Network

STATUS: IN_PROGRESS  
SLUG: /about/our-network  
WIX PAGE: Our Network.wfe5g  
AREA: SKANDI  
LIVE HTML: YES  
ELEMENT: #htmlSkandiMap  
LAST SYNCED: 2026-09-16

### COMMENT HISTORY

1. 2026-09-17 3:02 PM — “Page might be restyled, but keeping same payloads, page not syncing correctly yet” / Samuel
2. 2026-09-17 4:00 PM — “I'm re-working it” / Samuel

## CHANGE LOG

- 2026-10-13 UTC — Preserved the supplied Our Network design/map/layout and merged destination discovery into the page. Added `See our full Destinations list`, an in-code full-screen directory grouped by country with alphabetical country/destination ordering, Country-route navigation and Destination-route navigation. Existing map payload, map modes, booking handoff, Collection, airline, search, panels and responsive behavior remain unchanged.
- 2026-10-13 UTC — Bare `/destinations` is intended to redirect to this merged discovery page through the updated Our Destinations Wix controller; destination detail states remain on their existing destination-flow routes.


- 2026-10-28 UTC — Updated `skandi-embeds/destinations/skandi-destinations.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Our Destinations** (`/destinations`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED HTML

> The matching executable source is maintained in this page folder.
