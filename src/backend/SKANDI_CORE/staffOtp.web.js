// /src/backend/SKANDI_CORE/staffOtp.web.js
import { Permissions, webMethod } from "wix-web-module";
import { authentication } from "wix-members-backend";
import { triggeredEmails } from "wix-crm-backend";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";
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
const TRIGGERED_EMAIL_ID = "riaintra_staff_otp";
const BLOCKED_EMPLOYMENT = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);

function normalizePhoneDigits(rawPhone) {
  const digits = String(rawPhone || "").replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits.slice(1) : digits;
}

function maskEmail(emailAddress) {
  const [localPart, domain] = emailAddress.split("@");
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function maskPhone(phoneDigits) {
  return `+${phoneDigits.slice(0, 2)} *** ** ${phoneDigits.slice(-2)}`;
}

async function sendWhatsAppOtp(toPhoneDigits, otpCode) {
  const token = await getSecret("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = await getSecret("WHATSAPP_PHONE_NUMBER_ID");

  const response = await fetch(`https://facebook.com{phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toPhoneDigits,
      type: "template",
      template: {
        name: "riaintra_auth_otp",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: otpCode }]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: otpCode }]
          }
        ]
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`WhatsApp API error (${response.status}): ${errText}`);
  }
}

async function sendEmailOtp(wixMemberId, skId, otpCode) {
  await triggeredEmails.emailMember(TRIGGERED_EMAIL_ID, wixMemberId, {
    variables: {
      code: otpCode,
      skId: skId,
      expiresInMinutes: "5"
    }
  });
}

/**
 * Step 1: Validate SK-ID in Supabase agent_users, verify active Wix Member,
 * generate a 6-digit OTP, and send via WhatsApp (if phone exists in agent_users)
 * or fall back to Email.
 */
export const requestStaffOtp = webMethod(Permissions.Anyone, async (rawSkId) => {
  const skId = normalizeSkId(rawSkId);

  if (!isValidSkId(skId)) {
    return { ok: false, code: "INVALID_SK_ID", message: "Enter a valid SK-ID (two letters + four digits)." };
  }

  try {
    // 1. Lookup staff projection in Supabase agent_users
    const rows = await restRequest(
      `${AGENT_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&select=id,agent_id,sk_id,email,corporate_email_address,phone,mobile_phone,phone_number,wix_member_id,employment_status,status,active,portal_access,authorized&limit=1`
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

    // 4. Generate 6-digit OTP & store in Supabase
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

    // 5. Check Supabase agent_users for a valid phone number; send WhatsApp or fall back to Email
    const rawAgentPhone = agent.mobile_phone || agent.phone || agent.phone_number;
    const phoneDigits = normalizePhoneDigits(rawAgentPhone);

    let channel = "EMAIL";
    let maskedDestination = maskEmail(targetEmail);

    if (phoneDigits && phoneDigits.length >= 8) {
      try {
        await sendWhatsAppOtp(phoneDigits, otpCode);
        channel = "WHATSAPP";
        maskedDestination = maskPhone(phoneDigits);
      } catch (waErr) {
        console.warn("[SKANDI_OTP] WhatsApp delivery failed, falling back to email:", waErr);
        await sendEmailOtp(wixMember._id, skId, otpCode);
        channel = "EMAIL_FALLBACK";
        maskedDestination = maskEmail(targetEmail);
      }
    } else {
      await sendEmailOtp(wixMember._id, skId, otpCode);
    }

    await tryWriteStaffLoginAudit?.({
      skId,
      agentId: agent.agent_id,
      event: `OTP_SENT_${channel}`
    });

    return {
      ok: true,
      channel,
      maskedEmail: maskedDestination
    };
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

    const rows = await restRequest(
      `${OTP_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&used=eq.false&expires_at=gt.${encodeURIComponent(nowIso)}&order=created_at.desc&limit=1`
    );
    const otpRecord = firstRow(rows);

    if (!otpRecord) {
      return { ok: false, code: "EXPIRED_OR_INVALID", message: "Code expired or invalid. Request a new code." };
    }

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

    await restRequest(`${OTP_TABLE}?id=eq.${otpRecord.id}`, {
      method: "PATCH",
      body: { used: true, verified_at: nowIso }
    });

    const sessionToken = await authentication.generateSessionToken(otpRecord.email);

    await tryWriteStaffLoginAudit?.({ skId, agentId: otpRecord.agent_id, event: "OTP_LOGIN_SUCCESS" });

    return { ok: true, sessionToken };
  } catch (err) {
    console.error("[SKANDI_OTP] verifyStaffOtp failed:", err);
    return { ok: false, code: "VERIFY_ERROR", message: "Verification failed. Please try again." };
  }
});
