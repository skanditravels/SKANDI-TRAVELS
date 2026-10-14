# Exact route-by-route Wix settings

V12 desktop chrome authority correction: 2026-10-13. This register uses the pages represented in `/HTML_REF` and preserves unresolved routes as unresolved instead of inventing slugs.

## Governing desktop chrome rules

- Every routed page has exactly **one** global header and **one** matching global footer on desktop unless its exact route is listed under **Chrome-free exceptions**.
- Public SKANDI pages use the SKANDI customer header + customer footer.
- RIAINTRA pages use the RIAINTRA header + RIAINTRA footer.
- ALTEA pages use the ALTEA header + ALTEA footer **only**. The RIAINTRA header/footer are replaced on ALTEA routes so a page can never render double global headers.
- GroupTalk opens in the same browser as a **new tab** and remains chrome-free on its own route.
- The Store, Store Checkout and Store Confirmation are customer-facing HTML-embed surfaces. Checkout/confirmation may use Wix native commerce pages underneath as the integration host, but the visible customer layer is the custom HTML embed and is not classified as `NATIVE_WIX`.

### Chrome-free exceptions

- `/riaintra/success-factors/altea/grouptalk`
- `/riaintra`
- `/booking`
- `/the-store/store-checkout/order-confirmation`
- `/the-store/store-checkout`
- `/the-store`

## Mode legend

- **CONTENT_AUTO** = Wix/browser owns document scroll; the embed resizes to content; the matching header/footer remain visible.
- **APP_VIEWPORT_PUBLIC** = public app owns its app-region scroll; SKANDI header/footer remain enabled. Main app region uses `calc(100vh - 118px)`; footer follows the app region.
- **APP_VIEWPORT_RIAINTRA** = internal app owns its app-region scroll; RIAINTRA header/footer remain enabled. Main app region uses `calc(100vh - 52px)`; footer follows the app region.
- **APP_VIEWPORT_ALTEA** = ALTEA app owns its app-region scroll; **ALTEA header/footer only**. Main app region uses `calc(100vh - 48px)`; footer follows the app region.
- **APP_FULLSCREEN_CHROME_FREE** = one of the six explicit exceptions; no global header/footer; app is 100vh and owns scroll.


