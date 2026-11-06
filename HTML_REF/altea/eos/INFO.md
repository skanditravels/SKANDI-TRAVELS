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
