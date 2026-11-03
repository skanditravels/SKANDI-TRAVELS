# SKANDI Uniform Center

> Current document: `riaintra-embeds/uniform-center/README.md`. Original reference: `HTML_REF/riaintra/Uniform Center.md`.


## INFO / LOG

- **Status:** V12 repair prepared — STATICALLY VERIFIED / REQUIRES LIVE TEST
- **System:** RIAINTRA
- **Route:** `/riaintra/success-factors/uniform`
- **Wix page:** `Uniform Center.lukfc`
- **HTML component:** `#uniformCenterEmbed`
- **Child source:** `SKANDI_UNIFORM_EMPLOYEE`
- **Repository baseline:** `skanditravels/SKANDI-TRAVELS` main `4163618a81fed71d7114ac55d3fa003421f145b0`
- **Prepared:** 2026-10-13

### V12 repair

Added server-authoritative Admin Login routing to Uniform Control, an explicit unauthorized dialog, and resilient startup synchronization. Existing employee catalog/order/policy functionality is preserved.

### Verification boundary

Source contracts and syntax are checked locally. Wix publication, Supabase/RLS, staff/member session state and provider behavior require live testing after replacement and publication.

---


- 2026-10-28 UTC — Updated `skandi-embeds/uniform-center/skandi-uniform-center.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Uniform Center** (`/riaintra/success-factors/uniform`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
