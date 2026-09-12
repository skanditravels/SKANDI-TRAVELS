// /src/backend/SKANDI_CORE/travelReference.web.js
// SKANDI shared frontend-callable travel reference facade.
// R-003.9.1
//
// Public-safe reference data only. Commercial/provider-management mutations such
// as negotiated rates stay behind Inventory Control and are not exposed here.

import { webMethod, Permissions } from "wix-web-module";
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
} from "backend/SKANDI_CORE/travelReference.js";

const ANYONE = Permissions.Anyone;
const publicInput = input => ({ ...(input || {}), includeRaw: false });

export const listDuffelAirlines = webMethod(ANYONE, input => listDuffelAirlinesCore(publicInput(input)));
export const getDuffelAirline = webMethod(ANYONE, input => getDuffelAirlineCore(publicInput(input)));

export const listDuffelAircraft = webMethod(ANYONE, input => listDuffelAircraftCore(publicInput(input)));
export const getDuffelAircraft = webMethod(ANYONE, input => getDuffelAircraftCore(publicInput(input)));

export const listDuffelAirports = webMethod(ANYONE, input => listDuffelAirportsCore(publicInput(input)));
export const getDuffelAirport = webMethod(ANYONE, input => getDuffelAirportCore(publicInput(input)));

export const listDuffelCities = webMethod(ANYONE, input => listDuffelCitiesCore(publicInput(input)));
export const getDuffelCity = webMethod(ANYONE, input => getDuffelCityCore(publicInput(input)));
export const searchDuffelPlaces = webMethod(ANYONE, input => searchDuffelPlacesCore(publicInput(input)));

export const listDuffelHotelBrands = webMethod(ANYONE, input => listDuffelHotelBrandsCore(publicInput(input)));
export const getDuffelHotelBrand = webMethod(ANYONE, input => getDuffelHotelBrandCore(publicInput(input)));

export const listDuffelHotelChains = webMethod(ANYONE, input => listDuffelHotelChainsCore(publicInput(input)));
export const getDuffelHotelChain = webMethod(ANYONE, input => getDuffelHotelChainCore(publicInput(input)));

export const listDuffelAirLoyaltyProgrammes = webMethod(ANYONE, input => listDuffelAirLoyaltyProgrammesCore(publicInput(input)));
export const getDuffelAirLoyaltyProgramme = webMethod(ANYONE, input => getDuffelAirLoyaltyProgrammeCore(publicInput(input)));
export const listDuffelStayLoyaltyProgrammes = webMethod(ANYONE, input => listDuffelStayLoyaltyProgrammesCore(publicInput(input)));

export const searchDuffelAccommodationSuggestions = webMethod(ANYONE, input => searchDuffelAccommodationSuggestionsCore(publicInput(input)));
export const getDuffelAccommodation = webMethod(ANYONE, input => getDuffelAccommodationCore(publicInput(input)));