| siteMap / settings key | Route | Mode | Header | Footer | Wix main section H | HTML component | Vertical scroll owner | Page overflow | Section overflow |
|---|---|---|---|---|---|---|---|---|---|
| home | `/` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| search | `/search` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| flights | `/flights` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| carRental | `/car-rental` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| hotels | `/hotels` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| packages | `/packages` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| tours | `/tours` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| activities | `/activities` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| transfers | `/transfers` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| destinations | `/destinations` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| country | `/destinations/country` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| destination | `/destinations/country/destination` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| offers | `/offers` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| travelInfo | `/travel-info` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| skandiCollection | `/skandi-collection` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| voy | `/voy-magazine` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| club | `/skandi-club` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| forgotPassword | `/forgot-password` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| about | `/about` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| support | `/about/support` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| memberSupport | `/my-profile/support` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| newsroom | `/about/news-room` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| theStore | `/the-store` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | W/H 100% | Embed | Hide | Hide |
| storeCheckout | `/the-store/store-checkout` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | W/H 100% | Embed | Hide | Hide |
| storeConfirmation | `/the-store/store-checkout/order-confirmation` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | W/H 100% | Embed | Hide | Hide |
| ourNetwork | `/about/our-network` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| legal | `/about/legal` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| policies | `/about/legal/policies` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| riaintra | `/riaintra` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | W/H 100% | Embed | Hide | Hide |
| staffLogin | `/riaintra` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | W/H 100% | Embed | Hide | Hide |
| successFactors | `/riaintra/success-factors` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| legalInternal | `/riaintra/success-factors/legal-internal` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| legalInternalPolicy | `/riaintra/success-factors/legal-internal/policies-internal` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| policyControl | `/riaintra/success-factors/policy-control` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| alteaLaunchpad | `/riaintra/success-factors/altea` | APP_VIEWPORT_ALTEA | ALTEA 48px only | ALTEA ON | calc(100vh - 48px) | W/H 100% | Embed | Hide | Hide |
| alteaReservations | `/riaintra/success-factors/altea/reservations` | APP_VIEWPORT_ALTEA | ALTEA 48px only | ALTEA ON | calc(100vh - 48px) | W/H 100% | Embed | Hide | Hide |
| inventoryControl | `/riaintra/success-factors/altea/inventory-control` | APP_VIEWPORT_ALTEA | ALTEA 48px only | ALTEA ON | calc(100vh - 48px) | W/H 100% | Embed | Hide | Hide |
| alteaTimatic | `/riaintra/success-factors/altea/timatic` | APP_VIEWPORT_ALTEA | ALTEA 48px only | ALTEA ON | calc(100vh - 48px) | W/H 100% | Embed | Hide | Hide |
| mail | `/riaintra/success-factors/mail` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| docunet | `/riaintra/success-factors/docunet` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| docunetAdmin | REQUIRES LIVE ROUTE VERIFICATION | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| serviceDesk | `/riaintra/success-factors/helpdesk` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| mediaControl | `/riaintra/success-factors/media-control` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| storeControl | `/riaintra/success-factors/store-control` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| payroll | `/riaintra/success-factors/payroll` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| uniformCenter | `/riaintra/success-factors/uniform` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| uniformControl | `/riaintra/success-factors/uniform/admin-control` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| staffDocumentControl | REQUIRES LIVE ROUTE VERIFICATION | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| transportCompliance | REQUIRES LIVE ROUTE VERIFICATION | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| bookingFlow | `/booking` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | Active state embed 100% W x 100% H | Active embed | Hide | Hide |
| myProfile | `/my-profile` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| myTrips | `/my-profile?tab=trips` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| careers | `/about/careers` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| myRoster | `/riaintra/success-factors/my-roster` | APP_VIEWPORT_RIAINTRA | RIA 52px only | RIA ON | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| groupTalk | `/riaintra/success-factors/altea/grouptalk` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | W/H 100% | Embed | Hide | Hide |
| passportVisa | `/travel-info/passport-visa` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| baggageAllowance | `/travel-info/baggage-allowance` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| travelInsurance | `/travel-info/insurance` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| specialAssistance | `/travel-info/special-assistance` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min; grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| flightStatus | `/travel-info/flight-status` | APP_VIEWPORT_PUBLIC | Customer 118px base | Customer ON | calc(100vh - 118px) | W/H 100% | Embed/FIDS | Hide | Hide |

## Route-specific notes

### `/booking`
Booking is an explicit chrome-free exception. Only the active booking-state HTML component may be expanded to 100vh; inactive booking-state components must be hidden **and collapsed** so they do not add page height.

### `/the-store`, `/the-store/store-checkout`, `/the-store/store-checkout/order-confirmation`
All three are explicit chrome-free customer surfaces. The visible Store Checkout and Store Confirmation experiences are custom HTML embeds. Wix native commerce pages remain only as their underlying Wix integration/commerce host; they are not the customer-facing layout authority.

### ALTEA routes
ALTEA routes must never stack the RIAINTRA header above the ALTEA header. The ALTEA header is the sole global header and the ALTEA footer is the sole global footer. GroupTalk is the one ALTEA exception and is chrome-free.

### GroupTalk
`/riaintra/success-factors/altea/grouptalk` is opened from ALTEA navigation in a new browser tab. The GroupTalk page itself remains 100vh and chrome-free.

### Unresolved internal routes
`docunetAdmin`, `staffDocumentControl`, and `transportCompliance` remain `REQUIRES LIVE ROUTE VERIFICATION` because their current HTML_REF files do not establish a route. They inherit the RIAINTRA desktop chrome rule when published; no slug is fabricated here.

### Destination and Travel Info content pages
Existing content-resize behavior remains unchanged. Public content pages keep the SKANDI customer header/footer.
