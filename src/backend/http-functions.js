// /src/backend/http-functions.js
// V12 canonical Wix HTTP-function entry point: Alexandra, Travel Info, WhatsApp and Duffel endpoints.
// Wix registers these endpoints from this exact filename.

import { ok, badRequest, forbidden, serverError } from "wix-http-functions";
import {
  verifyAlexandraGatewayTokenCore,
  getSupportWorkflowTrustedCore,
  createSupportCaseTrustedCore,
  updateSupportCaseTrustedCore,
  getHumanSupportAvailabilityCore,
  requestHumanHandoffTrustedCore
} from "backend/SKANDI_CORE/customerSupport";
import { verifyAndRecordDuffelAssistantWebhookCore } from "backend/SKANDI_CORE/duffelAssistant";
import { verifyWhatsAppWebhookChallengeCore, receiveWhatsAppWebhookCore } from "backend/SKANDI_CORE/whatsAppCustomerCare";
import { getPublicTravelInfoPayloadCore } from "backend/SKANDI_CORE/publicContent";
import { applyInventoryAuthorityToTravelInfoCore } from "backend/SKANDI_CORE/publicContentInventoryProjection";

function header(request, name) {
  const lowerName = String(name || "").toLowerCase();
  try {
    if (typeof request?.headers?.get === "function") return request.headers.get(name) || request.headers.get(lowerName) || "";
  } catch (_) {}
  const headers = request?.headers || {};
  return headers[name] || headers[lowerName] || headers[Object.keys(headers).find(key => String(key).toLowerCase() === lowerName)] || "";
}
function bearer(request) {
  const value = String(header(request, "authorization") || "").trim();
  return /^Bearer\s+/i.test(value) ? value.replace(/^Bearer\s+/i, "").trim() : "";
}
async function jsonBody(request) {
  try {
    if (typeof request?.body?.json === "function") return await request.body.json();
    if (typeof request?.body?.text === "function") return JSON.parse(await request.body.text());
    if (typeof request?.body === "string") return JSON.parse(request.body);
    if (request?.body && typeof request.body === "object") return request.body;
  } catch (_) {}
  return {};
}
function responseBody(value) {
  return {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    body: JSON.stringify(value)
  };
}
async function authorized(request) {
  const token = bearer(request);
  if (!token) return false;
  try { await verifyAlexandraGatewayTokenCore(token); return true; } catch (_) { return false; }
}
async function run(request, handler) {
  if (!await authorized(request)) return forbidden(responseBody({ ok: false, error: "UNAUTHORIZED" }));
  try {
    const body = await jsonBody(request);
    return ok(responseBody(await handler(body || {})));
  } catch (error) {
    const code = String(error?.code || error?.message || "SUPPORT_GATEWAY_ERROR").slice(0, 120);
    if (/REQUIRED|INVALID|EMPTY/i.test(code)) return badRequest(responseBody({ ok: false, error: code }));
    console.error("[R-007.3 Alexandra Support Gateway]", { code });
    return serverError(responseBody({ ok: false, error: code }));
  }
}
export function post_alexandraSupportWorkflow(request) {
  return run(request, body => getSupportWorkflowTrustedCore(body));
}
// LiveKit's existing search_travel_info HTTP tool uses this authenticated public-only endpoint.
// Read the exact same canonical Travel Info + Inventory projection as the Wix page.
// Only small, explicit public text fields leave this boundary; no raw Inventory rows.
function travelText(value, max = 1000) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function travelFold(value) {
  return travelText(value, 6000).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function travelLanguage(locale) {
  const value = String(locale || "en").toLowerCase().split(/[-_]/)[0];
  return ({ sv:"SV", no:"NO", nb:"NO", nn:"NO", da:"DA" })[value] || "EN";
}
function travelBaggage(row) {
  const baggage = row?.baggage;
  if (!baggage || typeof baggage !== "object") return travelText(row?.baggageAllowance, 1400);
  if (baggage.mode === "narrative") return travelText(baggage.text, 1400);
  if (baggage.mode !== "structured" || !Array.isArray(baggage.cabins)) return "";
  const fareDetails = [];
  for (const cabin of baggage.cabins.slice(0, 8)) {
    for (const fare of (Array.isArray(cabin?.fares) ? cabin.fares : []).slice(0, 8)) {
      fareDetails.push([cabin.cabinType, fare.name, fare.description, fare.underSeatBag, fare.overheadCarryOn, fare.checkedBag].filter(Boolean).join(": "));
    }
  }
  return travelText(fareDetails.join("; "), 1400);
}
function travelCandidates(payload) {
  const sections = [
    ["airline", payload.airlines],
    ["airport", payload.airports],
    ["hotel", payload.hotels],
    ["transfer", payload.transfers],
    ["tour", payload.tours],
    ["activity", payload.activities],
    ["ticket", payload.tickets],
    ["article", payload.articles],
    ["travel-requirement", payload.travelRequirements],
    ["help-topic", payload.helpCenter?.topics]
  ];
  const matches = [];
  for (const [category, items] of sections) {
    if (!Array.isArray(items)) continue;
    for (const row of items) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const title = travelText(row.title || row.name, 220);
      if (!title) continue;
      const code = travelText(row.iataCode || row.iata || row.code, 12);
      const baggage = category === "airline" ? travelBaggage(row) : "";
      const summary = travelText(row.summary || row.excerpt || row.subtitle || row.body, 1600);
      const content = [title, code, row.city, row.country, row.category, row.slug,
        summary, travelText(row.body, 1400), travelText(row.tags, 300),
        baggage, baggage ? "baggage allowance luggage" : "", row.boarding, row.checkInDeadline].filter(Boolean).join(" ");
      const link = typeof row.path === "string" && /^\/travel-info(?:\/|$|\?)/.test(row.path)
        ? travelText(row.path, 400) : "/travel-info";
      matches.push({ category, title, code, summary, baggage, content, path:link });
    }
  }
  return matches;
}
async function alexandraTravelInfoQuery(body = {}) {
  const query = travelText(body.query, 240);
  if (!query) throw new Error("TRAVEL_INFO_QUERY_REQUIRED");
  const language = travelLanguage(body.locale);
  let payload;
  try {
    payload = await applyInventoryAuthorityToTravelInfoCore(
      await getPublicTravelInfoPayloadCore({ language })
    );
  } catch (error) {
    console.error("[Alexandra Travel Info] Public source read failed", {
      code:String(error?.code || "PUBLIC_READ_FAILED").slice(0, 80)
    });
    throw new Error("TRAVEL_INFO_SOURCE_UNAVAILABLE");
  }
  if (!payload || payload.ok !== true) throw new Error("TRAVEL_INFO_SOURCE_UNAVAILABLE");

  const stopwords = new Set(["the", "and", "for", "what", "how", "does", "can", "you", "please", "about", "with", "from", "have", "are", "where", "this", "that", "is", "on", "in", "to", "at", "do", "of", "a", "i", "my", "me"]);
  const terms = [...new Set(travelFold(query).split(/[^a-z0-9]+/).filter(term => term.length > 1 && !stopwords.has(term)))].slice(0, 16);
  if (!terms.length) throw new Error("TRAVEL_INFO_QUERY_INVALID");
  const matches = [];
  const baggageQuery = /\b(bag|bags|baggage|luggage|carry.on|checked bag)\b/i.test(query);
  for (const item of travelCandidates(payload)) {
    const text = travelFold(item.content);
    const heading = travelFold(`${item.title} ${item.code}`);
    const hits = terms.filter(term => text.includes(term));
    if (!hits.length) continue;
    const score = hits.length * 3 + terms.filter(term => heading.includes(term)).length * 7 +
      (heading.includes(travelFold(query)) ? 12 : 0);
    const excerpt = baggageQuery && item.category === "airline" && item.baggage
      ? item.baggage : item.summary;
    matches.push({ score, category:item.category, title:item.title, code:item.code || undefined,
      summary:travelText(excerpt, 1100), path:item.path });
  }
  matches.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const results = matches.slice(0, 8).map(({ score, ...item }) => item);
  return {
    ok:true, source:"SKANDI_PUBLIC_TRAVEL_INFO", language, query,
    totalMatches:matches.length, results,
    generatedAt:payload.generatedAt || null,
    ...(results.length ? {} : { message:"No matching published SKANDI Travel Info content was found." })
  };
}
export function post_alexandraTravelInfo(request) {
  return run(request, alexandraTravelInfoQuery);
}

