import { createHash, createHmac, timingSafeEqual } from "crypto";
import { Buffer } from "buffer";
import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { restRequest, rpcRequest } from "backend/SKANDI_CORE/supabaseServer";

const getSecret = elevate(secrets.getSecretValue);
const MESSAGES = "customer_support_messages";
const ACCOUNT_SID = /^AC[0-9a-f]{32}$/i;
const MESSAGE_SID = /^(?:SM|MM)[0-9a-f]{32}$/i;
const REPLY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ADDRESS = /^whatsapp:\+[1-9]\d{1,14}$/;
const WEBHOOK_ORIGIN = "https://www.skanditravels.com";
const WEBHOOK_BASE = `${WEBHOOK_ORIGIN}/_functions/`;
const INBOUND_URL = `${WEBHOOK_BASE}skandiTwilioWhatsAppInbound`;
const STATUS_URL = `${WEBHOOK_BASE}skandiTwilioWhatsAppStatus`;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_REPLY_LENGTH = 1600;
const PROVIDER_STATUSES = new Set(["accepted", "scheduled", "queued", "sending", "sent", "delivered", "read", "undelivered", "failed", "canceled"]);

function failure(code) { return Object.assign(new Error(code), { code }); }
function limitedText(value, max) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function field(fields, name) { return typeof fields[name] === "string" ? fields[name] : ""; }
function providerErrorCode(value) { return /^\d{1,10}$/.test(String(value ?? "")) ? String(value) : null; }

async function readSecret(name) {
  const result = await getSecret(name).catch(() => null);
  return limitedText(typeof result === "string" ? result : result?.value ?? result?.secretValue ?? result?.secret?.value, 300);
}

async function settings() {
  const [account, authToken, senderNumber] = await Promise.all([
    readSecret("SKANDI_TWILIO_ACCOUNT_SID"),
    readSecret("SKANDI_TWILIO_AUTH_TOKEN"),
    readSecret("SKANDI_TWILIO_WHATSAPP_SENDER")
  ]);
  const sender = senderNumber.startsWith("whatsapp:") ? senderNumber : `whatsapp:${senderNumber}`;
  if (!ACCOUNT_SID.test(account) || !authToken || !ADDRESS.test(sender)) throw failure("TWILIO_WHATSAPP_NOT_CONFIGURED");
  return {
    account, authToken, sender,
    url: `https://api.twilio.com/2010-04-01/Accounts/${account}/Messages`,
    authorization: `Basic ${Buffer.from(`${account}:${authToken}`).toString("base64")}`
  };
}

function matchesFormSignature(authToken, signature, url, fields) {
  const formData = Object.keys(fields).sort().map(name => {
    const value = fields[name];
    const values = Array.isArray(value) ? [...new Set(value)].sort() : [value];
    return values.map(item => name + item).join("");
  }).join("");
  const provided = Buffer.from(signature, "ascii");
  // Twilio can sign the canonical HTTPS URL with or without its default port.
  const urlWithPort = `${WEBHOOK_ORIGIN}:443${url.slice(WEBHOOK_ORIGIN.length)}`;
  return [url, urlWithPort].some(signedUrl => {
    const expected = createHmac("sha1", authToken).update(signedUrl + formData, "utf8").digest("base64");
    return timingSafeEqual(provided, Buffer.from(expected, "ascii"));
  });
}

async function signedForm({ raw, signature, contentType, url }) {
  if (!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(contentType || "") || typeof raw !== "string" || !raw || raw.length > 65536) {
    throw failure("TWILIO_WHATSAPP_BAD_REQUEST");
  }
  if (!/^[A-Za-z0-9+/]{27}=$/.test(signature || "")) throw failure("TWILIO_WHATSAPP_UNAUTHORIZED");
  const config = await settings();
  const fields = Object.create(null);
  for (const [key, value] of new URLSearchParams(raw)) {
    if (fields[key] === undefined) fields[key] = value;
    else fields[key] = [].concat(fields[key], value);
  }
  if (!matchesFormSignature(config.authToken, signature, url, fields) || field(fields, "AccountSid") !== config.account) {
    throw failure("TWILIO_WHATSAPP_UNAUTHORIZED");
  }
  return { config, fields };
}

function replyMessageId(replyId) { return `twilio-out:${replyId}`; }
function callbackUrl(replyId) { return `${STATUS_URL}?replyId=${replyId}`; }

