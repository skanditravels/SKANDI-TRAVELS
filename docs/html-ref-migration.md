# HTML_REF source migration

Base: `skanditravels/SKANDI-TRAVELS` main `18a25b1b339f600cf94bec613a87dd4f5bdec08a`. Review branch: `codex/html-ref-split-sources`.

Extracted all **73 HTML payloads into 273 HTML/CSS/JavaScript files** in the website source structure. Nine Markdown files contain documentation only. All 73 payloads reconstruct exactly from the generated source ranges. The HTML_REF files were not modified.

The primary triplet uses the existing page folder and stem. Additional blocks use `.part-NN` companions so scripts retain their original execution positions, attributes and boundaries. This matters for modules, third-party libraries, scripts between markup, and styles with a media condition. JSON/import maps and inert templates remain in HTML. The Reservations change log accidentally inside its code fence is excluded from the HTML payload.

## Source decisions

- Eight current source sets remain active and unchanged: Home, Flight Status, Travel Info, RIAINTRA login, Success Factors, public header, public footer and mobile navigation. Their reference alternatives are split under `html-ref/` subfolders. The registry now points to your renamed `riaintra-embeds/success-factors/success-factors.*` files.
- Four RIAINTRA/ALTEA global components fill their existing pending folders. Generated shell code handles shared iframe geometry and component ID collisions; extracted source remains unchanged.
- Booking is one public page at `/booking` and one Wix HTML component, `#bookingFlowEmbed`. The canonical build input is `skandi-embeds/booking-flow/skandi-booking-flow.{html,css,js}` with the existing V12 page controller and booking facade. Former step components and duplicate merged copies remain only as superseded historical sources; they are not separate routes or build inputs.
- Nine unregistered controller/component sources are extracted under `_unregistered/`. Their routes are not invented.
- `Uniform Control.md` is a duplicate of the employee Uniform Center, not the admin source. Its extraction is under `uniform-control/html-ref/`; the admin slot remains pending.
- `Customer Service Desk.md` contains an ALTEA Reservations implementation. It is retained under `_unregistered/benbs/html-ref/` and is not assigned to the Customer Service Desk controller.
- The two Media Control documents have identical HTML and share one split target. Both Alexandra chat versions are preserved in distinct folders.
- Destinations, Cookie Preferences and Special Assistance mappings are verified against their existing page/master controllers. No canonical route strings, backend functions, provider operations or database schema changed.

## Validation

- 22 automated tests pass, including coverage of every HTML payload, exact reconstruction, modules/templates, external library order, media stylesheets, linked companion files, and the existing route/receiver tests.
- Build result: **31 built, 16 pending, 2 blocked integrations, 2 aliases, 8 failed**. A split source is not a completed Wix migration. The build command deliberately exits 1 for the eight failures; the workflow will remain red until those are addressed. Failed pages are not advertised by the receiver manifest.
- 62 browser smoke cases (31 pages at 1440×1000 and 390×844) completed with no uncaught JavaScript errors or document-width overflow. Results are recorded in `html-ref-browser-checks.json`. Desktop and mobile checks use a simulated Wix parent with external network requests blocked; they do not prove Wix publication, authenticated data, media/CDN availability or provider operations.

## Remaining compilation failures

| Page | Evidence / remaining work |
| --- | --- |
| destinations | [destinations / destinations] skandi-embeds/destinations/skandi-destinations.html, skandi-embeds/destinations/skandi-destinations.css, skandi-embeds/destinations/skandi-destinations.js: skandi-embeds/destinations/skandi-destinations.html: external stylesheet cannot be scoped: https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css; put its rules in the CSS source |
| travelInfo | [travelInfo / travel-info] skandi-embeds/travel-info/skandi-travel-info.html, skandi-embeds/travel-info/skandi-travel-info.css, skandi-embeds/travel-info/skandi-travel-info.js: skandi-embeds/travel-info/skandi-travel-info.css:1264:7: Unexpected } |
| skandiCollection | [skandiCollection / skandi-collection] skandi-embeds/skandi-collection/skandi-skandi-collection.html, skandi-embeds/skandi-collection/skandi-skandi-collection.css, skandi-embeds/skandi-collection/skandi-skandi-collection.js: skandi-embeds/skandi-collection/skandi-skandi-collection.css: missing asset YOUR-IMAGE-URL.jpg |
| alteaReservations | [alteaReservations / altea-reservations] skandi-embeds/altea-reservations/skandi-altea-reservations.html, skandi-embeds/altea-reservations/skandi-altea-reservations.css, skandi-embeds/altea-reservations/skandi-altea-reservations.js: skandi-embeds/altea-reservations/skandi-altea-reservations.html: executable scripts interleaved with markup; move scripts after page markup before splitting |
| inventoryControl | [inventoryControl / inventory-control] skandi-embeds/inventory-control/skandi-inventory-control.html, skandi-embeds/inventory-control/skandi-inventory-control.css, skandi-embeds/inventory-control/skandi-inventory-control.js: skandi-embeds/inventory-control/skandi-inventory-control.html: module scripts require bundling into the page .js first |
| docunetAdmin | [docunetAdmin / docunet-admin] skandi-embeds/docunet-admin/skandi-docunet-admin.html, skandi-embeds/docunet-admin/skandi-docunet-admin.css, skandi-embeds/docunet-admin/skandi-docunet-admin.js: skandi-embeds/docunet-admin/skandi-docunet-admin.html: nested iframe is not supported; retain the existing Wix integration |
| mediaControl | [mediaControl / media-control] skandi-embeds/media-control/skandi-media-control.html, skandi-embeds/media-control/skandi-media-control.css, skandi-embeds/media-control/skandi-media-control.js: skandi-embeds/media-control/skandi-media-control.html: executable scripts interleaved with markup; move scripts after page markup before splitting |
| groupTalk | [groupTalk / group-talk] skandi-embeds/group-talk/skandi-group-talk.html, skandi-embeds/group-talk/skandi-group-talk.css, skandi-embeds/group-talk/skandi-group-talk.js: skandi-embeds/group-talk/skandi-group-talk.html: external stylesheet cannot be scoped: https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css; put its rules in the CSS source |

## Existing integration blocks

- **support**: src/public/customerAuthUi.js: imported export openCustomerLogin is absent; Help Center and support chat are separate HTML components; preserve them until a verified single-component migration.
- **country**: src/public/customerAuthUi.js: imported export openCustomerLogin is absent

Travel Info is your existing main-branch source: its CSS contains HTML style tags and an unmatched brace. It is preserved for review rather than overwritten by the older reference. The source alternatives and known placeholder asset are not silently repaired with invented code or imagery.

## Use and installation

Merge the reviewed changes into the existing repository, retain the linked companion files, then run SKANDI Website Builder. Edit the split source files directly going forward. This is a source package: paste only an eligible generated `dist/<slug>/index.html` or the verified receiver into Wix, never an HTML file containing relative developer-file references. Keep current Wix implementations for pending, blocked or failed routes. Newly built pages require their existing controller and an authenticated/live integration check before receiver installation. No Wix publication or main-branch merge was performed.

The complete source map is `html-ref-source-map.csv`. Initial import provenance, output hashes and reversible source-range metadata are in `html-ref-import.json`.
