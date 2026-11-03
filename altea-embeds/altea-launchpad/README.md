# INFO / LOG — ALTEA LAUNCHPAD

> Current document: `altea-embeds/altea-launchpad/README.md`. Original reference: `HTML_REF/altea/ALTEA Launchpad.md`.


## CHANGE LOG (append-only)

- 2026-10-28 UTC — Updated `skandi-embeds/altea-launchpad/skandi-altea-launchpad.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **ALTEA Launchpad** (`/riaintra/success-factors/altea`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.
- 2026-10-28 UTC — Updated `skandi-embeds/eos/skandi-eos.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **EOS Mobile Operations** (`/riaintra/success-factors/altea/eos`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.


- Source file: `/HTML_REF/altea/ALTEA Launchpad.md`.
- Display name/system: ALTEA Launchpad / ALTEA.
- Wix page: `/src/pages/ALTEA Launchpad.ajs4y.js`.
- Route: `/riaintra/success-factors/altea`, owned by `public/siteMap.SITE_MAP.alteaLaunchpad`.
- HTML element: the existing Wix HTML component that sends `source: SKANDI_ALTEA_LAUNCHPAD` with a valid `ALTEA_LAUNCHPAD_READY` or `ALTEA_LAUNCHPAD_REFRESH` request. V12.1 enumerates `$w("HtmlComponent")` using the existing master-page pattern, then pins the responding component. No hard-coded ID, fallback alias or element rename is required. The actual live element ID is not established by the public controller bundle.
- Canonical backend facade: `backend/SKANDI_CORE/staffAuth.web`.
- Canonical implementation: `backend/SKANDI_CORE/staffAuth`, using `supabaseServer`, `platformCache`, `platformErrors`, `platformValidation`, `platformAudit`, and `public/siteMap`.
- Authentication/authorization: Wix Members session; Supabase staff identity, effective assignment, active access role and permission preset; existing ALTEA app/group filters. Browser-supplied app IDs and paths never grant access.
- Supabase resources: `agent_users`, `org_employee_assignments`, `org_access_roles`, `org_permission_presets`; existing staff-auth audit dependency `staff_login_audit`. No new resources, queries, policies or permission grants.
- External dependencies: Wix Members, Wix web methods, Wix HTML components and Wix Location. Launchpad does not directly call Duffel, Amadeus, Timatic or other provider APIs; it opens existing authorized application routes.
- Status: V12.1 bridge correction, locally tested (31/31 checks). STATICALLY VERIFIED for syntax, transitive imports/exports, message contracts and unchanged schema dependencies. REQUIRES LIVE TEST for Wix publication, authenticated navigation and destination application behavior.
- Source-of-truth provenance: no existing Launchpad HTML_REF was found in the supplied project or matching Library title results. The complete user-supplied `Pasted text(20261006-064759).txt` is the authoritative HTML input for this repair.
- Last inspected: 2026-10-06.
- Change log: 2026-10-06 — Established this complete HTML_REF from the supplied Launchpad HTML and traced its existing B-002 page bridge to the V12 staff-auth core. The current core matches the earlier V12 delivery apart from a trailing newline; the canonical cache matches the prior cache repair. All four authorization tables and their selected fields were verified by read-only schema inspection, with RLS enabled. The uploaded HTML's message names match the existing page. Identified missing ready retry/bootstrap timeout, uncaught startup rejection, lost request correlation, stale response handling and late navigation locking.
- Change log: 2026-10-06 — Read-only inspection of the current published page bundle establishes `#alteaDasboardEmbed` as the controller's target and confirms both `getStaffPortalSession` and `getAlteaLaunchpadApps` have generated Wix backend proxies. Corrected the replacement controller's ID accordingly. The three historical local ID candidates are not retained as fallback aliases. The staff-auth facade already supports this contract and requires no change.
- Change log: 2026-10-06 — V12 bridge and HTML now use HOST_READY plus repeated, correlated read-only READY/REFRESH requests; navigation is sent once. Added bounded service/UI timeouts, explicit loading/error/empty states, persistent Refresh, stale-response rejection, safe coded errors, dialog focus handling and one navigation at a time. Existing staff identity and permission rules are unchanged; each launch revalidates the canonical backend app list. No added backend facade, duplicate app catalog, independent database client or provider call.
- Change log: 2026-10-06 — Inspected the published Wix route map: `uposx` (OPS Control) is `/riaintra/success-factors/altea/ops`. Corrected only `SITE_MAP.opsControl` from its obsolete `/occ` value. Ticketing and PSS/DCS have no matching static or dynamic published routes; their existing authorized catalog entries now carry `available:false` and a visible reason. They remain visible to authorized staff, but cannot launch. Their permission groups, IDs and intended future paths are retained. No destination pages were invented or redirected to unrelated tools.
- Change log: 2026-10-06 — 20/20 local checks pass using jsdom and the actual pinned `@wix/web-methods@1.0.12` SDK with Wix Members and Supabase operations stubbed. Nine transitive local dependency files pass import/export checks. The complete HTML remains in this document and is extracted verbatim for delivery. No GitHub, live Wix, Supabase data/schema or provider configuration was changed.
- Change log: 2026-10-06 — V12.1 correction after the user supplied repeated `[ALTEA Launchpad] No supported HTML embed was found.` console output. This proves the old controller exits before registering its message handler. The earlier decision to treat its `#alteaDasboardEmbed` target as an existing page component is superseded: the published code established a lookup target, not that element's presence. The previous test fixture repeated the assumed ID and did not detect this mismatch. A regression fixture with a different actual ID reproduces the exact old error.
- Change log: 2026-10-06 — Replaced only the page controller's fixed-ID lookup with bounded HTML-component discovery. Each discovered component gets one listener and a non-sensitive HOST_READY notice. The first valid Launchpad READY/REFRESH pins the channel before any asynchronous authorization; NAVIGATE cannot claim it. Other components cannot take over, receive the authorized profile/app list, or invoke navigation after binding. Discovery stops on connection or after 40 passes at 500 ms intervals; listeners already registered remain usable for a later HTML Retry. Added distinct missing-component and missing-handshake diagnostics plus the actual bound element ID in the console.
- Change log: 2026-10-06 — V12.1 passes 31/31 local checks, including old-error reproduction, differently named embeds, header/footer isolation, delayed mounting, single registration, bounded discovery, lost HOST_READY, channel pinning during an in-flight authorization, and a complete HTML/page/SDK/core fixture round trip. The executable HTML, page imports, staff-auth implementation/facade and shared route map are unchanged from V12. Nine transitive dependency files pass import/export checks. No live deployment, GitHub mutation, database operation or provider configuration change was performed for V12.1.

## V12 ownership and contracts

`HTML_REF/altea/ALTEA Launchpad.md` → existing HTML component identified by its Launchpad handshake → `src/pages/ALTEA Launchpad.ajs4y.js` → `staffAuth.web` → `staffAuth` → existing Wix Members / Supabase helpers.

The uploaded layout, colors, icons, responsive tiles and search remain. The HTML obtains all applications and availability from the backend; no staff roles or app catalog are maintained in the embed. The shared `SITE_MAP` remains the owner of the OPS route.

| Direction | Message | Behavior |
| --- | --- | --- |
| Page → HTML | `ALTEA_LAUNCHPAD_HOST_READY` | Non-sensitive discovery notice to each detected HTML component; the Launchpad resends its pending request with the same ID. No profile or app data is broadcast. |
| HTML → Page | `ALTEA_LAUNCHPAD_READY` | Loads the authorized app list. |
| HTML → Page | `ALTEA_LAUNCHPAD_REFRESH` | Rechecks session and app access; Retry and Refresh create a new ID. |
| Page → HTML | `ALTEA_LAUNCHPAD_BOOTSTRAP` | Returns sanitized apps/profile with the caller's request ID. Can also update the app list when a launch discovers changed access. |
| HTML → Page | `ALTEA_LAUNCHPAD_NAVIGATE` | Sends an app ID and displayed path once; the page checks its authorized snapshot and revalidates backend access before navigating. |
| Page → HTML | `ALTEA_LAUNCHPAD_NAVIGATING` | Acknowledges that Wix Location accepted the navigation call. Does not claim the destination finished loading. |
| Page → HTML | `ALTEA_LAUNCHPAD_ERROR` | Returns a safe message/code with the same request ID. |

- Release: `V12.1-ALTEA-LAUNCHPAD-2026.10.06` in the corrected page controller. The compatible, unchanged HTML retains `V12-ALTEA-LAUNCHPAD-2026.10.06`. This is a controller-only runtime repair, not a new HTML protocol.
- Discovery uses the Wix component type selector, not a guessed element name. It retries only listener discovery, never a navigation or mutation. Message source/type/request ID identify the Launchpad channel; they are not substitutes for backend staff authorization. Once pinned, responses and errors go only to that component. A missing HTML component cannot be created by this controller; the page must contain the existing Launchpad HTML.
- Backend app descriptors retain `id`, `title`, `description`, `icon`, `code`, `accent`, `path`, and add `available` plus `unavailableReason`. Availability is catalog metadata, independent of staff permission grants. A browser message cannot override the page's backend-supplied availability.
- Read-only handshakes repeat every 1.5 seconds with the same request ID. Concurrent bootstrap requests share a backend read; only the current request receives its result. The page bounds the authorization check at 20 seconds; HTML stops waiting at 30 seconds. Expired responses are ignored and navigation is never automatically replayed.
- The page uses the existing staff-auth endpoints. `getStaffPortalSession` retains `Permissions.Anyone`; `getAlteaLaunchpadApps` retains `Permissions.SiteMember` and backend staff authorization. The shared core's existing five-minute access-role/preset cache remains; a fresh endpoint call does not bypass that cache.
- HTML verifies the message's source window and, when available, the parent origin derived from the browser referrer. It accepts only matching request IDs. Service failures are not presented as a successful empty app list. Authorization and data access remain enforced by the destination backends as well.

## Published-route check — 2026-10-06

| Existing app ID | Canonical target | V12 launch state |
| --- | --- | --- |
| `ardw` | `/riaintra/success-factors/altea/reservations` | Route present; staff authorization required. |
| `inventory` | `/riaintra/success-factors/altea/inventory-control` | Route present; staff authorization required. |
| `uniform-control` | `/riaintra/success-factors/uniform/admin-control` | Route present; staff authorization required. |
| `ticketing` | `/riaintra/success-factors/altea/ticketing` | Visible when authorized; unavailable until the actual application is published. |
| `pss-dcs` | `/riaintra/success-factors/altea/departure-control` | Visible when authorized; unavailable until the actual application is published. |
| `timatic` | `/riaintra/success-factors/altea/timatic` | Published route retained. Existing site-map deprecation metadata is unchanged. |
| `grouptalk` | `/riaintra/success-factors/altea/grouptalk` | Route present; existing app/group/GroupTalk flag checks retained. |
| `occ` | `/riaintra/success-factors/altea/ops` | Corrected to the published OPS Control route; app ID and permission groups stay unchanged. |

Route presence verifies routing, not destination functionality. When Ticketing or PSS/DCS is actually published, verify its route and authorization before updating availability in this same `staffAuth.ALTEA_APPS` catalog. No additional registry is required.

## Verification and deployment

- The 31 local checks cover old-error reproduction, a different actual element ID, unrelated header/footer messages, pinned-channel isolation, delayed component mounting, selector return shapes, bounded retries, missing components, missing handshakes, lost HOST_READY, one listener per component, and unchanged V12 HTML/backend/routes/imports. Existing checks also cover anonymous/inactive access denial, preset/group filtering, GroupTalk gating, SDK permission metadata, concurrent bootstrap/refresh correlation, expired sessions, changed app access, forged paths, duplicate navigation, missing exports, safe failures, timeouts/late replies, escaped tile content, search, retry/empty states, unavailable tiles, dialog keyboard handling and a full late-mounted embed/page/SDK/core round trip with test fixtures.
- Live database metadata confirms the selected staff/assignment/role/preset columns exist and RLS is enabled on all four tables. No database query, policy or grant was changed by this repair.
- For this V12.1 correction, replace the complete `/src/pages/ALTEA Launchpad.ajs4y.js`, retain this updated HTML_REF, publish and reload the page while signed in. Keep the already installed V12 Launchpad HTML, `staffAuth.js`, `staffAuth.web.js`, `public/siteMap.js`, repaired `platformCache.js`, `supabaseServer.js`, other canonical helpers and `masterPage.js` unchanged. The original V12 package remains the full-install prerequisite; the V12.1 correction package contains full changed files, not diff fragments.
- Expected new console confirmation: `[ALTEA Launchpad] Bridge attached to #<actual element ID>.` If the original `No supported HTML embed was found.` still appears, the old page controller is still running. If the new diagnostic says no HTML component could be bound, verify that this page actually contains a Wix HTML component. If it says components were found but none sent the handshake, verify the full Launchpad HTML below is installed in the intended component rather than only in a header/footer. Do not rename elements to guess an ID.
- Live verification still required: sign in with a valid staff session, load/search/refresh the Launchpad, open an assigned application and OPS Control, and confirm revoked access remains blocked. Wix's permission enforcement, actual navigation, publication parity and destination services are not simulated by local tests.
- No SQL migration, new secret, npm dependency or Wix element rename is needed. The original uploaded file remains an input reference; this document owns the final complete HTML below.
- Official API references checked: https://dev.wix.com/docs/sdk/core-modules/web-methods/web-method ; https://dev.wix.com/docs/velo/velo-only-apis/%24w/html-component/post-message ; https://dev.wix.com/docs/velo/apis/wix-location-frontend/to . Public route/module evidence was read from https://www.skanditravels.com/riaintra/success-factors/altea .

## COMPLETE HTML / SOURCE IMPLEMENTATION

> The matching executable source is maintained in this page folder.
