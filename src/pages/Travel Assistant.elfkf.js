// /src/pages/Travel Assistant.elfkf.js
// Wix Velo controller for the dedicated SKANDI Duffel Assistant page.
// HTML element: #htmlDuffelAssistant ; page route: /travel-assistant.

import { authentication } from "wix-members-frontend";
import wixLocationFrontend from "wix-location-frontend";
import { getCustomerProfileBootstrap } from "backend/SKANDI_CORE/customerProfile.web.js";
import {
  createCustomerDuffelAssistantSession,
  recordCustomerDuffelAssistantEvent,
  getCustomerDuffelAssistantActivity,
  verifyCustomerDuffelAssistantBooking
} from "backend/SKANDI_CORE/duffelAssistant.web.js";

const HTML_SOURCE = "SKANDI_DUFFEL_ASSISTANT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const RESOURCE_ID = /^((ord_|bok_)[A-Za-z0-9_]+)$/;
const ISSUE_TYPES = new Set(["cancellation", "change", "other"]);
const PROFILE_TIMEOUT_MS = 26000;
let component = null;
let readyReceived = false;
let listPending = null;
let openPending = false;
let currentSupportCaseId = "";
let activeSessionBookingId = "";
let activeSessionResourceType = "";
const query = wixLocationFrontend.query || {};
const prefill = {
  supportCaseId: String(query.caseId || "").slice(0,160),
  bookingId: String(query.bookingId || "").slice(0,90),
  issueType: ISSUE_TYPES.has(String(query.issueType || "")) ? String(query.issueType) : ""
};
const EVENTS = new Set(["UI_HANDOFF_REQUESTED", "NEW_MESSAGE_NOTICE", "MINIMISED", "LAUNCH_FAILED"]);

function send(type, payload = {}) {
  try {
    component?.postMessage({ source: PARENT_SOURCE, type, payload });
  } catch (_) {}
}
function safeError(e) {
  return {
    code: /^[A-Z0-9_]{2,100}$/.test(String(e?.code || "")) ? e.code : "ASSISTANT_REQUEST_FAILED",
    message: String(e?.publicMessage || "The Assistant request could not be completed.").slice(0, 400)
  };
}
function extractTrips(profileData) {
  const groups = profileData?.trips || {};
  const visits = [...(Array.isArray(groups.upcoming) ? groups.upcoming : []),
    ...(Array.isArray(groups.history) ? groups.history : [])];
  const out = [];
  const seen = new Set();
  for (const booking of visits) {
    if (!booking?.id || seen.has(booking.id)) continue;
    seen.add(booking.id);
    const refs = [booking.supplierOrderId, booking.supplierBookingReference,
      ...(Array.isArray(booking.components) ? booking.components.map(x => x?.supplierReference) : [])];
    const verifiedIds = refs.map(String).filter(id => RESOURCE_ID.test(id));
    const kinds = new Set(verifiedIds.map(id => id.startsWith("ord_") ? "air" : "stay"));
    for (const kind of kinds) {
      if (out.length >= 80) break;
      out.push({
        bookingId: String(booking.id),
        resourceType: kind,
        label: String(booking.bookingReference || booking.pnrLocator || "SKANDI booking").slice(0, 80),
        route: [booking.origin, booking.destination].filter(Boolean).join(" – ").slice(0, 140),
        departureDate: String(booking.departureDate || "").slice(0, 10),
        status: String(booking.status || "").slice(0, 50),
        kind: kind === "air" ? "Flight" : "Hotel"
      });
    }
    if (out.length >= 80) break;
  }
  return out;
}
async function listTrips(force = false) {
  if (listPending) return listPending;
  const run = (async () => {
    try {
      let timer;
      const data = await Promise.race([
        getCustomerProfileBootstrap({ tab: "trips" }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(Object.assign(new Error("The customer profile did not respond in time."), {
            code: "PROFILE_TIMEOUT",
            publicMessage: "The booking list is taking too long to load. Select Refresh trips to retry."
          })), PROFILE_TIMEOUT_MS);
        })
      ]).finally(() => clearTimeout(timer));
      send("DUFFEL_ASSISTANT_TRIPS", {
        trips: extractTrips(data),
        displayName: String(data?.profile?.firstName || "").slice(0, 80)
      });
    } catch (e) {
      send("DUFFEL_ASSISTANT_ERROR", safeError(e));
    }
  })();
  listPending = run;
  try { await run; } finally { if (listPending === run) listPending = null; }
}
async function openAssistant(payload) {
  if (openPending) return;
  openPending = true;
  const requestId = String(payload?.requestId || "").slice(0, 100);
  try {
    const issueType = String(payload?.issueType || "").slice(0, 20);
    if (issueType && !ISSUE_TYPES.has(issueType)) throw Object.assign(new Error("Choose a valid support reason."), { code: "ISSUE_TYPE_INVALID" });
    const response = await createCustomerDuffelAssistantSession({
      bookingId: String(payload?.bookingId || "").slice(0, 80),
      resourceType: String(payload?.resourceType || "").slice(0, 10),
      issueType,
      supportCaseId: String(payload?.supportCaseId || "").slice(0,160)
    });
    if (!response?.ok || !response.clientKey) {
      throw Object.assign(new Error("Duffel did not return a session key."), { code: "DUFFEL_KEY_UNAVAILABLE" });
    }
    currentSupportCaseId = String(response.supportCaseId || "");
    activeSessionBookingId = String(response.bookingId || "");
    activeSessionResourceType = String(response.resourceType || "");
    send("DUFFEL_ASSISTANT_OPEN", {
      requestId,
      clientKey: response.clientKey,
      issueType: response.issueType || null,
      handoffSummary: response.handoffSummary || null,
      handoffPreparedAt: response.handoffPreparedAt || null,
      supportCaseId: currentSupportCaseId,
      supportCaseRef: response.supportCaseRef || "",
      supportSubject: response.supportSubject || "",
      activeSessionBookingId,
      activeSessionResourceType
    });
    void activity({ supportCaseId: currentSupportCaseId });
  } catch (e) {
    send("DUFFEL_ASSISTANT_ERROR", { ...safeError(e), requestId });
  } finally { openPending = false; }
}

