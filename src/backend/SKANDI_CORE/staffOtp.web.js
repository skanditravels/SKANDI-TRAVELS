// /src/backend/SKANDI_CORE/staffOtp.web.js
import { Permissions, webMethod } from "wix-web-module";
import { authentication } from "wix-members-backend";
import { triggeredEmails } from "wix-crm-backend";
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
const OTP_TABLE = "staff_login_otps"; // Create this table in Supabase
const BLOCKED_EMPLOYMENT = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);

/**
 * Step 1: Validate SK-ID against agent_users, verify active employment & Wix Member match,
 * generate a 6-digit code, store in Supabase, and send via Wix Triggered Email.
 */
export const requestStaffOtp = webMethod(Permissions.Anyone, async (rawSkId) => {
  const skId = normalizeSkId(rawSkId);

  if (!isValidSkId(skId)) {
    return { ok: false, code: "INVALID_SK_ID", message: "Enter a valid SK-ID (two letters + four digits)." };
  }

  try {
    // 1. Lookup staff projection in Supabase agent_users using existing restRequest
    const rows = await restRequest(
      `${AGENT_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&select=id,agent_id,sk_id,email,corporate_email_address,wix_member_id,employment_status,status,active,portal_access,authorized&limit=1`
    );
    const agent = firstRow(rows);

    if (!agent) {
      return { ok: false, code: "NOT_FOUND", message: "SK-ID not recognized." };
    }

    // 2. Enforce SKANDI employment & portal access rules before issuing any code
    const empStatus = upper(agent.employment_status || agent.status);
    if (BLOCKED_EMPLOYMENT.has(empStatus) || agent.active === false || agent.portal_access === false) {
      await tryWriteStaffLoginAudit?.({ skId, event: "OTP_BLOCKED_EMPLOYMENT", status: empStatus });
      return { ok: false, code: "ACCESS_DENIED", message: "Portal access is restricted for this account." };
    }

    // Resolve canonical email (prioritize corporate_email_address or email matching Wix Member)
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

    // 4. Generate 6-digit OTP (5-minute TTL) & invalidate previous unused codes for this SK-ID
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

    // 5. Dispatch OTP via Wix Triggered Email (Template ID: "riaintra_staff_otp")
    await triggeredEmails.emailMember("riaintra_staff_otp", wixMember._id, {
      variables: {
        code: otpCode,
        skId: skId
      }
    });

    await tryWriteStaffLoginAudit?.({ skId, agentId: agent.agent_id, event: "OTP_SENT" });

    // Mask email for UI feedback (e.g., j***@skandi.com)
    const [localPart, domain] = targetEmail.split("@");
    const maskedEmail = `${localPart.slice(0, 2)}***@${domain}`;

    return { ok: true, maskedEmail };
  } catch (err) {
    console.error("[SKANDI_OTP] requestStaffOtp failed:", err);
    return { ok: false, code: "SERVER_ERROR", message: "Unable to send verification code right now." };
  }
});

/**
 * Step 2: Verify the 6-digit OTP, enforce max attempts, and mint a Wix Session Token.
 */
export const verifyStaffOtp = webMethod(Permissions.Anyone, async (rawSkId, rawCode) => {
  const skId = normalizeSkId(rawSkId);
  const code = text(rawCode, 10).replace(/\s+/g, "");

  if (!isValidSkId(skId) || !/^\d{6}$/.test(code)) {
    return { ok: false, code: "INVALID_INPUT", message: "Enter the 6-digit verification code." };
  }

  try {
    const nowIso = new Date().toISOString();

    // Fetch latest active OTP for this SK-ID
    const rows = await restRequest(
      `${OTP_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&used=eq.false&expires_at=gt.${encodeURIComponent(nowIso)}&order=created_at.desc&limit=1`
    );
    const otpRecord = firstRow(rows);

    if (!otpRecord) {
      return { ok: false, code: "EXPIRED_OR_INVALID", message: "Code expired or invalid. Request a new code." };
    }

    // Brute-force guard: lock after 5 failed attempts
    if ((otpRecord.attempts || 0) >= 5) {
      await restRequest(`${OTP_TABLE}?id=eq.${otpRecord.id}`, {
        method: "PATCH",
        body: { used: true }
      });
      return { ok: false, code: "TOO_MANY_ATTEMPTS", message: "Too many failed attempts. Please request a new code." };
    }

    if (otpRecord.code !== code) {
      await restRequest(`${OTP_TABLE}?id=eq.${otpRecord.id}`, {
        method: "PATCH",
        body: { attempts: (otpRecord.attempts || 0) + 1 }
      });
      return { ok: false, code: "WRONG_CODE", message: "Incorrect verification code." };
    }

    // Mark OTP as consumed
    await restRequest(`${OTP_TABLE}?id=eq.${otpRecord.id}`, {
      method: "PATCH",
      body: { used: true, verified_at: nowIso }
    });

    // Generate Wix Session Token for the matched email
    const sessionToken = await authentication.generateSessionToken(otpRecord.email);

    await tryWriteStaffLoginAudit?.({ skId, agentId: otpRecord.agent_id, event: "OTP_LOGIN_SUCCESS" });

    return { ok: true, sessionToken };
  } catch (err) {
    console.error("[SKANDI_OTP] verifyStaffOtp failed:", err);
    return { ok: false, code: "VERIFY_ERROR", message: "Verification failed. Please try again." };
  }
});
