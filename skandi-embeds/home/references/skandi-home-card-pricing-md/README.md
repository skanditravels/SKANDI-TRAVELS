# SKANDI Home Card Pricing and Media Manager

## INFO / LOG

- **Display / page:** SKANDI Home (`/`)
- **Media Manager:** RIAINTRA → Media Control → Website → Home Cards & Pricing
- **Wix page controller:** `/src/pages/Home.n73w8.js`
- **Home embed:** `#htmlHome`
- **Home route identity:** `masterPage.js` maps Wix's `isHomePage` marker to the canonical `/` route, even when Wix reports the page URL as `/home`.
- **Canonical backend:** `/src/backend/SKANDI_CORE/homeContent.js`
- **Price refresh:** `/src/backend/jobs.config` → `refreshHomeCardPricesCore`, every six hours
- **Inventory source:** `inventory_public_entities_v`
- **Configuration and image override:** existing `travel_products` rows, keyed by the featured inventory card's `public_id`
- **Image storage:** Supabase Asset Library (`platform_assets` / `skandi-public-assets`)
- **Price cache:** `travel_product_price_cache`, cache key `HOME_CARD_V1`
- **Reference status:** Media Manager configuration is implemented; deployment and live staff-session verification are still required.

## How editors use it

Open **Media Control → Website → Home Cards & Pricing**, choose a featured Home card, edit its product and price settings, select a public image from the Supabase Asset Library, then save. Upload new photos first through **Media Control → Assets / Media** as public images in the SKANDI library. The photo selection and alt text are stored as a Home-only override on the matching `travel_products` row; Inventory's original media remains unchanged. Selecting **Use the inventory image** removes that override.

Set **Product status** to `Published` and enable **Customer visible** for the photo and price configuration to appear on public Home. The image can be saved with dynamic flight pricing disabled. The price controls set the IATA route, travel dates relative to today, passenger ages, cabin, connection limit, product currency, package base price, margin, and charter-package add-ons. The editor also shows the cached price status and last refresh.

## Price calculation and refresh

The backend matches the featured Home card's `public_id` to `travel_products.product_id`. Dynamic pricing supports `flight_only` and `charter_package` products. It reuses the canonical `searchLiveFlightOffersCore` Duffel path, searches the configured currency, and stores results in `travel_product_price_cache` under `HOME_CARD_V1`. The scheduled job refreshes at most two products concurrently. Public Home reads the cache and does not call Duffel for these cards per visitor; Booking must check live availability and price again.

For a `flight_only` card the displayed amount is the Duffel offer total plus the configured margin. For a `charter_package` card it is the Duffel total plus `travel_products.base_price`, existing non-flight component retail amounts, Media Manager package add-ons (retail amount × quantity), and the configured margin. Flight components are excluded because the provider flight total is searched separately. Keep all package and add-on amounts in the product currency. `returnDaysOut` is optional; omit it for a one-way route.

## Storage and verification boundary

No new Supabase tables or schema changes are needed. Media Manager uses the existing `travel_products`, `travel_product_components`, `travel_product_price_cache`, `platform_assets`, and `platform_asset_usages` tables. The image is registered as a shared asset usage so the Asset Library can prevent archiving a photo still used by a Home card.

Current live Supabase inspection found the travel-product tables empty, so cards need to be configured in Media Manager before prices or image overrides appear. The runtime code and scheduled job must be deployed to Wix. No live Wix deployment, Supabase content write, or Duffel offer search was performed for this change.

## CHANGE LOG

- 2026-10-28 — Fixed Home receiver authorization: Wix's homepage context reports `url: "/home"` with `isHomePage: true`; `masterPage.js` now resolves that context to the canonical `/` integration before authorizing the Home embed.
- 2026-10-27 — Added Media Manager controls for featured-card pricing configuration, charter add-ons, product visibility, and Home-only photo/alt-text selection from the public Supabase Asset Library.
- 2026-10-27 — Added scheduled Duffel baseline pricing for featured flight-only and charter-package Home cards. No Supabase schema change was required.
