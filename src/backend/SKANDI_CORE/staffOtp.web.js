// /src/backend/SKANDI_CORE/staffOtp.web.js
import { Permissions, webMethod } from "wix-web-module";
import { authentication } from "wix-members-backend";
import { automations } from "wix-automations-backend";
import wixData from "wix-data";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import {
  email as cleanEmail,
  firstRow,
  isValidSkId,
  normalizeSkId,
  text,
  upper
} from "backend/SKANDI_CORE/platformValidation";
import { tryWriteStaffLoginAudit } from "backend/SKANDI_CORE/platformAudit";

const AGENT_TABLE = "agent_users";
const OTP_TABLE = "staff_login_otps";
const OTP_AUTOMATION_TRIGGER_ID = "1a27f5c5-bc5a-44a5-92c1-38763c35fda6"; // From Wix Automations -> Triggered by Velo
const BLOCKED_EMPLOYMENT = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);

/**
 * Step 1: Validate SK-ID against agent_users, verify active employment & Wix Member match,
 * generate a 6-digit code, store in Supabase, and trigger Wix Automation.
 */
export const requestStaffOtp = webMethod(Permissions.Anyone, async (rawSkId) => {
  const skId = normalizeSkId(rawSkId);

  if (!isValidSkId(skId)) {
    return { ok: false, code: "INVALID_SK_ID", message: "Enter a valid SK-ID (two letters + four digits)." };
  }

  try {
    // 1. Lookup staff projection in Supabase agent_users
    const rows = await restRequest(
      `${AGENT_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&select=id,agent_id,sk_id,email,corporate_email_address,wix_member_id,employment_status,status,active,portal_access,authorized&limit=1`
    );
    const agent = firstRow(rows);

    if (!agent) {
      return { ok: false, code: "NOT_FOUND", message: "SK-ID not recognized." };
    }

    // 2. Enforce SKANDI employment & portal access rules
    const empStatus = upper(agent.employment_status || agent.status);
    if (BLOCKED_EMPLOYMENT.has(empStatus) || agent.active === false || agent.portal_access === false) {
      await tryWriteStaffLoginAudit?.({ skId, event: "OTP_BLOCKED_EMPLOYMENT", status: empStatus });
      return { ok: false, code: "ACCESS_DENIED", message: "Portal access is restricted for this account." };
    }

    const targetEmail = cleanEmail(agent.corporate_email_address || agent.email);
    if (!targetEmail) {
      return { ok: false, code: "NO_EMAIL", message: "No email configured for this SK-ID." };
    }

    // 3. Verify matching Wix Member exists
    const memberRes = await wixData.query("Members/PrivateMembersData")
      .eq("loginEmail", targetEmail)
      .limit(1)
      .find({ suppressAuth: true });

    const wixMember = memberRes.items[0];
    if (!wixMember) {
      return { ok: false, code: "WIX_MEMBER_MISSING", message: "Wix Member account not linked to this staff email." };
    }

    // 4. Generate 6-digit OTP (5-minute TTL) & invalidate previous unused codes
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await restRequest(`${OTP_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&used=eq.false`, {
      method: "PATCH",
      body: { used: true }
    });

    await restRequest(OTP_TABLE, {
      method: "POST",
      body: {
        sk_id: skId,
        agent_id: agent.agent_id || agent.id,
        email: targetEmail,
        wix_member_id: wixMember._id,
        code: otpCode,
        expires_at: expiresAt,
        used: false,
        attempts: 0
      }
    });

    // 5. Trigger Wix Automation with flat JSON payload
    await automations.run(OTP_AUTOMATION_TRIGGER_ID, {
      email: targetEmail,
      skId: skId,
      code: otpCode,
      expiresInMinutes: 5
    });

    await tryWriteStaffLoginAudit?.({ skId, agentId: agent.agent_id, event: "OTP_SENT" });

    // Mask email for UI feedback (e.g., jo***@skandi.com)
    const [localPart, domain] = targetEmail.split("@");
    const maskedEmail = `${localPart.slice(0, 2)}***@${domain}`;

    return { ok: true, maskedEmail };
  } catch (err) {
    console.error("[SKANDI_OTP] requestStaffOtp failed:", err);
    return { ok: false, code: "SERVER_ERROR", message: "Unable to send verification code right now." };
  }
});
