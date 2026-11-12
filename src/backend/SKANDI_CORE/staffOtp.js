// RIAINTRA device verification. Backend-only implementation; web methods live in staffOtp.web.js.
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { Buffer } from "buffer";
import { authentication } from "wix-members-backend";
import { members } from "@wix/members";
import { customTrigger } from "@wix/automations";
import { auth } from "@wix/essentials";
import wixData from "wix-data";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { loginStaffWithSkIdCore, resolveStaffVerificationIdentityCore } from "backend/SKANDI_CORE/staffAuth";
import { email, firstRow, isValidSkId, normalizeSkId, text } from "backend/SKANDI_CORE/platformValidation";
import { tryWriteStaffLoginAudit } from "backend/SKANDI_CORE/platformAudit";

const OTP_TABLE = "staff_login_otps";
const TRUSTED_DEVICE_TABLE = "staff_trusted_devices";
const AUTOMATION_TRIGGER_ID = "d5dbec02-71b6-475e-aa80-6d67b0bd4432";
const TRUST_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_DURATION_MS = 5 * 60 * 1000;
const OTP_ATTEMPTS = 5;
const DEVICE_TOKEN = /^v2_[a-f0-9]{64}$/;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const runTrigger = auth.elevate(customTrigger.runTrigger);
const getMember = auth.elevate(members.getMember);

function hashDeviceToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
function otpDigest(skId, deviceToken, code, salt) {
  return createHash("sha256").update(`${salt}:${skId}:${deviceToken}:${code}`, "utf8").digest("hex");
}
function codeMatches(stored, skId, deviceToken, code) {
  const parts = String(stored || "").split(":");
  if (parts.length !== 3 || parts[0] !== "v2" || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expected = Buffer.from(parts[2], "hex");
  const actual = Buffer.from(otpDigest(skId, deviceToken, code, parts[1]), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function maskEmail(address) {
  const [local, domain] = address.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}
function formatStaffPhone(rawPhone) {
  const clean = String(rawPhone || "").trim().replace(/[^\d+]/g, "");
  if (/^\+1\d{10}$/.test(clean)) return `+1 (${clean.slice(2, 5)}) ${clean.slice(5, 8)}-${clean.slice(8, 12)}`;
  if (/^\+46\d{9}$/.test(clean)) return `+46 (0) ${clean.slice(3, 5)}-${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 12)}`;
  return String(rawPhone || "").trim();
}
function parseDeviceSummary(ua = "") {
  const s = String(ua);
  const browser = /Edg\//.test(s) ? "Edge" : /Chrome\//.test(s) && !/Chromium/.test(s) ? "Chrome" : /Safari\//.test(s) && !/Chrome\//.test(s) ? "Safari" : /Firefox\//.test(s) ? "Firefox" : "Browser";
  const os = /iPhone|iPad/.test(s) ? "iOS" : /Android/.test(s) ? "Android" : /Mac OS X/.test(s) ? "macOS" : /Windows/.test(s) ? "Windows" : /Linux/.test(s) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
}
function publicFailure(message = "Unable to sign in. Please check your details and try again.") {
  return { ok: false, code: "AUTH_ERROR", message };
}
async function findWixMember(identity) {
  const results = await wixData.query("Members/PrivateMembersData")
    .eq("loginEmail", identity.loginEmail).limit(2).find({ suppressAuth: true });
  if (!Array.isArray(results?.items) || results.items.length !== 1) throw new Error("STAFF_MEMBER_LOOKUP_FAILED");
  const id = text(results.items[0]?._id, 160);
  if (!GUID.test(id) || (identity.memberId && identity.memberId !== id)) throw new Error("STAFF_MEMBER_LINK_MISMATCH");
  const member = await getMember(id, { fieldsets: ["FULL"] });
  if (text(member?._id, 160) !== id || email(member?.loginEmail) !== identity.loginEmail || member?.status !== "APPROVED") throw new Error("STAFF_MEMBER_NOT_ACTIVE");
  const contactId = text(member?.contactId, 160);
  if (!GUID.test(contactId) || (identity.contactId && identity.contactId !== contactId)) throw new Error("STAFF_CONTACT_LINK_MISMATCH");
  return { id, contactId };
}

export async function issueStaffDeviceTokenCore() {
  return { ok: true, deviceToken: `v2_${randomBytes(32).toString("hex")}` };
}

export async function authenticateStaffWithDeviceTrustCore({ skId: rawSkId, password, deviceToken, userAgent = "" } = {}) {
  const skId = normalizeSkId(rawSkId);
  const token = text(deviceToken, 128);
  if (!isValidSkId(skId)) return { ok: false, code: "INVALID_SK_ID", message: "Enter a valid SK-ID." };
  if (typeof password !== "string" || !password.trim() || password.length > 256) return { ok: false, code: "PASSWORD_REQUIRED", message: "Enter your password." };
  if (!DEVICE_TOKEN.test(token)) return publicFailure("Device verification could not start. Please refresh the page and try again.");

  try {
    // A password is checked first, but its Wix session token stays on the server until the device is verified.
    const result = await loginStaffWithSkIdCore({ skId, password }, { pendingVerification: true });
    const sessionToken = text(result?.sessionToken, 8000);
    if (!sessionToken) return publicFailure();
    const identity = await resolveStaffVerificationIdentityCore(skId);
    const nowIso = new Date().toISOString();
    const deviceHash = hashDeviceToken(token);
    const trusted = firstRow(await restRequest({ table: TRUSTED_DEVICE_TABLE, query: {
      select: "id,agent_id", sk_id: `eq.${skId}`, device_token_hash: `eq.${deviceHash}`,
      revoked: "eq.false", expires_at: `gt.${nowIso}`, limit: 1
    }, prefer: "" }));
    if (trusted && trusted.agent_id && (trusted.agent_id === identity.agentId || trusted.agent_id === identity.agentUserId)) {
      await restRequest({ table: TRUSTED_DEVICE_TABLE, method: "PATCH", query: { id: `eq.${trusted.id}` }, body: { last_used_at: nowIso } });
      await tryWriteStaffLoginAudit({ skId, eventType: "LOGIN_TRUSTED_DEVICE", success: true });
      return { ok: true, mfaRequired: false, sessionToken };
    }

    const member = await findWixMember(identity);
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const salt = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + OTP_DURATION_MS).toISOString();
    await restRequest({ table: OTP_TABLE, method: "PATCH", query: { sk_id: `eq.${skId}`, used: "eq.false" }, body: { used: true } });
    const inserted = firstRow(await restRequest({ table: OTP_TABLE, method: "POST", body: {
      sk_id: skId, agent_id: identity.agentId || identity.agentUserId, email: identity.loginEmail,
      wix_member_id: member.id, code: `v2:${salt}:${otpDigest(skId, token, code, salt)}`,
      expires_at: expiresAt, used: false, attempts: 0
    } }));
    if (!inserted?.id) throw new Error("STAFF_CHALLENGE_NOT_CREATED");
    const requestedAtUtc = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
    try {
      await runTrigger({ triggerId: AUTOMATION_TRIGGER_ID, payload: {
        contactId: member.contactId, email: identity.deliveryEmail, phone: formatStaffPhone(identity.phone),
        skId, code, expiresInMinutes: 5, requestedAtUtc, ipAddress: "Unavailable", location: "Unknown Location",
        deviceSummary: parseDeviceSummary(userAgent), deviceIdShort: `DEV-${deviceHash.slice(0, 8).toUpperCase()}`
      } });
    } catch (error) {
      await restRequest({ table: OTP_TABLE, method: "PATCH", query: { id: `eq.${inserted.id}` }, body: { used: true } });
      throw error;
    }
    await tryWriteStaffLoginAudit({ skId, agentUserId: identity.agentUserId, eventType: "MFA_OTP_SENT_NEW_DEVICE", success: true });
    return { ok: true, mfaRequired: true, maskedEmail: maskEmail(identity.deliveryEmail) };
  } catch (error) {
    console.error("[SKANDI OTP] Unable to start verification:", error?.code || error?.message || "unknown");
    return publicFailure("Unable to sign in or send a verification code. Please try again.");
  }
}

export async function verifyStaffOtpAndTrustDeviceCore({ skId: rawSkId, code: rawCode, deviceToken, userAgent = "" } = {}) {
  const skId = normalizeSkId(rawSkId);
  const code = text(rawCode, 10).replace(/\s+/g, "");
  const token = text(deviceToken, 128);
  if (!isValidSkId(skId) || !/^\d{6}$/.test(code) || !DEVICE_TOKEN.test(token)) return { ok: false, code: "INVALID_INPUT", message: "Enter the 6-digit verification code." };
  try {
    // The conditional PATCH claims one attempt atomically, including the successful one.
    for (let retry = 0; retry < 8; retry += 1) {
      const nowIso = new Date().toISOString();
      const record = firstRow(await restRequest({ table: OTP_TABLE, query: {
        select: "id,sk_id,agent_id,email,wix_member_id,code,expires_at,used,attempts,created_at",
        sk_id: `eq.${skId}`, used: "eq.false", expires_at: `gt.${nowIso}`, order: "created_at.desc", limit: 1
      }, prefer: "" }));
      if (!record || Number(record.attempts) >= OTP_ATTEMPTS) return { ok: false, code: "EXPIRED_OR_INVALID", message: "Code expired or invalid. Please sign in again." };
      const matched = codeMatches(record.code, skId, token, code);
      const count = Number(record.attempts) || 0;
      const claimed = firstRow(await restRequest({ table: OTP_TABLE, method: "PATCH", query: {
        id: `eq.${record.id}`, used: "eq.false", attempts: `eq.${count}`, expires_at: `gt.${nowIso}`
      }, body: { attempts: count + 1, used: matched || count + 1 >= OTP_ATTEMPTS, ...(matched ? { verified_at: nowIso } : {}) } }));
      if (!claimed) continue;
      if (!matched) return { ok: false, code: "WRONG_CODE", message: count + 1 >= OTP_ATTEMPTS ? "Too many failed attempts. Please sign in again." : "Incorrect verification code." };

      const identity = await resolveStaffVerificationIdentityCore(skId);
      const member = await findWixMember(identity);
      if (identity.loginEmail !== email(record.email) || member.id !== record.wix_member_id || (record.agent_id && record.agent_id !== identity.agentId && record.agent_id !== identity.agentUserId)) throw new Error("STAFF_CHALLENGE_IDENTITY_CHANGED");
      const sessionToken = await authentication.generateSessionToken(identity.loginEmail);
      if (!sessionToken || typeof sessionToken !== "string") throw new Error("WIX_SESSION_TOKEN_MISSING");
      const deviceHash = hashDeviceToken(token);
      const trustExpiresAt = new Date(Date.now() + TRUST_DURATION_MS).toISOString();
      await restRequest({ table: TRUSTED_DEVICE_TABLE, method: "POST", query: { on_conflict: "sk_id,device_token_hash" }, prefer: "resolution=merge-duplicates,return=representation", body: {
        sk_id: skId, agent_id: identity.agentId || identity.agentUserId, device_token_hash: deviceHash,
        user_agent: text(userAgent, 240), trusted_at: nowIso, last_used_at: nowIso, expires_at: trustExpiresAt, revoked: false
      } });
      await tryWriteStaffLoginAudit({ skId, agentUserId: identity.agentUserId, eventType: "MFA_DEVICE_TRUSTED_30D", success: true });
      return { ok: true, sessionToken };
    }
    return { ok: false, code: "RETRY", message: "Verification is busy. Please try again." };
  } catch (error) {
    console.error("[SKANDI OTP] Unable to verify device:", error?.code || error?.message || "unknown");
    return { ok: false, code: "VERIFY_ERROR", message: "Verification failed. Please sign in again." };
  }
}
