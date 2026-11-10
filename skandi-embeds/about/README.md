# About

> Current document: `skandi-embeds/about/README.md`. Original reference: `HTML_REF/skandi/About.md`.


## INFO / LOG

- **2026-11-10:** Added a compact, searchable country/destination browser and Trusted Connections overview moved from `/destinations`. `About.xcftf.js` separately requests the existing `getPublicNetworkMapData` facade and sends `ABOUT_NETWORK_DATA` or `ABOUT_NETWORK_ERROR`; `ABOUT_NETWORK_REFRESH` retries without replacing the existing About payload. Items link to the existing map selection contract, including derived city IDs. New presentation labels are registered in `src/public/siteMap.js`; network records stay with their existing Inventory/public-network owner. The page controller and site map must be updated in Wix along with the generated embed for the network overview to load. Historical notes below remain for earlier versions.

- **Status:** READY
- **System:** SKANDI
- **Route:** `/about`
- **Wix page:** `About.xcftf`
- **HTML component:** `#aboutEmbed`
- **HTML source:** `/HTML_REF/skandi/About.md`
- **Page source:** `SKANDI_ABOUT_PAGE`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Public data facade:** `backend/SKANDI_CORE/publicContent.web`
- **Public data method:** `getPublicAboutPayload`
- **Public data core:** `backend/SKANDI_CORE/publicContent`
- **Global chrome/settings/routes:** `masterPage.js`
- **Version:** `B-011.4`
- **Last verified:** `2026-09-24`

### Architecture

`About HTML`
→ `postMessage`
→ `/src/pages/About.xcftf.js`
→ `backend/SKANDI_CORE/publicContent.web`
→ `backend/SKANDI_CORE/publicContent`
→ canonical Supabase public-content / Inventory projections

Global customer header/footer, customer settings, shared routes and session behavior remain owned by `masterPage.js`.

### B-011.4 visual convergence

B-011.4 is a presentation-only refinement of the already-converged B-011.3 About architecture.

The page now intentionally matches the current Home design language while retaining its own About-specific layout:

- Home-aligned navy `#022e64`, cyan `#5FC7CF`, white and pale-blue surfaces.
- Compact light editorial hero instead of the former dark animated cinematic hero.
- Navy H1/H2 typography with restrained cyan accents.
- Reduced radii and shadow intensity to match Home.
- Removed high-tech/glow/radar/scan visual effects from the story timeline.
- Converted Our Story to a lighter editorial timeline.
- Converted Collection to a pale Home-style content rail.
- Kept Who We Are as image-led cards, but with restrained gradients and motion.
- Helpful Links remains a different 2×2 editorial mosaic so About does not simply copy Home's layout.
- Final CTA is the one intentional dark navy feature block.
- Existing content, translations, live Inventory collection/partner data and B-011 message contracts are unchanged.
- Existing Presentation Registry hooks are preserved.
- No masterPage, backend, database, RPC or provider change is required.

---


- 2026-10-28 UTC — Updated `skandi-embeds/about/skandi-about.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **About SKANDI** (`/about`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
