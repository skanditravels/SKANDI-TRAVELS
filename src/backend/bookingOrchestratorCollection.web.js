import { webMethod, Permissions } from "wix-web-module";
import {
  getHomeBootstrap as baseGetHomeBootstrap,
  searchUnifiedOffers as baseSearchUnifiedOffers,
  createBookingCartFromOffer as baseCreateBookingCartFromOffer
} from "./bookingOrchestrator.web.js";
import { searchDuffelStays } from "./RIA/duffelGroundProducts.web.js";
import {
  getSearchableCatalogPolicy,
  filterSearchableOffers,
  assertSearchableOffer,
  assertSearchableHotelMaster,
  getSearchableFinderData
} from "./RIA/inventorySearchPolicy.js";

function arr(v) { return Array.isArray(v) ? v : []; }

export const getHomeBootstrap = webMethod(Permissions.Anyone, async (input = {}) => {
  const [base, catalog] = await Promise.all([
    baseGetHomeBootstrap(input),
    getSearchableCatalogPolicy()
  ]);
  return {
    ...(base || {}),
    collectionPolicy: catalog.rule,
    searchableDestinations: catalog.destinations,
    searchableAirlines: catalog.airlines,
    searchableHotels: catalog.hotels
  };
});

export const getSearchableDestinationFinderData = webMethod(Permissions.Anyone, async (input = {}) => {
  return getSearchableFinderData(input.language || input.locale || "EN");
});

export const searchUnifiedOffers = webMethod(Permissions.Anyone, async ({ search = {} } = {}) => {
  const result = await baseSearchUnifiedOffers({ search });
  const items = await filterSearchableOffers(arr(result?.items), search);
  return {
    ...(result || {}),
    items,
    meta: {
      ...(result?.meta || {}),
      returnedByProvider: arr(result?.items).length,
      returnedBySkandiCollection: items.length,
      collectionPolicyApplied: true
    }
  };
});

export const createBookingCartFromOffer = webMethod(Permissions.Anyone, async ({ offer, search = {} } = {}) => {
  const allowed = await assertSearchableOffer(offer || {}, search || offer?.searchContext || {});
  const result = await baseCreateBookingCartFromOffer({ offer: allowed, search: search || allowed.searchContext || {} });
  return { ...(result || {}), collectionPolicyApplied: true };
});

export const searchCollectionHotelStays = webMethod(Permissions.Anyone, async (input = {}) => {
  const hotel = await assertSearchableHotelMaster(input);
  const result = await searchDuffelStays({
    accommodationId: input.accommodationId,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    adults: input.adults,
    children: input.children,
    childAges: input.childAges,
    rooms: input.rooms,
    fetchRates: input.fetchRates !== false
  });
  const items = arr(result?.items).map(item => ({
    ...item,
    inventoryMasterId: hotel.id,
    collectionType: hotel.collection_type,
    partnerTier: hotel.partner_tier || "",
    collectionLabel: hotel.collection_type === "SKANDI_PARTNER" ? "SKANDI Partner" : "SKANDI Collection"
  }));
  return { ...(result || {}), items, inventoryMasterId: hotel.id, collectionPolicyApplied: true };
});