async function activity(input = {}) {
  const supportCaseId = String(input.supportCaseId || currentSupportCaseId || "").slice(0, 160);
  if (!supportCaseId) return;
  try {
    const data = await getCustomerDuffelAssistantActivity({ supportCaseId });
    send("DUFFEL_ASSISTANT_ACTIVITY", data);
  } catch (e) { send("DUFFEL_ASSISTANT_ACTIVITY_ERROR", safeError(e)); }
}
async function verifyBooking(input = {}) {
  if (String(input.bookingId || "") !== activeSessionBookingId ||
      String(input.resourceType || "") !== activeSessionResourceType) {
    send("DUFFEL_ASSISTANT_VERIFICATION_ERROR", { message: "Open Assistant for this specific booking before verifying it." });
    return;
  }
  const supportCaseId = String(input.supportCaseId || currentSupportCaseId || "").slice(0,160);
  if (!supportCaseId) return;
  try {
    const result = await verifyCustomerDuffelAssistantBooking({ supportCaseId });
    send("DUFFEL_ASSISTANT_VERIFICATION", result);
    void activity({ supportCaseId });
  } catch (error) { send("DUFFEL_ASSISTANT_VERIFICATION_ERROR", safeError(error)); }
}
async function logEvent(input = {}) {
  const eventType = String(input.eventType || "").slice(0, 60);
  const supportCaseId = String(input.supportCaseId || currentSupportCaseId || "").slice(0, 160);
  if (!EVENTS.has(eventType) || !supportCaseId) return;
  try {
    await recordCustomerDuffelAssistantEvent({ supportCaseId, eventType });
    send("DUFFEL_ASSISTANT_EVENT_RECORDED", { eventType });
    void activity({ supportCaseId });
  } catch (e) {
    send("DUFFEL_ASSISTANT_ACTIVITY_ERROR", safeError(e));
  }
}

$w.onReady(() => {
  component = $w("#htmlDuffelAssistant");
  component.onMessage(event => {
    let message = event.data;
    if (typeof message === "string") {
      try { message = JSON.parse(message); } catch (_) { return; }
    }
    if (!message || message.source !== HTML_SOURCE) return;
    switch (message.type) {
      case "DUFFEL_ASSISTANT_READY":
        if (!readyReceived) {
          readyReceived = true;
          send("DUFFEL_ASSISTANT_HOST_READY", { prefill });
          void listTrips();
        }
        break;
      case "DUFFEL_ASSISTANT_LIST":
        void listTrips(true);
        break;
      case "DUFFEL_ASSISTANT_KEY_REQUEST":
        void openAssistant(message.payload || {});
        break;
      case "DUFFEL_ASSISTANT_EVENT":
        void logEvent(message.payload || {});
        break;
      case "DUFFEL_ASSISTANT_ACTIVITY_REQUEST":
        void activity(message.payload || {});
        break;
      case "DUFFEL_ASSISTANT_VERIFY":
        void verifyBooking(message.payload || {});
        break;
      case "DUFFEL_ASSISTANT_SUPPORT":
        wixLocationFrontend.to("/about/support");
        break;
      case "DUFFEL_ASSISTANT_SIGN_IN":
        void authentication.promptLogin().then(() => listTrips(true)).catch(() => {
          send("DUFFEL_ASSISTANT_ERROR", { code: "LOGIN_REQUIRED", message: "Sign in to use Duffel Assistant." });
        });
        break;
      default:
        break;
    }
  });
  for (const timeout of [0, 500, 1600, 3400]) {
    setTimeout(() => {
      if (!readyReceived) send("DUFFEL_ASSISTANT_HOST_READY", { prefill });
    }, timeout);
  }
});
