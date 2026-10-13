# SKANDI V12 Content Authority — 2026-10-13

- Inventory Control remains authoritative for Inventory-owned facts and Inventory-owned media.
- Magazine Manager is the presentation/editorial authority for VOY, Newsroom, public page copy, hero/card/ad presentation slots and the shared non-inventory Asset Library.
- Public presentation records use existing `magazine_manager.voy_entities` records with `scope=WEBSITE`; no new Supabase table is introduced.
- `masterPage.js` projects route-specific published presentation data through `SKANDI_PRESENTATION_DATA`.
- Info Control is retired and must not be redeployed.
- The Super Admin page is already absent at repository baseline `4163618a81fed71d7114ac55d3fa003421f145b0` and must not be restored. Permission role tokens such as `SUPER_ADMIN` remain authorization data and are not a page.
- Existing public pages require the V12 Presentation Runtime listener to apply `data-content-id` / `data-media-slot` records. This package migrates Newsroom and VOY; remaining page payloads are not silently rewritten without their authoritative HTML_REF sources.
