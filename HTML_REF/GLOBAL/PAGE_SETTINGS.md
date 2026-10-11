# Exact route-by-route Wix settings

Legend:
- **CONTENT_AUTO** = Wix/browser is the only vertical scroll; embed resizes to content.
- **APP_VIEWPORT_PUBLIC** = customer app owns vertical scroll; customer footer must be collapsed.
- **APP_VIEWPORT_RIAINTRA** = RIAINTRA app owns scroll; internal footer collapsed.
- **APP_VIEWPORT_ALTEA** = stacked RIAINTRA + ALTEA chrome; app owns scroll; internal footer collapsed.
- **APP_FULLSCREEN_CHROME_FREE** = no global chrome; app is 100vh and owns scroll.
- **NATIVE_WIX** = no custom HTML sizing rule.

| siteMap key | Route | Mode | Header | Footer | Wix main section H | HTML component | Vertical scroll owner | Page overflow | Section overflow |
|---|---|---|---|---|---|---|---|---|---|
| home | `/` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| search | `/search` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| flights | `/flights` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| carRental | `/car-rental` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| hotels | `/hotels` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| packages | `/packages` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| tours | `/tours` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| activities | `/activities` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| transfers | `/transfers` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| destinations | `/destinations` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| offers | `/offers` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| travelInfo | `/travel-info` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| skandiCollection | `/skandi-collection` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| voy | `/voy-magazine` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| club | `/skandi-club` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| about | `/about` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| support | `/about/support` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| newsroom | `/about/news-room` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| theStore | `/the-store` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| storeCheckout | `/the-store/store-checkout` | NATIVE_WIX | native/current checkout chrome | OFF recommended | Auto/native | no custom iframe sizing | Wix/native | Hide | n/a |
| storeConfirmation | `/the-store/store-checkout/order-confirmation` | NATIVE_WIX | native/current confirmation chrome | OFF recommended | Auto/native | no custom iframe sizing | Wix/native | Hide | n/a |
| ourNetwork | `/about/our-network` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| legal | `/about/legal` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| policies | `/about/legal/policies` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| riaintra | `/riaintra` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| staffLogin | `/riaintra` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| successFactors | `/riaintra/success-factors` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| alteaLaunchpad | `/riaintra/success-factors/altea` | APP_VIEWPORT_ALTEA | RIA 52px + ALTEA 48px | OFF | calc(100vh - 100px) | W/H 100% | Embed | Hide | Hide |
| alteaReservations | `/riaintra/success-factors/altea/reservations` | APP_VIEWPORT_ALTEA | RIA 52px + ALTEA 48px | OFF | calc(100vh - 100px) | W/H 100% | Embed | Hide | Hide |
| inventoryControl | `/riaintra/altea/inventory-control` | APP_VIEWPORT_ALTEA | RIA 52px + ALTEA 48px | OFF | calc(100vh - 100px) | W/H 100% | Embed | Hide | Hide |
| alteaTimatic | `/riaintra/success-factors/altea/timatic` | APP_VIEWPORT_ALTEA | RIA 52px + ALTEA 48px | OFF | calc(100vh - 100px) | W/H 100% | Embed | Hide | Hide |
| mail | `/riaintra/success-factors/mail` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| docunet | `/riaintra/success-factors/docunet` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| serviceDesk | `/riaintra/success-factors/helpdesk` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| magazineManager | `/riaintra/success-factors/media-control` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| payroll | `/riaintra/success-factors/payroll` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| bookingFlow | `/booking` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | active booking state embed W/H 100% | Active embed | Hide | Hide |
| myProfile | `/my-profile` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| myTrips | `/my-profile?tab=trips` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed | Hide | Hide |
| careers | `/about/careers` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| myRoster | `/riaintra/success-factors/my-roster` | APP_VIEWPORT_RIAINTRA | RIA 52px | OFF | calc(100vh - 52px) | W/H 100% | Embed | Hide | Hide |
| groupTalk | `/riaintra/success-factors/altea/grouptalk` | APP_FULLSCREEN_CHROME_FREE | OFF | OFF | 100vh | W/H 100% | Embed | Hide | Hide |
| passportVisa | `/travel-info/passport-visa` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| baggageAllowance | `/travel-info/baggage-allowence` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| travelInsurance | `/travel-info/insurance` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| specialAssistance | `/travel-info/special-assistance` | CONTENT_AUTO | Customer 118px base | Customer ON | 680px min, grows with embed | W 100%; H runtime 680–30000 | Wix page | Hide | Show |
| flightStatus | `/travel-info/flight-status` | APP_VIEWPORT_PUBLIC | Customer 118px base | OFF | calc(100vh - 118px) | W/H 100% | Embed/FIDS | Hide | Hide |

## Notes on special pages

### `/booking`
Only the currently active booking-state HTML component should be expanded to the app area. Hidden booking-state components must be collapsed, not merely visually hidden while retaining height. Otherwise Wix can create blank page height and a second scroll surface.

### `/destinations`
This route already contains the correct architectural precedent: the child flow measures height, posts `DESTINATION_FLOW_RESIZE`, and page code sets the Wix HTML component height with 680–30000 px bounds. Keep this behavior.

### `/travel-info`
Because Airport Information / Travel Info content can grow when tabs or records change, fixed per-device heights are specifically the wrong model. Use CONTENT_AUTO unless the whole page is later converted to a persistent full-screen application shell.

### `/travel-info/flight-status`
FIDS behaves like an application surface. Keep it viewport-scrolling if it remains a standalone route. If FIDS is fully moved inside the Travel Info Airport Information page as previously requested, the standalone route can remain only as a compatibility route while the embedded FIDS area follows the Travel Info host's scroll model.

### `/the-store`
Cart drawers, filters and other fixed application controls are safer in APP_VIEWPORT_PUBLIC than in a 1800/2600 px auto-height document. The old fixed storefront heights should not be the final architecture.

### Internal apps
For operational systems, a viewport-owned app scroll is preferable because fixed/sticky headers, tables, panes and drawers behave correctly. Do not make these 3000–8000 px tall Wix documents just to avoid the iframe scrollbar.

### `alteaTimatic`
Current route metadata marks this route deprecated/planned removal. Keep the settings until it is formally retired; do not remove it only to solve scrolling.
