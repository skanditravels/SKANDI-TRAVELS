# Media Control public website editor

Prepared 2026-10-30. Automated build and regression coverage runs in GitHub Actions; Media Control changes still require Wix/Supabase live verification.

The 2026-10-30 descriptions and route counts below are historical. For the current Media Control changes and limitations, see the 2026-11-10 section at the end of this document and the current build manifest.

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


## 2026-11-07: editorial and image improvements

The visual editor accepts active, PUBLIC image records from the existing `skandi-public-assets`, `inventory-media`, `aircraft-assets` and `uniform-assets` public buckets. The existing server storage allowlist rejects private or unknown buckets; public site image URLs are limited to these buckets on Supabase domains. This changes selection of existing media only and does not move images or change permissions. The Home card manager retains its existing image ownership rules.

VOY Brand Guard now checks configured blocked and required phrases against the selected issue's available issue, page and article text, showing each finding and its location. It does not score brand quality or claim fact, tone or legal verification. This replaces the previous fixed score of 100.

Current builder result: 51 built, 3 pending source (hotels, packages and Timatic), 1 blocked integration (Support), and 5 aliases. These counts cover public and internal routes. The preview remains a script-free layout preview; data-driven components still require their existing content owners. Live save, publish, upload, image replacement and staff-session behavior remain to be verified with an authorized session.


The VOY launch kit now prepares editable newsletter, social and agency starting drafts from the supplied launch name, angle, page titles and booking link. A campaign parameter is added without dropping existing query parameters or anchors. Staff can edit and save kits through the existing editorial store, then reopen them. These are deterministic starting drafts, not AI-generated campaigns, sent messages, verified claims or finished press and advertising packages.

## 2026-11-10: workspace and website editing upgrade

Media Control now groups its existing functions into Overview, Website, Asset Library, VOY Magazine, Newsroom, Marketing and Review & tools. Its mobile menu replaces the horizontal workspace ribbon. Only interface preferences and selected record identifiers are stored locally; content remains in its current backend. An open edited form is retained across background refreshes and workspace changes, with a browser warning before leaving. These protections are in-memory and do not promise recovery after a restart. Save responses are correlated with their requests, and failed actions are shown beside their originating control where possible.

The shared Asset Library is separate from legacy VOY editorial reference records. Staff can search the loaded assets, filter by bucket, page through them, preview, and use eligible public images through the existing upload and authorization services. Uploads started from the shared library are categorized under `SKANDI / Media Control`; VOY field uploads retain their existing VOY classification. The current asset service loads at most 1,000 active records before client-side search and pagination, so results do not claim to cover additional records. No schema or permission changes are included.

The visual website editor adds structured headings, paragraphs, links and active public library images inside eligible selected containers. It can also edit placeholders on suitable text inputs without changing their values. The server validates the existing version-1 design record, link safety, block count and allowed public assets; publication, revisions, rollback and data ownership retain their existing paths. Added blocks cannot contain arbitrary HTML or scripts or target protected navigation/forms. Existing elements and operational controls are preserved. This is an extension of the existing page editor, not a free-form builder or a replacement for the owners of inventory and other dynamic content. Internal pages and public routes without an approved built source remain outside this editor. The current manifest is the route coverage authority.

Quality Lab now performs limited, deterministic checks on loaded copy and asset metadata. Its source-review guidance does not automatically fact-check claims, and automatic translation remains unavailable without a configured service. These checks do not establish legal, factual or accessibility compliance.

The compiled Media Control page and public-page runtime are generated by the existing build. The changed Wix runtime files are `src/pages/Media Control.chm91.js`, `src/public/websiteDesign.js` and `src/backend/SKANDI_CORE/websiteDesign.js`; they must be deployed together before using the new website design fields. The page receiver and HTML component ID are unchanged. Verify actual Wix publication separately from GitHub build and merge; a preview and local automated tests do not establish that live save, publish, upload, private-asset rejection or rollback work in Wix.

## 2026-11-10: connection checks and editorial integrations

The Connections screen replaces the earlier illustrative API matrix and nonfunctional alias form. Its tests call the existing staff-authorized backend and report actual response or error for Wikimedia Commons, Openverse, Fontsource, Wikipedia research, Canva and Search Console. A successful response with zero results is still a completed request, not evidence that a useful asset or template exists. Results are session-only and provider access from Wix must be tested independently; local network restrictions do not establish provider health in Wix. The existing Website Editor source-search and asset authorization paths remain in place. Wikimedia requests identify the application through `Api-User-Agent`.

Before this update, authenticated live Wix Website Editor searches returned Stockholm image results from Wikimedia Commons and Openverse, and a Fontsource search returned Inter. These checks did not import or publish assets and do not verify the new Connections screen or future provider availability.

Canva template browsing uses Canva's service-app client-credentials flow. Configure Wix Secrets `SKANDI_CANVA_SERVICE_CLIENT_ID` and `SKANDI_CANVA_SERVICE_CLIENT_SECRET` for a Canva service app with `service:brandtemplate:meta:read` access to the intended SKANDI templates. Browsing handles continuation and returns Canva-hosted create links; it does not silently create a design, autofill a template, or copy Canva assets into storage. A connected ChatGPT Canva account does not supply credentials to Wix. The account's plan, service-app permissions and template access must be confirmed with Canva.

Page and article writing assistance uses the same Wix AI transport pattern already present in Alexandra, with the editor's selected copy and language sent to the model. A suggestion does not change the editor until the user applies it, and it is not saved or published automatically. A review is required; AI service access and usage charges depend on the Wix account. This action should not be used to submit confidential employee or customer information.

Destination research uses Wikipedia's Action API to return source links and introductory extracts in the selected supported language. It does not update Inventory Control or assert factual verification; editors must review the cited sources and confirm time-sensitive details with official sources.

The Google Search Console view uses a read-only service-account assertion and is restricted to the SKANDI Travels domain property or its supported URL-prefix properties. Configure Wix Secrets `SKANDI_SEARCH_CONSOLE_SERVICE_ACCOUNT` with the service-account JSON and `SKANDI_SEARCH_CONSOLE_PROPERTY` with the verified property, enable the Google Search Console API, and grant that service account the least access needed to read the property. No private key, assertion or access token is returned to the browser. The report requests up to 25 page rows over 1–90 days and notes reporting delay; it does not guarantee indexing or retrieve every possible row.

VOY's page and issue actions open the browser print dialog so the editor can select Save as PDF for a review copy. The export omits placeholder preview blocks and the illustrative route map. It does not establish PDF/X, color-profile, bleed, image-resolution or other press-readiness. The output is not an automated downloadable PDF and actual browser, iframe, image and print behavior requires live verification.

Deploy `src/backend/SKANDI_CORE/mediaControlIntegrations.js`, `src/backend/SKANDI_CORE/mediaControlSources.js`, `src/backend/SKANDI_CORE/mediaControl.web.js`, and `src/pages/Media Control.chm91.js` together with any prior unpublished website-design runtime files. The compiled page uses the existing receiver and component ID. GitHub build success is not evidence that Wix code, credentials, Canva, Google, external providers or the browser print workflow work in production.
