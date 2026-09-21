// /src/backend/http-functions.js
// R-007.3 Alexandra -> SKANDI trusted HTTP tool gateway.
// IMPORTANT: If the Wix project already contains an unregistered http-functions.js, reconcile it before replacement.


import { ok, badRequest, forbidden, serverError } from "wix-http-functions";
import {
  verifyAlexandraGatewayTokenCore,
  getSupportWorkflowTrustedCore,
  createSupportCaseTrustedCore,
  updateSupportCaseTrustedCore,
  getHumanSupportAvailabilityCore,
  requestHumanHandoffTrustedCore
} from "backend/SKANDI_CORE/customerSupport";


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
