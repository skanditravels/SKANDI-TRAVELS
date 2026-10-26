# SKANDI Website Builder — current verification

Checked against `skanditravels/SKANDI-TRAVELS` `main` at `c3ab01f` on 2026-10-26, with the repairs in this working copy. No Wix editor settings or Supabase data were changed.

## Source and build

- **38 automated tests passed**, including exact sidecar comparisons for the active My Profile and Alexandra source triplets and workflow coverage for `HTML_REF/**` changes.
- The latest local build produced **38** `dist/<slug>/index.html` pages, **14** pending page identities, **1** blocked integration, **3** aliases and **2** internal compilation failures. The `--fail-on-public` gate reported **0** public failures.
- `/my-profile` (`#htmlMyProfile`) now compiles to `dist/my-profile/index.html`. The output is 276,449 bytes and matches the builder manifest SHA-256 `470cdf3c472a501c9fd84e84742cfa4d3a5db05072ac95771a41317ac66cfc92`.
- Booking is compiled inside Home; `bookingFlow` is a Home alias. My Profile draft continuation links to Home with its cart ID. The Home output contains the booking-flow component, and no separate `/booking` index is advertised.
- The current integrated Alexandra HTML/CSS/JS triplet matches `HTML_REF/riaintra/Alexandra Chat.md`. `src/pages/masterPage.js` binds `src/public/alexandraGlobalBridge.js`; the bridge targets `#skandiAlexandraGlobalEmbed` and blocks `/riaintra`, `/altea`, and other internal routes.

## Workflow failure and repair

The latest observed GitHub Actions run failed in `tests/html-ref-split.test.mjs` before the build because two Alexandra HTML_REF payloads were unmapped. The `push` path filter also omitted `HTML_REF/**`. The mappings, split files, regression assertions, and workflow path filters have been updated. My Profile previously failed compilation because its active HTML fragment lacked the document wrapper and linked CSS/JS sidecars; those files now match the complete HTML_REF payload.

## Delivery boundary

The generated index is served by the Wix universal receiver. The receiver fetches the manifest and matching page index from GitHub `main` and verifies the SHA-256 before rendering it in the Wix HTML component. The workflow pushes generated `dist/` files to `main` after tests and the public build pass. It does not upload source files into the Wix editor.

The SKANDI Wix site is listed as published in the connected account context. Actual receiver installation/publish state for each Wix HTML component, the global Alexandra component placement, and live backend/provider behavior still require checking in the published site. No live Wix or Supabase change was made during this source repair.

## Remaining build statuses

- **Pending source (14):** flights, hotels, packages, cruises, activities, transfers, voy, giftCard, ourNetwork, careers, myRoster, uniformControl, alteaTimatic, serviceDesk.
- **Blocked integration (1):** support.
- **Internal compiler failures (2):** `inventoryControl` (module import in classic bundle) and `docunetAdmin` (nested iframe).

The source and build inventory is in [html-ref-migration.md](html-ref-migration.md). The current installation register and exact compiler report are generated under `dist/` by the build.
