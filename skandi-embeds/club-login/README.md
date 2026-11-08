# SKANDI Club Login

> Current document: `skandi-embeds/club-login/README.md`. Original reference: `HTML_REF/skandi/SKANDI Club Login.md`.


## INFO / LOG

- 2026-11-08 — A separate Wix lightbox implementation is being prepared in `skandi-embeds/club-login-popup/`; the `/skandi-club/login` page documented below is preserved. The popup requires its own Wix HTML component and native CAPTCHA. Its authentication and layout require a live Wix test before publication.

- **Current status:** `SOURCE COMPLETE — WIX PAGE/ELEMENT INSTALLATION REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/skandi-club/login`
- **Wix page:** `SKANDI Club Log in.noml8`
- **HTML component:** `#skandiClubLoginEmbed`
- **HTML child source:** `SKANDI_CLUB_LOGIN`
- **Wix popup authority:** `src/public/siteMap.js` → `CUSTOMER_AUTH_POPUPS`
- **Page controller:** `/src/pages/SKANDI Club Log in.noml8.js`
- **Canonical backend facade:** `src/backend/SKANDI_CORE/presentation.web.js` → `getPublicPagePresentation`
- **Canonical backend core:** `src/backend/SKANDI_CORE/presentation.js`
- **Supabase resources:** public Storage bucket `skandi-public-assets`; presentation content reads `organizations` and `voy_entities` through the canonical core.
- **Wix identity boundary:** Wix Site Members authentication through the configured Wix login, signup and reset-password lightboxes. The embed never accepts credentials.
- **Page assets:** `MASTER_CONFIG.brand.assets.images.clubLoginHero` in `/src/pages/masterPage.js`, served from the verified public Supabase asset map.
- **Media Control:** Hero copy, CTA labels and the `club-login-hero` media slot use the public presentation runtime. A configured Media Control image overrides the MasterPage default.
- **Message contracts:** `MASTER_ASSETS_REQUEST` / `SKANDI_MASTER_ASSETS`; `SKANDI_PRESENTATION_READY` / `SKANDI_PRESENTATION_DATA`; `SKANDI_CLUB_LOGIN_OPEN`, `SKANDI_CLUB_SIGNUP_OPEN`, `SKANDI_CLUB_RESET_OPEN`, `SKANDI_CLUB_LOGIN_NAVIGATE`, and `SKANDI_CLUB_LOGIN_HEIGHT`.
- **Version:** `CLUB-LOGIN-1.0`
- **Last verified:** `2026-10-27`

The page collects no credentials. Login, sign-up and password reset open the configured Wix member lightboxes through the page controller. The controller currently opens the named Wix lightbox `SKANDI Club Log In`; its live contents and Wix publication state still require verification. Page navigation is sent to Wix and allow-listed by the controller. The hero image is requested from the MasterPage Supabase asset map; a valid `club-login-hero` image set in Media Control takes priority.

### Change log

- `2026-10-27` — Replaced the Git-bundled Club Login hero image with the public Supabase lifestyle image exposed by MasterPage. Added MasterPage-first loading and retained the Media Control image override.

> The matching executable source is maintained in this page folder.

- 2026-10-28 UTC — Updated `skandi-embeds/club-login/skandi-club-login.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **SKANDI Club Login** (`/skandi-club/login`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.
