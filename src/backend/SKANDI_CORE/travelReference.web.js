// /src/backend/SKANDI_CORE/travelReference.web.js
// SKANDI Backend Base 1.0 — B-004 public-safe travel-reference web boundary.
// No raw Duffel credentials, commercial mutations, or Inventory writes are exposed here. 

import { Permissions, webMethod } from "@wix/web-methods";
import {
  listDuffelAirlinesCore,
  getDuffelAirlineCore,
  listDuffelAircraftCore,
  getDuffelAircraftCore,
  listDuffelAirportsCore,
  getDuffelAirportCore,
  listDuffelCitiesCore,
  getDuffelCityCore,
  searchDuffelPlacesCore,
  listDuffelHotelBrandsCore,
  getDuffelHotelBrandCore,
  listDuffelHotelChainsCore,
  getDuffelHotelChainCore,
  listDuffelAirLoyaltyProgrammesCore,
  getDuffelAirLoyaltyProgrammeCore,
  listDuffelStayLoyaltyProgrammesCore,
  searchDuffelAccommodationSuggestionsCore,
  getDuffelAccommodationCore
} from "backend/SKANDI_CORE/travelReference";

const ANYONE = Permissions.Anyone;
const input = value => ({ ...(value && typeof value === "object" ? value : {}), includeRaw: false });
const publicMethod = handler => webMethod(ANYONE, value => handler(input(value)));

export const listDuffelAirlines = publicMethod(listDuffelAirlinesCore);
export const getDuffelAirline = publicMethod(getDuffelAirlineCore);
export const listDuffelAircraft = publicMethod(listDuffelAircraftCore);
export const getDuffelAircraft = publicMethod(getDuffelAircraftCore);
export const listDuffelAirports = publicMethod(listDuffelAirportsCore);
export const getDuffelAirport = publicMethod(getDuffelAirportCore);
export const listDuffelCities = publicMethod(listDuffelCitiesCore);
export const getDuffelCity = publicMethod(getDuffelCityCore);
// Keep this export as a direct webMethod declaration so Wix can register it
// for the public flight-search host. The input remains filtered by the same
// public-safe boundary used for the other reference-data methods.
export const searchDuffelPlaces = webMethod(ANYONE, async value => {
  try {
    return await searchDuffelPlacesCore(input(value));
  } catch (error) {
    console.error("[Flight place lookup]", {
      code: String(error?.code || "LOOKUP_FAILED").slice(0, 80),
      status: Number(error?.status) || null,
      name: String(error?.name || "Error").slice(0, 80)
    });
    throw error;
  }
});
export const listDuffelHotelBrands = publicMethod(listDuffelHotelBrandsCore);
export const getDuffelHotelBrand = publicMethod(getDuffelHotelBrandCore);
export const listDuffelHotelChains = publicMethod(listDuffelHotelChainsCore);
export const getDuffelHotelChain = publicMethod(getDuffelHotelChainCore);
export const listDuffelAirLoyaltyProgrammes = publicMethod(listDuffelAirLoyaltyProgrammesCore);
export const getDuffelAirLoyaltyProgramme = publicMethod(getDuffelAirLoyaltyProgrammeCore);
export const listDuffelStayLoyaltyProgrammes = publicMethod(listDuffelStayLoyaltyProgrammesCore);
export const searchDuffelAccommodationSuggestions = publicMethod(searchDuffelAccommodationSuggestionsCore);
export const getDuffelAccommodation = publicMethod(getDuffelAccommodationCore);

