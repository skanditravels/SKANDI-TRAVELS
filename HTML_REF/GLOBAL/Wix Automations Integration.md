# INFO / LOG — Wix Automations Integration

- **System area:** GLOBAL / SKANDI V12
- **Purpose:** Canonical server-side connection between SKANDI V12 and Wix Automations.
- **Wix site:** SKANDI TRAVELS (`97bf5405-2507-4744-b53a-0f1a5a61796d`).
- **Canonical backend facade:** `/src/backend/SKANDI_CORE/automationControl.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/automationControl.js`
- **Wix provider:** `@wix/automations` → `automationsV2`
- **Authorization:** Wix Site Member facade plus canonical `requireStaffPortalSessionCore()`; automation metadata is restricted to SKANDI system administrators / privileged access roles.
- **Current consumer:** `/src/pages/Customer Service Desk.benbs.js` → existing Customer Service Desk Admin Center.
- **HTML contract:** Existing `SKANDI_SUPPORT_AGENT` HTML already accepts `triggers[]` and `automations[]` in `AGENT_BOOTSTRAP`; no HTML payload replacement is required for this connection.
- **Source of truth:** Wix Automations remains authoritative for workflow definitions, trigger/action configuration, activation state, revisions and execution.
- **Secrets:** None are exposed to HTML or page code. This read connection does not require trigger IDs or provider credentials in frontend code.
- **Status:** **STATICALLY VERIFIED — REQUIRES LIVE TEST** after installation and Wix publication.

## Architecture

`Customer Service Desk HTML` → `postMessage / AGENT_READY` → `/src/pages/Customer Service Desk.benbs.js` → `/src/backend/SKANDI_CORE/automationControl.web.js` → `/src/backend/SKANDI_CORE/automationControl.js` → Wix Automations V2.

The automation layer is supplemental to the existing Customer Support chain. Supabase remains authoritative for customer-support cases and messages. Wix Automations remains authoritative for automation workflow definitions.

## Behavior

1. Customer Service Desk requests its normal bootstrap.
2. The Wix page controller requests the existing customer-support bootstrap and a Wix Automations administration snapshot in parallel.
3. Authorized system administrators receive normalized automation and trigger metadata in the existing `AGENT_BOOTSTRAP` payload.
4. The existing Admin Center renders these records through its already-present `db.triggers` and `db.automations` contract.
5. Staff without automation-administration authority continue to receive the Customer Service Desk normally; the automation arrays remain empty and the support workspace is not blocked.
6. Automation payloads, action mappings, email contents, trigger schemas, secrets and internal execution details are not exposed to the HTML embed.

## Scope of this implementation

This connection is intentionally read-only. It does not create, delete, reconfigure, activate, deactivate or test-run Wix automations. Those operations can change production customer communications and must be introduced only with an explicit workflow requirement and a verified Wix automation contract.

Custom Velo-code triggers are already an approved SKANDI pattern where required by a specific subsystem (for example, the Store gift-card implementation uses `customTrigger.runTrigger` server-side). A new global custom-trigger registry is not introduced here because no travel-update event names, payload schemas or target automation actions were specified.

## Verification

- **VERIFIED:** Current SKANDI repository uses `@wix/automations` and `@wix/essentials` server-side in the existing V12 Store gift-card implementation.
- **VERIFIED:** Wix official documentation confirms `automationsV2.queryAutomations()` and elevated server-side permissions for automation administration.
- **VERIFIED:** Current Customer Service Desk HTML contains `triggers[]` and `automations[]` bootstrap arrays and renders both in the Admin Center.
- **STATICALLY VERIFIED:** New imports, ownership boundaries, staff authorization path and `AGENT_BOOTSTRAP` data contract.
- **REQUIRES LIVE TEST:** Wix runtime resolution of `automationsV2.queryAutomations()`, site permission elevation, published page bootstrap and the live Admin Center rendering.

## CHANGE LOG

- **2026-10-14** — Added the canonical V12 Wix Automations read connection. Live automation metadata is normalized in `SKANDI_CORE`, system-admin gated, and merged into the existing Customer Service Desk `AGENT_BOOTSTRAP` contract. No automation workflow, status or HTML payload was modified.
