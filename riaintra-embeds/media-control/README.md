# media-control

## INFO / LOG

- 2026-11-10 — Kept the mobile navigation above both slide-out drawers and ended the drawers above the safe-area-aware bottom bar. This prevents the global drawer, including its sign-out control, from covering the Media Control menu button. The six mobile items share space responsively, with full accessible labels even where visual labels need truncation. The adjustment is scoped to Media Control.

- 2026-11-10 — Removed Media Control's separate app header. Its content menu now mounts into the existing RIAINTRA header on desktop and into the shared RIAINTRA mobile navigation bar on mobile. The global staff menu remains a separate action. The controls keep the existing searchable workspace drawer, keyboard focus and closed-state behavior; standalone source retains an inline fallback. The drawer and overview identify the workspace as RIAINTRA. No shared navigation sources or Wix message contracts changed.

- 2026-11-10 — Restored desktop document scrolling by overriding this page's legacy internal-chrome overflow lock at the desktop shell breakpoint. Mobile keeps the shared RIAINTRA app scroll area and bottom navigation, with touch scrolling enabled. Refined the workspace's typography, controls and surfaces; the VOY template grid now fits its available width. Existing template preview styles, message contracts and content ownership remain unchanged. The change requires the normal build and live runtime verification.

- 2026-11-10 — Redesigned the active Media Control workspace around a full-width publishing dashboard and a single slide-out application menu on desktop and mobile. The menu supports section search, keyboard focus, Escape and backdrop dismissal. Existing VOY, Website, Newsroom, marketing, Asset Library and connector actions retain their established owners and message contracts. Shared RIAINTRA navigation remains available. Wikipedia remains the existing read-only research provider and does not require a token for the current searches. TravelBriefing is shown as not connected: its domain and current API contract could not be verified, so it was not connected or used for travel-document decisions. Source/build checks do not establish a live Wix deployment.

- 2026-11-10 — Replaced the proposed connector matrix with real per-service tests and staff-only backend integrations for Canva template browsing, AI writing suggestions, Wikipedia research and read-only Search Console reporting. VOY page/issue printing uses the browser Save as PDF workflow for review copies without presenting it as press-ready output. The initial update was published in Wix; Wikimedia, Openverse, Fontsource search, Wikipedia research and a writing suggestion responded in live checks. Canva and Google require separately configured site credentials and access; their connections and the finished PDF output remain unverified. See `docs/media-control-website-editor.md`.

- 2026-11-10 — Reorganized the workspace into Website, Asset Library, VOY, Newsroom, Marketing and review tools, with mobile navigation. Website drafts can include safe structured headings, text, links and library images in eligible containers, plus form placeholders. Background refreshes preserve in-progress forms, save errors appear by their action, and local checks clearly identify manual or unavailable tools. The library separates VOY references from shared assets and paginates the first 1,000 loaded records. Current source and integration details are in `docs/media-control-website-editor.md`. The Wix page controller, public design contract and backend design service must be updated together; source/build checks do not prove a Wix publication.

  `skandi-media-control.part-05.js` preserves the exact historical HTML_REF split payload for reconstruction checks; the active page does not link or execute this historical sidecar.

- 2026-11-08 — Removed the non-interactive summary pills and their unused counters from the toolbar. Search, save and preview remain available. The linked complete reference payloads are historical; active HTML and JavaScript are the implementation. Requires live Wix verification.

## Reference documents

- [HTML_REF/riaintra/Media Control.md](references/riaintra-media-control-md/README.md)
- [HTML_REF/skandi/Media Control.md](references/skandi-media-control-md/README.md)
