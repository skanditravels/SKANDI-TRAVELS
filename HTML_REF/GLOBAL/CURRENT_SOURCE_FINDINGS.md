# Current-source findings that determine the settings

V12 desktop chrome authority correction: 2026-10-13.

## 1. Route authority

The route list is derived from current `src/public/siteMap.js` together with the page identities/routes documented in `/HTML_REF`. An HTML_REF surface whose route is explicitly unresolved remains `REQUIRES LIVE ROUTE VERIFICATION`; this register does not invent a slug.

## 2. Global chrome authority

Current global chrome components are:
- SKANDI customer header: 118 px base
- SKANDI customer footer
- RIAINTRA header: 52 px
- RIAINTRA footer
- ALTEA header: 48 px
- ALTEA footer: 30 px base

The governing desktop rule is one header family + one matching footer family per routed page, except the six exact chrome-free routes documented in `PAGE_SETTINGS.md`.

## 3. Corrected master-page visibility behavior

The prior master-page condition allowed RIAINTRA and ALTEA headers to be visible together on ALTEA routes. That stacked-header behavior is superseded.

Correct V12 desktop behavior:
- public SKANDI route → SKANDI customer header + SKANDI customer footer
- RIAINTRA route that is not ALTEA → RIAINTRA header + RIAINTRA footer
- ALTEA route → ALTEA header + ALTEA footer only
- exact chrome-free route → no global header/footer

The exact chrome-free route set is:
- `/riaintra/success-factors/altea/grouptalk`
- `/riaintra`
- `/booking`
- `/the-store/store-checkout/order-confirmation`
- `/the-store/store-checkout`
- `/the-store`

`/riaintra` is matched exactly; its child routes do not inherit chrome-free state.

## 4. No-double-header invariant

`masterPage.js` must never show both `IDS.internalHeaders` and `IDS.alteaHeaders` for the same route. ALTEA replaces RIAINTRA global chrome inside the ALTEA route scope; it is not stacked beneath it.

## 5. Store page classification

The Store Checkout and Store Confirmation customer experiences are custom HTML embeds. Wix native commerce pages remain the underlying Wix integration/commerce host only. They are not `NATIVE_WIX` customer-facing surfaces in this page-settings register.

The Store, Store Checkout and Store Confirmation are explicit chrome-free 100vh HTML-embed routes.

## 6. GroupTalk navigation

GroupTalk remains chrome-free at `/riaintra/success-factors/altea/grouptalk`. The ALTEA global header opens that route in a new browser tab so the current ALTEA workspace remains open in its original tab.

## 7. Runtime height setter already exists

The master page accepts approved embed resize messages and clamps HTML-component height. Dynamic HTML-component height is therefore an established SKANDI runtime mechanism, not a speculative architecture.

## 8. Destinations already demonstrates content auto-height

Current Destinations flow uses measured child height and parent-side clamping. This remains the precedent for CONTENT_AUTO pages. The chrome correction does not replace or remove page-specific content-resize contracts.

## 9. Historical fixed-height settings are not the chrome authority

Older fixed desktop/mobile heights may remain useful as emergency layout fallbacks, but they do not override the route-by-route chrome rules in `PAGE_SETTINGS.md` and do not justify suppressing a required global footer.
