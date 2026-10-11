# Current-source findings that determine the settings

## 1. Route authority
The page list follows the current named `siteMap.js` retrieved from the SKANDI library. It contains `SITE_MAP` and `APP_ROUTES` and is treated as the route authority for this configuration document.

## 2. Chrome authority
The B-011.18 route/chrome registry provides these global values:
- Customer header: collapsedHeight 118, maxHeight 1200
- Customer footer: collapsedHeight 0, maxHeight 2400
- RIAINTRA header: collapsedHeight 52, maxHeight 700
- ALTEA header: collapsedHeight 48, maxHeight 300
- ALTEA footer: collapsedHeight 30, maxHeight 120

## 3. Current master-page visibility behavior
Current master page behavior:
- public route → customer header + customer footer shown
- internal route → RIAINTRA header + internal footer shown
- ALTEA route → RIAINTRA header + ALTEA header + internal footer shown
- `/riaintra/success-factors/altea/grouptalk` → chrome-free

This is the reason APP_VIEWPORT routes need route-aware footer suppression to become truly single-scroll.

## 4. Runtime height setter already exists
The current master page handles the customer header's `SKANDI_EMBED_RESIZE` and sets `embed.height` after clamping 118–1200.

Therefore dynamic HTML-component height is already an accepted SKANDI runtime mechanism; it is not a speculative architecture.

## 5. Destinations already demonstrates full content auto-height
Current Destinations flow:
- child document measures its scroll/offset height
- `ResizeObserver` watches the child DOM
- fallback interval/initial delayed measurements are also used
- flow posts `DESTINATION_FLOW_RESIZE`
- Wix page controller clamps the requested value to 680–30000
- page controller writes `html.height = height`

This should be the model for CONTENT_AUTO pages.

## 6. Wix Studio behavior confirmed from current Wix documentation
- HTML embeds are iframe-based/sandboxed.
- Embedded/nested iframe width and height should use 100% rather than hard-coded pixel dimensions to fill the Wix container.
- Wix Studio supports element size/responsive settings per breakpoint.
- Studio advanced sizing supports Auto on some elements and formula-based size values.
- A section set to Fixed Height acts as a minimum and may become taller if a child element pushes its height.
- Section/container Overflow may be Show, Hide or Scroll.
- Page Overflow may be Show or Hide.
- Wix specifically recommends Hide at the mobile page level when horizontal overflow creates a scrollbar.

## 7. Historical fixed-height settings found but superseded for scrolling architecture
Examples found in older setup files:
- Storefront: 1800 desktop / 2600 phone
- SKANDI Club: 2300 desktop / 3400 phone
- About: 2500 desktop / 3600 phone
- Flight Status: 900 desktop / 1000 tablet / 1400 phone

These numbers are useful as emergency non-resize fallbacks, but they cannot solve dynamic-content sizing cleanly across all routes.
