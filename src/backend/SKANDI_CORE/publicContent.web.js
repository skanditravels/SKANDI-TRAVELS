// /src/backend/SKANDI_CORE/publicContent.web.js
// Public frontend boundary for SKANDI public-content reads.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getPublicAboutPayloadCore,
  getPublicSkandiCollectionCore,
  getPublicTravelInfoPayloadCore,
  getPublicTravelInfoAircraftCore,
  getPublicBaggagePayloadCore,
  getPublicPassportVisaPayloadCore,
  searchPublicTravelRequirementsCore,
  getPublicInsurancePayloadCore
} from "backend/SKANDI_CORE/publicContent.js";

const anyone = handler => webMethod(Permissions.Anyone, input => handler(input && typeof input === "object" ? input : {}));

export const getPublicAboutPayload = anyone(getPublicAboutPayloadCore);
export const getPublicSkandiCollection = anyone(getPublicSkandiCollectionCore);
export const getPublicTravelInfoPayload = anyone(getPublicTravelInfoPayloadCore);
export const getPublicTravelInfoAircraft = anyone(getPublicTravelInfoAircraftCore);
export const getPublicBaggagePayload = anyone(getPublicBaggagePayloadCore);
export const getPublicPassportVisaPayload = anyone(getPublicPassportVisaPayloadCore);
export const searchPublicTravelRequirements = anyone(searchPublicTravelRequirementsCore);
export const getPublicInsurancePayload = anyone(getPublicInsurancePayloadCore);
