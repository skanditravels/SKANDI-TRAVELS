// /src/backend/SKANDI_CORE/automationControl.js
// SKANDI V12 — canonical Wix Automations administration/read bridge and Git-managed action entry point.
// Wix Automations remains the workflow source of truth. Administration metadata stays normalized and
// non-secret; customer-facing automation workflows must be mapped explicitly before they can execute.

import { automationsV2 } from "@wix/automations";
import { auth } from "@wix/essentials";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import {
  generateAutomationEmailActionMapping,
  getAutomationEmailPlatformSnapshot,
  inspectAutomationEmailAction,
  previewAutomationEmailAction,
  syncAutomationEmailAction
} from "backend/SKANDI_CORE/automationEmailPlatform";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";
import { lower, stringArray, text, upper } from "backend/SKANDI_CORE/platformValidation";

const queryAutomationsElevated = auth.elevate(automationsV2.queryAutomations);
const PRIVILEGED_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const MAX_AUTOMATIONS = 100;
const ENTRYPOINT_TEST_ACTION = "SKANDI_AUTOMATION_ENTRYPOINT_TEST";

function objectOf(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function automationId(value = {}) {
  return text(value?._id || value?.id, 120);
}

function automationStatus(value = {}) {
  return upper(value?.configuration?.status, 32) || "INACTIVE";
}

function triggerKey(value = {}) {
  return text(value?.configuration?.trigger?.triggerKey, 240);
}

function triggerAppId(value = {}) {
  return text(value?.configuration?.trigger?.appId, 120);
}

function actionCount(value = {}) {
  return Object.keys(objectOf(value?.configuration?.actions)).length;
}

function humanizeTrigger(value) {
  const clean = text(value, 240);
  if (!clean) return "Configured trigger";
  const tail = clean.includes("-") ? clean.split("-").slice(1).join("-") : clean;
  return tail
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase())
    .trim() || clean;
}

function assertAutomationAdministrator(session = {}) {
  const role = upper(session.accessRole, 80);
  const groups = new Set(stringArray(session.permissionGroups).map(value => lower(value, 100)));
  const keys = new Set(stringArray(session.permissionKeys).map(value => lower(value, 100)));
  const privileged = session.isSystemAdmin === true || PRIVILEGED_ROLES.has(role) || groups.has("system-admin") || keys.has("system-admin");
  if (!privileged) {
    throw new SkandiError("AUTOMATION_ADMIN_REQUIRED", "System administrator access is required.", {
      publicMessage: "System administrator access is required to manage Wix Automations."
    });
  }
}

async function requireAutomationAdministrator() {
  const session = await requireStaffPortalSessionCore();
  assertAutomationAdministrator(session);
  return session;
}

function normalizeAutomation(value = {}) {
  const id = automationId(value);
  const status = automationStatus(value);
  const key = triggerKey(value);
  const actions = actionCount(value);
  const origin = upper(value?.origin, 40);
  const description = text(value?.description, 320) || [
    key ? `Trigger: ${humanizeTrigger(key)}` : "Trigger configured in Wix Automations",
    `${actions} action${actions === 1 ? "" : "s"}`,
    origin ? `Origin: ${origin}` : ""
  ].filter(Boolean).join(" · ");

  return {
    id,
    name: text(value?.name, 180) || "Unnamed automation",
    description,
    enabled: status === "ACTIVE",
    status,
    origin,
    triggerKey: key,
    triggerAppId: triggerAppId(value),
    actionCount: actions,
    archived: value?.archived === true,
    updatedAt: value?._updatedDate || value?.updatedDate || null
  };
}

