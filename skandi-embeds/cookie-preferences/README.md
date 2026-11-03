# SKANDI COOKIE PREFERENCES

> Current document: `skandi-embeds/cookie-preferences/README.md`. Original reference: `HTML_REF/skandi/SKANDI COOKIE PREFERENCES.md`.


STATUS: V12 SYNC PREPARED — STATICALLY VERIFIED / REQUIRES LIVE TEST
SLUG: `/about/legal/cookie-preferences`
WIX PAGE: Cookie Preferences
AREA: SKANDI
LIVE HTML: YES
ELEMENT: `#cookiePreferencesEmbed`
MESSAGE SOURCE: `SKANDI_COOKIE_PREFERENCES`
WIX PARENT: `/src/pages/masterPage.js`
LAST SYNCED: 2026-10-17

## INFO
- New customer-facing privacy preference page using the existing V12 global customer header/footer.
- The page is `CONTENT_AUTO`; the HTML sends measured height through the existing parent resize contract.
- Current visitor consent is read from Wix Consent Policy Manager through `masterPage.js`.
- Saved choices are written back to the same Wix visitor consent state. No duplicate Supabase consent table is introduced.
- Essential is locked on. Functional, Analytics, Marketing and Third-party data sharing are independently controlled.
- Global Privacy Control locks Third-party data sharing off when the browser sends the signal.
- Cookie Policy and Privacy Policy continue to use the existing Policy Control routes.

## CHANGE LOG
- 2026-10-17 — V12 initial implementation: dedicated SKANDI privacy preference center added.


- 2026-10-28 UTC — Updated `skandi-embeds/cookie-preferences/skandi-cookie-preferences.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Cookie Preferences** (`/about/legal/cookie-preferences`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
