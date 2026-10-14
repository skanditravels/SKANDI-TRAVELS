# SKANDI V12 Content Authority — 2026-10-13
- Inventory Control remains authoritative for Inventory-owned facts and Inventory-owned media.
- Magazine Manager is the presentation/editorial authority for VOY, Newsroom, public page copy, hero/card/ad presentation slots and the shared non-inventory Asset Library.
- Public presentation records use existing `magazine_manager.voy_entities` records with `scope=WEBSITE`; no new Supabase table is introduced.
- `masterPage.js` projects route-specific published presentation data through `SKANDI_PRESENTATION_DATA`.
- Info Control is retired and must not be redeployed.
- The Super Admin page is already absent at repository baseline `4163618a81fed71d7114ac55d3fa003421f145b0` and must not be restored. Permission role tokens such as `SUPER_ADMIN` remain authorization data and are not a page.
- Existing public pages require the V12 Presentation Runtime listener to apply `data-content-id` / `data-media-slot` records. This package migrates Newsroom and VOY; remaining page payloads are not silently rewritten without their authoritative HTML_REF sources.

# SKANDI V12 Content Authority — 2026-10-14
- Inventory Control remains authoritative for Inventory-owned facts and Inventory-owned media.
- Media Control is the presentation/editorial authority for VOY, Newsroom, registered public-page copy, registered presentation-media slots and the shared non-inventory Asset Library.
- Public presentation records continue to use existing `magazine_manager.voy_entities` records with `scope=WEBSITE`; no new Supabase table is introduced.
- Canonical public route ownership remains `src/public/siteMap.js`. The same file now exports the Media Control editorial catalog so editors select registered pages, sections, content hooks and media slots from controlled dropdowns instead of typing route/hook identifiers.
- `masterPage.js` remains the route-specific public presentation projection owner and projects published presentation data through `SKANDI_PRESENTATION_DATA`.
- A registered editorial hook is not proof that a currently published page consumes presentation records. Published Presentation Runtime consumption must be live-tested page by page. At the inspected baseline, Newsroom and VOY contain the runtime listener; other registered page hooks remain source registrations until their authoritative page payload receives and publishes the shared runtime.
- Media Control does not take ownership of policy bodies, Inventory facts, commerce records, customer data, bookings or provider data.
- Info Control is retired and must not be redeployed.
- The Super Admin page remains absent and must not be restored. Permission role tokens such as `SUPER_ADMIN` remain authorization data and are not a page.
- 
## 2026-10-14 Media Control transport rule
Media Control Asset Library calls use the dedicated `backend/SKANDI_CORE/mediaControl.web.js` single dispatch boundary. The web method delegates to the canonical `backend/SKANDI_CORE/assets.js` core. Do not reintroduce a parallel asset implementation or bypass the canonical Asset Library core.