export async function receiveTwilioWhatsAppCore({ raw, signature, contentType, query = "" }) {
  if (query) throw failure("TWILIO_WHATSAPP_BAD_REQUEST");
  const { config, fields } = await signedForm({ raw, signature, contentType, url: INBOUND_URL });
  const sid = field(fields, "MessageSid");
  const recipient = field(fields, "From");
  if (!MESSAGE_SID.test(sid) || !ADDRESS.test(recipient)) throw failure("TWILIO_WHATSAPP_BAD_REQUEST");
  if (field(fields, "To") !== config.sender) throw failure("TWILIO_WHATSAPP_UNAUTHORIZED");

  const messageId = `twilio-in:${sid}`;
  const existing = await restRequest({ table: MESSAGES, query: { select: "message_id", message_id: `eq.${messageId}`, limit: 1 } });
  if (existing?.length) return;

  // A delayed delivery or webhook retry must not extend the traveler's reply window.
  const response = await fetch(`${config.url}/${sid}.json`, { headers: { Authorization: config.authorization } });
  if (!response.ok) throw failure("TWILIO_WHATSAPP_MESSAGE_LOOKUP_FAILED");
  const message = await response.json();
  const createdAt = Date.parse(message?.date_created);
  if (message?.sid !== sid || message.account_sid !== config.account || message.from !== recipient || message.to !== config.sender || message.direction !== "inbound" ||
      !Number.isFinite(createdAt) || createdAt > Date.now() + 60000) {
    throw failure("TWILIO_WHATSAPP_MESSAGE_LOOKUP_FAILED");
  }

  const digest = createHash("sha256").update(`${config.account}:${config.sender}:${recipient}`).digest("hex");
  const profileName = limitedText(field(fields, "ProfileName"), 120) || "WhatsApp traveler";
  const hasMedia = Number(field(fields, "NumMedia")) > 0;
  const body = limitedText(field(fields, "Body") || field(fields, "ButtonText"), 4000);
  const attachmentNote = hasMedia ? "[WhatsApp attachment received. Ask the traveler for a text description.]" : "";
  await rpcRequest({ functionName: "skandi_record_twilio_whatsapp_inbound", body: {
    p_case_id: `wa_twilio_${digest}`,
    p_message_id: messageId,
    p_received_at: new Date(createdAt).toISOString(),
    p_profile_name: profileName,
    p_body: [body, attachmentNote].filter(Boolean).join("\n\n") || "[WhatsApp message received in an unsupported format.]",
    p_case_payload: {
      caseRef: `WA-${digest.slice(0, 12).toUpperCase()}`,
      source: "whatsapp", sourceChannel: "WHATSAPP", requesterType: "CUSTOMER", fullName: profileName,
      phone: recipient.slice("whatsapp:".length), whatsappProvider: "twilio", twilioAccountSid: config.account,
      whatsappBusinessAddress: config.sender, whatsappContactAddress: recipient,
      identityVerifiedForBookings: false, queueKey: "support", labels: ["whatsapp"]
    },
    p_message_payload: {
      source: "whatsapp", private: false, kind: "public", whatsappProvider: "twilio", twilioMessageSid: sid,
      hasMedia, identityVerifiedForBookings: false
    }
  } });
}

async function recordStatus({ replyId, config, recipient, sid = null, status, errorCode = null }) {
  return rpcRequest({ functionName: "skandi_record_twilio_whatsapp_status", body: {
    p_message_id: replyMessageId(replyId), p_account: config.account, p_sender: config.sender,
    p_recipient: recipient, p_message_sid: sid, p_status: status, p_error_code: errorCode
  } });
}

export async function receiveTwilioWhatsAppStatusCore({ raw, signature, contentType, query }) {
  const replyId = typeof query === "string" && query.startsWith("?replyId=") ? query.slice(9) : "";
  if (!REPLY_ID.test(replyId)) throw failure("TWILIO_WHATSAPP_BAD_REQUEST");
  const { config, fields } = await signedForm({ raw, signature, contentType, url: callbackUrl(replyId) });
  const sid = field(fields, "MessageSid");
  const sender = field(fields, "From");
  const recipient = field(fields, "To");
  if (!MESSAGE_SID.test(sid) || (recipient && !ADDRESS.test(recipient))) throw failure("TWILIO_WHATSAPP_BAD_REQUEST");
  if (sender && sender !== config.sender) throw failure("TWILIO_WHATSAPP_UNAUTHORIZED");
  const status = field(fields, "EventType") === "READ" ? "read" : field(fields, "MessageStatus").toLowerCase();
  if (!PROVIDER_STATUSES.has(status)) return;
  await recordStatus({ replyId, config, recipient: recipient || null, sid, status, errorCode: providerErrorCode(field(fields, "ErrorCode")) });
}

function replyProblem(error, message, retryWithNewId = false) {
  return { ok: false, error, message, retryWithNewId };
}

function rejectedReply(code) {
  if (code === "63016") return replyProblem("WHATSAPP_WINDOW_CLOSED", "The WhatsApp reply window has closed. An approved template is required to contact this traveler.", true);
  return replyProblem("TWILIO_WHATSAPP_REJECTED", `Twilio rejected the reply${code ? ` (error ${code})` : ""}. The message was not sent.`, true);
}

