# SKANDI Wix Studio — Exact Scrolling / Sizing Settings

Status: V12 CONFIGURATION SPECIFICATION — desktop chrome authority corrected 2026-10-13.
Scope: route/page settings represented by the current route registry and `/HTML_REF` source references.
Target: preserve one intentional scroll owner per surface while enforcing the current global header/footer rules.

## 2026-10-13 desktop chrome authority correction

The previous settings that suppressed footers on most app routes and stacked RIAINTRA + ALTEA headers are superseded.

Desktop invariant:
- public SKANDI route → SKANDI customer header + SKANDI customer footer
- RIAINTRA route → RIAINTRA header + RIAINTRA footer
- ALTEA route → ALTEA header + ALTEA footer only
- no routed page may display two global headers at the same time
- only the six exact routes below are chrome-free

Chrome-free routes:
- `/riaintra/success-factors/altea/grouptalk`
- `/riaintra`
- `/booking`
- `/the-store/store-checkout/order-confirmation`
- `/the-store/store-checkout`
- `/the-store`

Additional corrected authority:
- GroupTalk opens in a new browser tab from ALTEA global navigation.
- Store Checkout and Store Confirmation are customer-facing HTML embeds. Wix native commerce pages remain the underlying Wix integration host, not the visible customer page authority.
- `PAGE_SETTINGS.md` and `PAGE_SETTINGS.csv` are the exact route matrix for this configuration.

## Preserved 2026-10-11 Baggage Allowance correction

- Customer footer label: `Baggage Allowance`.
- Canonical application route: `/travel-info/baggage-allowance`.
- Baggage Allowance remains a `CONTENT_AUTO` customer route.
- No provider/database ownership is changed by this page-settings correction.

## Global page-open scroll invariant

Every newly opened SKANDI surface begins at the top of its visible scroll owner.

- A new Wix route scrolls the outer Wix viewport to `(0, 0)` on initial page readiness and route changes.
- Master-controlled navigation requests the top position around route navigation.
- Embedded/detail/app subviews may emit `MASTER_SCROLL_TOP` when they become the new primary surface.
- The master controller broadcasts `SKANDI_SCROLL_TOP` to mounted HTML components so an app-owned scroll surface can reset too.
- Returning to an intentionally preserved list position remains allowed when that behavior is part of the page UX.

Runtime authority remains `/src/pages/masterPage.js`; page-specific HTML contracts remain in their own HTML_REF/controller chains.

## Governing sizing rule

A page should not accidentally create two independent vertical scroll surfaces.

`CONTENT_AUTO` is for document-like content whose HTML component grows with content.
`APP_VIEWPORT_*` is for app-like surfaces with internal workspace scrolling. The matching global footer is still present on desktop and follows the app region; footer presence does not authorize stacking another global header or creating an unrelated page scrollbar inside the app region.


## Mobile field focus and footer handoff invariant

### Field focus
- Mobile text-entry controls inside HTML embeds must have a computed font size of at least **16px**. This is the canonical SKANDI fix for iOS focus auto-zoom.
- The rule applies to text/search/email/password/tel/url/number/date/time/datetime/month/week inputs, inputs without an explicit type, `select`, and `textarea`.
- Do not use `user-scalable=no`, `maximum-scale=1`, or other viewport locks as the primary fix; user pinch zoom remains available.
- `/src/pages/master-config-bridge.js` now installs this guard for embeds that include the shared bridge. Global SKANDI header/footer HTML contains the rule directly.

### APP_VIEWPORT footer handoff on mobile
- The iframe remains the primary vertical scroll owner.
- The matching global footer is expanded but hidden while the outer Wix page is at `scrollY = 0`.
- The iframe's main mobile scroller must allow normal boundary chaining (`overscroll-behavior-y:auto`/default).
- When the iframe reaches bottom and a continued downward gesture transfers scrolling to Wix, `masterPage.js` observes non-zero outer scroll and reveals the footer without changing layout height.
- Scrolling the outer page back to `scrollY = 0` hides the footer again; upward scrolling can then continue in the iframe.
- CONTENT_AUTO pages do not use the gate because Wix already owns their entire document scroll.

## Exact Wix Studio presets

### PRESET A — CONTENT_AUTO

Use for editorial, informational and long-flow pages.

Global chrome:
- public page: SKANDI customer header/footer
- RIAINTRA content page: RIAINTRA header/footer if one is classified this way
- ALTEA content page: ALTEA header/footer only if one is classified this way

Main content section:
- Width 100%
- Initial/minimum height 680 px
- Overflow content Show
- Do not use Fit to Screen

HTML component:
- Width 100%
- Initial height 680 px
- Runtime content height controlled by the page's approved resize contract where implemented
- No aspect-ratio lock
- Do not put the component in another vertical scrolling container

Result:
- iframe does not own the document-level scrollbar
- Wix/browser owns document scrolling
- matching global footer remains part of the page

### PRESET B — APP_VIEWPORT_PUBLIC

Use for customer-facing app surfaces that are not chrome-free exceptions.

Global chrome:
- SKANDI customer header ON, 118 px base
- SKANDI customer footer ON

