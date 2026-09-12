// /src/backend/SKANDI_CORE/platformAudit.js
// SKANDI Backend Base 1.0 — audit persistence helpers.
// Audit persistence must never become an authorization bypass or single point of failure.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { email, normalizeSkId, text } from "backend/SKANDI_CORE/platformValidation.js";

function auditId(prefix = "AUD") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function writeStaffLoginAudit({
  agentUserId = null,
  skId = "",
  emailAddress = "",
  eventType,
  success = false,
  errorMessage = ""
} = {}) {
  return restRequest({
    table: "staff_login_audit",
    method: "POST",
    body: {
      agent_user_id: agentUserId || null,
      sk_id: normalizeSkId(skId) || null,
      email: email(emailAddress) || null,
      event_type: text(eventType, 100) || "STAFF_EVENT",
      success: success === true,
      error_message: text(errorMessage, 500) || null
    }
  });
}

export async function tryWriteStaffLoginAudit(input = {}) {
  try {
    await writeStaffLoginAudit(input);
    return true;
  } catch (error) {
    console.warn("[SKANDI Audit] Staff audit write failed.", error?.code || error?.message || error);
    return false;
  }
}

export async function writeAdminAudit({
  adminId = "",
  targetMember = null,
  targetResource = "",
  action,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null
} = {}) {
  return restRequest({
    table: "admin_audit_logs",
    method: "POST",
    body: {
      log_id: auditId("ADM"),
      timestamp: new Date().toISOString(),
      admin_id: text(adminId, 160) || null,
      target_member: text(targetMember, 160) || null,
      target_resource: text(targetResource, 300) || null,
      action_performed: text(action, 160) || "UNKNOWN_ACTION",
      old_value: oldValue && typeof oldValue === "object" ? oldValue : null,
      new_value: newValue && typeof newValue === "object" ? newValue : null,
      ip_address: text(ipAddress, 120) || null,
      user_agent: text(userAgent, 1000) || null
    }
  });
}

export async function tryWriteAdminAudit(input = {}) {
  try {
    await writeAdminAudit(input);
    return true;
  } catch (error) {
    console.warn("[SKANDI Audit] Admin audit write failed.", error?.code || error?.message || error);
    return false;
  }
}
