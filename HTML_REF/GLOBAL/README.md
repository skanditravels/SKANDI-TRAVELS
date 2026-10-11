# SKANDI Wix Studio — Exact Scrolling / Sizing Settings

Status: CONFIGURATION SPECIFICATION — global scroll-top runtime contract prepared; remaining sizing guidance unchanged.
Scope: every route currently present in the named `siteMap.js` plus its `APP_ROUTES`.
Target: remove the current “two scrolls” experience while preserving the SKANDI v12 page/embed architecture.


## 2026-10-11 Baggage Allowance naming / route correction

- Customer footer label corrected from `Baggage Allowence` to `Baggage Allowance` in `/src/pages/masterPage.js`.
- Canonical application route corrected from `/travel-info/baggage-allowence` to `/travel-info/baggage-allowance` in `/src/public/siteMap.js` and the currently mirrored `customerAuthUi.js` route registry.
- Baggage Allowance remains a `CONTENT_AUTO` customer route and keeps the existing 680–30000 px sizing model.
- No global-header embed geometry, authentication contract, scroll ownership, database/provider behavior or other route is changed by this naming correction.

## Global page-open scroll invariant

Every newly opened SKANDI surface must begin at the top of its visible scroll owner.

- A new Wix route must scroll the outer Wix viewport to `(0, 0)` on initial page readiness and whenever the route/query identity changes.
- Master-controlled navigation must request the top position before route navigation and re-assert it immediately after the Wix route transition settles.
- An embedded/hidden page, detail page, app subpage, or same-route view that becomes the new primary surface must emit `MASTER_SCROLL_TOP` to the Wix master controller when it opens.
- The Wix master controller answers by scrolling the Wix viewport to the top and broadcasting `SKANDI_SCROLL_TOP` to mounted HTML components so an embed that owns its own scroll surface can also reset itself.
- Shared embed code should use `masterScrollTop()` / `window.SKANDIMaster.scrollTop()` from `/src/pages/master-config-bridge.js` when available rather than inventing page-specific parent-scroll contracts.
- Returning from a detail view to a deliberately preserved prior list position is allowed only when that return behavior is intentional and already part of the page UX; opening the new detail itself still starts at the top.
- This rule applies to customer SKANDI pages, RIAINTRA and ALTEA. It does not change which layer owns scrolling under the sizing presets below.

Runtime authority: `/src/pages/masterPage.js` for the Wix viewport and `/src/pages/master-config-bridge.js` for the shared embed contract. Travel Info is synchronized in this repair as the current hidden-detail implementation using the contract. STATICALLY VERIFIED; REQUIRES LIVE TEST after Wix publication.

## Governing rule

There must be exactly **one vertical scroll owner** on each page.

SKANDI already proves that runtime HTML-component resizing works:
- `masterPage.js` accepts `SKANDI_EMBED_RESIZE` from the customer header and writes `embed.height`.
- the Destinations flow measures content with `ResizeObserver`, posts `DESTINATION_FLOW_RESIZE`, and the Wix page controller writes the HTML component height with a 680–30000 px clamp.

That existing pattern should be the standard for pages classified as **CONTENT_AUTO** below. Fixed 1800/2600/3600 px embeds are only fallbacks; they are the main reason dynamic pages either gain an inner scrollbar or leave large empty space.

Pages classified as **APP_VIEWPORT** are different: they should remain an app-sized viewport because their UI can contain sticky/fixed controls, drawers, filters, operational panes, etc. Those pages should let the embed own vertical scrolling and the Wix page itself must not also have a second vertical scroll surface.

## Exact Wix Studio presets

### PRESET A — CONTENT_AUTO
Use for editorial, informational and long-flow pages whose content should feel like a normal website page.

**Wix page**
- Browser/Wix page owns vertical scrolling: YES
- Page Inspector → Layout → Overflow content: **Hide** on Desktop, Tablet and Mobile. This is primarily to eliminate accidental horizontal overflow.
- Customer/RIA header: according to route matrix
- Footer: according to route matrix