function replyResult(row, payload) {
  const { twilioStatus: status, twilioErrorCode: errorCode, twilioMessageSid: sid } = payload;
  if (status === "rejected") return rejectedReply(errorCode);
  if (!sid) return replyProblem("TWILIO_WHATSAPP_UNCONFIRMED", "Twilio has not confirmed this send. Check the conversation for a delivery update before sending again.");
  return {
    ok: true, caseId: row.case_id, providerAccepted: true, deliveryConfirmed: ["delivered", "read"].includes(status),
    sentMessage: { id: row.message_id, body: row.message, senderType: "agent", senderName: row.sender_name,
      channel: "whatsapp", at: row.created_at, deliveryStatus: status, deliveryErrorCode: errorCode || "" }
  };
}

export async function sendTwilioWhatsAppReply({ record, agent, content, replyId }) {
  const body = typeof content === "string" ? content.trim() : "";
  if (!body || body.length > MAX_REPLY_LENGTH) return replyProblem("TWILIO_WHATSAPP_BODY_INVALID", `Write a WhatsApp reply of 1 to ${MAX_REPLY_LENGTH} characters.`);
  if (!REPLY_ID.test(replyId || "")) return replyProblem("TWILIO_WHATSAPP_REPLY_ID_INVALID", "Reload the Customer Service Desk to send a WhatsApp reply.");
  const config = await settings();
  const { whatsappBusinessAddress, whatsappContactAddress: recipient, twilioAccountSid } = record.payload;
  if (whatsappBusinessAddress !== config.sender || twilioAccountSid !== config.account || !ADDRESS.test(recipient || "")) {
    return replyProblem("TWILIO_WHATSAPP_SENDER_MISMATCH", "This conversation belongs to a different Twilio WhatsApp sender.");
  }
  const messageId = replyMessageId(replyId);
  const query = { select: "*", case_id: `eq.${record.case_id}`, message_id: `eq.${messageId}`, limit: 1 };
  const agentId = agent.skId || agent.id || agent.email;
  const previous = (await restRequest({ table: MESSAGES, query }))[0];
  if (previous) {
    if (previous.payload?.agentSkId !== agentId || previous.message !== body) throw failure("TWILIO_WHATSAPP_REPLY_ID_CONFLICT");
    return replyResult(previous, previous.payload);
  }

  const [latest] = await restRequest({ table: MESSAGES, query: {
    select: "created_at", case_id: `eq.${record.case_id}`, channel: "eq.whatsapp", sender_type: "eq.customer",
    order: "created_at.desc.nullslast", limit: 1
  } });
  const lastInboundAt = Date.parse(latest?.created_at);
  const remaining = lastInboundAt + WINDOW_MS - Date.now() - 60000;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return replyProblem("WHATSAPP_WINDOW_CLOSED", "The WhatsApp reply window has closed. An approved template is required to contact this traveler.");
  }

  // Reserve a durable reply ID before calling Twilio. A later callback can settle it even if the API response is lost.
  const [saved] = await restRequest({ table: MESSAGES, method: "POST", query: { on_conflict: "message_id" },
    prefer: "resolution=ignore-duplicates,return=representation", body: {
      message_id: messageId, case_id: record.case_id, sender_type: "agent", sender_name: agent.name || "SKANDI Customer Service",
      message: body, channel: "whatsapp", payload: {
        source: "whatsapp-agent-reply", private: false, kind: "public", whatsappProvider: "twilio",
        twilioAccountSid: config.account, whatsappBusinessAddress: config.sender, whatsappContactAddress: recipient,
        twilioStatus: "submitting", agentSkId: agentId
      }
    } });
  if (!saved) {
    const [winner] = await restRequest({ table: MESSAGES, query });
    if (winner?.payload?.agentSkId !== agentId || winner?.message !== body) throw failure("TWILIO_WHATSAPP_REPLY_ID_CONFLICT");
    return replyResult(winner, winner.payload);
  }

  const form = new URLSearchParams({ From: config.sender, To: recipient, Body: body, StatusCallback: callbackUrl(replyId),
    ValidityPeriod: String(Math.min(36000, Math.max(1, Math.floor(remaining / 1000)))) });
  const response = await fetch(`${config.url}.json`, {
    method: "POST", headers: { Authorization: config.authorization, "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString()
  }).catch(() => null);
  const data = await response?.json().catch(() => null);
  const sid = MESSAGE_SID.test(data?.sid || "") && data.account_sid === config.account ? data.sid : null;
  const rejected = [400, 401, 403, 404, 422, 429].includes(response?.status);
  const status = response?.ok && sid ? (PROVIDER_STATUSES.has(data.status) ? data.status : "accepted") : rejected ? "rejected" : "uncertain";
  const errorCode = providerErrorCode(data?.error_code || data?.code);
  const fallback = { twilioStatus: status, twilioMessageSid: sid, twilioErrorCode: errorCode };
  const persisted = await recordStatus({ replyId, config, recipient, sid, status, errorCode }).catch(() => {
    console.error("[Twilio WhatsApp] Send result is awaiting reconciliation.", { status });
    return null;
  });
  return replyResult(saved, persisted || fallback);
}
