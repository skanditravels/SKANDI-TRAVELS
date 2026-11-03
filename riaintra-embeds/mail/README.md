# INFO / LOG — MAIL

> Current document: `riaintra-embeds/mail/README.md`. Original reference: `HTML_REF/riaintra/Mail.md`.


- Source file: `/HTML_REF/riaintra/Mail.md`.
- Display name/system: Mail / RIAINTRA.
- System area: `RIAINTRA`.
- Canonical product name: **Mail**. `H-Mail` is not a current product name or permission key.
- Wix page: `/src/pages/Mail.ecik8.js`.
- Route: `/riaintra/success-factors/mail`, owned by `public/siteMap.SITE_MAP.mail`.
- Wix HTML element: `#mailEmbed`.
- Page mode: `APP_VIEWPORT_RIAINTRA` — RIAINTRA 52px global header/footer family, main app region `calc(100vh - 52px)`, HTML component 100% W/H, embed owns workspace scrolling.
- Canonical backend facade: `/src/backend/SKANDI_CORE/mail.web.js` (unchanged by this repair).
- Canonical backend core: `/src/backend/SKANDI_CORE/internalMail.js`.
- Canonical storage/transport: `/src/backend/SKANDI_CORE/supabaseServer.js`.
- Authentication/authorization: Wix Members → `staffAuth`; server access uses the canonical `mail` allowed-app/permission key. Browser-supplied aliases, SK-IDs or mailbox state never grant authority.
- Supabase resources verified 2026-10-14: `internal_mail_accounts`, `internal_mail_threads`, `internal_mail_messages`, `internal_mail_recipients`, `internal_mail_entries`, `internal_mail_attachments`, `internal_mail_events`.
- Storage verified 2026-10-14: private bucket `internal-mail-attachments`; 25 MB bucket limit with the existing document/image/text MIME allowlist. Mail retains its stricter 10 MB per-file application limit.
- Message contract: HTML → page `MAIL_READY`, `MAIL_LIST_REQUEST`, `MAIL_GET_REQUEST`, `MAIL_SEND_REQUEST`, `MAIL_DRAFT_SAVE_REQUEST`, `MAIL_STATE_REQUEST`, `MAIL_DIRECTORY_REQUEST`; page → HTML corresponding `*_RESPONSE` messages and `MAIL_ERROR`.
- Status: **STATICALLY VERIFIED — REQUIRES LIVE TEST**.
- Source-of-truth provenance: no current Mail HTML_REF file was present in GitHub `main`; the user-supplied `Pasted text (2)(20261014-175027).txt` is the authoritative HTML input for this V12 convergence.
- Last verified date: 2026-10-14.

## Change log

- 2026-10-14 — Established the complete Mail HTML_REF from the supplied embed and current `Mail.ecik8.js` / `mail.web.js` / `internalMail.js` chain.
- 2026-10-14 — Corrected the broken `internalMail.js` staff-auth import syntax.
- 2026-10-14 — Removed the obsolete `h-mail` authorization alias. Mail now authorizes only the canonical `mail` key (plus established privileged access).
- 2026-10-14 — Corrected the staff application catalog label from `H-Mail` to `Mail`; app ID and route remain `mail` and `/riaintra/success-factors/mail`.
- 2026-10-14 — Enabled server-side writes for the existing private `internal-mail-attachments` bucket in the canonical Supabase transport so the already-implemented attachment flow can function without exposing direct browser storage credentials.
- 2026-10-14 — Added the V12 mobile 16px form-control guard while preserving the supplied Mail layout, folders, search, reading pane, compose flow, drafts, directory, settings and attachment behavior.


- 2026-10-28 UTC — Updated `skandi-embeds/mail/skandi-mail.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **RIAINTRA Mail** (`/riaintra/success-factors/mail`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE HTML / SOURCE IMPLEMENTATION

> The matching executable source is maintained in this page folder.
