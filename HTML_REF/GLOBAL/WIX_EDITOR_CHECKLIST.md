# Wix Studio click-through checklist

Apply this after identifying a route's mode in `PAGE_SETTINGS.md`.

## CONTENT_AUTO route

1. Open the page in Wix Studio.
2. Switch through Desktop, Tablet and Mobile. Apply the same architecture at all three.
3. Select the **page layer** → Inspector → Layout → Overflow content → **Hide**.
4. Select the **main HTML section**:
   - Width: 100%
   - Height: Fixed
   - H: 680 px
   - Min H: 680 px
   - Padding top/bottom: 0
   - Overflow content: Show
   - Do not use Fit to Screen.
5. Select the **HTML component**:
   - Width: 100%
   - Height: 680 px initial
   - no aspect ratio lock
   - responsive width to parent; do not Scale Proportionally
6. Make sure no parent container around the HTML component is set to Overflow → Scroll.
7. Make sure the embed's own HTML document has no `overflow-y:auto/scroll` on html/body/root.
8. The embed must report measured document height after render/content changes.
9. The Wix controller must set the component's `height` with 680–30000 bounds.
10. Keep the customer footer visible for public content routes.
11. Publish and verify that there is exactly one browser scrollbar.

## APP_VIEWPORT_PUBLIC route

1. Page layer → Overflow content → Hide.
2. Customer header stays visible.
3. Customer footer must be collapsed/hidden for this route.
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
   - overflow-y: auto
   - overscroll-behavior-y: contain
7. No section/spacer/footer may sit below the app section.
8. Publish and test wheel, trackpad, Page Down, Home/End, keyboard focus and iPhone touch scrolling.

## APP_VIEWPORT_RIAINTRA route

Same as APP_VIEWPORT_PUBLIC except:
- RIAINTRA header = 52 px
- section H = `calc(100vh - 52px)`
- internal footer OFF

## APP_VIEWPORT_ALTEA route

Same as APP_VIEWPORT_PUBLIC except:
- RIAINTRA header = 52 px
- ALTEA header = 48 px
- combined header = 100 px
- section H = `calc(100vh - 100px)`
- internal footer OFF

## APP_FULLSCREEN_CHROME_FREE route

- page Overflow content = Hide
- all chrome collapsed
- section = 100vh
- HTML component = 100% W × 100% H
- app root overflow-y = auto
- no other page section

## BOOKING page additional rule

When the booking page uses multiple HTML components for different states:
- active state: show + expand; 100% of app area
- inactive states: hide + collapse
- never leave inactive state embeds at a large height while merely hidden visually

## Mobile-specific checks

- Page overflow Hide to prevent horizontal body scrolling.
- No element should exceed 100vw.
- Full-screen/app mode should use safe-area padding inside the HTML for bottom controls: `env(safe-area-inset-bottom)`.
- Test momentum scrolling on iOS Safari.
- Ensure modal/drawer content scrolls inside its own overlay only while open; once closed, the main app regains the sole scroll surface.
