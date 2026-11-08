// /src/backend/SKANDI_CORE/livekitServer.js
// SKANDI B-011 — shared backend-only LiveKit service.
// Owns LiveKit credentials, participant token minting and Alexandra explicit dispatch.
// LiveKit Agents owns Alexandra runtime; Supabase customer_support_* owns durable Support cases/messages.
// GroupTalk remains a separate operational domain.

import { createHash, createHmac, randomUUID } from "crypto";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
const DEFAULT_TTL = "15m";
const SUPPORT_TEXT_TOPIC = "skandi.support.chat";
const ALEXANDRA_TEXT_TOPIC = "lk.chat";
const ALEXANDRA_AGENT_NAME = "alexandra-prod";

// Wix's package runtime cannot load the SDK's ESM dependency tree. LiveKit
// documents its JWT grants and Twirp API, so keep the existing service and
// authorization boundaries while using the native backend primitives.
export function signLiveKitAccessTokenCore({ apiKey, apiSecret, identity = "", name = "", metadata = "", video, ttlSeconds = 900 } = {}) {
  if (!apiKey || !apiSecret || !video || !Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 3600) {
    throw new Error("LIVEKIT_TOKEN_PARAMETERS_INVALID");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  const claims = { iss: apiKey, nbf: timestamp, iat: timestamp, exp: timestamp + ttlSeconds, video };
  if (identity) claims.sub = identity;
  if (name) claims.name = name;
  if (metadata) claims.metadata = metadata;
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode(claims)}`;
  return `${unsigned}.${createHmac("sha256", apiSecret).update(unsigned, "utf8").digest("base64url")}`;
}

async function dispatchAlexandra({ apiHost, apiKey, apiSecret, roomName, jobMetadata }) {
  if (!/^https:\/\//i.test(apiHost)) throw new Error("LIVEKIT_URL_INVALID");
  const authorization = signLiveKitAccessTokenCore({ apiKey, apiSecret, video: { roomAdmin: true, room: roomName }, ttlSeconds: 60 });
  const response = await fetch(`${apiHost}/twirp/livekit.AgentDispatchService/CreateDispatch`, {
    method: "POST",
    redirect: "error",
    headers: { Authorization: `Bearer ${authorization}`, "Content-Type": "application/json" },
    body: JSON.stringify({ agent_name: ALEXANDRA_AGENT_NAME, room: roomName, metadata: JSON.stringify(jobMetadata) })
  });
  if (!response.ok) throw new Error(`ALEXANDRA_DISPATCH_HTTP_${response.status}`);
  return response.json();
}

function clean(value, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

function safeTokenPart(value, fallback = "session") {
  const normalized = clean(value, 300)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function opaquePart(value, length = 18) {
  return createHash("sha256").update(String(value ?? "")).digest("hex").slice(0, length);
}

function liveKitApiHost(url) {
  const value = clean(url, 1000);
  if (value.startsWith("wss://")) return `https://${value.slice(6)}`.replace(/\/+$/, "");
  if (value.startsWith("ws://")) return `http://${value.slice(5)}`.replace(/\/+$/, "");
  return value.replace(/\/+$/, "");
}

async function secret(name) {
  const result = await elevatedGetSecretValue(name);
  const value = typeof result === "string"
    ? result
    : result?.value ?? result?.secretValue ?? result?.secret?.value ?? "";
  const normalized = clean(value, 10000);
  if (!normalized) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return normalized;
}

async function liveKitCredentials() {
  const [apiKey, apiSecret, livekitUrl] = await Promise.all([
    secret("LIVEKIT_API_KEY"),
    secret("LIVEKIT_API_SECRET"),
    secret("LIVEKIT_URL")
  ]);
  return { apiKey, apiSecret, livekitUrl, apiHost: liveKitApiHost(livekitUrl) };
}

export function supportRoomName(caseId) {
  const raw = clean(caseId, 160);
  if (!raw) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  return `skandi-support-${opaquePart(`support-room:${raw}`, 32)}`;
}

export function supportParticipantIdentity({ role, subjectId, caseId }) {
  const normalizedRole = role === "agent" ? "agent" : "customer";
  const seed = `${normalizedRole}:${clean(subjectId, 300)}:${clean(caseId, 160)}`;
  return `support-${normalizedRole}-${opaquePart(seed, 24)}`;
}

