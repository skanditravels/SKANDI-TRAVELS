// /src/backend/SKANDI_CORE/staffOtp.web.js
import crypto from "crypto";
import { Permissions, webMethod } from "wix-web-module";
import { authentication } from "wix-members-backend";
import { automations } from "wix-automations-backend";
import { fetch } from "wix-fetch";
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
const AUTOMATION_TRIGGER_ID = "d5dbec02-71b6-475e-aa80-6d67b0bd4432";
const TRUST_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BLOCKED_EMPLOYMENT = new Set(["TERMINATED", "SUSPENDED", "FURLOUGHED", "INACTIVE"]);

function hashDeviceToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken || "")).digest("hex");
}

function maskEmail(emailAddress) {
  const [localPart, domain] = emailAddress.split("@");
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function formatStaffPhone(rawPhone) {
  const cleaned = String(rawPhone || "").trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  // US / North America (+1 followed by 10 digits) -> +1 (360) 901-7157
  if (/^\+1\d{10}$/.test(cleaned)) {
    const area = cleaned.slice(2, 5);
    const prefix = cleaned.slice(5, 8);
    const line = cleaned.slice(8, 12);
    return `+1 (${area}) ${prefix}-${line}`;
  }

  // Sweden (+46 followed by 9 digits) -> +46 (0) 72-21 56 997
  if (/^\+46\d{9}$/.test(cleaned)) {
    const ndc = cleaned.slice(3, 5);
    const part1 = cleaned.slice(5, 7);
    const part2 = cleaned.slice(7, 9);
    const part3 = cleaned.slice(9, 12);
    return `+46 (0) ${ndc}-${part1} ${part2} ${part3}`;
  }

  return String(rawPhone || "").trim();
}

function parseDeviceSummary(ua = "") {
  const s = String(ua);
  const browser = /Edg\//.test(s) ? "Edge"
    : /Chrome\//.test(s) && !/Chromium/.test(s) ? "Chrome"
    : /Safari\//.test(s) && !/Chrome\//.test(s) ? "Safari"
    : /Firefox\//.test(s) ? "Firefox"
    : "Browser";

  const os = /iPhone|iPad/.test(s) ? "iOS"
    : /Android/.test(s) ? "Android"
    : /Mac OS X/.test(s) ? "macOS"
    : /Windows/.test(s) ? "Windows"
    : /Linux/.test(s) ? "Linux"
    : "Unknown OS";

  return `${browser} on ${os}`;
}

async function resolveIpGeolocation(ip) {
  if (!ip || ip === "Unavailable" || ip === "127.0.0.1" || ip.startsWith("192.168.")) {
    return "Unknown Location";
  }
  try {
    const res = await fetch(`https://ipapi.co{encodeURIComponent(ip)}/json/`, { method: "GET" });
    if (!res.ok) return "Unknown Location";
    const geo = await res.json();
    const parts = [geo.city, geo.region_code, geo.country_code].filter(Boolean);
    return parts.length ? parts.join(", ") : "Unknown Location";
  } catch (_) {
    return "Unknown Location";
  }
}

/**
 * Step 1: Verify SK-ID + Password first.
 * If deviceToken is trusted (< 30 days), return sessionToken immediately.
 * Otherwise, dispatch a 6-digit email OTP with telemetry via Wix Automations.
 */
export const authenticateStaffWithDeviceTrust = webMethod(
  Permissions.Anyone,
  async ({ skId: rawSkId, password, deviceToken, userAgent = "" }, context) => {
    const skId = normalizeSkId(rawSkId);
    const cleanDeviceToken = text(deviceToken, 128);

    if (!isValidSkId(skId)) {
      return { ok: false, code: "INVALID_SK_ID", message: "Enter a valid SK-ID." };
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

      // 3. New or expired device (> 30 days): lookup agent (including phone) & Wix Member
      const rows = await restRequest(
        `${AGENT_TABLE}?sk_id=eq.${encodeURIComponent(skId)}&select=id,agent_id,sk_id,email,corporate_email_address,phone,employment_status,status,active,portal_access&limit=1`
      );
      const agent = firstRow(rows);

      if (!agent) {
        return { ok: false, code: "NOT_FOUND", message: "Staff profile not found." };
      }

      const empStatus = upper(agent.employment_status || agent.status);
      if (BLOCKED_EMPLOYMENT.has(empStatus) || agent.active === false || agent.portal_access === false) {
        return { ok: false, code: "ACCESS_DENIED", message: "RIA access is restricted for this account." };
      }

      const targetEmail = cleanEmail(agent.corporate_email_address || agent.email);
      const memberRes = await wixData.query("Members/PrivateMembersData")
        .eq("loginEmail", targetEmail)
        .limit(1)
        .find({ suppressAuth: true });

      const wixMember = memberRes.items[0];
      if (!wixMember) {
        return { ok: false, code: "WIX_MEMBER_MISSING", message: "Invalid email." };
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

      // 5. Gather telemetry & format US (+1) / Swedish (+46) phone number
      const formattedPhone = formatStaffPhone(agent.phone);
      const ipAddress = String(context?.clientIp || "Unavailable").trim();
      const location = await resolveIpGeolocation(ipAddress);
      const deviceSummary = parseDeviceSummary(userAgent);
      const deviceIdShort = cleanDeviceToken
        ? `DEV-${hashDeviceToken(cleanDeviceToken).slice(0, 8).toUpperCase()}`
        : "DEV-UNKNOWN";
      const requestedAtUtc = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

      // 6. Trigger Wix Automation
      await automations.run(AUTOMATION_TRIGGER_ID, {
        contactId: wixMember._id,
        email: targetEmail,
        phone: formattedPhone,
        skId: skId,
        code: otpCode,
        expiresInMinutes: 5,
        requestedAtUtc,
        ipAddress,
        location,
        deviceSummary,
        deviceIdShort
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