Main app section:
- Width 100%
- Height `calc(100vh - 118px)`
- Padding 0
- Overflow Hide

HTML component:
- Width/height 100%
- app workspace may own its vertical scrolling

The customer footer follows the app section. Do not collapse it merely because the app owns its workspace scroll.

### PRESET C — APP_VIEWPORT_RIAINTRA

Use for non-ALTEA internal app routes.

- RIAINTRA header ON, 52 px, sole global header
- RIAINTRA footer ON
- customer chrome OFF
- ALTEA chrome OFF
- main app section `calc(100vh - 52px)`
- app embed 100% W × 100% H
- page/section app container overflow Hide

### PRESET D — APP_VIEWPORT_ALTEA

Use for ALTEA operational pages except GroupTalk.

- ALTEA header ON, 48 px, sole global header
- ALTEA footer ON
- RIAINTRA header/footer OFF on the ALTEA route
- customer chrome OFF
- main app section `calc(100vh - 48px)`
- app embed 100% W × 100% H
- page/section app container overflow Hide

The historical stacked `RIAINTRA 52px + ALTEA 48px` header is invalid under the current V12 authority.

### PRESET E — APP_FULLSCREEN_CHROME_FREE

Only for these exact routes:
- `/riaintra/success-factors/altea/grouptalk`
- `/riaintra`
- `/booking`
- `/the-store/store-checkout/order-confirmation`
- `/the-store/store-checkout`
- `/the-store`

Rules:
- all SKANDI/RIAINTRA/ALTEA global headers OFF
- all SKANDI/RIAINTRA/ALTEA global footers OFF
- main section 100vh
- HTML component 100% W × 100% H
- app/active embed owns its required scrolling
- page/section overflow Hide

Booking additionally requires inactive booking-state embeds to be hidden and collapsed.

Store Checkout / Confirmation remain HTML-embed customer surfaces even though Wix native commerce pages are used underneath.

## Global chrome settings

| Global element | Width | Base height | Route use |
|---|---:|---:|---|
| SKANDI customer header | 100% | 118 px | public non-exception routes |
| SKANDI customer footer | 100% | content-driven | public non-exception routes |
| RIAINTRA header | 100% | 52 px | internal non-ALTEA non-exception routes |
| RIAINTRA footer | 100% | content-driven | internal non-ALTEA non-exception routes |
| ALTEA header | 100% | 48 px | ALTEA non-exception routes |
| ALTEA footer | 100% | 30 px base | ALTEA non-exception routes |

These header families are mutually exclusive per route.

## Breakpoints

Use the site's existing Wix Studio breakpoints. The desktop chrome rules above are authoritative for Desktop. Existing responsive HTML behavior is preserved; do not create duplicate global header/footer implementations inside page embeds to compensate for a breakpoint.

## Store surfaces

`/the-store`, `/the-store/store-checkout`, and `/the-store/store-checkout/order-confirmation` are explicitly chrome-free. The customer sees custom HTML embeds. Wix Stores/eCommerce native pages may remain underneath for commerce integration, but are not the customer-facing layout authority and must not be used to classify these surfaces as `NATIVE_WIX`.

## GroupTalk

`/riaintra/success-factors/altea/grouptalk` remains a 100vh chrome-free workspace. The ALTEA global header opens GroupTalk in a new browser tab, preserving the originating ALTEA page in its current tab.

## Verification status

STATICALLY VERIFIED in the prepared replacement set:
- exact six-route chrome-free set
- public/RIAINTRA/ALTEA chrome families are mutually exclusive
- ALTEA routes no longer request a stacked RIAINTRA + ALTEA global header
- non-exception page-settings rows retain a matching footer
- Store Checkout/Confirmation are classified as HTML-embed surfaces, not `NATIVE_WIX`
- GroupTalk new-tab behavior is present in the ALTEA global-header HTML
- replacement JavaScript/embedded script syntax checks pass

REQUIRES LIVE TEST after Wix installation/publication:
- actual Wix element show/hide/collapse behavior on every route
- desktop header/footer placement and footer reachability
- GroupTalk browser-tab opening under the published iframe/browser security context
- Store Checkout/Confirmation custom HTML sizing over their native Wix underlay


## 2026-10-13 mobile UX runtime correction

STATICALLY VERIFIED:
- Mobile footer gate syntax and route matrix against the current 60-row page-settings baseline.
- Footer gate activates only on APP_VIEWPORT routes with chrome enabled; six chrome-free exceptions remain excluded.
- RIAINTRA and ALTEA headers remain mutually exclusive.
- Global SKANDI header/footer text-entry controls have a 16px mobile minimum.
- Shared master-config bridge exposes `masterScrollTop()` / `window.SKANDIMaster.scrollTop()` and installs the mobile focus-size guard.

REQUIRES LIVE TEST:
- iPhone Safari focus behavior on page-specific HTML embeds that do not yet include the shared bridge and may define sub-16px controls locally.
- Natural iframe-to-Wix scroll chaining on each APP_VIEWPORT route, especially any embed that overrides `overscroll-behavior-y` to `contain` or `none`.
- Footer reveal/hide transition with the actual published footer heights and Wix Studio mobile layout.
