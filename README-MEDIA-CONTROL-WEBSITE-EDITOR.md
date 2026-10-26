# SKANDI Media Control Website Editor

Prepared 2026-10-25. The feature branch is stacked on PR #4 (`codex/html-ref-split-sources`). This package contains the complete changed source, public compiled output, HTML_REF history and payloads, tests, and coverage notes.

## File map

```text
HTML_REF/
  riaintra/Media Control.md                 Complete source payload and revision history
  skandi/Media Control.md                   Complete source payload and revision history
docs/media-control-website-editor.md        Feature, coverage, integrations and deployment notes
scripts/lib/compile.mjs                     Media Control full-document compiler handling
skandi-embeds/global/skandi-website-design.js Public published-design runtime
skandi-embeds/media-control/
  skandi-media-control.html                 Split Media Control source with editor module links
  skandi-media-control.js                   Website editor panel registration
  skandi-website-editor.css                 Responsive editor styles
  skandi-website-editor.js                  Visual selection, controls, preview, draft/publish flow
src/backend/SKANDI_CORE/
  assets.js                                 Existing Asset Library permission and attribution changes
  mediaControl.web.js                       Existing authenticated Media Control dispatcher
  mediaControlSources.js                    Preview integrity and open-source media/font APIs
  presentation.js                           Published public projection
  publicContent.js                          Shared existing editorial context export
  websiteDesign.js                          Existing-store draft, publish, asset and rollback core
src/pages/
  Media Control.chm91.js                    Wix dispatch boundary and style catalog
  masterPage.js                             Public presentation refresh
src/public/websiteDesign.js                 Public route/style/content validation contract
dist/                                      Rebuilt public pages, manifest and install reports
tests/                                     Compiler, split, editor and browser coverage
```

## Validation

- `node --test tests/*.test.mjs`: 29 passing tests.
- `node scripts/build-skandi-app.mjs`: 33 built, 16 pending source, 2 blocked integrations, 2 aliases, 6 failed pages.
- `SKANDI_TEST_CHROMIUM=/path/to/chromium node tests/website-editor.browser.cjs`: desktop 1440px and mobile 390px workflow with mocked Wix/Supabase boundary; verifies save and publish messages, responsive style editing and editor viewport bounds.
- Live Wix, external-provider download, Supabase upload/finalization and staff-role checks remain required before release.

See `docs/media-control-website-editor.md` for routes, API status, security behavior, outstanding source/build failures, and installation steps. Do not install this branch to Wix directly. Review and merge PR #4 first, then integrate this feature PR into main after its `main`-based preview source is available.
