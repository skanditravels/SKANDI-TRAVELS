# Media Control public website editor

Prepared 2026-10-25. STATICALLY VERIFIED / REQUIRES LIVE TEST.

This change adds a visual editor to Media Control → Website → Visual Website Editor. It is a foundation for full website editing, not a claim that every existing SKANDI page or dynamic component is editable yet. Current source availability permits compiled runtime coverage on 20 of 37 unique public routes. Internal RIAINTRA and ALTEA pages cannot be selected or saved as public website designs.

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

Public compiled pages with the new runtime: home, about, legal, policies, cookiePreferences, carRental, tours, newsroom, club, search, theStore, storeCheckout, storeConfirmation, forgotPassword, myProfile, passportVisa, baggageAllowance, travelInsurance, specialAssistance and flightStatus. Use `dist/manifest.json` as the exact key/route authority.

Historical 2026-10-25 result: twelve public routes were PENDING SOURCE. As of 2026-10-26, `/offers` has been retired and `bookingFlow` has a single complete source/controller mapping for `/booking` and `#bookingFlowEmbed`; the next workflow run must record its compiled status. The other routes from that earlier list remain pending: flights, hotels, packages, cruises, activities, transfers, voy, ourNetwork and careers. Gift Card denominations are surfaced as products inside The Store, not as a separate page.

Country and Support remain BLOCKED INTEGRATION: their existing controller integration references the absent `openCustomerLogin` export; Support also has multiple HTML components requiring a verified migration.

Three public builds still fail: Destinations has an external MapLibre stylesheet that cannot be scoped, Travel Info has an unexpected `<` in JavaScript, and SKANDI Collection references the missing `YOUR-IMAGE-URL.jpg` placeholder. These pre-existing content/build defects are not silently replaced with fabricated content. Three unrelated internal failures remain Inventory Control, Docunet Admin and Group Talk.

Media Control now builds using a dedicated complete-document compiler that preserves interleaved script/style positions, attributes and the existing encoded Email Studio payload. It uses its existing app chrome. Its source references in both HTML_REF locations include the complete updated payload and append this revision's history.

## Validation and installation

Automated suite: 29 tests pass, including public-only targeting, injection rejection, draft/publication isolation, revision conflicts, rollback, private/missing asset rejection, preservation of child controls, rerendered targets, stable editorial-hook selection and existing compiler/receiver tests. Browser tests exercise the actual compiled Media Control with mocked Wix messages at 1440px and 390px: select text, change mobile font size, save draft and publish; no JavaScript errors. These are not live Wix/Supabase write tests.

Full build: 33 built, 16 pending, 2 blocked, 2 aliases, 6 failed. The build is not globally green. The compiled runtime is present in 20 public outputs and absent from internal page outputs except the dormant editor library used by Media Control itself.

1. Review this feature branch, which is based on PR #4. Merge PR #4 first; retarget this draft feature PR to main and resolve any intervening changes before merging it.
2. Install the complete changed Wix backend/public/page files together; rebuild and publish the reviewed compiled outputs to main. Preview fetches the digest-verified `dist/manifest.json` and public HTML from main, so a draft branch alone does not enable production previews.
3. Follow the repository receiver/controller installation instructions for the public pages and Media Control. Publish Wix only after review. This work has not published Wix, merged either PR, or altered Supabase content.
4. In a staff session, verify an unauthorized user cannot save, then save an unpublished draft and confirm anonymous visitors see the previous version. Publish a harmless change, verify desktop/mobile rendering and approximately one-minute refresh, and roll it back.
5. Test a real Asset Library upload, current-image copy, attribution display and provider import through Wix. Verify font API availability. Confirm private images cannot be selected or published.
6. Supply the missing approved page sources, resolve the listed public build/integration defects, and add explicit editors for data-driven components and remaining content types before claiming complete no-code coverage.
