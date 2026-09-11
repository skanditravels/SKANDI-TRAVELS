// /src/backend/SKANDI_CORE/livekitSupportClient.js
// SKANDI Support Center — LiveKit transport core.
// R-003.7
//
// LiveKit is the realtime transport/agent plane only.
// Supabase customer_support_cases/customer_support_messages remain canonical history.
// API key/secret are read only from Wix Secrets Manager and are never returned.

import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const TEXT_TOPIC = "skandi.support.chat";
const TOKEN_TTL_SECONDS = 60 * 60;
const DISPATCH_TTL_SECONDS = 60;

let configPromise = null;

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function publicError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  error.publicMessage = message || "Realtime support is temporarily unavailable.";
  return error;
}

async function readSecret(names, required = true) {
  for (const name of names) {
    try {
      const result = await elevatedGetSecretValue(name);
      const value = clean(result?.value || result, 10000);
      if (value) return value;
    } catch (_) {}
  }
  if (!required) return "";
  throw publicError("LIVEKIT_SECRET_MISSING", `Missing LiveKit secret: ${names[0]}`);
}

function normalizeLiveKitUrl(value) {
  const raw = clean(value, 1000).replace(/\/+$/, "");
  if (!raw) return "";
  if (/^wss?:\/\//i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/^http/i, "ws");
  return `wss://${raw}`;
}

function httpBase(livekitUrl) {
  return normalizeLiveKitUrl(livekitUrl)
    .replace(/^wss:/i, "https:")
    .replace(/^ws:/i, "http:")
    .replace(/\/+$/, "");
}

async function configuration() {
  if (!configPromise) {
    configPromise = (async () => {
      const [url, apiKey, apiSecret, agentName] = await Promise.all([
        readSecret(["LIVEKIT_URL", "LIVEKIT_WS_URL", "LIVEKIT_SERVER_URL"]),
        readSecret(["LIVEKIT_API_KEY", "LIVEKIT_KEY"]),
        readSecret(["LIVEKIT_API_SECRET", "LIVEKIT_SECRET"]),
        readSecret(["LIVEKIT_AGENT_NAME", "LIVEKIT_SUPPORT_AGENT_NAME"], false)
      ]);
      return {
        url: normalizeLiveKitUrl(url),
        apiKey,
        apiSecret,
        agentName: clean(agentName, 120)
      };
    })().catch(error => {
      configPromise = null;
      throw error;
    });
  }
  return configPromise;
}

function utf8(value) {
  if (typeof TextEncoder === "undefined") {
    throw publicError("LIVEKIT_CRYPTO_UNAVAILABLE", "The server runtime cannot create LiveKit access tokens.");
  }
  return new TextEncoder().encode(String(value));
}

function base64UrlBytes(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += i + 1 < bytes.length ? alphabet[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? alphabet[n & 63] : "=";
  }
  return out.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlJson(value) {
  return base64UrlBytes(utf8(JSON.stringify(value)));
}

async function hmacSha256(secret, content) {
  const subtle = globalThis?.crypto?.subtle;
  if (!subtle) {
    throw publicError("LIVEKIT_CRYPTO_UNAVAILABLE", "The server runtime cannot create LiveKit access tokens.");
  }
  const key = await subtle.importKey(
    "raw",
    utf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await subtle.sign("HMAC", key, utf8(content));
  return new Uint8Array(signature);
}

async function signJwt(payload, cfg) {
  const header = { alg: "HS256", typ: "JWT" };
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signature = base64UrlBytes(await hmacSha256(cfg.apiSecret, unsigned));
  return `${unsigned}.${signature}`;
}

function opaqueId(prefix, value) {
  const raw = clean(value, 200).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!raw) throw publicError("LIVEKIT_ID_REQUIRED", "A secure support identity is required.");
  return `${prefix}-${raw}`.slice(0, 180);
}

export function liveKitSupportRoomName(caseRow = {}) {
  const databaseId = clean(caseRow.id, 120).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!databaseId) throw publicError("LIVEKIT_CASE_ID_REQUIRED", "The support case must be saved before realtime chat can start.");
  return `sk-support-${databaseId}`;
}

async function createJoinToken({ roomName, identity, role, caseId, participantName = "" }) {
  const cfg = await configuration();
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    iss: cfg.apiKey,
    sub: identity,
    nbf: now - 5,
    exp: now + TOKEN_TTL_SECONDS,
    name: clean(participantName, 120) || undefined,
    metadata: JSON.stringify({ role: clean(role, 40), caseId: clean(caseId, 120) }),
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    }
  }, cfg);
}

