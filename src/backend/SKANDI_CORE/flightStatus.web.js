// /src/backend/SKANDI_CORE/flightStatus.web.js
// SKANDI Flight Status B-011.37 — public-safe Wix web-method facade.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  searchFlightStatusCore,
  getFlightStatusAirportDirectoryCore,
  getFlightStatusAirportContextCore
} from "backend/SKANDI_CORE/flightStatus.js";

const ANYONE = Permissions.Anyone;
const input = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const searchFlightStatus = webMethod(ANYONE, payload => searchFlightStatusCore(input(payload)));
export const getFlightStatusAirportDirectory = webMethod(ANYONE, () => getFlightStatusAirportDirectoryCore());
export const getFlightStatusAirportContext = webMethod(ANYONE, payload => getFlightStatusAirportContextCore(input(payload)));
