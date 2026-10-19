// /src/backend/SKANDI_CORE/duffelAssistant.js
// V12 customer-scoped Duffel Assistant and Customer Service activity projection.
// CustomerSupport retains case creation/ownership; its established Supabase tables
// receive narrowly typed provider activity, not fabricated chat transcripts.

import { createHmac, createHash, timingSafeEqual, randomUUID } from "crypto";
import { elevate } from "wix-auth";
import { secrets } from "wix-secrets-backend.v2";
import { getCustomerProfileBootstrapCore, getCustomerBookingDetailCore, updateCustomerProfileCore } from "backend/SKANDI_CORE/customerProfile";
import { createDuffelComponentClientKeyCore } from "backend/SKANDI_CORE/duffelGround";
import { duffelRequest } from "backend/SKANDI_CORE/duffelClient";
import { createCustomerSupportCaseCore, listCustomerSupportCasesCore, getCustomerSupportCaseCore, getAgentSupportCaseCore, updateAgentSupportCaseCore } from "backend/SKANDI_CORE/customerSupport";
import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const USER_ID = /^icu_[A-Za-z0-9_]+$/;
const ORDER_ID = /^ord_[A-Za-z0-9_]+$/;
const STAY_ID = /^bok_[A-Za-z0-9_]+$/;
const BOOKING_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID = /^wev_[A-Za-z0-9_]+$/;
const ISSUE_TYPES = new Set(["cancellation", "change", "other"]);
const RESOURCE_WEBHOOK_TYPES = new Set(["air.order.changed", "order_cancellation.confirmed", "stays.booking.cancelled"]);
const HANDOFF_HEADING = /^DUFFEL HANDOFF\s*$/i;
const MAX_HANDOFF_SUMMARY = 1800;
const BROWSER_EVENTS = Object.freeze({
  UI_HANDOFF_REQUESTED: "Assistant was launched in the customer interface; supplier session completion is not independently verified.",
  NEW_MESSAGE_NOTICE: "The browser reported a new Duffel Assistant message notification. Message content remains in Duffel.",
  MINIMISED: "The traveler minimised the Duffel Assistant interface.",
  LAUNCH_FAILED: "The browser reported a failure to open the Duffel Assistant interface.",
  STAFF_CONTEXT_SUBMITTED: "The SKANDI agent's handoff context was passed to the Duffel Assistant widget. This does not independently confirm a Duffel agent read it."
});
const secretValue = elevate(secrets.getSecretValue);