async function createRoomAdminToken(roomName) {
  const cfg = await configuration();
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    iss: cfg.apiKey,
    sub: `support-dispatch-${now}`,
    nbf: now - 5,
    exp: now + DISPATCH_TTL_SECONDS,
    video: { room: roomName, roomAdmin: true }
  }, cfg);
}

async function dispatchNamedAgent(roomName, metadata = {}) {
  const cfg = await configuration();
  if (!cfg.agentName) return { mode: "automatic", dispatched: false };

  const token = await createRoomAdminToken(roomName);
  const response = await fetch(`${httpBase(cfg.url)}/twirp/livekit.AgentDispatchService/CreateDispatch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      agent_name: cfg.agentName,
      room: roomName,
      metadata: JSON.stringify(object(metadata))
    })
  });

  if (response.ok) {
    let result = {};
    try { result = await response.json(); } catch (_) {}
    return { mode: "explicit", dispatched: true, dispatchId: clean(result?.id, 200) || null };
  }

  const body = clean(await response.text().catch(() => ""), 1000);
  const alreadyExists = response.status === 409 || /already exists|already dispatched/i.test(body);
  if (alreadyExists) return { mode: "explicit", dispatched: true, existing: true };

  throw publicError("LIVEKIT_AGENT_DISPATCH_FAILED", `LiveKit agent dispatch failed (${response.status}).`);
}

export async function getLiveKitSupportState() {
  try {
    const cfg = await configuration();
    return {
      configured: Boolean(cfg.url && cfg.apiKey && cfg.apiSecret),
      url: cfg.url,
      textTopic: TEXT_TOPIC,
      dispatchMode: cfg.agentName ? "explicit" : "automatic"
    };
  } catch (_) {
    return { configured: false, url: "", textTopic: TEXT_TOPIC, dispatchMode: "unavailable" };
  }
}

export async function createCustomerLiveKitSession({ caseRow, customerContext, ensureAgent = true } = {}) {
  const roomName = liveKitSupportRoomName(caseRow);
  const profileId = clean(customerContext?.profileRow?.id || customerContext?.profile?.id, 120);
  const identity = opaqueId("customer", profileId);
  const cfg = await configuration();
  const dispatch = ensureAgent
    ? await dispatchNamedAgent(roomName, { caseId: clean(caseRow?.case_id, 120), source: "skandi-support-center" }).catch(error => ({ mode: cfg.agentName ? "explicit" : "automatic", dispatched: false, warning: error.publicMessage || error.message }))
    : { mode: cfg.agentName ? "explicit" : "automatic", dispatched: false };
  const token = await createJoinToken({
    roomName,
    identity,
    role: "customer",
    caseId: caseRow?.case_id,
    participantName: "SKANDI Traveler"
  });
  return {
    url: cfg.url,
    token,
    roomName,
    participantIdentity: identity,
    textTopic: TEXT_TOPIC,
    role: "customer",
    dispatch
  };
}

export async function createAgentLiveKitSession({ caseRow, staffSession, ensureAgent = false } = {}) {
  const roomName = liveKitSupportRoomName(caseRow);
  const agentId = clean(staffSession?.profile?.id || staffSession?.profile?.agentUserId || staffSession?.agentUserId, 120);
  const identity = opaqueId("agent", agentId);
  const cfg = await configuration();
  const dispatch = ensureAgent
    ? await dispatchNamedAgent(roomName, { caseId: clean(caseRow?.case_id, 120), source: "skandi-support-agent-workspace" }).catch(error => ({ mode: cfg.agentName ? "explicit" : "automatic", dispatched: false, warning: error.publicMessage || error.message }))
    : { mode: cfg.agentName ? "explicit" : "automatic", dispatched: false };
  const token = await createJoinToken({
    roomName,
    identity,
    role: "agent",
    caseId: caseRow?.case_id,
    participantName: "SKANDI Support"
  });
  return {
    url: cfg.url,
    token,
    roomName,
    participantIdentity: identity,
    textTopic: TEXT_TOPIC,
    role: "agent",
    dispatch
  };
}
