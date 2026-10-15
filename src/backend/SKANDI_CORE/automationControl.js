// /src/backend/SKANDI_CORE/automationControl.js
// SKANDI V12 — canonical Wix Automations administration/read bridge.
// Wix Automations remains the workflow source of truth. This module exposes only normalized,
// non-secret automation metadata to authorized RIAINTRA administration surfaces.

import { automationsV2 } from "@wix/automations";
import { auth } from "@wix/essentials";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { SkandiError } from "backend/SKANDI_CORE/platformErrors";
import { lower, stringArray, text, upper } from "backend/SKANDI_CORE/platformValidation";

const queryAutomationsElevated = auth.elevate(automationsV2.queryAutomations);
const PRIVILEGED_ROLES = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_OWNER"]);
const MAX_AUTOMATIONS = 100;

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
      publicMessage: "System administrator access is required to view Wix Automations."
    });
  }
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
  const session = await requireStaffPortalSessionCore();
  assertAutomationAdministrator(session);

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