**Main content section**
- Width: 100%
- Left/right margins: 0
- Top/bottom padding: 0 unless the design itself requires spacing
- Responsive behavior: **Fixed height**
- Initial / minimum height: **680 px**
- Max height: none in the editor
- Overflow content: **Show**
- Do not use “Fit to screen”
- Do not use `vh` for this section

Wix documents Fixed Height as effectively a minimum: the section can become taller when a child pushes it. That is what we want when the HTML component's runtime height changes.

**HTML component**
- Width: **100%**
- Initial height: **680 px**
- Min height: **680 px**
- Max height in Studio: none
- Aspect ratio lock: OFF
- Horizontal behavior: Relative width / Stretch to parent width (use the option Wix exposes for the element; target is always 100% width)
- Do not use Scale Proportionally
- Do not place the HTML component in a vertically scrolling container

**HTML document**
- `html, body`: width 100%; margin 0
- Horizontal overflow: hidden
- Vertical overflow: hidden
- Content height measured from the document's real `scrollHeight`
- Resize mechanism: `ResizeObserver` + initial delayed measurements after first render/assets
- Message payload: measured content height
- Parent clamp: **680 px minimum / 30000 px maximum**

**Result**
- iframe never has its own scrollbar
- Wix page has the only scrollbar
- header/content/footer behave like one continuous document
- content growth/shrink is reflected by runtime HTML-component height

### PRESET B — APP_VIEWPORT_PUBLIC
Use for customer-facing applications where sticky/fixed controls, drawers or persistent toolbars are part of the experience.

**Global chrome**
- Customer header: ON
- Customer header collapsed height: **118 px**
- Customer header runtime range already established in source: **118–1200 px**
- Customer footer: **OFF / collapsed for these routes**

**Main app section**
- Width: 100%
- Height: **calc(100vh - 118px)**
- Min H: 0
- Max H: none
- Padding: 0
- Overflow content: **Hide**
- Do not add any section below the app section.

**HTML component**
- Width: 100%
- Height: 100%
- Fill the app section
- Internal vertical scroll: YES
- Internal horizontal scroll: NO
- Scrollbar can be visually hidden only if accessibility and discoverability remain acceptable; do not disable scrolling itself.
- Recommended CSS: `overscroll-behavior-y: contain;` to reduce scroll chaining into the Wix shell.

**Wix page**
- Page overflow content: Hide
- No customer footer on these routes
- No spacer sections below the app

**Important current implementation gap**
Current `masterPage.js` shows the customer footer on every non-internal route. Therefore a public APP_VIEWPORT route cannot be made perfectly single-scroll by editor settings alone while that behavior remains. Route-aware footer collapse is required for the final architecture.

### PRESET C — APP_VIEWPORT_RIAINTRA
Use for internal RIAINTRA apps that are not ALTEA.

- RIAINTRA header: ON, **52 px**
- ALTEA header: OFF
- RIAINTRA footer: **OFF / collapsed on app routes**
- Main app section height: **calc(100vh - 52px)**
- App embed: 100% W × 100% H
- Embed owns vertical scroll
- Wix page overflow: Hide
- Section overflow: Hide
- No section below app

Current `masterPage.js` shows the internal footer on internal routes except GroupTalk. To achieve one scroll, app routes need the internal footer collapsed/hidden.

### PRESET D — APP_VIEWPORT_ALTEA
Use for ALTEA operational pages.

- RIAINTRA header: ON, **52 px**
- ALTEA header: ON, **48 px**
- Total chrome height: **100 px**
- Internal footer: OFF / collapsed
- Main app section height: **calc(100vh - 100px)**
- App embed: 100% W × 100% H
- Embed owns vertical scroll
- Wix page overflow: Hide
- Section overflow: Hide
- No section below app

### PRESET E — APP_FULLSCREEN_CHROME_FREE
Only for the explicitly chrome-free GroupTalk route.

- Customer header/footer: OFF
- RIAINTRA header/footer: OFF
- ALTEA header/footer: OFF
- Main section: **100vh**
- HTML component: **100% W × 100% H**
- Embed owns vertical scroll
- Wix page must not scroll
- Page overflow: Hide
- Section overflow: Hide

