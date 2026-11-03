# Wix Studio click-through checklist

V12 desktop chrome authority + mobile scroll handoff correction: 2026-10-13. Apply this after identifying the route mode in `PAGE_SETTINGS.md`.

## Global desktop chrome invariant

1. Every routed page shows exactly one matching global header and one matching global footer unless it is one of the six explicit chrome-free routes below.
2. Public SKANDI route: SKANDI customer header + SKANDI customer footer.
3. RIAINTRA route: RIAINTRA header + RIAINTRA footer.
4. ALTEA route: ALTEA header + ALTEA footer only. Do not show the RIAINTRA header/footer on the same ALTEA page.
5. No page may render two global headers at the same time.
6. Chrome-free routes:
   - `/riaintra/success-factors/altea/grouptalk`
   - `/riaintra`
   - `/booking`
   - `/the-store/store-checkout/order-confirmation`
   - `/the-store/store-checkout`
   - `/the-store`

## CONTENT_AUTO route

1. Open the page in Wix Studio.
2. Apply the same content-sizing architecture at Desktop, Tablet and Mobile unless the page reference explicitly documents a breakpoint-specific exception.
3. Page layer → Inspector → Layout → Overflow content → Hide.
4. Main HTML section:
   - Width: 100%
   - Height: Fixed initial 680 px
   - Min H: 680 px
   - Padding top/bottom: 0
   - Overflow content: Show
   - Do not use Fit to Screen.
5. HTML component:
   - Width: 100%
   - Height: 680 px initial
   - no aspect ratio lock
   - responsive width to parent; do not Scale Proportionally
6. No parent container around the HTML component may use Overflow → Scroll.
7. The embed document must not create a second page-level vertical scroll surface.
8. The embed reports measured document height after render/content changes where that page contract supports dynamic sizing.
9. The Wix controller owns the component height within the page's established bounds.
10. Keep the route's matching global header and footer visible.
11. Publish and verify a single browser document scrollbar.

## APP_VIEWPORT_PUBLIC route

1. Page layer → Overflow content → Hide.
2. SKANDI customer header stays visible.
3. SKANDI customer footer stays enabled. On mobile it remains expanded but hidden until iframe-bottom scroll chaining hands off to Wix; then `masterPage.js` reveals it.
4. Main app section:
   - Width: 100%
   - Height: `calc(100vh - 118px)`
   - Padding: 0
   - Overflow content: Hide
5. HTML component:
   - Width: 100%
   - Height: 100%
   - fills the section
6. HTML app root:
   - height: 100%
   - overflow-x: hidden
   - overflow-y: auto where the app owns its workspace scroll
   - desktop/tablet may use existing overscroll behavior
   - mobile APP_VIEWPORT primary scroller must allow boundary handoff (`overscroll-behavior-y: auto`, not `contain`/`none`) when a global footer is enabled
7. Do not duplicate the SKANDI header/footer inside the page HTML.
8. Publish and test wheel, trackpad, Page Down, Home/End, keyboard focus and iPhone touch scrolling.

## APP_VIEWPORT_RIAINTRA route

1. RIAINTRA header = 52 px and is the only global header.
2. RIAINTRA footer stays enabled. On mobile it is expanded/hidden until the app reaches its scroll boundary and Wix begins the footer handoff.
3. ALTEA and customer chrome must be hidden/collapsed.
4. Main app section = `calc(100vh - 52px)`.
5. HTML component = 100% W × 100% H.
6. Page/section overflow = Hide; the app owns its workspace scroll.
7. Do not duplicate a RIAINTRA header/footer inside the page HTML.

## APP_VIEWPORT_ALTEA route

1. ALTEA header = 48 px and is the only global header.
2. ALTEA footer stays enabled. On mobile it is expanded/hidden until the app reaches its scroll boundary and Wix begins the footer handoff.
3. RIAINTRA header/footer and customer chrome must be hidden/collapsed on the ALTEA route.
4. Main app section = `calc(100vh - 48px)`.
5. HTML component = 100% W × 100% H.
6. Page/section overflow = Hide; the app owns its workspace scroll.
7. Do not duplicate either RIAINTRA or ALTEA chrome inside the page HTML.
8. Verify the route never shows the prior stacked `RIAINTRA 52px + ALTEA 48px` double-header state.

## APP_FULLSCREEN_CHROME_FREE route

Only the six routes listed under the global invariant use this mode.

- all customer, RIAINTRA and ALTEA global header/footer elements collapsed
- main section = 100vh
- HTML component = 100% W × 100% H
- app root owns vertical scrolling
- no spacer or global footer section below the app

### Booking

Only the active booking-state HTML component is shown/expanded. Every inactive booking-state component must be hidden and collapsed.

### Store / Checkout / Confirmation

The Store, Store Checkout and Store Confirmation are customer-facing HTML-embed surfaces. For Checkout and Confirmation, Wix native commerce pages are the underlying Wix integration host only. The custom HTML embed remains the customer-facing page layer and must fill the chrome-free 100vh surface.

### GroupTalk

GroupTalk is chrome-free at `/riaintra/success-factors/altea/grouptalk`. Navigation to GroupTalk from ALTEA chrome opens in a new tab in the same browser.

## Mobile-specific checks

- Prevent horizontal page scrolling.
- No element may exceed 100vw.
- Every editable text control inside an HTML embed uses **16px minimum** on mobile: text/search/email/password/tel/url/number/date/time/datetime/month/week inputs, `select`, and `textarea`. Do not use `user-scalable=no` or otherwise disable pinch zoom.
- CONTENT_AUTO: Wix remains the only page-level scroll owner and footer stays in normal document flow.
- APP_VIEWPORT: iframe owns the primary vertical scroll; matching footer remains expanded but hidden while outer Wix `scrollY` is 0. Boundary scroll chaining from the iframe reveals the footer only after Wix begins scrolling.
- APP_VIEWPORT mobile main scroller must not use `overscroll-behavior-y: contain`/`none` if the route has a footer; use the browser default/`auto` so the bottom boundary can hand off to Wix.
- Use safe-area padding inside HTML for bottom controls where applicable: `env(safe-area-inset-bottom)`.
- Test momentum scrolling on iOS Safari, including down into the footer and back up into the embed.
- Modal/drawer content may own its own scroll only while open; once closed, the normal app/document scroll owner resumes.