export function post_alexandraCreateSupportCase(request) {
  return run(request, body => createSupportCaseTrustedCore(body));
}
export function post_alexandraUpdateSupportCase(request) {
  return run(request, body => updateSupportCaseTrustedCore(body));
}
export function post_alexandraHumanSupportAvailability(request) {
  return run(request, () => getHumanSupportAvailabilityCore());
}
export function post_alexandraRequestHumanHandoff(request) {
  return run(request, body => requestHumanHandoffTrustedCore(body));
}

// Configure Duffel's existing test/live webhook subscriptions to include
// assistant.conversation.updated; do NOT register a second webhook for the same mode.
export async function post_duffelAssistantWebhook(request) {
  try {
    // Signature calculation requires the original, unparsed raw request body.
    const raw = typeof request?.body?.text === "function" ? await request.body.text() : "";
    const signature = header(request, "X-Duffel-Signature");
    const result = await verifyAndRecordDuffelAssistantWebhookCore(raw, signature);
    return ok(responseBody(result));
  } catch (cause) {
    const code = String(cause?.code || "ASSISTANT_WEBHOOK_FAILED").slice(0, 100);
    if (code === "ASSISTANT_WEBHOOK_UNAUTHORIZED") return forbidden(responseBody({ ok: false, error: code }));
    if (/INVALID|BAD_JSON|BAD_MODE/.test(code)) return badRequest(responseBody({ ok: false, error: code }));
    console.error("[Duffel Assistant webhook]", { code });
    return serverError(responseBody({ ok: false, error: code }));
  }
}