This matches the current `GROUPTALK_CHROME_FREE_PATHS` rule.

### PRESET F — NATIVE_WIX
Use where Wix owns the application surface rather than a custom HTML component.

- Do not create a fake fixed-height HTML section
- Let the native Wix page determine its height
- Page vertical scroll: Wix/native
- Page overflow: Hide to prevent horizontal overflow
- If the global footer creates a second scroll region inside a native checkout surface, hide/collapse the footer for that route

## Global chrome settings from current route/chrome sources

| Global element | Width | Base height | Runtime/max | Scroll |
|---|---:|---:|---:|---|
| Customer header | 100% | 118 px | max 1200 px | never own-scroll |
| Customer footer | 100% | content-driven target | registry max 2400 px | never own-scroll |
| RIAINTRA header | 100% | 52 px | registry max 700 px | never own-scroll |
| ALTEA header | 100% | 48 px | registry max 300 px | never own-scroll |
| ALTEA footer | 100% | 30 px | registry max 120 px | should not be used to create a second app scroll |

The customer header already uses runtime height messages. The same principle should be used anywhere chrome height changes.

## Breakpoints

Use the site's existing Wix Studio Desktop / Tablet / Mobile breakpoints. Do not create a separate breakpoint only to solve iframe height.

For CONTENT_AUTO, the measured runtime height replaces breakpoint-specific fixed heights.
For APP_VIEWPORT, keep the same viewport formula at all breakpoints; the width/layout inside the HTML remains responsive.

## Exact HTML iframe/content rule

Wix's current Studio documentation recommends percentage sizing inside embedded iframe markup so the embedded document fills the Wix container rather than using hard-coded pixel width/height. Use 100% width/height for any nested iframe. The Wix HTML component itself is sized by the page preset above.

## Why this solves the current problem

The current “two scrolls” behavior happens when both are true:
1. Wix page is taller than the viewport and can scroll; and
2. the HTML component is too short for its contents, so its sandboxed document also scrolls.

CONTENT_AUTO removes #2 by resizing the Wix component to the document.
APP_VIEWPORT removes #1 by making the application the single full-height scroll surface and removing the footer/extra page content below it.

## Current-source conflicts handled

Older setup documents contain fixed desktop/phone heights such as 1800/2600, 2300/3400 and 2500/3600. Those values are retained as historical fallbacks only. They are not suitable as the final dynamic sizing model.

The route matrix in this package follows the currently named `siteMap.js` supplied in the SKANDI library. A separate B-011.18 snapshot contains additional/older route entries; those are not silently inserted into this matrix.

## Verification status

STATICALLY VERIFIED:
- route list from current named `siteMap.js`
- current global chrome registry values from B-011.18 route/chrome source
- current master-page visibility behavior
- current header runtime resize behavior
- current Destinations runtime content-height resize behavior
- current Wix Studio sizing/overflow behavior from Wix documentation
- global `MASTER_SCROLL_TOP` / `SKANDI_SCROLL_TOP` message handling and route-change watcher syntax/contracts

REQUIRES LIVE TEST:
- final visible header/footer placement on each published route
- any page-specific HTML that uses fixed/sticky positioning and therefore should be moved from CONTENT_AUTO to APP_VIEWPORT
- route-aware footer suppression because current `masterPage.js` presently shows footers broadly
- published Wix route transitions, back/forward navigation and same-route embedded-view top-reset behavior

## Wix documentation used

- Studio Editor: Adding an HTML iFrame Element
  https://support.wix.com/en/article/studio-editor-adding-an-html-iframe-element
- Studio Editor: Setting the Size of Your Elements
  https://support.wix.com/en/article/studio-editor-setting-the-size-of-your-elements
- Studio Editor: Working with Overflow Content
  https://support.wix.com/en/article/studio-editor-working-with-overflow-content
- Studio Editor: Troubleshooting Gaps and Horizontal Scroll Bars
  https://support.wix.com/en/article/studio-editor-troubleshooting-gaps-and-horizontal-scroll-bars