function normalizeTriggers(automations = []) {
  const byKey = new Map();

  for (const automation of automations) {
    const key = text(automation.triggerKey, 240);
    const appId = text(automation.triggerAppId, 120);
    if (!key && !appId) continue;
    const id = `${appId || "unknown"}:${key || "unknown"}`;
    const existing = byKey.get(id) || {
      id,
      name: humanizeTrigger(key),
      description: "",
      enabled: false,
      triggerKey: key,
      triggerAppId: appId,
      automationCount: 0,
      activeAutomationCount: 0
    };
    existing.automationCount += 1;
    if (automation.enabled) existing.activeAutomationCount += 1;
    existing.enabled = existing.activeAutomationCount > 0;
    byKey.set(id, existing);
  }

  return [...byKey.values()]
    .map(item => ({
      ...item,
      description: `${item.automationCount} automation${item.automationCount === 1 ? "" : "s"} · ${item.activeAutomationCount} active`
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function automationActionPayload(options = {}) {
  const envelope = objectOf(options);
  if (Object.prototype.hasOwnProperty.call(envelope, "payload")) return objectOf(envelope.payload);
  return envelope;
}

function automationActionName(payload = {}) {
  return upper(payload.skandiAction || payload.automationAction || payload.eventType, 120);
}

async function queryLiveAutomations() {
  const query = queryAutomationsElevated();
  const result = await query.limit(MAX_AUTOMATIONS).find();
  const rows = Array.isArray(result?.items)
    ? result.items
    : Array.isArray(result?.automations)
      ? result.automations
      : [];
  return rows.filter(row => row?.archived !== true);
}

export async function getAutomationAdminSnapshotCore() {
  await requireAutomationAdministrator();

  const rows = await queryLiveAutomations();
  const automations = rows
    .map(normalizeAutomation)
    .filter(item => item.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const triggers = normalizeTriggers(automations);

  return {
    ok: true,
    source: "Wix Automations",
    readOnly: true,
    retrievedAt: new Date().toISOString(),
    triggers,
    automations,
    counts: {
      triggers: triggers.length,
      automations: automations.length,
      active: automations.filter(item => item.enabled).length,
      inactive: automations.filter(item => !item.enabled).length
    }
  };
}

export async function getAutomationEmailPlatformSnapshotCore() {
  await requireAutomationAdministrator();
  return getAutomationEmailPlatformSnapshot();
}

export async function generateAutomationEmailActionMappingCore(options = {}) {
  await requireAutomationAdministrator();
  return generateAutomationEmailActionMapping(objectOf(options));
}

export async function inspectAutomationEmailActionCore(options = {}) {
  await requireAutomationAdministrator();
  return inspectAutomationEmailAction(objectOf(options));
}

export async function previewAutomationEmailActionCore(options = {}) {
  await requireAutomationAdministrator();
  return previewAutomationEmailAction(objectOf(options));
}

export async function syncAutomationEmailActionCore(options = {}) {
  await requireAutomationAdministrator();
  return syncAutomationEmailAction(objectOf(options));
}

export async function runAutomationActionCore(options = {}, context = {}) {
  const payload = automationActionPayload(options);
  const action = automationActionName(payload);

  if (action === ENTRYPOINT_TEST_ACTION) {
    console.info("[SKANDI][WixAutomations] Git-managed V12 action entry point reached.", {
      action,
      payloadKeys: Object.keys(payload).slice(0, 30),
      contextKeys: Object.keys(objectOf(context)).slice(0, 20)
    });
    return {
      ok: true,
      action,
      receivedAt: new Date().toISOString()
    };
  }

  throw new SkandiError(
    "AUTOMATION_WORKFLOW_NOT_MAPPED",
    action
      ? `Wix Automation action ${action} is not mapped to a canonical SKANDI V12 workflow handler.`
      : "The Wix Automation action did not identify a canonical SKANDI V12 workflow handler.",
    {
      publicMessage: "This Wix Automation action is connected to SKANDI, but its business workflow has not been mapped yet.",
      details: {
        action: action || null,
        payloadKeys: Object.keys(payload).slice(0, 30)
      }
    }
  );
}

// Runtime Run Velo Code actions remain intentionally separate from email-content synchronization.
// Email content must be synchronized administratively, never rewritten during each live automation execution.
export async function skandiAutomationHandler(options = {}, context = {}) {
  await runAutomationActionCore(options, context);
  return {};
}

export const invoke = skandiAutomationHandler;
