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

## COMPLETE INTENDED HTML

> The matching executable source is maintained in this page folder.
