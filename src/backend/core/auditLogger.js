import { sbInsert } from "backend/supabaseClient";
import { uid } from "backend/core/response";

const AUDIT_TABLE = "admin_audit_logs";

export async function auditLog({
  adminId = "",
  targetMember = "",
  action,
  oldValue = {},
  newValue = {},
  ipAddress = "",
  userAgent = ""
}) {
  try {
    await sbInsert(AUDIT_TABLE, {
      log_id: uid("AUDIT"),
      admin_id: adminId || null,
      target_member: targetMember || null,
      action_performed: action,
      old_value: oldValue || {},
      new_value: newValue || {},
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    });
  } catch (error) {
    // Audit should not break customer-facing actions.
  }
}