# INFO / LOG — SKANDI GroupTalk

> Current document: `altea-embeds/group-talk/README.md`. Original reference: `HTML_REF/riaintra/GroupTalk.md`.


- WIX PAGE: `GroupTalk.wi4iw`
- HTML COMPONENT: `#htmlGroupTalk`
- CHILD SOURCE: `GROUPTALK_HTML`
- CANONICAL BACKEND: `/src/backend/SKANDI_CORE/groupTalk.web.js` → `/src/backend/SKANDI_CORE/groupTalk.js`
- VOICE: LiveKit room audio with server-issued short-lived room tokens
- PRESENCE / ACTIVITY: established Supabase Realtime GroupTalk subsystem
- RECEIVER: page-specific receiver generated beside the GroupTalk source after a successful build
- REQUIRED WIX SECRET: `SUPABASE_JWT_SECRET` (active Supabase HS256 signing secret)
- SUPABASE MIGRATION: `20261027200056_grouptalk_private_realtime_and_db_broadcasts.sql`
- STATUS: PRIVATE REALTIME SYNC STATICALLY VERIFIED — REQUIRES LIVE TEST

## CHANGE LOG
- 2026-10-12 — Hardened the existing genuine LiveKit push-to-talk path as a walkie-talkie: single-flight room connection prevents duplicate concurrent connects/token requests; group changes and offline/page exit now explicitly mute/disconnect and remove attached remote audio; remote track unsubscribe cleans its audio element; connection establishes in listen-only mode with microphone forced off; browser blur/visibility loss releases PTT to prevent a stuck open microphone; obsolete legacy VOICE_* bridge handlers referencing undeclared state were removed. Existing `PTT_EVENT`, LiveKit token, Supabase Realtime, group permission and audit contracts remain unchanged. STATICALLY VERIFIED; REQUIRES LIVE TEST with at least two devices/users and microphone permission.
- 2026-10-27 — Added short-lived staff-scoped private Supabase Realtime tokens and database-change invalidation broadcasts for GroupTalk data; retained Wix backend authorization for reads and writes. The successful build now generates and publishes the GroupTalk page receiver beside its source triplet. The receiver remains dependent on the active Wix controller and `SUPABASE_JWT_SECRET`. STATICALLY VERIFIED; REQUIRES LIVE TEST with two authorized staff sessions and voice permissions.


- 2026-10-28 UTC — Updated `skandi-embeds/group-talk/skandi-group-talk.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **ALTEA GroupTalk** (`/riaintra/success-factors/altea/grouptalk`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

- 2026-11-07 UTC — Live GroupTalk loaded but remained offline, and Wix Logs showed `PHONEBOOK_REQUEST` failing with `TypeError: n is not a function` at the page boundary. The facade now exports each existing Wix web method directly through `webMethod`, retaining the same names, permission settings and core authorization. The indirect registration pattern was a likely cause; Wix publication and an authenticated live retest are required to confirm it. Multi-user voice and realtime sync still require separate live testing.
- 2026-11-07 UTC — After the web-method repair was published, an authenticated live session loaded the group, staff phonebook and categories and connected to LiveKit in listen-only mode. Supabase Realtime logs showed a rejected JWT signature and subsequent private-channel authorization failures; the project uses a current ES256 signing key, while the existing GroupTalk token issuer uses HS256. The precise signature mismatch remains unconfirmed and private realtime is not working. A quick PTT release could race an asynchronous microphone enable; microphone operations are now serialized and a released, changed-group, offline or hidden session invalidates the pending press. Automated tests cover release while connecting, release during microphone activation and a rapid new press. End-to-end two-person audio and realtime synchronization still require live verification.
- 2026-11-07 UTC — A later authenticated production session loaded the generated PTT repair, joined the LiveKit room in listen-only mode, reported the private realtime channel online and displayed the signed-in staff member in the online list. This supersedes the earlier offline observation for this single session; the reason for the earlier signature failure has not been established. The current GroupTalk token issuer still uses HS256, so this is not evidence of an ES256 migration. A two-session message/presence test and two-person microphone/audio test remain outstanding.

- 2026-11-28 — Adopted the supplied desktop dispatch and mobile layouts in the active GroupTalk source triplet. Desktop uses resizable panes, group and contact tabs, tickets, and MapLibre layers. The phone layout retains push-to-talk, phonebook, My Tickets, location sharing and the three-second emergency control. The builder owns the generated shell and receiver. The existing ALTEA route, #htmlGroupTalk binding, GroupTalk Wix facade and staff authorization remain the integration points.
- 2026-11-28 — Group radio tones now use the existing private GroupTalk broadcast and require talk permission. The microphone starts after voice connects, and release keeps the original group even if the operator changes groups. Going offline invalidates pending voice and realtime connections. Emergency confirmation follows acknowledgment from the broadcast service. Phonebook calls use the device dialer. Email follow-up details are recorded with the ticket reply.
- 2026-11-28 — The generated GroupTalk page compiled. Automated tests verify microphone release and radio-tone authorization. Desktop and mobile integration checks use simulated Wix, LiveKit, Supabase and MapLibre. A live two-session check still requires the authorized Wix release.

## COMPLETE INTENDED HTML

> The matching executable source is maintained in this page folder.
