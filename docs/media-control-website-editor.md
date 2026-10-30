# Media Control public website editor

Prepared 2026-10-30. Automated build and regression coverage runs in GitHub Actions; Media Control changes still require Wix/Supabase live verification.

This change adds a visual editor to Media Control → Website → Visual Website Editor. It is a foundation for full website editing, not a claim that every existing SKANDI page or dynamic component is editable yet. The compiled runtime is injected into every successfully built public route. After the 2026-10-30 integration fixes, 27 of 37 unique public routes are buildable; eight routes still have no authoritative page source, and Support has multiple HTML components without a verified single-component migration. `myTrips` aliases `myProfile`. Internal RIAINTRA and ALTEA pages are outside the public website design catalog.

## Editing and publishing

Select a page and load its verified compiled HTML. Click a heading, paragraph, image, link, card or container. Edit its direct text, link, image description, Supabase image, colors, typography, dimensions, spacing, border, grid/flex layout or order. Appearance can differ for desktop, tablet and mobile. Undo/redo affects the current draft. Save draft does not change the public website. Publish is explicit; discard restores the current publication to the draft; rollback publishes the previous publication.

The editor prefers existing unique content/media/section hooks, then IDs, then DOM paths. Major markup changes can invalidate saved paths and require reselection. A text edit changes the element's direct text node without replacing child controls or their event handlers. New cards/sections, form placeholders, generated pseudo-content, embedded documents, and data-driven content absent from the static preview are not fully covered by this iteration. Prices, availability and booking/account data retain their existing owners.

The preview strips executable page scripts, nested frames and event attributes, and runs only the editor selection runtime in a sandbox. It cannot reproduce live inventory or authenticated views. No fallback fake page is generated when source or a successful build is missing.

## Persistence and images

No database migration or alternate Supabase client is introduced. The existing staff/editorial authorization supplies organization and actor identity. A `campaign` entity named `WEBSITE-DESIGN-<pageKey>` in `magazine_manager.voy_entities` stores draft, publication, previous publication and revision. Writes use revision and updated-at conditions to reject concurrent overwrites. The public projection exposes only the published design. Open public pages request refresh approximately every minute.

Images selected in the editor must be active public IMAGE assets in `skandi-public-assets`. URLs are derived on the server from the canonical asset record. Private assets and client-supplied image URLs cannot be published through this path. Existing Asset Library upload/finalization, permissions, duplicate detection and Supabase transport are reused. No service-role key reaches the browser.

Existing image references remain until replaced. The explicit Copy current image to Supabase action supports images already present in verified compiled source on the allowed Wix, Unsplash and Wikimedia hosts. Other images can be uploaded through Assets / Media. There has been no bulk migration of existing images and no production data write during development.

## External sources

| Source | Implemented use | Verification and limitations |
| --- | --- | --- |
| Wikimedia Commons | Image search, license/source display, explicit raster image import to Asset Library | Search returned a valid response. End-to-end Wix download and Supabase finalize still require a live test. Editor confirms license review; attribution is retained and displayed on published pages. |
| Fontsource | Family search, font selection and version-pinned WOFF2 references | Search returned a valid response earlier; later detail/version probes returned HTTP 403 in this environment. Verify access from Wix before relying on new font selection. Published fonts use pinned CDN references; publication rollback does not query the font API. |
| Openverse | Image discovery and license/source display | HTTP 403 in this environment. Not verified as working. Direct import is restricted to the controlled Wikimedia upload host; other results use the existing manual upload workflow. |

These are relevant open-source/open-content integrations, not every API on the internet. No paid subscriptions, unconfigured AI/OCR/translation services, or credentials were invented. Provider errors remain visible. Free API access does not mean every result has unrestricted usage rights.

## Source and build gaps

Public compiled pages with the new runtime: see `dist/manifest.json`; it is the route and status authority. Current public status after the 2026-10-30 fixes: 27 BUILT, 8 PENDING SOURCE, 1 BLOCKED INTEGRATION and 1 ALIAS. Pending source routes are flights, hotels, packages, cruises, activities, transfers, ourNetwork and careers. Support remains blocked because its Help Center and support chat are separate HTML components without a verified single-component migration. `myTrips` is an alias of `myProfile`. Gift Card denominations are surfaced as products inside The Store.

The previously blocked Cookie Preferences and Special Assistance routes now use the exported EOS web-method facade, with staff checks retained in the backend core. VOY is restored from the complete authoritative `HTML_REF/skandi/VOY.md` source and builds with its blank PDF fallback frame preserved.

Media Control now builds using a dedicated complete-document compiler that preserves interleaved script/style positions, attributes and the existing encoded Email Studio payload. It uses its existing app chrome. Its source references in both HTML_REF locations include the complete updated payload and append this revision's history.

## Validation and installation

Automated regression coverage includes public-only targeting, injection rejection, draft/publication isolation, revision conflicts, rollback, private/missing asset rejection, preservation of child controls, compiler/receiver behavior and the VOY-only blank PDF fallback allowlist. Browser tests exercise the compiled Media Control with mocked Wix messages at 1440px and 390px. These do not replace live Wix/Supabase verification.

Public build coverage: 27 BUILT, 8 PENDING SOURCE, 1 BLOCKED INTEGRATION and 1 ALIAS. Pages without authoritative sources cannot yet be previewed or edited through this visual editor. Internal pages remain outside the public route catalog.

1. The current source is based on the latest `main` and its GitHub Actions workflow builds and commits verified `dist/` outputs and page receivers after merge.
2. Publish the Wix page receivers and master/backend files from the Wix-only package after reviewing the generated build. Preview reads the digest-verified `dist/manifest.json` and public HTML from `main`.
3. Follow the repository receiver/controller installation instructions. This work does not publish Wix or write to Supabase.
4. In a staff session, verify an unauthorized user cannot save, then save an unpublished draft and confirm anonymous visitors see the previous version. Publish a harmless change, verify desktop/mobile rendering and approximately one-minute refresh, and roll it back.
5. Test a real Asset Library upload, current-image copy, attribution display and provider import through Wix. Verify font API availability. Confirm private images cannot be selected or published.
6. Supply the missing approved page sources, resolve the listed public build/integration defects, and add explicit editors for data-driven components and remaining content types before claiming complete no-code coverage.