export async function issueLiveKitRoomTokenCore({
  roomName,
  identity,
  participantName = "SKANDI Support",
  role = "customer",
  caseId = "",
  canPublish = true,
  canSubscribe = true,
  ttl = DEFAULT_TTL,
  textTopic = SUPPORT_TEXT_TOPIC,
  participantMetadata = {}
} = {}) {
  const room = clean(roomName, 120);
  const participant = clean(identity, 120);
  if (!room || !participant) throw new Error("LIVEKIT_ROOM_IDENTITY_REQUIRED");

  const { apiKey, apiSecret, livekitUrl } = await liveKitCredentials();
  if (ttl !== DEFAULT_TTL) throw new Error("LIVEKIT_TOKEN_TTL_UNSUPPORTED");
  const token = signLiveKitAccessTokenCore({ apiKey, apiSecret,
    identity: participant,
    name: clean(participantName, 120) || "SKANDI Support",
    metadata: JSON.stringify({
      system: "skandi-support",
      role: role === "agent" ? "agent" : "customer",
      contextId: `ctx_${opaquePart(`support-context:${clean(caseId, 160)}`, 24)}`,
      realtimeProvider: "livekit",
      caseStore: "supabase",
      ...participantMetadata
    }),
    video: {
    roomJoin: true,
    room,
    canSubscribe: canSubscribe === true,
    canPublish: canPublish === true,
    canPublishData: canPublish === true
    }
  });

  return {
    url: livekitUrl,
    token,
    roomName: room,
    identity: participant,
    role: role === "agent" ? "agent" : "customer",
    caseId: clean(caseId, 160),
    textTopic: clean(textTopic, 120) || SUPPORT_TEXT_TOPIC,
    expiresIn: ttl
  };
}

export async function issueSupportLiveKitSessionCore({
  caseId,
  role,
  subjectId,
  participantName
} = {}) {
  const cleanCaseId = clean(caseId, 160);
  if (!cleanCaseId) throw new Error("SUPPORT_CASE_ID_REQUIRED");
  const normalizedRole = role === "agent" ? "agent" : "customer";
  return issueLiveKitRoomTokenCore({
    roomName: supportRoomName(cleanCaseId),
    identity: supportParticipantIdentity({ role: normalizedRole, subjectId, caseId: cleanCaseId }),
    participantName,
    role: normalizedRole,
    caseId: cleanCaseId,
    canPublish: true,
    canSubscribe: true,
    textTopic: SUPPORT_TEXT_TOPIC,
    participantMetadata: { supportMode: "human", supportCaseStore: "customer_support_cases" }
  });
}

export async function issueAlexandraLiveKitSessionCore({
  locale = "en-US",
  currency = "USD",
  pagePath = "/about/support",
  authenticated = false,
  channel = "web"
} = {}) {
  const { apiKey, apiSecret, livekitUrl, apiHost } = await liveKitCredentials();
  const sessionId = `alexandra_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const contextId = `ctx_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const roomName = `alexandra-${randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const identity = `web-${randomUUID().replaceAll("-", "").slice(0, 24)}`;

  const jobMetadata = {
    brand: "SKANDI TRAVELS",
    channel: clean(channel, 30) || "web",
    locale: clean(locale, 40) || "en-US",
    currency: clean(currency, 12).toUpperCase() || "USD",
    page_path: clean(pagePath, 300) || "/about/support",
    authenticated: authenticated === true,
    context_id: contextId,
    session_id: sessionId,
    agent_runtime: "livekit-agents",
    support_case_store: "supabase",
    support_case_table: "customer_support_cases",
    support_message_table: "customer_support_messages"
  };

  const dispatch = await dispatchAlexandra({ apiHost, apiKey, apiSecret, roomName, jobMetadata });
  if (!dispatch?.id) {
    const error = new Error("ALEXANDRA_DISPATCH_UNCONFIRMED");
    error.code = "ALEXANDRA_DISPATCH_UNCONFIRMED";
    throw error;
  }

  const token = signLiveKitAccessTokenCore({ apiKey, apiSecret,
    identity,
    name: "SKANDI Traveler",
    metadata: JSON.stringify({
      system: "skandi-alexandra",
      channel: jobMetadata.channel,
      locale: jobMetadata.locale,
      sessionId
    }),
    video: {
    roomJoin: true,
    room: roomName,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true
    }
  });

  return {
    url: livekitUrl,
    token,
    roomName,
    identity,
    sessionId,
    contextId,
    agentName: ALEXANDRA_AGENT_NAME,
    agentRuntime: "LiveKit Agents",
    provider: "LiveKit",
    caseStore: "Supabase",
    dispatchId: clean(dispatch.id, 200),
    textTopic: ALEXANDRA_TEXT_TOPIC,
    transcriptionTopic: "lk.transcription",
    metadata: jobMetadata,
    expiresIn: DEFAULT_TTL
  };
}
