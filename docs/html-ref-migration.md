# HTML_REF source map and GitHub-to-Wix delivery

Checked against `main` commit `c3ab01f` and rebuilt locally on 2026-10-26.

## Current source inventory

- **84** Markdown files are in `HTML_REF`: **75** contain HTML payloads and **9** are documentation only.
- Every payload has a source-map entry and can be reconstructed byte-for-byte from its split HTML/CSS/JavaScript files. The map covers **279 split-file targets**.
- The latest `/my-profile` source now compiles to `dist/my-profile/index.html`; its canonical Wix component is `#htmlMyProfile`.
- The latest integrated Alexandra widget is `HTML_REF/riaintra/Alexandra Chat.md`. Although that reference is stored under the `riaintra` folder, its own source says it is for customer-facing SKANDI pages. It is mapped to `skandi-embeds/global/alexandra/`; the existing Wix master bridge hides it on RIAINTRA, ALTEA and other internal routes. It is a separate Wix component (`#skandiAlexandraGlobalEmbed`), so it is not emitted as a page `index.html`.
- The older Alexandra chat remains under `skandi-embeds/global/html-ref/`. The duplicate legacy launcher is mapped without replacing the integrated widget's own launcher.
- Booking is a component inside the Home payload. `bookingFlow` resolves to the Home identity, and My Profile draft continuation returns to Home with its cart ID. The old `/booking` Wix route remains only as a query-preserving redirect; the manifest advertises no separate booking page index.

## Build result

The latest source build produced **38 page indexes**, with **14 pending source identities**, **1 integration-blocked page**, **3 aliases**, and **2 internal page build failures**. The public-page gate reports **zero public failures**. The two internal failures are:

| Page | Current compiler issue |
| --- | --- |
| `inventoryControl` | Its JavaScript sidecar contains an `import` that the classic-script compiler cannot execute. |
| `docunetAdmin` | Its source contains a nested iframe; keep the existing Wix integration until that source is migrated. |

The pending and blocked pages remain absent from receiver lookup; their existing Wix integrations are not replaced by this build.

## What failed and what changed

The latest GitHub Actions run before this repair stopped in tests because `HTML_REF/riaintra/Alexandra Chat.md` and `HTML_REF/riaintra/Alexandra Global Launcher.md` were unmapped. The workflow also did not watch `HTML_REF/**`, so an authority-file-only change would not start a build. Both payloads are now classified, and changes to `HTML_REF/**` trigger validation.

The active My Profile HTML had lost the document wrapper and its local sidecar references. The split source has been restored from its existing complete HTML_REF payload, allowing the current compiler to generate the page index without changing the page controller or backend.

## How the Wix delivery works

1. A source commit on `main` triggers `.github/workflows/skandi-app-build.yml`. The workflow runs source and regression checks, then compiles each complete page to `dist/<slug>/index.html` with `dist/manifest.json`.
2. On a successful public build, `scripts/publish-skandi-build.mjs` commits and pushes the generated `dist/` files directly to `main`. This is the existing no-PR publishing path; `dist/**` pushes do not retrigger the workflow.
3. The Wix universal receiver fetches `dist/manifest.json` and the matching `dist/<slug>/index.html` from GitHub `main`, checks the SHA-256 and route identity, and serves that page inside the Wix HTML component.

The builder does not upload page files into Wix Studio. The receiver must already be installed and published in the corresponding Wix component. Repository checks confirm the receiver code and its GitHub fetch path; they cannot confirm the current Wix Studio component placement or test the live page. The SKANDI Wix site is listed as published, but this repair did not modify or publish Wix settings.

The generated source inventory and exact output hashes are in [html-ref-import.json](html-ref-import.json); the compact page/source status table is [html-ref-source-map.csv](html-ref-source-map.csv).
