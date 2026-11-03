# INFO / LOG — Store Control

> Current document: `riaintra-embeds/store-control/README.md`. Original reference: `HTML_REF/riaintra/The Store Control.md`.


- Canonical source identity: `/HTML_REF/riaintra/The Store Control.md`
- System area: `RIAINTRA`
- Wix page/controller: `/src/pages/The Store Control.y10le.js`
- Customer/internal route: `/riaintra/success-factors/store-control`
- Installed HTML element: `#storeControlEmbed`
- Live HTML unchanged in this follow-up; complete source is preserved below. No Store Control embed replacement is included or required.
- Canonical backend chain: `backend/SKANDI_CORE/storeCartV3.web.js → storefront.js → Wix Stores V3 / eCommerce / native wix-marketing.v2 coupons`.
- Authority: SiteMember facade plus canonical requireStaffPortalSessionCore / Store administrator authorization before all merchant APIs.
- Status: V12 repair candidate; VERIFIED live zero-coupon response and local promotions flow / STATICALLY VERIFIED source chain / REQUIRES LIVE TEST after publication. Previous product-query and image repairs are retained.
- Last source verification: 2026-10-08. Prepared against `skanditravels/SKANDI-TRAVELS`, `main`, commit `a57c32b2631ac083fddefe0c5058ad8dd6bda56b`, retaining the approved V12 repairs.
- Intended source only: this package has not changed published Wix, GitHub or Supabase.
- Dependencies and live gates: existing masterPage/siteMap/staff/provider dependencies. This repair replaces only `src/backend/SKANDI_CORE/storefront.js`; rebuild and publish after replacement. Retain the installed page, facade and embed. See README for the post-publication check.

## Historical INFO / LOG (preserved)

Earlier route, component, controller and status claims below are historical; the current INFO above and latest repair entry supersede conflicting metadata.

No prior Store Control HTML_REF exists in the inspected Git tree or approved V12 source. Created from the complete user-supplied Store Control HTML.


