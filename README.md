# SKANDI Website Builder

Maintain the HTML, CSS and JavaScript source files listed for a page in [the website register](dist/website-structure.md), commit them, then run **Actions → SKANDI Website Builder → Run workflow**. The workflow builds every complete eligible page and commits generated output to `dist/` on `main`. The same workflow validates pull requests without publishing their output. It does not deploy GitHub Pages.

## Sources and page discovery

`src/public/siteMap.js` remains the only route authority. `PAGE_BUILD_INTEGRATIONS` in that same file records source-verified controller bindings without duplicating route paths. The existing master-page chrome rules are shared from this registry. A prepared page needs no workflow list or compiler-array edit when its HTML, CSS and JavaScript are completed.

Source triplets follow their verified route: public pages use `skandi-embeds/`, `/riaintra` pages use `riaintra-embeds/`, and `/riaintra/success-factors/altea` and its descendants use `altea-embeds/`. Existing stems and explicit source mappings remain intact. Flight Status uses `flight-status.{html,css,js}`, and RIAINTRA login uses `riaintra-embeds/riaintra/riaintra.{html,css,js}`. Do not paste into the old `home/index.html` or `flight-status/index.html` preview scaffolds; those are not compiler inputs.

`staffLogin` aliases `riaintra`. `myTrips` is a query view of `myProfile`. They share builds rather than creating duplicate pages. Explicit nested/template routes are resolved from the registry. Controllers without verified routes have reserved slots in `skandi-embeds/_unregistered/`; filling those slots does not invent a route or activate a build.

- **PENDING SOURCE:** all three files are empty or contain `SKANDI_PENDING_SOURCE`. No blank output is produced.
- **INCOMPLETE SOURCE / FAILED:** at least one source is populated while others are empty/missing, or validation fails. The report names exact files.
- **BLOCKED INTEGRATION:** a complete triplet lacks verified bindings/imports or its own global component family.
- **BUILT:** compilation and static integration checks passed. Installation still requires live Wix validation.

When sources are removed or invalidated, the manifest stops advertising their output. Existing compiled HTML is retained for installed legacy URLs. No approved artifact is automatically deleted. `dist/manifest.json` is generated metadata, not a route registry.

## Global components

| Family | Source | Presentation |
| --- | --- | --- |
| Public | `skandi-embeds/global/skandi-{header,footer,mobile-nav}.*` and shell | Desktop header/content/footer; mobile content and fixed bottom navigation |
| RIAINTRA | `riaintra-embeds/global/riaintra-{header,footer}.*` | Independent internal chrome |
| ALTEA | `altea-embeds/global/altea-{header,footer}.*` | Independent operational chrome |
| Chrome-free | Canonical master rules | No injected global chrome |

The separate RIAINTRA and ALTEA global components are now extracted from HTML_REF. Public components are never substituted. The [HTML_REF migration report](docs/html-ref-migration.md) maps all 75 HTML payloads to their split source folders and records source conflicts and pages that need additional integration work. RIAINTRA login and GroupTalk remain chrome-free, as do Booking and the existing store/checkout routes.

## Local validation

Run `npm ci --prefix scripts --ignore-scripts`, `node --test tests/*.test.mjs`, then `node scripts/build-skandi-app.mjs`. `--inventory` checks route/controller evidence. `--scaffold` prepares absent source slots without replacing existing content. Dependencies are pinned in `scripts/package-lock.json`; the Wix root package is unchanged.

Fragments and legacy complete documents are supported. Inline-only legacy code may use comment-only sidecars; identical inline/sidecar content is executed once. Conflicting inline/sidecar code, interleaved scripts, ambiguous async/defer dependencies, unapproved external stylesheets, unresolved CSS imports/nesting and nested iframes are rejected with actionable errors. Native ES modules and validated import maps are retained as module scripts; pinned MapLibre stylesheets remain external inside the isolated Wix HTML-component iframe. Consolidate classic executable code into the page `.js` and styles into its `.css`. Inert templates and JSON payloads are retained. Local markup/CSS assets are checked and embedded; approved absolute Wix/Supabase URLs remain unchanged. Provider availability and JavaScript-generated asset URLs require live checks.

