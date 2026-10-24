# SKANDI Website Builder — implementation and verification

Audit baseline: `skanditravels/SKANDI-TRAVELS`, `main`, commit `ae6316ff4273e904be32f198115c60bb47e34437` (2026-10-24). The remote main branch was rechecked before review preparation. Existing runtime Git sources were used; excluded historical reference files were not read or changed.

## Result

The universal build infrastructure is implemented. All currently complete eligible page sources compile: **Home, Flight Status and RIAINTRA login**. Other pages remain in their existing Wix implementations until their sources and integration are ready. This is not a claim that the entire website has migrated or that a receiver has been installed.

There are **59 canonical route entries**, consisting of **57 page identities and 2 aliases**. **54 page identities are pending source**. Another **32 actual Wix controllers** have reserved unregistered slots because canonical routes or bindings cannot be verified from the allowed runtime sources. The generated structure register and installation CSV cover all entries, exact source destinations and unresolved controllers.

## Confirmed audit findings

- The original test required staging only Home, while the workflow already stages the entire distribution. Tests now check universal behavior rather than a single hardcoded page.
- `scripts/package-lock.json` was absent even though the workflow ran `npm ci` in `scripts/`. The isolated compiler now has pinned dependencies and its own lockfile; the Wix root package is untouched.
- Flight Status's existing triplet uses `flight-status.*`, which the previous `skandi-*`-only discovery missed. Its CSS also contained a Markdown-formatted image URL inside `url(...)`; the source URL is now valid CSS and points to the same Wix asset.
- The compiled mobile wrapper collided with the actual navigation root ID. The wrapper now has its own ID. FIDS and the standalone header shared `searchBtn`; only the generated header copy uses a private ID.
- RIAINTRA login duplicated its logo and logo-text IDs. The endorsement IDs are now unique and retain the original CSS styling. The established login source folder and authentication controller are preserved.
- Approved separate RIAINTRA/ALTEA global component sources are unavailable within the allowed sources. Their scaffold slots are explicit pending inputs; those families are supported by the compiler and tests, but no internal production chrome is fabricated.

## Verification

**VERIFIED — local Node.js 24.22.1:** 18 automated tests pass. Coverage includes multi-page compilation; three separate chrome families; chrome-free exceptions; fragments and legacy document normalization; inline handlers and inert templates; body/document-state CSS; duplicate IDs; syntax; local assets; incomplete/removed sources; aliases/templates/nested routes; preserved message identities; strict receiver resolution, origins, correlation, staff checks and integrity; repeat-build determinism; multi-file Git staging; one generated commit and no second unchanged commit; concurrent-main rejection; no Pages deployment.

**VERIFIED — local Chromium 153.0.8010.0, simulated original parent/iframe:** Home, Flight Status and RIAINTRA login were loaded at 1440×1000 and 390×844. All six runs had zero uncaught JavaScript errors and no document horizontal overflow. Public desktop header/footer appeared; public mobile header/footer were hidden and the bottom navigation appeared. Mobile drawers opened and closed in the full original iframe without requesting an outer resize. RIAINTRA login had no injected public chrome. Network assets were deliberately blocked; this check covers structure, layout and startup messaging, not asset availability or backend data.

**STATICALLY VERIFIED:** canonical route/controller/element ID declarations, imported facade/module existence and named exports, preservation of the existing Home receiver bytes, unchanged backend files, source-family classification, generated output paths and complete replacement files. Multiple component IDs in a controller are supported candidates, not evidence of the currently installed Wix ID.

**REQUIRES LIVE TEST:** the deployed Wix build and all backend/session/provider responses; actual installed element IDs and geometry; same-component universal replacement in Wix; production/preview parent origins; staff permission enforcement; customer authentication/settings/newsletter; Home search/booking flow; FIDS provider data; RIAINTRA login; Alexandra LiveKit chat; and equivalent Home migration behavior. No Wix Studio component, deployment setting, Supabase table, RLS policy, secret or provider configuration was changed.

## Integration blockers retained

- No verified controller mapping: flights, hotels, packages, cruises, activities, transfers, destinations, offers, giftCard, ourNetwork, cookiePreferences, alteaTimatic, serviceDesk and specialAssistance. Route existence alone is not installation evidence.
- `support`, `country` and `bookingFlow` import `openCustomerLogin` from `src/public/customerAuthUi.js`, but the current module exports a route/chrome registry instead. This pre-existing mismatch is reported and left outside this compiler task.
- `myRoster` imports absent `src/backend/FINAL/internalChrome.web.js` and `src/backend/SKANDI_CORE/myRoster.web.js`. These are reported without adding alternate backend wrappers.
- Booking uses eight HTML components and a Wix multi-state flow. Help Center uses separate help/chat components. Those pages require an explicitly verified integration migration before a single receiver can be installed.
- Country and ALTEA Launchpad discover their HTML components by handshake. Their installed IDs are unknown from source; the universal master bridge requires a single unambiguous non-chrome component for those bindings.
- Internal global header/footer source is pending. Existing RIAINTRA/ALTEA chrome must remain installed until approved source is supplied and live migration verified.

## Installation and delivery

Use `README.md` for installation order and workflow operation; use `dist/wix-installation.csv` for every page. Publish the three changed Wix frontend files together, then install the universal receiver only in a verified eligible component. Keep the current Home receiver until its equivalent live test passes. No backend or individual data controller replacement is required.

The ZIP contains complete changed/new files at their canonical repository paths. `docs/website-builder-files.txt` lists the exact file inventory. Source scaffolds are not live embeds. Generated manifests/registers are documentation; only generated `dist/{page}/index.html` files are receiver payloads.

## Upstream references

- GitHub workflow concurrency: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- parse5 HTML parser: https://github.com/inikulin/parse5
- PostCSS selector parser: https://github.com/postcss/postcss-selector-parser
