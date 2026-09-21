// /src/backend/SKANDI_CORE/flightStatus.web.js
// SKANDI Flight Status B-011.40 — native Wix public web-module facade.
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

const ANYONE = Permissions.Anyone;

const input = value =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

export const handleFlightStatusAction = webMethod(
  ANYONE,
  payload => handleFlightStatusActionCore(input(payload))
);

// Compatibility exports. The B-011.40 page itself uses the dispatcher above.
export const searchFlightStatus = webMethod(
  ANYONE,
  payload => searchFlightStatusCore(input(payload))
);

export const getFlightStatusAirportDirectory = webMethod(
  ANYONE,
  () => getFlightStatusAirportDirectoryCore()
);

export const getFlightStatusAirportContext = webMethod(
  ANYONE,
  payload => getFlightStatusAirportContextCore(input(payload))
);
