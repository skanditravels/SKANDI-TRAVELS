# INFO / LOG — Wix Automations Integration

- **System area:** GLOBAL / SKANDI V12
- **Purpose:** Canonical server-side connection between SKANDI V12 and Wix Automations, including the Git-managed Run Velo Code entry point.
- **Wix site:** SKANDI TRAVELS (`97bf5405-2507-4744-b53a-0f1a5a61796d`).
- **Canonical backend facade:** `/src/backend/SKANDI_CORE/automationControl.web.js`
- **Canonical backend core / Git action entry point:** `/src/backend/SKANDI_CORE/automationControl.js`
- **Wix provider:** `@wix/automations` → `automationsV2`
- **Authorization:** Wix Site Member facade plus canonical `requireStaffPortalSessionCore()` for administration metadata. The Git-managed Run Velo Code entry point is backend-only and is not exposed through the site-member web facade.
- **Current consumer:** `/src/pages/Customer Service Desk.benbs.js` → existing Customer Service Desk Admin Center.
- **HTML contract:** Existing `SKANDI_SUPPORT_AGENT` HTML already accepts `triggers[]` and `automations[]` in `AGENT_BOOTSTRAP`; no HTML payload replacement is required for this connection.
- **Run Velo Code contract:** On Git-managed Wix sites, select existing backend function `/src/backend/SKANDI_CORE/automationControl.js` → `skandiAutomationHandler`. The conventional `invoke` export aliases the same implementation.
- **Source of truth:** Wix Automations remains authoritative for workflow definitions, trigger/action configuration, activation state, revisions and execution. SKANDI V12 remains authoritative for SKANDI business workflow handlers and branded communication logic.
- **Secrets:** None are exposed to HTML or page code. This entry-point repair does not add trigger IDs, email-provider credentials or customer data to frontend code.
- **Status:** **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Git installation/synchronization and Wix publication.

## Architecture

Administration read path:

`Customer Service Desk HTML` → `postMessage / AGENT_READY` → `/src/pages/Customer Service Desk.benbs.js` → `/src/backend/SKANDI_CORE/automationControl.web.js` → `/src/backend/SKANDI_CORE/automationControl.js` → Wix Automations V2.

Git-managed Run Velo Code path:

`Wix Automation trigger` → `Run Velo Code` → existing backend function `SKANDI_CORE/automationControl.js → skandiAutomationHandler()` → `runAutomationActionCore()` → explicitly mapped canonical SKANDI workflow handler.

The automation layer is supplemental to the existing Customer Support chain. Supabase remains authoritative for customer-support cases and messages. Wix Automations remains authoritative for automation workflow definitions.

## Behavior

1. Customer Service Desk requests its normal bootstrap.
2. The Wix page controller requests the existing customer-support bootstrap and a Wix Automations administration snapshot in parallel.
3. Authorized system administrators receive normalized automation and trigger metadata in the existing `AGENT_BOOTSTRAP` payload.
4. The existing Admin Center renders these records through its already-present `db.triggers` and `db.automations` contract.
5. Staff without automation-administration authority continue to receive the Customer Service Desk normally; the automation arrays remain empty and the support workspace is not blocked.
6. Automation payloads, action mappings, email contents, trigger schemas, secrets and internal execution details are not exposed to the HTML embed.
7. For Git-managed Run Velo Code actions, Wix can select the existing `skandiAutomationHandler` backend export instead of attempting to create an unsupported service-plugin `.js` file from the Automations interface.
8. The entry point accepts Wix's action options object, extracts `payload`, delegates to the canonical action boundary, and returns the empty object required by Wix after successful execution.
9. The action boundary fails closed for unmapped production workflows. It never reports a successful customer communication when no canonical SKANDI workflow handler exists.
10. `SKANDI_AUTOMATION_ENTRYPOINT_TEST` is the only action accepted by this repair itself and exists solely to verify that Wix reached the Git-managed backend entry point. Customer-facing receipt, delay, reminder, payment, document, post-travel and ticket workflows require their own verified canonical handlers before activation.

## Scope of this implementation

The administration connection remains read-only. It does not create, delete, reconfigure, activate, deactivate or test-run Wix automations.

This repair adds only the missing Git-managed Run Velo Code entry boundary required by Wix's documented Git Integration flow. It does **not** invent a raw-email sender, duplicate existing booking/store logic, create a new automation registry, or claim that customer-facing automation workflows are already implemented.

Custom Velo-code triggers remain an approved SKANDI pattern where required by a specific subsystem (for example, the Store gift-card implementation uses `customTrigger.runTrigger` server-side). No existing custom-trigger contract is changed by this repair.

## Verification

- **VERIFIED:** Current SKANDI repository uses `@wix/automations` and `@wix/essentials` server-side in the existing V12 Store gift-card implementation.
- **VERIFIED:** Wix official Help Center documentation states that Git-managed sites cannot create the Run Velo Code `.js` service-plugin file from the Automations interface and recommends selecting an existing backend function created in GitHub instead.
- **VERIFIED:** Wix official Velo documentation defines the custom-action entry contract as an `invoke({ payload })` function that returns an empty object.
- **VERIFIED:** Current Customer Service Desk HTML contains `triggers[]` and `automations[]` bootstrap arrays and renders both in the Admin Center.
- **STATICALLY VERIFIED:** `skandiAutomationHandler` and `invoke` use one canonical implementation, preserve the existing administration read path, expose no new web method, add no new package dependency and fail closed for unmapped business workflows.
- **REQUIRES LIVE TEST:** Wix Git synchronization/publication, visibility of `SKANDI_CORE/automationControl.js → skandiAutomationHandler` in the Run Velo Code existing-function selector, runtime invocation and Wix Logs output.

## CHANGE LOG

- **2026-10-14** — Added the canonical V12 Wix Automations read connection. Live automation metadata is normalized in `SKANDI_CORE`, system-admin gated, and merged into the existing Customer Service Desk `AGENT_BOOTSTRAP` contract. No automation workflow, status or HTML payload was modified.
- **2026-10-15** — Added the missing Git-managed Run Velo Code entry point to the existing canonical `automationControl.js`. `skandiAutomationHandler` delegates to the canonical action boundary and `invoke` aliases the same implementation for Wix custom-action compatibility. Unmapped customer-facing workflows fail closed rather than returning false success. No automation definition, email workflow, Supabase resource, Wix deployment or external provider was modified. **STATICALLY VERIFIED — REQUIRES LIVE TEST.**
