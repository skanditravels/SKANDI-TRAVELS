// /src/backend/SKANDI_CORE/opsControl.web.js
// V12 — OPS Control frontend web-method boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getOpsControlBootstrapCore,
  handleOpsControlActionCore
} from "backend/SKANDI_CORE/opsControl";

function publicError(error) {
  const code = String(error?.code || error?.message || "OPS_CONTROL_FAILED").toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 100) || "OPS_CONTROL_FAILED";
  const transportMessages = {
    OPS_TRANSPORT_VEHICLE_INVALID: "Complete the vehicle details and enter a valid capacity and country code.",
    OPS_TRANSPORT_ASSIGNMENT_INVALID: "Complete the service details and enter a valid time range and passenger count.",
    OPS_TRANSPORT_STOPS_INVALID: "Enter up to 20 stops, each no longer than 180 characters.",
    OPS_TRANSPORT_DATE_INVALID: "Enter a valid inspection or insurance date.",
    OPS_TRANSPORT_SUPPLIER_INVALID: "Choose an active supplier from Inventory Control.",
    OPS_TRANSPORT_VEHICLE_NOT_FOUND: "This vehicle is no longer available. Refresh and try again.",
    OPS_TRANSPORT_VEHICLE_CHANGED: "This vehicle was changed by another user. Refresh before editing it again.",
    OPS_TRANSPORT_ASSIGNMENT_CHANGED: "This service was changed by another user. Refresh before editing it again.",
    OPS_TRANSPORT_ASSIGNMENT_NOT_FOUND: "This service is no longer available. Refresh and try again.",
    OPS_TRANSPORT_VEHICLE_UNAVAILABLE: "The vehicle must be available before the service can be published.",
    OPS_TRANSPORT_VEHICLE_HAS_ACTIVE_SERVICES: "This change conflicts with a future published service. Update the affected services first.",
    OPS_TRANSPORT_CAPACITY_EXCEEDED: "The passenger count exceeds the vehicle's seats. Save a draft or choose a larger vehicle.",
    OPS_TRANSPORT_STAFF_REQUIRED: "Assign a staff member before publishing this service.",
    OPS_TRANSPORT_STAFF_INVALID: "Choose an active SKANDI staff member.",
    OPS_TRANSPORT_ASSIGNMENT_CONFLICT: "The selected vehicle or staff member already has a transport service at this time.",
    OPS_TRANSPORT_DUPLICATE_VEHICLE: "A vehicle with this registration and country already exists.",
    OPS_TRANSPORT_USE_TRANSPORT_EDITOR: "Edit this bus service in Accommodations & Logistics.",
    OPS_TRANSPORT_LABEL_REQUIRED: "Enter a service name.",
    OPS_TRANSPORT_ACTOR_REQUIRED: "Your staff identity could not be confirmed.",
    OPS_TRANSPORT_SAVE_FAILED: "The transport change could not be saved. Refresh before retrying."
  };
  const message = code.startsWith("OPS_TRANSPORT_") ? (transportMessages[code] || "The transport request could not be completed.") : (error?.publicMessage || error?.message || "OPS Control request failed.");
  const out = new Error(String(message).slice(0, 500));
  out.name = "OpsControlError";
  out.code = code;
  out.publicMessage = out.message;
  return out;
}

async function call(handler, input = {}) {
  try {
    return await handler(input || {});
  } catch (error) {
    throw publicError(error);
  }
}

export const getOpsControlBootstrap = webMethod(
  Permissions.SiteMember,
  input => call(getOpsControlBootstrapCore, input)
);

export const handleOpsControlAction = webMethod(
  Permissions.SiteMember,
  input => call(handleOpsControlActionCore, input)
);
