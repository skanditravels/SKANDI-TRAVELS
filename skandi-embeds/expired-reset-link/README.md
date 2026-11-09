# INFO / LOG — Expired Reset Link

- **Status:** Source complete; Git synchronization, Wix publication and live member testing require verification.
- **System / page:** SKANDI Club; Wix Members authentication-system page `Expired Reset Link.anxhe`.
- **Route:** `/auth/expired-reset-link`, verified in published Wix router metadata. The editor displayed the corresponding page and its default Velo boilerplate.
- **Wix HTML component:** `#expiredResetEmbed`. No HTML component was observed on this page in the Wix editor; create it with this ID and paste the existing universal receiver into it.
- **Source:** `skandi-embeds/expired-reset-link/skandi-expired-reset-link.{html,css,js}`. The website builder generates `dist/expired-reset-link/index.html` and an identical page receiver copy.
- **Wix controller:** `src/pages/Expired Reset Link.anxhe.js`. `src/public/siteMap.js` registers the route, exact embed ID and editable presentation fields. `src/pages/masterPage.js` verifies the route and receiver; it recognizes Wix's separate `auth` router prefix for this page and Access Restricted.
- **Presentation:** Existing `SKANDI_PRESENTATION_READY` / `SKANDI_PRESENTATION_DATA` projection and Media Control text fields; the standard compiled-shell website-design runtime owns presentation styling. Default text remains when no presentation data is published.
- **Authentication:** `Send new link` opens the existing Wix Members `authentication.promptForgotPassword()` modal. The member must submit their email in the Wix form; a resolved form is not proof of email delivery. `Log in` calls `openCustomerLogin` in `src/public/customerAuthUi.js`, the configured SKANDI Club login lightbox. Successful sign-in returns to the Club route. The page never collects or sends passwords or reset tokens.
- **Go back:** Requests browser history navigation when available and falls back to the registered `/forgot-password` page if there is no history or navigation does not occur.
- **Backend / data:** The existing presentation facade and core provide editable copy; Wix Members and the existing Club login implementation own authentication. No new backend, database resources or permission changes.
- **Contracts:** `EXPIRED_RESET_AUTH` (`reset` or `login`) → `EXPIRED_RESET_AUTH_OPENING` / `EXPIRED_RESET_AUTH_RESULT`, correlated by request ID; `EXPIRED_RESET_BACK` → canonical recovery page, with `EXPIRED_RESET_BACK_ERROR` on failure. Only the named HTML component is wired by the page controller.
- **Verification boundary:** Local automated tests and the GitHub builder do not prove Wix has synchronized the new controller and route, the receiver has been installed, the expired-token redirect opens the page, or emails and login work in the published site.

## CHANGE LOG

- 2026-11-09 — Added the expired reset link page, its verified Wix router route, Media Control fields, universal-receiver binding and recovery, login and back actions. Updated shared authentication-router path resolution when Wix reports the prefix separately. Existing password and access controls remain owned by Wix Members.
