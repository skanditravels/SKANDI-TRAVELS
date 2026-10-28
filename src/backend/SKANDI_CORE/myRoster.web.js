// Frontend-callable boundary for destination staff MyRoster actions.
import { Permissions, webMethod } from "@wix/web-methods";
import {
  getMyRosterBootstrapCore,
  createTimeClockEventCore,
  requestTimeOffCore,
  requestShiftChangeCore
} from "backend/SKANDI_CORE/myRoster";

function publicError(error) {
  const code = String(error && (error.code || error.message) || "MYROSTER_FAILED").toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 100) || "MYROSTER_FAILED";
  const messages = {
    MYROSTER_DESTINATION_ACCESS_REQUIRED: "MyRoster is limited to SKANDI destination and airport field staff.",
    MYROSTER_DESTINATION_BASE_REQUIRED: "Your SKANDI profile needs an assigned destination or base before MyRoster can load.",
    STAFF_AUTH_REQUIRED: "Sign in to RIAINTRA to view your staff schedule.",
    STAFF_ACCESS_DENIED: "Your SKANDI staff access could not be confirmed.",
    MYROSTER_ASSIGNMENT_NOT_FOUND: "That assignment is no longer available for your staff account.",
    MYROSTER_TIMEOFF_DATES_INVALID: "Enter a valid time-off date range of up to 93 days.",
    MYROSTER_REQUEST_REASON_REQUIRED: "Add a short note explaining your schedule-change request."
  };
  const out = new Error(messages[code] || "MyRoster could not complete the request. Refresh the page or contact your local SKANDI manager.");
  out.name = "MyRosterError";
  out.code = code;
  out.publicMessage = out.message;
  return out;
}
async function call(handler, input) {
  try { return await handler(input || {}); }
  catch (error) { throw publicError(error); }
}
export const getMyRosterBootstrap = webMethod(Permissions.SiteMember, input => call(getMyRosterBootstrapCore, input));
export const createTimeClockEvent = webMethod(Permissions.SiteMember, input => call(createTimeClockEventCore, input));
export const requestTimeOff = webMethod(Permissions.SiteMember, input => call(requestTimeOffCore, input));
export const requestShiftChange = webMethod(Permissions.SiteMember, input => call(requestShiftChangeCore, input));
