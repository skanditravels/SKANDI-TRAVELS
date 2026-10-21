// /src/backend/SKANDI_CORE/whatsAppCustomerCare.js
// V12 WhatsApp Cloud API ingress/egress for the existing SKANDI Customer Service case store.
// Provider identity is not customer-account authentication. No automatic account linking.

import { createHmac, timingSafeEqual } from "crypto";
import { Buffer } from "buffer";
import { fetch } from "wix-fetch";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { requireSupportAgentCore } from "backend/SKANDI_CORE/customerSupport";

const getSecret = elevate(secrets.getSecretValue);
const CASES = "customer_support_cases";
const MESSAGES = "customer_support_messages";
const MAX_TEXT = 4000;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const WINDOW_SAFETY_MS = 60 * 1000;
const META_ID = /^\d{5,20}$/;
const META_WAMID = /^wamid\.[A-Za-z0-9_\-.:=]+$/;
const PROVIDER_SOURCE = "whatsapp";

function clean(value, max = 300) { return String(value ?? "").trim().slice(0, max); }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function rows(value) { return Array.isArray(value) ? value : []; }
function failure(code) { const e = new Error(code); e.code = code; return e; }
async function secret(name, required = true) {
  let raw = "";
  try {
    const result = await getSecret(name);
    raw = clean(typeof result === "string" ? result : result?.value ?? result?.secretValue ?? result?.secret?.value, 20000);
  } catch (_) {}
  if (!raw && required) throw failure(`WHATSAPP_SECRET_NOT_CONFIGURED_${name}`);
  return raw;
}
function safeCompare(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
function caseIdFor(phoneId, senderId, appSecret) {
  return `wa_${createHmac("sha256", appSecret).update(`${phoneId}:${senderId}`).digest("hex")}`;
}
async function getCase(caseId) {
  const found = await restRequest({ table: CASES, query: { select: "*", case_id: `eq.${caseId}`, limit: 1 } });
  return rows(found)[0] || null;
}
async function getCaseById(caseId) {
  if (!/^wa_[a-f0-9]{64}$/.test(clean(caseId, 120))) throw failure("WHATSAPP_CASE_INVALID");
  const item = await getCase(caseId);
  if (!item || item.source !== PROVIDER_SOURCE) throw failure("WHATSAPP_CASE_NOT_FOUND");
  return item;
}
async function createCaseIfAbsent(caseId, senderId, phoneId, contactName) {
  const payload = {
    source: PROVIDER_SOURCE, sourceChannel: "WHATSAPP", requesterType: "CUSTOMER",
    fullName: contactName || "WhatsApp traveler", phone: `+${senderId}`,
    whatsappWaId: senderId, whatsappPhoneNumberId: phoneId,
    identityVerifiedForBookings: false, queueKey: "support", labels: ["whatsapp"],
    channelDescription: "Meta WhatsApp Cloud API; caller is not authenticated to SKANDI"
  };
  await restRequest({ table: CASES, method: "POST", query: { on_conflict: "case_id" },
    prefer: "resolution=ignore-duplicates,return=representation", body: {
      case_id: caseId, member_id: null, wix_member_id: null, email: null,
      subject: "WhatsApp Customer Care", category: "general", priority: "normal",
      status: "open", source: PROVIDER_SOURCE, page: "/about/support", payload
    } });
  const record = await getCase(caseId);
  if (!record || record.source !== PROVIDER_SOURCE ||
    clean(obj(record.payload).whatsappWaId, 25) !== senderId ||
    clean(obj(record.payload).whatsappPhoneNumberId, 30) !== phoneId) {
    throw failure("WHATSAPP_CASE_IDENTITY_CONFLICT");
  }
  return record;
}
function messageText(message) {
  const type = clean(message.type, 40);
  if (type === "text") return clean(message.text?.body, MAX_TEXT);
  if (["image", "video", "audio", "document", "sticker", "location", "contacts", "interactive", "button"].includes(type)) {
    return `[WhatsApp ${type} received. This content is not imported; request a text description from the traveler.]`;
  }
  return "[WhatsApp message received in an unsupported format.]";
}
async function recordInbound(message, contactName, phoneId, appSecret) {
  const from = clean(message.from, 25), wamid = clean(message.id, 200);
  if (!META_ID.test(from) || !META_WAMID.test(wamid)) throw failure("WHATSAPP_INBOUND_ID_INVALID");
  const timestamp = Number(message.timestamp);
  const timestampMs = Number.isFinite(timestamp) ? timestamp * 1000 : 0;
  if (!timestampMs || timestampMs > Date.now() + 5 * 60 * 1000 || timestampMs < Date.now() - 7 * 86400000) {
    throw failure("WHATSAPP_INBOUND_TIMESTAMP_INVALID");
  }
  const caseId = caseIdFor(phoneId, from, appSecret);
  const record = await createCaseIfAbsent(caseId, from, phoneId, contactName);
  const storedId = `wa:${wamid}`;
  const persisted = await restRequest({ table: MESSAGES, method: "POST", query: { on_conflict: "message_id" },
    prefer: "resolution=ignore-duplicates,return=representation", body: {
      message_id: storedId, case_id: caseId, member_id: null, wix_member_id: null,
      sender_type: "customer", sender_name: contactName || "WhatsApp traveler",
      message: messageText(message), channel: PROVIDER_SOURCE,
      payload: { source: PROVIDER_SOURCE, private: false, kind: "public", metaMessageId: wamid,
        metaTimestamp: new Date(timestampMs).toISOString(), metaType: clean(message.type, 40),
        mediaImported: false, identityVerifiedForBookings: false }
    } });
  if (rows(persisted).length) {
    const old = obj(record.payload), last = Date.parse(old.whatsappLastInboundAt || "") || 0;
    await restRequest({ table: CASES, method: "PATCH", query: { case_id: `eq.${caseId}` },
      body: { status: "open", updated_at: new Date().toISOString(), payload: {
        ...old, whatsappLastInboundAt: new Date(Math.max(timestampMs, last)).toISOString()
      } } });
  }
  return { received: rows(persisted).length === 1 };
}
async function recordDeliveryStatus(status, phoneId, appSecret) {
  const id = clean(status.id, 200), to = clean(status.recipient_id, 25);
  if (!META_WAMID.test(id) || !META_ID.test(to)) return;
  const caseId = caseIdFor(phoneId, to, appSecret);
  const matched = rows(await restRequest({ table: MESSAGES, query: {
    select: "message_id,payload", message_id: `eq.wa:${id}`, case_id: `eq.${caseId}`, limit: 1
  } }))[0];
  if (!matched) return;
  const next = clean(status.status, 30);
  if (!["sent", "delivered", "read", "failed"].includes(next)) return;
  await restRequest({ table: MESSAGES, method: "PATCH", query: {
    message_id: `eq.wa:${id}`, case_id: `eq.${caseId}`
  }, body: { payload: { ...obj(matched.payload), metaStatus: next,
    metaStatusAt: new Date().toISOString(), metaFailureCode: next === "failed" ? clean(status.errors?.[0]?.code, 40) : "" } } });
}

export async function verifyWhatsAppWebhookChallengeCore({ mode = "", token = "", challenge = "" } = {}) {
  const expected = await secret("SKANDI_WHATSAPP_VERIFY_TOKEN");
  if (mode !== "subscribe" || !safeCompare(token, expected)) throw failure("WHATSAPP_WEBHOOK_UNAUTHORIZED");
  const text = String(challenge ?? "");
  if (!/^\d{1,64}$/.test(text)) throw failure("WHATSAPP_WEBHOOK_CHALLENGE_INVALID");
  return text;
}
export async function receiveWhatsAppWebhookCore(rawBody, signatureHeader) {
  const original = typeof rawBody === "string" ? rawBody : "";
  if (!original || original.length > 500000) throw failure("WHATSAPP_WEBHOOK_BODY_INVALID");
  const appSecret = await secret("SKANDI_WHATSAPP_APP_SECRET");
  const header = clean(signatureHeader, 100);
  if (!/^sha256=[a-f0-9]{64}$/i.test(header) ||
    !safeCompare(header.toLowerCase(), `sha256=${createHmac("sha256", appSecret).update(original, "utf8").digest("hex")}`)) {
    throw failure("WHATSAPP_WEBHOOK_UNAUTHORIZED");
  }
  let event;
  try { event = JSON.parse(original); } catch (_) { throw failure("WHATSAPP_WEBHOOK_BAD_JSON"); }
  if (event?.object !== "whatsapp_business_account") throw failure("WHATSAPP_WEBHOOK_OBJECT_INVALID");
  const phoneId = await secret("SKANDI_WHATSAPP_PHONE_NUMBER_ID");
  if (!META_ID.test(phoneId)) throw failure("WHATSAPP_PHONE_NUMBER_ID_INVALID");
  const wabaId = await secret("SKANDI_WHATSAPP_BUSINESS_ACCOUNT_ID", false);
  let received = 0;
  for (const entry of rows(event.entry).slice(0, 20)) {
    if (wabaId && String(entry.id) !== wabaId) throw failure("WHATSAPP_WABA_ID_MISMATCH");
    for (const change of rows(entry.changes).slice(0, 20)) {
      if (change.field !== "messages") continue;
      const value = obj(change.value);
      if (value.messaging_product !== "whatsapp" || String(value.metadata?.phone_number_id) !== phoneId) {
        throw failure("WHATSAPP_PHONE_ID_MISMATCH");
      }
      const contacts = new Map(rows(value.contacts).map(c => [String(c.wa_id), clean(c.profile?.name, 120)]));
      for (const message of rows(value.messages).slice(0, 50)) {
        const outcome = await recordInbound(message, contacts.get(String(message.from)) || "", phoneId, appSecret);
        if (outcome.received) received++;
      }
      for (const item of rows(value.statuses).slice(0, 50)) await recordDeliveryStatus(item, phoneId, appSecret);
    }
  }
  return { ok: true, accepted: true, inboundStored: received };
}

export async function replyAgentWhatsAppCore({ caseId = "", content = "" } = {}) {
  const agent = await requireSupportAgentCore();
  const text = clean(content, MAX_TEXT);
  if (!text) throw failure("WHATSAPP_REPLY_TEXT_REQUIRED");
  const record = await getCaseById(caseId);
  const attributes = obj(record.payload);
  const waId = clean(attributes.whatsappWaId, 25);
  const phoneId = await secret("SKANDI_WHATSAPP_PHONE_NUMBER_ID");
  if (!META_ID.test(waId) || attributes.whatsappPhoneNumberId !== phoneId) throw failure("WHATSAPP_CASE_PHONE_MISMATCH");
  const latest = rows(await restRequest({ table: MESSAGES, query: {
    select: "payload", case_id: `eq.${caseId}`, channel: "eq.whatsapp", sender_type: "eq.customer",
    order: "created_at.desc", limit: 100
  } }));
  const lastInbound = Math.max(0, ...latest.map(row => Date.parse(obj(row.payload).metaTimestamp || "") || 0));
  if (!lastInbound || Date.now() - lastInbound >= WINDOW_MS - WINDOW_SAFETY_MS) {
    throw failure("WHATSAPP_24_HOUR_WINDOW_CLOSED_USE_APPROVED_TEMPLATE");
  }
  const token = await secret("SKANDI_WHATSAPP_ACCESS_TOKEN");
  const configuredVersion = await secret("SKANDI_WHATSAPP_GRAPH_VERSION", false);
  const version = configuredVersion || "v24.0";
  if (!/^v\d{2}\.0$/.test(version)) throw failure("WHATSAPP_GRAPH_VERSION_INVALID");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: waId,
      type: "text", text: { preview_url: false, body: text } })
  });
  let data;
  try { data = await response.json(); } catch (_) { data = null; }
  if (!response.ok || !data?.messages?.[0]?.id) {
    const code = clean(data?.error?.code || response.status, 50);
    throw failure(`WHATSAPP_PROVIDER_REJECTED_${code}`);
  }
  const metaMessageId = clean(data.messages[0].id, 200);
  if (!META_WAMID.test(metaMessageId)) throw failure("WHATSAPP_PROVIDER_MESSAGE_ID_INVALID");
  let persisted;
  try {
    persisted = await restRequest({ table: MESSAGES, method: "POST", query: { on_conflict: "message_id" },
      prefer: "resolution=ignore-duplicates,return=representation", body: {
        message_id: `wa:${metaMessageId}`, case_id: caseId, member_id: null, wix_member_id: null,
        sender_type: "agent", sender_name: clean(agent.name, 200) || "SKANDI Customer Service",
        message: text, channel: PROVIDER_SOURCE,
        payload: { source: "whatsapp-agent-reply", kind: "public", private: false,
          metaMessageId, metaStatus: "accepted", acceptedAt: new Date().toISOString(),
          agentSkId: clean(agent.skId, 100) }
      } });
    await restRequest({ table: CASES, method: "PATCH", query: { case_id: `eq.${caseId}` },
      body: { updated_at: new Date().toISOString(), assigned_agent_id: clean(agent.id || agent.skId || agent.email, 200) || null,
        assigned_agent_name: clean(agent.name, 200) || "SKANDI Customer Service" } });
  } catch (e) {
    console.error("[WhatsApp Customer Care] Provider accepted reply but canonical persistence failed.", { caseId });
    throw failure("WHATSAPP_PROVIDER_ACCEPTED_BUT_PERSISTENCE_FAILED_DO_NOT_RESEND_BLINDLY");
  }
  if (!rows(persisted).length) throw failure("WHATSAPP_REPLY_ALREADY_RECORDED_DO_NOT_RESEND");
  return { ok: true, providerAccepted: true, deliveryConfirmed: false, caseId,
    sentMessage: { id: `wa:${metaMessageId}`, body: text, content: text, channel: PROVIDER_SOURCE,
      senderType: "agent", senderName: clean(agent.name, 200), at: new Date().toISOString() } };
}