function clean(value, max = 220) { return String(value ?? "").trim().slice(0, max); }
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function error(code, message, status = 400) {
  const e = new Error(message); e.name = "CustomerDuffelAssistantError";
  e.code = code; e.status = status; e.publicMessage = message; return e;
}
function requireContext(context) {
  if (!context?.memberId) throw error("LOGIN_REQUIRED", "Sign in to SKANDI to manage your Duffel bookings.", 401);
  return context;
}
function userIds(resource) {
  return [...new Set(arr(resource?.users).filter(value => USER_ID.test(String(value))))];
}
function hasPassengerAccess(resource, userId, kind) {
  return arr(kind === "air" ? resource?.passengers : resource?.guests).some(row => row?.user_id === userId);
}
async function ensureResourceAccess(kind, resourceId, userId) {
  const path = `${kind === "air" ? "/air/orders" : "/stays/bookings"}/${encodeURIComponent(resourceId)}`;
  const before = await duffelRequest(path, { retrySafe: true });
  const resource = before.data;
  if (resource?.id !== resourceId) throw error("PROVIDER_BOOKING_NOT_FOUND", "Duffel did not return the expected booking.", 502);
  const current = userIds(resource);
  if (current.includes(userId) || hasPassengerAccess(resource, userId, kind)) return;
  if (current.length >= 100) throw error("PROVIDER_BOOKING_USERS_LIMIT", "This booking has reached its access-management limit. Contact SKANDI Support.", 409);
  // The PATCH replaces the list. Do not remove other explicitly authorised users.
  const linked = await duffelRequest(path, { method: "PATCH", body: { data: { users: [...current, userId] } }, retrySafe: false });
  if (linked.data?.id !== resourceId || !(userIds(linked.data).includes(userId) || hasPassengerAccess(linked.data, userId, kind))) {
    throw error("PROVIDER_BOOKING_LINK_UNCONFIRMED", "Duffel has not confirmed access to this booking. Contact SKANDI Support.", 502);
  }
}
async function resolvedCustomerId(context) {
  const state = await getCustomerProfileBootstrapCore(context, {});
  let profile = state?.profile;
  if (!profile) throw error("CUSTOMER_PROFILE_UNAVAILABLE", "Your SKANDI profile is unavailable.", 503);
  let id = clean(profile.providerCustomerUserId);
  if (!id) {
    const updated = await updateCustomerProfileCore(context, {});
    if (updated?.providerSync?.ok !== true) {
      throw error("DUFFEL_IDENTITY_NOT_SYNCED", clean(updated?.providerSync?.error?.message, 250) || "Complete and save your first name, last name and email in My Profile before opening the Assistant.", 409);
    }
    profile = updated.profile;
    id = clean(profile?.providerCustomerUserId);
  }
  if (!USER_ID.test(id)) throw error("DUFFEL_IDENTITY_INVALID", "Your travel-provider identity is unavailable. Contact SKANDI Support.", 409);
  return id;
}
function subjectFor(bookingReference) {
  return `Duffel Assistant · ${clean(bookingReference, 80) || "Account support"}`;
}
function safeCaseReference(value) { return clean(value, 120); }
async function supportCaseRow(context, caseId) {
  requireContext(context);
  if (!/^case_[A-Za-z0-9_]+$/.test(clean(caseId, 160))) throw error("SUPPORT_CASE_INVALID", "Choose an Assistant support activity.");
  // Preserve canonical customer-case ownership guard before any provider log mutation.
  await getCustomerSupportCaseCore({ caseId });
  const rows = await restRequest({ table: "customer_support_cases", query: {
    select: "*", case_id: `eq.${caseId}`, member_id: `eq.${clean(context.memberId, 240)}`,
    limit: "1"
  } });
  const row = arr(rows)[0];
  if (!row) throw error("ASSISTANT_CASE_NOT_FOUND", "The Assistant activity is not linked to this account.", 404);
  return row;
}
async function appendActivity(row, eventType, message, { duffelEventId = "", resourceId = "", browser = false } = {}) {
  const caseId = clean(row?.case_id, 160);
  if (!caseId) throw error("SUPPORT_CASE_NOT_FOUND", "The customer-support case is unavailable.", 503);
  if (duffelEventId) {
    const existing = await restRequest({ table: "customer_support_messages", query: {
      select: "id", case_id: `eq.${caseId}`, "payload->>duffelEventId": `eq.${duffelEventId}`, limit: "1"
    } });
    if (arr(existing).length) return { recorded: false, duplicate: true };
  }
  const sent = await restRequest({ table: "customer_support_messages", method: "POST", body: {
    message_id: `msg_${randomUUID().replaceAll("-", "")}`,
    case_id: caseId,
    member_id: clean(row.member_id, 240) || null,
    wix_member_id: clean(row.wix_member_id || row.member_id, 240) || null,
    sender_type: "system",
    sender_name: "Duffel Assistant",
    message: clean(message, 4000),
    channel: "internal",
    payload: {
      private: true, kind: "internal", source: "duffel-assistant", eventType,
      duffelEventId: duffelEventId || null, resourceId: clean(resourceId, 220) || null,
      evidence: browser ? "client-reported" : duffelEventId ? "signed-duffel-webhook" : "skandi-server"
    }
  } });
  if (!arr(sent).length || !sent[0]?.id) throw error("ASSISTANT_ACTIVITY_NOT_SAVED", "The Assistant activity could not be recorded in Customer Service.", 503);
  await restRequest({ table: "customer_support_cases", method: "PATCH", query: { id: `eq.${row.id}` }, body: { updated_at: new Date().toISOString() } });
  return { recorded: true, duplicate: false };
}
// Existing Customer Service Desk agents can prepare a verified handoff using its
// established INTERNAL_NOTE action. No new or parallel staff case ownership API.
// Format (line breaks are mandatory):
// DUFFEL HANDOFF
// Issue: change | cancellation | other
// Summary: <specific supplier-facing description>
// The note is read only from canonical private agent messages, never browser input.
function parseStaffHandoff(value) {
  const lines = clean(value, 4000).replace(/\r/g, "").split("\n");
  if (!HANDOFF_HEADING.test(clean(lines.shift(), 60))) return null;
  const issueLine = clean(lines.shift(), 80);
  const issueMatch = /^Issue:\s*(change|cancellation|other)\s*$/i.exec(issueLine);
  if (!issueMatch) return null;
  const summary = clean(lines.join("\n").replace(/^Summary:\s*/i, ""), MAX_HANDOFF_SUMMARY);
  if (summary.length < 12) return null;
  return { issueType: issueMatch[1].toLowerCase(), summary };
}
async function latestStaffHandoff(row) {
  if (!row?.case_id) return null;
  const messages = await restRequest({ table: "customer_support_messages", query: {
    select: "message,message_id,created_at,payload", case_id: `eq.${row.case_id}`,
    sender_type: "eq.agent", channel: "eq.internal", order: "created_at.desc", limit: "40"
  } });
  for (const msg of arr(messages)) {
    const data = obj(msg.payload);
    if (data.private !== true || data.source !== "agent-internal-note") continue;
    const note = parseStaffHandoff(msg.message);
    if (!note) continue;
    return { ...note, messageId: clean(msg.message_id, 160), preparedAt: msg.created_at || null };
  }
  return null;
}
function verifiedProviderView(kind, resource) {
  // A verified provider read, not an assertion that SKANDI has refunded or reissued anything.
  if (!resource || typeof resource !== "object") throw error("DUFFEL_RESOURCE_EMPTY", "Duffel returned no verified booking state.", 502);
  if (kind === "air") {
    const slices = arr(resource.slices).slice(0, 12).map(slice => ({
      origin: clean(slice.origin?.iata_code || slice.origin?.iataCode, 8),
      destination: clean(slice.destination?.iata_code || slice.destination?.iataCode, 8),
      segments: arr(slice.segments).slice(0, 16).map(segment => ({
        id: clean(segment.id, 120), departure: clean(segment.departing_at || segment.departingAt, 40),
        arrival: clean(segment.arriving_at || segment.arrivingAt, 40)
      }))
    }));
    return { kind, resourceId: clean(resource.id), status: clean(resource.status, 60),
      cancelledAt: clean(resource.cancelled_at || resource.cancelledAt, 50) || null,
      reference: clean(resource.booking_reference || resource.bookingReference, 90) || null,
      slices, changeCount: arr(resource.changes).length, serviceCount: arr(resource.services).length };
  }
  return { kind, resourceId: clean(resource.id), status: clean(resource.status, 60),
    reference: clean(resource.reference, 90) || null,
    checkInDate: clean(resource.check_in_date || resource.checkInDate, 30) || null,
    checkOutDate: clean(resource.check_out_date || resource.checkOutDate, 30) || null };
}
function stateDigest(snapshot) { return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex"); }
async function ownedAlteaSnapshot(row, resourceId) {
  const meta = obj(obj(row.payload).duffelAssistant);
  if (!BOOKING_ID.test(clean(meta.bookingId, 90))) return null;
  const rows = await restRequest({ table: "altea_bookings", query: {
    select: "id,status,payment_status,fulfillment_status,ticketing_status,supplier_order_id,customer_member_id,booking_reference",
    id: `eq.${meta.bookingId}`, customer_member_id: `eq.${clean(row.member_id,240)}`, limit: 1
  } });
  const booked = arr(rows)[0];
  if (!booked) return null;
  // Standalone air resource uses top-level supplier_order_id. For hotel components,
  // compare against the authoritative component's supplier_reference.
  if (resourceId.startsWith("ord_")) {
    if (clean(booked.supplier_order_id,220) !== resourceId) return null;
  } else {
    const components = await restRequest({ table: "altea_booking_components", query: {
      select: "id,supplier_reference,status", booking_id: `eq.${meta.bookingId}`,
      supplier_reference: `eq.${resourceId}`, supplier: "eq.DUFFEL", limit: 1
    } });
    if (!arr(components).length) return null;
    booked.componentStatus = components[0].status;
  }
  return { id: booked.id, bookingReference: booked.booking_reference,
    status: booked.status, componentStatus: booked.componentStatus || null,
    paymentStatus: booked.payment_status, fulfillmentStatus: booked.fulfillment_status,
    ticketingStatus: booked.ticketing_status };
}
async function reconcileVerifiedResource(row, resourceId, eventType, eventId = "") {
  if (!ORDER_ID.test(resourceId) && !STAY_ID.test(resourceId)) return { checked: false, reason: "RESOURCE_NOT_IDENTIFIED" };
  const kind = ORDER_ID.test(resourceId) ? "air" : "stay";
  const expectedMeta = obj(obj(row.payload).duffelAssistant);
  if (clean(expectedMeta.customerUserId) === "" ||
    ![expectedMeta.resourceId, ...arr(expectedMeta.resourceIds)].includes(resourceId)) {
    return { checked: false, reason: "RESOURCE_NOT_LINKED_TO_CASE" };
  }
  const provider = await duffelRequest(`${kind === "air" ? "/air/orders" : "/stays/bookings"}/${encodeURIComponent(resourceId)}`, { retrySafe: true });
  if (provider?.data?.id !== resourceId) throw error("PROVIDER_BOOKING_MISMATCH", "Duffel did not return the expected booking.", 502);
  // Reverify supplier user linkage when resolving an event, rather than only trusting
  // the case's cached resource/user association.
  if (!userIds(provider.data).includes(expectedMeta.customerUserId) &&
      !hasPassengerAccess(provider.data, expectedMeta.customerUserId, kind)) {
    throw error("PROVIDER_OWNER_MISMATCH", "Supplier user access was not confirmed for reconciliation.", 403);
  }
  const view = verifiedProviderView(kind, provider.data);
  const digest = stateDigest(view);
  const before = obj(expectedMeta.providerVerification);
  const changed = !!before.digest && before.digest !== digest;
  const altea = await ownedAlteaSnapshot(row, resourceId);
  const cancelled = Boolean(view.cancelledAt) || view.status.toLowerCase().includes("cancel");
  const alteaStatus = clean(kind === "air" ? altea?.status : altea?.componentStatus, 80).toLowerCase();
  const discrepancy = Boolean(altea && cancelled && !alteaStatus.includes("cancel"));
  const reviewRequired = discrepancy || changed || RESOURCE_WEBHOOK_TYPES.has(eventType);
  const verifiedAt = new Date().toISOString();
  // Atomic server-side JSON-path patch avoids overwriting unrelated case payload.
  // This is a support-side reconciliation record; reservations/finance continue
  // to own authoritative ALTEA, document, accounting and refund mutations.
  const next = { ...expectedMeta, providerVerification: {
    digest, verifiedAt, eventType: clean(eventType,100), eventId: clean(eventId,220) || null,
    snapshot: view, altea, changed, discrepancy, needsReservationsReview: reviewRequired
  } };
  const saved = await restRequest({ table: "customer_support_cases", method: "PATCH", query: {
    id: `eq.${row.id}`, "payload->duffelAssistant->>customerUserId": `eq.${expectedMeta.customerUserId}`,
    updated_at: `eq.${row.updated_at}`
  }, body: { payload: { ...obj(row.payload), duffelAssistant: next },
    ...(reviewRequired ? { status: "open" } : {}), updated_at: verifiedAt } });
  if (!arr(saved).length) throw error("RECONCILIATION_NOT_RECORDED", "Could not save verified supplier information to Customer Service.", 503);
  if (reviewRequired || eventType !== "assistant.conversation.updated") {
    const detail = `Supplier ${kind} booking ${resourceId} verified from Duffel API: status ${view.status || "unspecified"}. ` +
      `SKANDI booking ${altea ? `${altea.bookingReference || altea.id} status ${alteaStatus || "unspecified"}` : "not confirmed in ALTEA"}. ` +
      (discrepancy ? "Confirmed supplier cancellation differs from SKANDI state; Reservations must reconcile booking, documents, and refund before closing. " :
       changed ? "Supplier details changed; Reservations should review the itinerary and financial effect. " : "No booking outcome inferred solely from notification. ") +
      `Provider observation ${verifiedAt}.`;
    await appendActivity(saved[0], "PROVIDER_STATE_VERIFIED", `[Duffel Assistant activity] ${detail}`,
      { resourceId, duffelEventId: eventId ? `${eventId}_verify` : "" });
  }
  return { checked: true, changed, discrepancy, state: view.status, alteaLinked: Boolean(altea),
    reviewRequired, verifiedAt };
}
async function ensureAssistantCase(context, { bookingReference = "", bookingId = "", resourceId = "", resourceType = "all", customerUserId, issueType = "", supportCaseId = "" }) {
  const subject = subjectFor(bookingReference);
  const cases = await listCustomerSupportCasesCore();
  let found = null;
  if (supportCaseId) {
    const existing = await supportCaseRow(context, supportCaseId);
    const bookedRef = clean(obj(existing.payload).bookingRef, 80);
    if (bookedRef && bookingReference && bookedRef !== bookingReference.toUpperCase()) {
      throw error("SUPPORT_CASE_BOOKING_MISMATCH", "This Customer Service case belongs to another booking.", 403);
    }
    found = { caseId: clean(existing.case_id,160), caseRef: clean(obj(existing.payload).caseRef,120),
      subject: clean(existing.subject,240), status: clean(existing.status,80) };
  } else {
    found = arr(cases?.cases).find(item => item.subject === subject && !["closed", "solved"].includes(clean(item.status).toLowerCase()));
  }
  if (!found) {
    const created = await createCustomerSupportCaseCore({ input: {
      category: "booking", subCategory: "manage-booking", subject,
      message: "Traveler initiated a Duffel Assistant travel support session. Supplier chat content is managed by Duffel and is not mirrored automatically to SKANDI.",
      source: "duffel-assistant", sourceChannel: "DUFFEL_ASSISTANT", sourcePage: "/my-profile/travel-assistance",
      bookingRef: clean(bookingReference, 80), hasBooking: bookingReference ? "yes" : "no",
      requesterType: "CUSTOMER", issueType: clean(issueType, 20),
      firstName: clean(context.firstName, 100), lastName: clean(context.lastName, 100),
      fullName: clean(context.displayName || [context.firstName, context.lastName].filter(Boolean).join(" "), 200),
      email: clean(context.email, 254)
    } });
    if (!created?.caseId) throw error("SUPPORT_CASE_CREATE_FAILED", "Customer Service did not confirm the Assistant case.", 503);
    found = { caseId: created.caseId, caseRef: created.caseRef || "", subject, status: "open" };
  }
  const row = await supportCaseRow(context, found.caseId);
  const earlier = obj(obj(row.payload).duffelAssistant);
  const resourceIds = [...new Set([...arr(earlier.resourceIds), earlier.resourceId, resourceId]
    .map(x => clean(x, 220)).filter(x => ORDER_ID.test(x) || STAY_ID.test(x)))].slice(-20);
  const nextMeta = {
    ...earlier,
    customerUserId, resourceId: clean(resourceId, 220) || null, resourceIds,
    resourceType, bookingId: clean(bookingId, 80) || null,
    bookingReference: clean(bookingReference, 80) || null,
    latestIssueType: clean(issueType, 20) || null
  };
  const newPayload = { ...obj(row.payload), duffelAssistant: nextMeta,
    sourceChannel: obj(row.payload).sourceChannel || "DUFFEL_ASSISTANT" };
  const saved = await restRequest({ table: "customer_support_cases", method: "PATCH", query: {
    id: `eq.${row.id}`, member_id: `eq.${clean(context.memberId, 240)}`,
    updated_at: `eq.${row.updated_at}`
  }, body: { payload: newPayload, updated_at: new Date().toISOString() } });
  if (!arr(saved).length) throw error("SUPPORT_CASE_LINK_FAILED", "Customer Service did not confirm the Assistant booking link.", 503);
  return { row: saved[0], caseId: found.caseId, caseRef: clean(found.caseRef || obj(newPayload).caseRef, 120) };
}

export async function createCustomerDuffelAssistantSessionCore(context, input = {}) {
  requireContext(context);
  const customerUserId = await resolvedCustomerId(context);
  const bookingId = clean(input.bookingId, 80);
  const kind = clean(input.resourceType, 10).toLowerCase();
  const issueType = clean(input.issueType, 20).toLowerCase();
  const supportCaseId = clean(input.supportCaseId, 160);
  if (issueType && !ISSUE_TYPES.has(issueType)) throw error("ISSUE_TYPE_INVALID", "Choose cancellation, change or other.");
  const scope = { userId: customerUserId };
  let resourceType = "all", resourceId = "", bookingReference = "";
  if (bookingId) {
    if (!BOOKING_ID.test(bookingId)) throw error("SKANDI_BOOKING_ID_INVALID", "Choose a valid booking from your SKANDI account.");
    if (kind && !["air", "stay"].includes(kind)) throw error("RESOURCE_TYPE_INVALID", "Choose a flight or hotel booking.");
    const detail = await getCustomerBookingDetailCore(context, { bookingId });
    if (!detail?.ok) throw error("BOOKING_NOT_FOUND", "This booking is not linked to your SKANDI account.", 404);
    const air = clean(detail.providerIds?.orderId), stay = clean(detail.providerIds?.stayBookingId);
    bookingReference = safeCaseReference(detail.booking?.bookingReference || detail.booking?.pnrLocator || bookingId);
    if (!kind && ORDER_ID.test(air) && STAY_ID.test(stay)) throw error("RESOURCE_TYPE_REQUIRED", "Choose flight support or hotel support for this booking.");
    if ((kind === "air" || (!kind && ORDER_ID.test(air))) && ORDER_ID.test(air)) {
      scope.orderId = air; resourceType = "air"; resourceId = air;
    } else if ((kind === "stay" || (!kind && STAY_ID.test(stay))) && STAY_ID.test(stay)) {
      scope.bookingId = stay; resourceType = "stay"; resourceId = stay;
    } else throw error("DUFFEL_RESOURCE_NOT_LINKED", "This booking is not linked to a supported Duffel flight or hotel booking.", 409);
    await ensureResourceAccess(resourceType, resourceId, customerUserId);
  }
  // Short-lived client keys are issued only after Wix ownership is established.
  const key = await createDuffelComponentClientKeyCore(scope);
  const clientKey = clean(key?.componentClientKey || key?.component_client_key, 8000);
  if (!clientKey) throw error("DUFFEL_CLIENT_KEY_UNAVAILABLE", "Duffel could not prepare the secure Assistant session.", 503);
  const linked = await ensureAssistantCase(context, { customerUserId, resourceId, resourceType, bookingId, bookingReference, issueType, supportCaseId });
  const candidateHandoff = await latestStaffHandoff(linked.row);
  // Never mix a stale staff change summary with a customer's newly selected
  // cancellation issue (or vice versa).
  const handoff = candidateHandoff && (!issueType || issueType === candidateHandoff.issueType) ? candidateHandoff : null;
  const finalIssueType = issueType || handoff?.issueType || null;
  await appendActivity(linked.row, "SESSION_PREPARED", `Assistant session prepared for ${resourceType === "all" ? "the customer's linked Duffel trips" : `${resourceType} booking ${bookingReference}`}. Support reason: ${finalIssueType || "not selected"}. ${handoff ? "A verified SKANDI agent handoff context is available. " : ""}No supplier servicing outcome is implied.`, { resourceId });
  return { ok: true, clientKey, resourceType, issueType: finalIssueType, bookingId: bookingId || null,
    handoffSummary: handoff?.summary || null, handoffPreparedAt: handoff?.preparedAt || null,
    supportCaseId: linked.caseId, supportCaseRef: linked.caseRef, supportSubject: linked.row.subject || subjectFor(bookingReference) };
}

export async function recordCustomerDuffelAssistantEventCore(context, input = {}) {
  const eventType = clean(input.eventType, 60).toUpperCase();
  if (!Object.prototype.hasOwnProperty.call(BROWSER_EVENTS, eventType)) throw error("ASSISTANT_EVENT_INVALID", "That Assistant activity cannot be recorded.");
  const row = await supportCaseRow(context, clean(input.supportCaseId, 160));
  const meta = obj(obj(row.payload).duffelAssistant);
  const resourceId = clean(meta.resourceId, 220);
  const message = `[Duffel Assistant activity] ${BROWSER_EVENTS[eventType]}`;
  await appendActivity(row, eventType, message, { resourceId, browser: true });
  return { ok: true, supportCaseId: row.case_id, eventType };
}
export async function getCustomerDuffelAssistantActivityCore(context, input = {}) {
  const row = await supportCaseRow(context, clean(input.supportCaseId, 160));
  const detail = await getCustomerSupportCaseCore({ caseId: row.case_id });
  return {
    ok: true, supportCaseId: row.case_id, supportCaseRef: clean(obj(row.payload).caseRef, 120),
    subject: clean(row.subject, 240),
    events: arr(detail?.messages).filter(x => clean(x.channel, 80) === "internal" && /^\[Duffel Assistant activity\]|^Assistant session prepared|^Duffel Assistant:/.test(clean(x.content, 30000)))
      .map(x => ({ id: clean(x.id, 160), text: clean(x.content, 600), at: x.createdAt || x.at || null })).slice(-100),
    // Unify customer-visible SKANDI case conversation with the Duffel signal log.
    // Private staff notes and Duffel's private conversation are never exposed.
    skandiMessages: arr(detail?.messages).filter(x => x.private !== true && clean(x.channel,80) !== "internal")
      .map(x => ({ id: clean(x.id, 160), text: clean(x.content, 1600),
        at: x.createdAt || x.at || null, sender: clean(x.senderName, 120) })).slice(-100)
  };
}

// Optional customer-triggered supplier-state check. Read-only against live booking and
// ALTEA; durable verified snapshots and discrepancy flags are saved in Support only.
export async function verifyCustomerDuffelAssistantBookingCore(context, input = {}) {
  const row = await supportCaseRow(context, clean(input.supportCaseId, 160));
  const meta = obj(obj(row.payload).duffelAssistant);
  const resourceId = clean(meta.resourceId,220);
  if (!resourceId) throw error("BOOKING_SCOPE_REQUIRED", "Select a flight or hotel booking before verifying its supplier status.");
  return { ok: true, ...(await reconcileVerifiedResource(row, resourceId, "customer-initiated-check")) };
}

async function webhookSecret(liveMode) {
  const name = liveMode ? "DUFFEL_ASSISTANT_WEBHOOK_SECRET_LIVE" : "DUFFEL_ASSISTANT_WEBHOOK_SECRET_TEST";
  const value = await secretValue(name);
  const secret = typeof value === "string" ? value : value?.value ?? value?.secretValue ?? value?.secret?.value ?? "";
  if (!secret) throw error("ASSISTANT_WEBHOOK_SECRET_MISSING", "Duffel webhook signing is not configured.", 503);
  return String(secret);
}
export async function verifyAndRecordDuffelAssistantWebhookCore(rawBody, signatureHeader) {
  if (typeof rawBody !== "string" || rawBody.length > 65536) throw error("WEBHOOK_BODY_INVALID", "Invalid webhook payload.");
  const sig = clean(signatureHeader, 512);
  const timestamp = /(?:^|,)\s*t=(\d{10,15})\s*(?:,|$)/.exec(sig)?.[1];
  const signedHex = /(?:^|,)\s*v1=([0-9a-fA-F]{64})\s*(?:,|$)/.exec(sig)?.[1];
  if (!timestamp || !signedHex || Math.abs(Date.now() - Number(timestamp) * 1000) > 600000) {
    throw error("ASSISTANT_WEBHOOK_UNAUTHORIZED", "Invalid Duffel webhook signature.", 403);
  }
  let event;
  try { event = JSON.parse(rawBody); } catch (_) { throw error("ASSISTANT_WEBHOOK_BAD_JSON", "Invalid Duffel webhook payload."); }
  if (typeof event?.live_mode !== "boolean") throw error("ASSISTANT_WEBHOOK_BAD_MODE", "Duffel webhook mode is missing.", 400);
  const secret = await webhookSecret(event.live_mode);
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  const received = Buffer.from(signedHex, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw error("ASSISTANT_WEBHOOK_UNAUTHORIZED", "Invalid Duffel webhook signature.", 403);
  }
  if (event.type !== "assistant.conversation.updated" && !RESOURCE_WEBHOOK_TYPES.has(event.type)) {
    return { ok: true, recorded: false, reason: "EVENT_NOT_HANDLED" };
  }
  if (!EVENT_ID.test(clean(event.id, 220))) throw error("ASSISTANT_WEBHOOK_EVENT_INVALID", "Invalid Duffel event ID.");
  const data = obj(event.data);
  const entity = obj(data.object);
  const eventUserId = clean(data.user_id || entity.user_id, 220);
  // Supplier servicing notifications can reference the order through several
  // documented event shapes. Do not guess the resource from arbitrary text.
  const resourceId = clean(data.resource_id || entity.order_id || entity.booking_id ||
    (ORDER_ID.test(entity.id) || STAY_ID.test(entity.id) ? entity.id : "") ||
    (ORDER_ID.test(event.idempotency_key) || STAY_ID.test(event.idempotency_key) ? event.idempotency_key : ""), 220);
  if (event.type === "assistant.conversation.updated" && !USER_ID.test(eventUserId)) {
    throw error("ASSISTANT_WEBHOOK_RESOURCE_INVALID", "Duffel webhook identity is invalid.");
  }
  if (resourceId && !(ORDER_ID.test(resourceId) || STAY_ID.test(resourceId))) {
    throw error("ASSISTANT_WEBHOOK_RESOURCE_INVALID", "Duffel webhook resource is invalid.");
  }
  if (RESOURCE_WEBHOOK_TYPES.has(event.type) && !resourceId) {
    return { ok: true, recorded: false, reason: "SUPPLIER_RESOURCE_NOT_IDENTIFIED" };
  }
  // Match by supplier context and verified customer identity, never by a bare
  // booking reference or email from the unsigned request payload.
  const query = { select: "*", order: "updated_at.desc", limit: "100" };
  if (eventUserId) query["payload->duffelAssistant->>customerUserId"] = `eq.${eventUserId}`;
  else query["payload->duffelAssistant->>resourceId"] = `eq.${resourceId}`;
  const candidates = await restRequest({ table: "customer_support_cases", query });
  const cases = arr(candidates).filter(row => {
    const meta = obj(obj(row.payload).duffelAssistant);
    if (eventUserId && meta.customerUserId !== eventUserId) return false;
    return resourceId ? (meta.resourceId === resourceId || arr(meta.resourceIds).includes(resourceId)) : !!meta.customerUserId;
  });
  if (!cases.length) return { ok: true, recorded: false, reason: "NO_LINKED_ASSISTANT_CASE" };
  // Only one linked case is recorded for each provider event. Event IDs are
  // checked before write and never turn into a claim that servicing completed.
  const row = cases[0];
  // Verify the supplier first. If this fails, do not acknowledge/log the event
  // ID; Duffel can retry rather than silently losing the reconciliation task.
  let verification = { checked: false, reason: "NO_RESOURCE" };
  if (resourceId) {
    verification = await reconcileVerifiedResource(row, resourceId, event.type, event.id);
  }
  const log = await appendActivity(row, "DUFFEL_PROVIDER_WEBHOOK",
    `[Duffel Assistant activity] Signed Duffel event ${event.type} (${event.id}) received for ${resourceId || "customer conversation"}. This event does not contain a chat transcript or confirm customer-refund settlement.`,
    { duffelEventId: event.id, resourceId });
  if (log.duplicate) return { ok: true, recorded: false, duplicate: true, verification };
  return { ok: true, recorded: log.recorded, duplicate: false, verification };
}


// V12.4 staff operations remain in the canonical Customer Service case.
// getAgentSupportCaseCore and updateAgentSupportCaseCore own staff authorization,
// team routing, internal notes and the persistent support-case audit trail.
async function agentAssistantCase(caseId) {
  const id = clean(caseId, 160);
  if (!/^case_[A-Za-z0-9_]+$/.test(id)) throw error("SUPPORT_CASE_INVALID", "Select a valid Customer Service case.");
  const caseDetail = await getAgentSupportCaseCore({ caseId: id, includeLiveKit: false, silentSync: true });
  if (clean(caseDetail?.case?.caseId, 160) !== id) throw error("SUPPORT_CASE_NOT_FOUND", "Customer Service did not return the selected case.", 404);
  const rows = await restRequest({ table: "customer_support_cases", query: { select: "*", case_id: `eq.${id}`, limit: "1" } });
  const row = arr(rows)[0];
  if (!row) throw error("SUPPORT_CASE_NOT_FOUND", "Customer Service case was not found.", 404);
  return { row, detail: caseDetail };
}
function agentCaseQueue(row) {
  return clean(obj(row.payload).queueKey || obj(row.payload).inboxKey || "support", 120);
}
function agentAssistantContext(row, handoff = null) {
  const payload = obj(row.payload);
  const meta = obj(payload.duffelAssistant);
  const verification = obj(meta.providerVerification);
  const kind = ORDER_ID.test(clean(meta.resourceId)) ? "air" : STAY_ID.test(clean(meta.resourceId)) ? "stay" : "";
  const bookingId = BOOKING_ID.test(clean(meta.bookingId, 80)) ? meta.bookingId : "";
  return {
    ok: true,
    caseId: clean(row.case_id, 160),
    caseRef: clean(payload.caseRef, 120),
    bookingRef: clean(meta.bookingReference || payload.bookingRef || payload.pnr, 120),
    queue: agentCaseQueue(row),
    status: clean(row.status, 60),
    bookingLinked: Boolean(bookingId && kind),
    bookingId: bookingId || null,
    resourceId: kind ? clean(meta.resourceId, 220) : null,
    resourceType: kind || null,
    provider: kind ? "Duffel" : null,
    supplierUserLinked: USER_ID.test(clean(meta.customerUserId)),
    verification: verification.verifiedAt ? {
      verifiedAt: verification.verifiedAt,
      eventType: clean(verification.eventType, 90),
      status: clean(obj(verification.snapshot).status, 100),
      supplierChanged: verification.changed === true,
      discrepancy: verification.discrepancy === true,
      reservationsReview: verification.needsReservationsReview === true,
      // Only previously persisted, provider-verified ALTEA state is shown.
      altea: obj(verification.altea).id ? {
        id: clean(verification.altea.id, 80),
        bookingReference: clean(verification.altea.bookingReference, 120),
        status: clean(verification.altea.status, 80),
        componentStatus: clean(verification.altea.componentStatus, 80),
        paymentStatus: clean(verification.altea.paymentStatus, 80),
        fulfillmentStatus: clean(verification.altea.fulfillmentStatus, 80)
      } : null
    } : null,
    handoff: handoff ? { issueType: handoff.issueType, summary: handoff.summary, preparedAt: handoff.preparedAt } : null,
    hasBookingReference: Boolean(clean(meta.bookingReference || payload.bookingRef || payload.pnr, 120)),
    // This link launches an authenticated CUSTOMER session, never a staff-side Duffel chat.
    customerRoute: bookingId ? `/my-profile/travel-assistance?caseId=${encodeURIComponent(row.case_id)}&bookingId=${encodeURIComponent(bookingId)}`
      : `/my-profile/travel-assistance?caseId=${encodeURIComponent(row.case_id)}`
  };
}
export async function getAgentDuffelSupportContextCore(input = {}) {
  const { row } = await agentAssistantCase(input.caseId);
  return agentAssistantContext(row, await latestStaffHandoff(row));
}
export async function verifyAgentDuffelSupportBookingCore(input = {}) {
  const { row } = await agentAssistantCase(input.caseId);
  const meta = obj(obj(row.payload).duffelAssistant);
  const resourceId = clean(meta.resourceId, 220);
  if (!(ORDER_ID.test(resourceId) || STAY_ID.test(resourceId))) {
    throw error("DUFFEL_BOOKING_NOT_LINKED", "An authenticated customer must open this case with a linked Duffel flight or hotel before supplier verification.", 409);
  }
  const outcome = await reconcileVerifiedResource(row, resourceId, "agent-initiated-check");
  if (outcome.checked !== true) throw error("DUFFEL_VERIFICATION_INCOMPLETE", "Duffel booking ownership or state could not be verified.", 409);
  // Re-read: reconciliation writes the latest snapshot into canonical support metadata.
  const fresh = await agentAssistantCase(input.caseId);
  return { ...agentAssistantContext(fresh.row, await latestStaffHandoff(fresh.row)), outcome };
}
export async function routeAgentDuffelSupportCaseCore(input = {}) {
  const { row } = await agentAssistantCase(input.caseId);
  const info = agentAssistantContext(row);
  if (!info.hasBookingReference && !info.bookingLinked) {
    throw error("BOOKING_REFERENCE_REQUIRED", "Link a booking or add a verified booking reference to the support case before routing to the Booking Team.", 409);
  }
  const reason = clean(input.reason, 1400);
  if (reason.length < 12) throw error("BOOKING_TEAM_REASON_REQUIRED", "Describe what the Booking Team must investigate (at least 12 characters).");
  if (info.queue === "booking-team") return { ...info, alreadyRouted: true };
  // Use the established team queue in the same case. No second case, no separate
  // booking record, and no claim that a supplier change/refund was performed.
  await updateAgentSupportCaseCore({ caseId: info.caseId, updates: {
    action: "INTERNAL_NOTE",
    internalNote: { content: `BOOKING TEAM HANDOFF\nReference: ${info.bookingRef || "Linked Duffel resource"}\nSupplier resource: ${info.resourceId || "Not yet linked"}\nRequest: ${reason}` },
    queue: "booking-team", status: "pending", assigneeId: "", assigneeName: ""
  } });
  const fresh = await agentAssistantCase(info.caseId);
  const result = agentAssistantContext(fresh.row, await latestStaffHandoff(fresh.row));
  if (result.queue !== "booking-team") throw error("BOOKING_TEAM_ROUTING_NOT_SAVED", "The Booking Team queue change was not confirmed.", 503);
  return { ...result, routed: true };
}
export async function prepareAgentDuffelSupportHandoffCore(input = {}) {
  const { row } = await agentAssistantCase(input.caseId);
  const meta = obj(obj(row.payload).duffelAssistant);
  const issueType = clean(input.issueType, 32).toLowerCase();
  const summary = clean(input.summary, MAX_HANDOFF_SUMMARY);
  if (!ISSUE_TYPES.has(issueType)) throw error("DUFFEL_ISSUE_TYPE_INVALID", "Select change, cancellation or other.");
  if (summary.length < 12) throw error("DUFFEL_HANDOFF_SUMMARY_REQUIRED", "Provide a useful supplier handoff summary (at least 12 characters).");
  if (!USER_ID.test(clean(meta.customerUserId)) || !(
    ORDER_ID.test(clean(meta.resourceId)) || STAY_ID.test(clean(meta.resourceId))
  ) || !BOOKING_ID.test(clean(meta.bookingId, 80))) {
    throw error("DUFFEL_HANDOFF_NOT_LINKED", "The customer must first launch the Assistant for a verified owned booking before a supplier handoff can be prepared.", 409);
  }
  // Canonical private agent note: the customer-side Assistant reads it only after
  // its own Wix-member/booking ownership guards. Duffel chat is never agent-impersonated.
  await updateAgentSupportCaseCore({ caseId: clean(row.case_id, 160), updates: {
    action: "INTERNAL_NOTE", internalNote: { content: `DUFFEL HANDOFF\nIssue: ${issueType}\nSummary: ${summary}` }
  } });
  const fresh = await agentAssistantCase(row.case_id);
  const handoff = await latestStaffHandoff(fresh.row);
  if (!handoff || handoff.issueType !== issueType || handoff.summary !== summary) {
    throw error("DUFFEL_HANDOFF_NOT_SAVED", "The supplier handoff note was not confirmed in Customer Service.", 503);
  }
  const ctx = agentAssistantContext(fresh.row, handoff);
  const customerRoute = `${ctx.customerRoute}&issueType=${encodeURIComponent(issueType)}`;
  return { ...ctx, customerRoute, prepared: true };
}
