# SKANDI Club Log In popup — INFO / LOG

- 2026-11-08 — Draft based on the Wix popup HTML supplied by the site owner. Wix Members authenticates the supplied email and password; Wix CAPTCHA must authorize the request. The existing staff lookup rejects linked staff identities before the browser receives a Wix session token. Existing Wix signup and reset popups remain the owners of those flows.
- Wix popup: `SKANDI Club Log In.bytg4.js`; HTML component: `#html1`; native Wix CAPTCHA: `#clubLoginCaptcha`.
- The HTML is installed directly in this Wix popup. It is separate from the `/skandi-club/login` page and its generated receiver. It reads brand assets from `masterPage.js` and optional Club presentation data from the existing presentation service.
- **REQUIRES LIVE TEST:** HTML parent origin/referrer, CAPTCHA placement and verification, Wix Members login, rejection of linked staff, mobile layout, signup and reset popup transitions. This implementation is not confirmed published.
