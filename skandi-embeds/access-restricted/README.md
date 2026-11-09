# INFO / LOG — Access Restricted

- **Status:** Source complete; Wix Git synchronization, publication and live integration require verification.
- **System:** SKANDI public website and Wix Members authentication-system page.
- **Page:** `Access Restricted.m6vln`; the published Wix router identifies page `m6vln` at `/auth/access-restricted`.
- **Wix component:** `#html1`, observed on the Access Restricted page in Wix Studio on 2026-11-09. Install the unchanged universal receiver from `skandi-embeds/receiver/skandi-wix-universal-receiver.html` in that component.
- **Source:** `skandi-embeds/access-restricted/skandi-access-restricted.{html,css,js}`. The current website builder generates `dist/access-restricted/index.html` and the page's identical receiver copy.
- **Wix page controller:** `src/pages/Access Restricted.m6vln.js`; route, page binding and presentation fields are registered in `src/public/siteMap.js`. The master controller supplies the verified receiver identity and shared public chrome.
- **Presentation owner:** Media Control uses the existing `SKANDI_PRESENTATION_READY` / `SKANDI_PRESENTATION_DATA` contract and the page's registered text fields. Published design settings use the existing compiled-shell design runtime. Default copy remains visible if presentation data is unavailable.
- **Existing backend:** `backend/SKANDI_CORE/presentation.web.js` → `backend/SKANDI_CORE/presentation.js`; existing public website-presentation data only. No new provider, database resource, schema or permission is introduced.
- **Navigation:** `SKANDI_ACCESS_RESTRICTED` sends `ACCESS_RESTRICTED_NAVIGATE` with `home` or `support`; the page controller only accepts those two route keys and resolves them through `SITE_MAP`. Navigation errors are shown in the component.
- **Authorization boundary:** This is an informational screen only. Wix Members, page restrictions and existing backend authorization remain responsible for granting or denying access. The page accepts no credentials and performs no permission changes.
- **Verification:** The live site's published page metadata and the editor's component ID were inspected. The new code, receiver handshake, actual redirect into this page, navigation, and responsive layout still require verification after Wix receives and publishes the new source.

## CHANGE LOG

- 2026-11-09 — Added the Access Restricted page, the verified `/auth/access-restricted` route and `#html1` integration, editable presentation fields and allowlisted navigation through the page controller. The original Git-tracked page controller did not exist; the Wix editor displayed only the default Velo reference comment. No existing authentication or authorization policy was altered.
