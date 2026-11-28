import { Permissions, webMethod } from "wix-web-module";
import { getSwedaviaAirportInfoCore } from "backend/SKANDI_CORE/swedaviaAirports";
import { getAirlabsAirportGeographyCore } from "backend/SKANDI_CORE/flightStatus";

// The core accepts only documented Swedish airports and public read scopes.
export const getSwedaviaAirportInfo = webMethod(
  Permissions.Anyone,
  input => getSwedaviaAirportInfoCore(input, getAirlabsAirportGeographyCore)
);
