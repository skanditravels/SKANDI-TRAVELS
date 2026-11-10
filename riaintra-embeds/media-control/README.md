# media-control

## INFO / LOG

- 2026-11-10 — Replaced the proposed connector matrix with real per-service tests and staff-only backend integrations for Canva template browsing, AI writing suggestions, Wikipedia research and read-only Search Console reporting. VOY page/issue printing now opens the browser Save as PDF workflow for review copies without presenting it as press-ready output. Canva and Google require separately configured site credentials and access; live provider checks and Wix publication remain required. See `docs/media-control-website-editor.md`.

- 2026-11-10 — Reorganized the workspace into Website, Asset Library, VOY, Newsroom, Marketing and review tools, with mobile navigation. Website drafts can include safe structured headings, text, links and library images in eligible containers, plus form placeholders. Background refreshes preserve in-progress forms, save errors appear by their action, and local checks clearly identify manual or unavailable tools. The library separates VOY references from shared assets and paginates the first 1,000 loaded records. Current source and integration details are in `docs/media-control-website-editor.md`. The Wix page controller, public design contract and backend design service must be updated together; source/build checks do not prove a Wix publication.

  `skandi-media-control.part-05.js` preserves the exact historical HTML_REF split payload for reconstruction checks; the active page does not link or execute this historical sidecar.

- 2026-11-08 — Removed the non-interactive summary pills and their unused counters from the toolbar. Search, save and preview remain available. The linked complete reference payloads are historical; active HTML and JavaScript are the implementation. Requires live Wix verification.

## Reference documents

- [HTML_REF/riaintra/Media Control.md](references/riaintra-media-control-md/README.md)
- [HTML_REF/skandi/Media Control.md](references/skandi-media-control-md/README.md)