- 2026-10-28 UTC — Updated `skandi-embeds/store-control/skandi-store-control.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Store Control** (`/riaintra/success-factors/store-control`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## 2026-10-07 — V12 complete-chain repair

Migrates the disconnected supplied SKANDI_STOREFRONT_ADMIN / flat-payload embed onto the existing SKANDI_STORE_CONTROL_V3 / nested-payload page contract. Existing V3 exports remain. Connects product/variant edits, stock by location and revision, bulk prices, orders, category assignment and persisted inactive coupon drafts. Success follows backend confirmation. Ready-to-ship is a merchant comment; fulfillment is the Wix fulfillment API. Session Activity is explicitly local, not a persistent audit database.

Local verification covers syntax, imports/exports, embed boot, provider contracts with mocks, stale replies, cart failure propagation, same-instance order submission deduplication, order ownership boundaries, administrator authorization and inventory revision conflicts. These tests do not prove a live provider request, payment, data write or production build. No database migration is required.

Store Control uses one source (`SKANDI_STORE_CONTROL_V3`) and parent `SKANDI_WIX_PARENT`, with payload objects. Added requests: STORE_CONTROL_UPDATE_INVENTORY, STORE_CONTROL_UPDATE_ORDER, STORE_CONTROL_SAVE_COLLECTION, STORE_CONTROL_SAVE_PROMOTION. Existing product/variant/category/bulk request handlers are retained. Replies include STORE_CONTROL_BOOTSTRAP, PRODUCT, MUTATION_OK, BULK_RESULT, PROGRESS, IDLE and ERROR. Orders are limited to the latest 100; coupon listing is the first page returned by Wix. Cancel does not refund/restock; archive does not change payment; fulfillment can trigger the site’s configured notification. Coupon drafts are inactive until activated in Wix. Collection creation and product assignments are separate operations; individual failures are reported.

## 2026-10-08 — V12 Store Control bootstrap repair

Inspected the current main source together with the published y10le bundle, which exposes `getStoreControlBootstrap` from the correct `backend/SKANDI_CORE/storeCartV3.web.js` path. The catalog query fields and sorting are supported by the current Wix contract. The corresponding live read-only REST requests succeeded, returning 30 products and 8 categories; there is no evidence for changing those queries to guessed fields or empty fallbacks.

Source-confirmed access mismatch: canonical staffAuth grants portal app access to server-resolved SUPER_ADMIN, OWNER, COMPANY_OWNER and allowedApps `*`/`all`. Store Control previously ignored those grants unless a separate flag or token happened to match. The existing Store Control gate now recognizes those exact canonical grants, preserving existing Store-specific grants. Every merchant operation still calls requireStaffPortalSessionCore first. Job titles, client-supplied roles and client-supplied permission flags never grant access. The facade remains Permissions.SiteMember.

Bootstrap failures now use the existing SkandiError/publicError contract and return an explicit `{ ok:false, error, stage, requestId }` from the existing facade. Successful payloads and exported method names are unchanged. The page emits STORE_CONTROL_BOOTSTRAP only for `ok:true`; failures use STORE_CONTROL_ERROR with a readable message and reference. Expired sessions redirect to /riaintra. Server logs retain a matching reference, phase, status and safe code without staff/provider payloads. Invalid catalog response envelopes produce an error rather than an empty success.

The exact signed-in production error remains unconfirmed without the affected staff session and matching monitoring entry. Local tests reproduce the access mismatch and verify its correction, denial of unprivileged users, all merchant-operation gates, product/category failure propagation, retry and session expiry. A connector-authorized REST call does not prove the same call succeeds in the published elevated Velo context. REQUIRES LIVE TEST: publish the three supplied core/facade/page replacements and revisit Store Control as the affected authorized staff member. If it still fails, the displayed reference identifies the corresponding Store Control V12 monitoring entry.

The complete Store Control HTML below is unchanged byte-for-byte. This package updates its reference documentation only; no Store Control HTML replacement is required. Shared image normalization also repairs the thumbnail/media values it receives. No database, role assignment, provider credential or external deployment changed.

## 2026-10-08 — V12 Store Control product-query correction

Follow-up report: "Wix products could not be loaded" with reference `SC-muyzftxv-bv0ed8`. The deployed page bundle contains the prior bootstrap/error repair, and the current main source retains the approved image and staff-access fixes. This message identifies the products phase after authorization; the matching private monitoring entry was not accessed.

Confirmed query defect: the site's locked dependencies are `@wix/stores` 1.0.823, `@wix/auto_sdk_stores_products-v-3` 1.0.193 and `@wix/sdk-runtime` 1.0.17. Executing that official Products V3 SDK with the locked runtime shows that the existing typed query sends the sort string `_updatedDate` unchanged. Wix's Query Products contract permits `updatedDate`, not `_updatedDate`, as the sort field. Later SDK runtimes can translate this string, so testing against an unpinned newer runtime would miss the defect.

The complete canonical `storefront.js` now uses `updatedDate` in `queryAllProducts`. This is the only runtime change. Cursor paging, requested image/media fields, image normalization, product response date handling, elevated SDK calls, staff authorization, exports and error propagation are preserved. No dependency upgrade or HTML/page/facade replacement is required.

Correction to the preceding bootstrap entry: its statement that the catalog sorting was supported did not verify serialization through the site's locked SDK. That conclusion is superseded by the captured request from the exact installed versions. The previously successful REST request alone was insufficient evidence for the SDK call.

VERIFIED locally: four focused checks cover the original unsupported serialized field; corrected real-SDK serialization with cursor paging and retained images; failure/malformed-response propagation; and the complete file's single query-field difference with preserved bootstrap imports/exports/messages. HTTP responses in the SDK tests are fixtures, not live Velo execution.

VERIFIED on the live site through a read-only connector query: the corrected request returned HTTP 200 with all 30 products, `hasNext:false`, and descending update dates. Official contract: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/query-products . STATICALLY VERIFIED: embed → page → SiteMember facade → canonical core mappings. REQUIRES LIVE TEST: after replacing the one backend file and publishing, open `/riaintra/success-factors/store-control` as the affected authorized staff member and confirm product loading/refresh. A connector catalog read does not prove the published staff-session/elevation path.

The complete HTML payload below is preserved byte-for-byte. This file changes reference documentation only. No external source, deployment, database, credential or role assignment was changed.

## 2026-10-08 — V12 promotions empty-result repair

Follow-up report: "Promotions could not be loaded". Current main source includes the approved product-query correction and image/access/error repairs. The warning is generated by the optional promotions service during bootstrap, after catalog loading.

Confirmed live response: both the existing empty query and an explicit first-page query returned HTTP 200 with exactly `{ "totalResults": 0 }`. Wix omitted the optional `coupons` array because the site has no coupons. The existing `readCoupons` check required an array and therefore threw "Promotion response was invalid" for that valid result. The Wix Velo documentation confirms the existing `wix-marketing.v2` import, `queryCoupons(query)` call and `wix-auth` elevation pattern; those interfaces remain unchanged.

The canonical `src/backend/SKANDI_CORE/storefront.js` now accepts an omitted `coupons` array only when `totalResults` is the number zero. Existing arrays are mapped as before. An absent or malformed response, a nonzero/malformed count without an array, an invalid array value, or a rejected provider request still produces the existing promotions warning. This is a confirmed empty result, not a fallback for API failures. Coupon creation remains unchanged and was not invoked.

VERIFIED on the live site through read-only connector requests: both coupon queries succeeded and returned zero results. VERIFIED locally: four focused checks reproduce the original warning using that captured envelope, then exercise core → SiteMember facade → page → HTML to show the existing "No promotions returned" state without the false warning. Checks also cover populated coupons, explicit empty arrays, malformed responses, provider rejection, authorization, retained product thumbnails and the prior query correction. Local Velo services are simulated; these tests do not execute a signed-in published Wix session.

STATICALLY VERIFIED: complete JavaScript syntax, canonical imports/exports and unchanged message/element contracts. Only the confirmed zero-result guard and its explanatory comment were added to runtime code. All previous INFO / LOG entries and the complete HTML payload are preserved. This HTML_REF update is documentation only; the live embed, page controller and facade do not need replacement.

REQUIRES LIVE TEST: replace the supplied complete `storefront.js`, rebuild and publish, then refresh Store Control as the affected authorized staff member. With the currently empty coupon catalog, the promotions list should show "No promotions returned" without a promotions loading warning. The package does not publish or modify GitHub, Wix data, roles, credentials or Supabase.

Official contracts: [Velo queryCoupons](https://dev.wix.com/docs/velo/apis/wix-marketing-v2/coupons/query-coupons) and [Query Coupons response schema](https://dev.wix.com/docs/api-reference/business-solutions/coupons/coupons/query-coupons).

## Complete intended HTML

> The matching executable source is maintained in this page folder.
