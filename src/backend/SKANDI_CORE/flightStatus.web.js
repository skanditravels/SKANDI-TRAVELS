// /src/backend/SKANDI_CORE/flightStatus.web.js
// SKANDI Flight Status B-011.40 — native Wix public web-module facade.
// Keep Permissions.Anyone directly in each top-level webMethod declaration for Wix export discovery.
// One dispatcher is the canonical page boundary. Compatibility exports remain
// available for older callers during convergence.

import {
  Permissions,
  webMethod
} from "wix-web-module";

import {
  handleFlightStatusActionCore,
  searchFlightStatusCore,
  getFlightStatusAirportDirectoryCore,
  getFlightStatusAirportContextCore
} from "backend/SKANDI_CORE/flightStatus";

async function publicResult(action) {
  try { return await action(); }
  catch (error) { return { ok: false, error: "FLIGHT_STATUS_UNAVAILABLE", publicMessage: error?.publicMessage || "Flight information is temporarily unavailable. Please try again." }; }
}

const input = value =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

export const handleFlightStatusAction = webMethod(
  Permissions.Anyone,
  payload => publicResult(() => handleFlightStatusActionCore(input(payload)))
);

// Compatibility exports. The B-011.40 page itself uses the dispatcher above.
export const searchFlightStatus = webMethod(
  Permissions.Anyone,
  payload => publicResult(() => searchFlightStatusCore(input(payload)))
);

export const getFlightStatusAirportDirectory = webMethod(
  Permissions.Anyone,
  () => publicResult(() => getFlightStatusAirportDirectoryCore())
);

export const getFlightStatusAirportContext = webMethod(
  Permissions.Anyone,
  payload => publicResult(() => getFlightStatusAirportContextCore(input(payload)))
);
