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
\n- Wix Preview exposed an older SAS link whose label named a different cabin from its destination. Movement controls now use the linked scene title. Matching scene names receive view numbers so customers can distinguish the options.\n