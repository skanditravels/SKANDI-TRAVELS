# SKANDI Payroll

> Current document: `riaintra-embeds/payroll/README.md`. Original reference: `HTML_REF/riaintra/Payroll.md`.


## INFO / LOG

- **Status:** V12 repair prepared — STATICALLY VERIFIED / REQUIRES LIVE TEST
- **System:** RIAINTRA
- **Route:** `/riaintra/success-factors/payroll`
- **Wix page:** `Payroll.rzo0a`
- **HTML component:** `#payrollStaffEmbed`
- **Child source:** `SKANDI_ZALARIS_PAYROLL`
- **Repository baseline:** `skanditravels/SKANDI-TRAVELS` main `4163618a81fed71d7114ac55d3fa003421f145b0`
- **Prepared:** 2026-10-13

### V12 repair

Adds listener-first/proactive payroll synchronization and recovery. SuccessFactors remains owner of organization/position/manager/jurisdiction master data; Payroll consumes that data and owns payroll data/export state.

### Verification boundary

Source contracts and syntax are checked locally. Wix publication, Supabase/RLS, staff/member session state and provider behavior require live testing after replacement and publication.

---


- 2026-10-28 UTC — Updated `skandi-embeds/payroll/skandi-payroll.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Payroll** (`/riaintra/success-factors/payroll`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
