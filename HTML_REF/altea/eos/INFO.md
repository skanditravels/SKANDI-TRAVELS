# EOS source mapping

The active EOS interface is built from `altea-embeds/eos/skandi-eos.{html,css,js}`.
The Wix component is `#eosEmbed` at the EOS route in `src/public/siteMap.js`.
`src/pages/masterPage.js` owns its message bridge and staff authorization.

`superseded-page-react.txt` preserves the React/JSX copy formerly placed in
`src/pages/EOS.f6tx1.js`. That copy was not valid Wix page-controller code:
it attempted to mount into the page DOM and prevented Wix CLI bundling. It is
historical reference, not an active source or a replacement for the embed.

Wix preview compilation and homepage rendering were checked after the repair.
EOS staff authorization and device-specific behavior still need a live or
authorized staff-session check.

EOS reads the same staff assignment sources as MyRoster and OPS Control under
the existing staff authorization boundary. It refreshes every minute while open
and online, and when the app returns to the foreground or reconnects. Wix
Bookings availability is independent of the SKANDI staff roster.

## Transport services (2026-11-10 source change)

The active EOS embed keeps its existing shell, roster, clock, support and settings.
The former flight home/search/detail content now displays the signed-in employee's
published bus assignments from `vehicle_assignments`. Vehicle, stop and manual
passenger-count details are recorded by OPS. Draft services are excluded from
both EOS and MyRoster. The old flight-search backend methods remain for message
contract compatibility but are not used by the updated EOS screen.

This source has not been published to Wix or checked with a live staff session.
The transport registry migration and backend publication require a coordinated
release; see `docs/ops-transport-workforce.md`.

## Shared staffing draft (2026-11-11)

The backend source projects a shared bus service to every assigned
employee while keeping other employees' assignments private. The v2 database
migration is required before activating this code. See
`docs/ops-transport-staffing-work-in-progress.md` for the incomplete customer
notice and deployment status. Verify the published version in a live staff session.
