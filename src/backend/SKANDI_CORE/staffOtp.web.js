// /src/backend/SKANDI_CORE/staffOtp.web.js
import crypto from "crypto";
import { Permissions, webMethod } from "wix-web-module";
import { authentication } from "wix-members-backend";
import { triggeredEmails } from "wix-crm-backend";
import wixData from "wix-data";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { loginStaffWithSkId } from "backend/SKANDI_CORE/staffAuth.web";
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
const TRUSTED_DEVICE_TABLE = "staff_trusted_devices";
const TRIGGERED_EMAIL_ID = "riaintra_staff_otp";
const TRUST_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BLOCKED_EMPLOYMENT = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);

function hashDeviceToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken || "")).digest("hex");
}

function maskEmail(emailAddress) {
  const [localPart, domain] = emailAddress.split("@");
  return `${localPart.slice(0, 2)}***@${domain}`;
}

/**
 * Step 1: Verify SK-ID + Password first.
 * If deviceToken is trusted (< 30 days), return sessionToken immediately.
 * Otherwise, dispatch a 6-digit email OTP and require MFA verification.
 */
export const authenticateStaffWithDeviceTrust = webMethod(
  Permissions.Anyone,
  async ({ skId: rawSkId, password, deviceToken, userAgent = "" }) => {
    const skId = normalizeSkId(rawSkId);
    const cleanDeviceToken = text(deviceToken, 128);

    if (!isValidSkId(skId)) {
      return { ok: false, code: "INVALID_SK_ID", message: "Enter a valid SK-ID in the AA0000 format." };
    }

    if (!password || typeof password !== "string") {
      return { ok: false, code: "PASSWORD_REQUIRED", message: "Enter your password." };
    }

    try {
      // 1. Validate SK-ID + Password using existing canonical login method
      const authResult = await loginStaffWithSkId({ skId, password });
      const sessionToken = String(authResult?.sessionToken || authResult?.payload?.sessionToken || "").trim();

      if (!sessionToken) {
        return { ok: false, code: "CREDENTIALS_INVALID", message: "The SK-ID or password is incorrect." };
      }

      // 2. Check if this device is already trusted and within the 30-day window
      const nowIso = new Date().toISOString();
      if (cleanDeviceToken.length >= 16) {
        const deviceHash = hashDeviceToken(cleanDeviceToken);
        const deviceRows = await restRequest(
          `${TRUSTED_DEVICE_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&device_token_hash=eq.${deviceHash}&revoked=eq.false&expires_at=gt.${encodeURIComponent(nowIso)}&limit=1`
        );
        const trustedDevice = firstRow(deviceRows);

        if (trustedDevice) {
          await restRequest(`${TRUSTED_DEVICE_TABLE}?id=eq.${trustedDevice.id}`, {
            method: "PATCH",
            body: { last_used_at: nowIso }
          });

          await tryWriteStaffLoginAudit?.({ skId, event: "LOGIN_TRUSTED_DEVICE" });
          return { ok: true, mfaRequired: false, sessionToken };
        }
      }

      // 3. New or expired device (> 30 days): lookup agent & Wix Member to send OTP
      const rows = await restRequest(
        `${AGENT_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&select=id,agent_id,sk_id,email,corporate_email_address,employment_status,status,active,portal_access&limit=1`
      );
      const agent = firstRow(rows);

      if (!agent) {
        return { ok: false, code: "NOT_FOUND", message: "Staff profile not found." };
      }

      const empStatus = upper(agent.employment_status || agent.status);
      if (BLOCKED_EMPLOYMENT.has(empStatus) || agent.active === false || agent.portal_access === false) {
        return { ok: false, code: "ACCESS_DENIED", message: "Portal access is restricted for this account." };
      }

      const targetEmail = cleanEmail(agent.corporate_email_address || agent.email);
      const memberRes = await wixData.query("Members/PrivateMembersData")
        .eq("loginEmail", targetEmail)
        .limit(1)
        .find({ suppressAuth: true });

      const wixMember = memberRes.items;
      if (!wixMember) {
        return { ok: false, code: "WIX_MEMBER_MISSING", message: "Wix Member account not linked to this email." };
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

      await triggeredEmails.emailMember(TRIGGERED_EMAIL_ID, wixMember._id, {
        variables: {
          code: otpCode,
          skId: skId,
          expiresInMinutes: "5"
        }
      });

      await tryWriteStaffLoginAudit?.({ skId, agentId: agent.agent_id, event: "MFA_OTP_SENT_NEW_DEVICE" });

      return {
        ok: true,
        mfaRequired: true,
        maskedEmail: maskEmail(targetEmail)
      };
    } catch (err) {
      console.error("[SKANDI_OTP] authenticateStaffWithDeviceTrust failed:", err);
      return { ok: false, code: "AUTH_ERROR", message: "The SK-ID or password is incorrect." };
    }
  }
);

/**
 * Step 2: Verify 6-digit OTP, register device as trusted for 30 days, and mint sessionToken.
 */
export const verifyStaffOtpAndTrustDevice = webMethod(
  Permissions.Anyone,
  async ({ skId: rawSkId, code: rawCode, deviceToken, userAgent = "" }) => {
    const skId = normalizeSkId(rawSkId);
    const code = text(rawCode, 10).replace(/\s+/g, "");
    const cleanDeviceToken = text(deviceToken, 128);

    if (!isValidSkId(skId) || !/^\d{6}$/.test(code)) {
      return { ok: false, code: "INVALID_INPUT", message: "Enter the 6-digit verification code." };
    }

    try {
      const now = Date.now();
      const nowIso = new Date(now).toISOString();

      const rows = await restRequest(
        `${OTP_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&used=eq.false&expires_at=gt.${encodeURIComponent(nowIso)}&order=created_at.desc&limit=1`
      );
      const otpRecord = firstRow(rows);

      if (!otpRecord) {
        return { ok: false, code: "EXPIRED_OR_INVALID", message: "Code expired or invalid. Please sign in again." };
      }

      if ((otpRecord.attempts || 0) >= 5) {
        await restRequest(`${OTP_TABLE}?id=eq.${otpRecord.id}`, {
          method: "PATCH",
          body: { used: true }
        });
        return { ok: false, code: "TOO_MANY_ATTEMPTS", message: "Too many failed attempts. Please sign in again." };
      }

      if (otpRecord.code !== code) {
        await restRequest(`${OTP_TABLE}?id=eq.${otpRecord.id}`, {
          method: "PATCH",
          body: { attempts: (otpRecord.attempts || 0) + 1 }
        });
        return { ok: false, code: "WRONG_CODE", message: "Incorrect verification code." };
      }

      // Consume OTP
      await restRequest(`${OTP_TABLE}?id=eq.${otpRecord.id}`, {
        method: "PATCH",
        body: { used: true, verified_at: nowIso }
      });

      // Register or renew 30-day device trust
      if (cleanDeviceToken.length >= 16) {
        const deviceHash = hashDeviceToken(cleanDeviceToken);
        const trustExpiresAt = new Date(now + TRUST_DURATION_MS).toISOString();

        await restRequest(`${TRUSTED_DEVICE_TABLE}?on_conflict=sk_id,device_token_hash`, {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates" },
          body: {
            sk_id: skId,
            agent_id: otpRecord.agent_id,
            device_token_hash: deviceHash,
            user_agent: text(userAgent, 240),
            trusted_at: nowIso,
            last_used_at: nowIso,
            expires_at: trustExpiresAt,
            revoked: false
          }
        });
      }

      const sessionToken = await authentication.generateSessionToken(otpRecord.email);

      await tryWriteStaffLoginAudit?.({ skId, agentId: otpRecord.agent_id, event: "MFA_DEVICE_TRUSTED_30D" });

      return { ok: true, sessionToken };
    } catch (err) {
      console.error("[SKANDI_OTP] verifyStaffOtpAndTrustDevice failed:", err);
      return { ok: false, code: "VERIFY_ERROR", message: "Verification failed. Please try again." };
    }
  }
);