The compiler isolates component JavaScript and document queries, scopes CSS while preserving real `body`/`html` state, and checks duplicate IDs and final inline JavaScript syntax. The generated header search-button DOM ID is privately scoped to avoid the FIDS `searchBtn` collision; canonical source contracts are unchanged. Component-specific iframe resize behavior is adapted only in generated output.

## One-time Wix installation

Use [wix-installation.csv](dist/wix-installation.csv) for exact source-verified page names, canonical routes, controller paths, component ID candidates, source paths, chrome, geometry and blockers.

1. Review and merge the repository changes. Run the workflow on `main`; confirm the generated commit was actually pushed.
2. Publish `src/public/siteMap.js`, `src/public/alexandraGlobalBridge.js` and `src/pages/masterPage.js` together through the existing Wix/Velo Git integration. Their changes add canonical receiver authorization and route compiled mobile messages to the existing owner. Backend files and page data controllers are unchanged.
3. For an eligible page, confirm the actual installed Wix HTML component matches the matrix. Paste the complete `skandi-embeds/receiver/skandi-wix-universal-receiver.html` once into that original component. Do not add another iframe or change the component ID. Confirm desktop and mobile full-width/viewport geometry in Wix; internal CSS cannot resize an incorrectly configured outer iframe.
4. Publish Wix and test the page's original message/data/authentication flows, menus, newsletter and responsive behavior. Only the universal receiver's successful startup opts the page into suppressing separate Wix chrome. Keep the separate cookie-consent component.
5. Keep Home's current `skandi-wix-receiver.html` installation until equivalent live universal-receiver testing passes. Keep all pending, blocked, native commerce and multi-component implementations in place.

The receiver obtains its identity from the owning Wix parent, accepts the production SKANDI origins, `https://editor.wix.com`, and the verified Wix Studio preview origin `https://skanditravels-my-site-2.editor.wix.com`, uses a bounded correlated handshake, resolves the strict manifest mapping, and checks SHA-256 before replacing its own document. It never derives an arbitrary build URL from query parameters, defaults to Home, or grants staff access. Existing backend authorization remains authoritative. Other Wix preview origins must be verified before adding them; do not use a wildcard for `.editor.wix.com` subdomains.

After installation, ordinary page updates need only the source triplet and a workflow run. Pages with an unverified mapping or an explicitly flagged controller migration still require that integration work before first installation.

## Publishing and diagnosis

The publisher stages all generated `dist/` files, checks for actual changes, verifies that `main` has not moved, and pushes without forcing or rebasing stale builds. Repeated unchanged runs create no commit. Generated-only commits do not trigger the workflow again. Concurrent runs are serialized. If branch protection blocks publishing, the job fails with Git's exact error and retains the build artifact for a reviewed PR; no automatic protection bypass is attempted.

An invalid page never replaces its previous HTML. Every failed page remains visible in the manifest and Actions summary. Public SKANDI page failures fail the website-builder workflow; RIAINTRA and ALTEA compilation failures are recorded but do not block the public-page workflow. Pending and blocked pages are listed in the same summary. Unknown receiver routes, denied staff sessions, missing builds and stale CDN digests show explicit load errors.

See [the implementation and verification report](docs/website-builder-verification.md). No Wix receiver installation, production data flow or backend deployment is claimed by a successful compiler run.

## Page documentation and source history

Page reference documents now live alongside their associated embed as `README.md`. Where a folder has several distinct historical references, its README links to their individual `references/.../README.md` files. Documents without a verified page mapping remain under the appropriate global references. Historical HTML is retained when it differs from, or has not been proven equivalent to, the active source.

An embedded HTML payload was removed only when its split files matched the active built page source byte for byte. Its original path and payload hash are recorded in `scripts/html-ref-sources.json`; the surrounding page information and history remain in the relocated README. Earlier import reports under `docs/` describe the original migration and are historical.

Edit the active developer source for normal work. `node scripts/import-html-ref.mjs` checks retained reference payloads and refuses to overwrite edited source; it is not part of the normal build.

Previously generated receivers can already be installed in Wix. For moved internal pages the manifest retains their existing receiver identities while the regenerated receiver files are stored in their new source folders. The installation register points to the new file location. This preserves the existing handshake; live Wix verification is still required.