// Meta WhatsApp Cloud API: webhook GET challenge and HMAC-authenticated POST events.
// Register https://www.skanditravels.com/_functions/skandiWhatsAppWebhook in Meta.
export async function get_skandiWhatsAppWebhook(request) {
  const q = request?.query || {};
  try {
    const challenge = await verifyWhatsAppWebhookChallengeCore({
      mode: String(q["hub.mode"] || ""),
      token: String(q["hub.verify_token"] || ""),
      challenge: String(q["hub.challenge"] || "")
    });
    return ok({ headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, body: challenge });
  } catch (error) {
    return forbidden(responseBody({ ok: false, error: "WHATSAPP_WEBHOOK_VERIFICATION_FAILED" }));
  }
}
export async function post_skandiWhatsAppWebhook(request) {
  try {
    // Verification needs the exact bytes Meta signed: do not parse before HMAC verification.
    const raw = typeof request?.body?.text === "function" ? await request.body.text() : "";
    const signature = header(request, "X-Hub-Signature-256");
    const result = await receiveWhatsAppWebhookCore(raw, signature);
    return ok(responseBody(result));
  } catch (error) {
    const code = String(error?.code || "WHATSAPP_WEBHOOK_FAILED").slice(0, 140);
    if (code === "WHATSAPP_WEBHOOK_UNAUTHORIZED" || code === "WHATSAPP_WABA_ID_MISMATCH" || code === "WHATSAPP_PHONE_ID_MISMATCH") {
      return forbidden(responseBody({ ok: false, error: "WHATSAPP_WEBHOOK_UNAUTHORIZED" }));
    }
    if (/WHATSAPP_WEBHOOK_(?:BAD_JSON|BODY_INVALID|OBJECT_INVALID)|WHATSAPP_INBOUND_(?:ID_INVALID|TIMESTAMP_INVALID)/.test(code)) {
      return badRequest(responseBody({ ok: false, error: code }));
    }
    console.error("[WhatsApp Customer Care] Signed webhook processing failed", { code });
    // A transient failure must not be falsely acknowledged; Meta may retry.
    return serverError(responseBody({ ok: false, error: "WHATSAPP_WEBHOOK_RETRY_REQUIRED" }));
  }
}
