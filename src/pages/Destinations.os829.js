import wixData from "wix-data";
import wixLocation from "wix-location";
import { getDestinationFlightSuggestions } from "src/backend/destinationFlightOffers.web";

const HTML_ID = "#htmlDestinations";
const HTML_SOURCE = "SKANDI_DESTINATION_FINDER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const DEFAULT_ORIGIN_IATA = "ARN"; // Change later if you want JFK, EWR, CPH, etc.
const DEFAULT_CURRENCY = "SEK";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85";

let DESTINATION_FINDER_DATA = {
  countries: [],
  areas: [],
  hotels: []
};

$w.onReady(async function () {
  const html = safeElement(HTML_ID);

  if (!html) {
    console.error(`[SKANDI Destinations] Missing HTML embed ${HTML_ID}`);
    return;
  }

  if (html.onMessage) {
    html.onMessage(handleDestinationFinderMessage);
  }

  const data = await getDestinationHotelFinderDataFromCms();
  DESTINATION_FINDER_DATA = data;

  sendDestinationDataToHtml(html, data);
});

async function handleDestinationFinderMessage(event) {
  const msg = event.data || {};

  if (msg.source && msg.source !== HTML_SOURCE) {
    return;
  }

  const payload = msg.payload || {};

  try {
    if (msg.type === "SKANDI_DESTINATION_FINDER_READY" || msg.type === "SKANDI_REFRESH_DESTINATION_DATA") {
      postToDestinationHtml({
        source: PARENT_SOURCE,
        type: "SKANDI_SET_DESTINATION_DATA",
        payload: DESTINATION_FINDER_DATA
      });
      return;
    }

    if (msg.type === "SKANDI_LIVE_OFFER_REQUEST") {
      await handleLiveOfferRequest(payload);
      return;
    }

    if (msg.type === "SKANDI_SEARCH_UPDATED") {
      await handleLiveOfferRequest(payload);
      return;
    }

    if (msg.type === "SKANDI_SEE_ROOMS") {
      const hotelId =
        payload?.hotel?.id ||
        payload?.hotelId ||
        payload?.search?.hotelId ||
        "";

      const roomName =
        payload?.roomName ||
        payload?.search?.roomName ||
        "";

      const roomQuery = roomName
        ? `&room=${encodeURIComponent(roomName)}`
        : "";

      wixLocation.to(`/booking?step=offer&hotel=${encodeURIComponent(hotelId)}${roomQuery}`);
      return;
    }

    if (msg.type === "SKANDI_CONTACT_REQUEST") {
      wixLocation.to("/contact");
      return;
    }

    if (msg.type === "SKANDI_HOTEL_SELECTED") {
      console.log("[SKANDI Destinations] Hotel selected:", payload.hotelId || payload);
      return;
    }

    if (msg.type === "SKANDI_LAYER_CHANGE") {
      console.log("[SKANDI Destinations] Layer changed:", payload);
      return;
    }
  } catch (error) {
    console.error("[SKANDI Destinations] Message handler failed:", error);

    postToDestinationHtml({
      type: "SKANDI_AMADEUS_OFFERS",
      payload: {
        ok: false,
        offers: [],
        priceSummary: null,
        message: "Live offers are temporarily unavailable."
      }
    });
  }
}

function sendDestinationDataToHtml(html, data) {
  const message = {
    source: PARENT_SOURCE,
    type: "SKANDI_SET_DESTINATION_DATA",
    payload: data
  };

  [0, 350, 900, 1600].forEach((delay) => {
    setTimeout(() => {
      html.postMessage(message);
    }, delay);
  });

  const query = wixLocation.query || {};

  if (query.hotel) {
    setTimeout(() => {
      html.postMessage({
        type: "SKANDI_GO_TO_HOTEL",
        hotelId: query.hotel
      });
    }, 1800);
    return;
  }

  if (query.area) {
    setTimeout(() => {
      html.postMessage({
        type: "SKANDI_GO_TO_AREA",
        areaId: query.area
      });
    }, 1800);
    return;
  }

  if (query.country) {
    setTimeout(() => {
      html.postMessage({
        type: "SKANDI_GO_TO_COUNTRY",
        countryId: query.country
      });
    }, 1800);
  }
}

async function handleLiveOfferRequest(payload = {}) {
  const request = buildLiveOfferRequest(payload);

  if (!request.destinationIata || !request.departureDate) {
    postToDestinationHtml({
      type: "SKANDI_AMADEUS_OFFERS",
      payload: {
        ok: false,
        offers: [],
        priceSummary: null,
        request,
        message: "Choose dates and a destination airport to see live flight suggestions."
      }
    });
    return;
  }

  postToDestinationHtml({
    type: "SKANDI_AMADEUS_LOADING",
    payload: {
      loading: true,
      request
    }
  });

  const result = await getDestinationFlightSuggestions(request);

  postToDestinationHtml({
    type: "SKANDI_AMADEUS_OFFERS",
    payload: {
      ...result,
      request
    }
  });
}

function buildLiveOfferRequest(payload = {}) {
  const search = payload.search || payload;

  const selectedHotel = findById(
    DESTINATION_FINDER_DATA.hotels,
    search.hotelId || payload.hotelId
  );

  const selectedArea = findById(
    DESTINATION_FINDER_DATA.areas,
    search.areaId || payload.areaId || selectedHotel?.areaId
  );

  const selectedCountry = findById(
    DESTINATION_FINDER_DATA.countries,
    search.countryId || payload.countryId || selectedHotel?.countryId || selectedArea?.countryId
  );

  return {
    originIata:
      cleanIata(search.originIata || search.origin || search.fromIata) ||
      DEFAULT_ORIGIN_IATA,

    destinationIata:
      cleanIata(search.destinationIata || search.destination || search.toIata) ||
      cleanIata(selectedHotel?.destinationIata || selectedHotel?.airportIata || selectedHotel?.nearestAirportIata) ||
      cleanIata(selectedArea?.destinationIata || selectedArea?.airportIata || selectedArea?.nearestAirportIata || selectedArea?.iata) ||
      cleanIata(selectedCountry?.destinationIata || selectedCountry?.airportIata || selectedCountry?.iata),

    departureDate:
      cleanDate(search.departureDate || search.departure || search.fromDate),

    returnDate:
      cleanDate(search.returnDate || search.return || search.toDate),

    adults:
      clampNumber(search.adults, 1, 9, 1),

    children:
      clampNumber(search.children, 0, 8, 0),

    cabin:
      cleanCabin(search.cabin || search.travelClass),

    currency:
      String(search.currency || DEFAULT_CURRENCY).toUpperCase().slice(0, 3),

    nonStop:
      Boolean(search.nonStop),

    max:
      6
  };
}

async function getDestinationHotelFinderDataFromCms() {
  const [destinationItems, hotelItems, hotelCurations] = await Promise.all([
    queryAllSafe("Destinations"),
    queryAllSafe("Hotels"),
    queryAllSafe("HotelCurations")
  ]);

  const publicDestinations = destinationItems.filter(isVisible);
  const publicHotels = filterCuratedHotels(
    hotelItems.filter(isVisible),
    hotelCurations.filter(isVisible)
  );

  const countries = buildCountries(publicDestinations, publicHotels);
  const areas = buildAreas(publicDestinations, publicHotels, countries);
  const hotels = buildHotels(publicHotels, areas, countries);

  return {
    countries,
    areas,
    hotels
  };
}

async function queryAllSafe(collectionId) {
  try {
    let result = await wixData.query(collectionId).limit(1000).find();
    let items = result.items || [];

    while (result.hasNext()) {
      result = await result.next();
      items = items.concat(result.items || []);
    }

    return items;
  } catch (error) {
    console.warn(`[SKANDI Destinations] Could not query ${collectionId}:`, error.message);
    return [];
  }
}

function buildCountries(destinations, hotels) {
  const map = new Map();

  destinations.forEach((item) => {
    const countryName = isCountryDestination(item)
      ? first(item, ["country", "countryName", "title", "name"], "")
      : first(item, ["country", "countryName"], "");

    if (!countryName) return;

    const countryId =
      first(item, ["countryId"], "") ||
      slug(countryName);

    const existing = map.get(countryId);

    if (!existing || isCountryDestination(item)) {
      map.set(countryId, makeCountryObject(item, countryName, countryId));
    }
  });

  hotels.forEach((item) => {
    const countryName = first(item, ["country", "countryName"], "");
    if (!countryName) return;

    const countryId =
      first(item, ["countryId"], "") ||
      slug(countryName);

    if (!map.has(countryId)) {
      map.set(countryId, makeCountryObject(null, countryName, countryId));
    }
  });

  return Array.from(map.values());
}

function buildAreas(destinations, hotels, countries) {
  const map = new Map();

  destinations.forEach((item) => {
    if (isCountryDestination(item)) return;

    const countryName = first(item, ["country", "countryName"], "");
    const countryId =
      first(item, ["countryId"], "") ||
      slug(countryName);

    if (!countryId) return;

    const areaId =
      first(item, ["areaId", "destinationId", "code", "iata", "slug"], "") ||
      slug(first(item, ["title", "name"], ""));

    if (!areaId) return;

    map.set(areaId, makeAreaObject(item, countryId, areaId));
  });

  hotels.forEach((hotel) => {
    const countryName = first(hotel, ["country", "countryName"], "");
    const countryId =
      first(hotel, ["countryId"], "") ||
      slug(countryName) ||
      countries[0]?.id;

    const areaName =
      first(hotel, ["area", "destination", "destinationName", "city", "region"], "") ||
      "General area";

    const areaId =
      first(hotel, ["areaId", "destinationId", "destinationCode", "areaSlug"], "") ||
      slug(areaName);

    if (!countryId || !areaId) return;

    if (!map.has(areaId)) {
      map.set(areaId, {
        id: areaId,
        countryId,
        parentAreaId: first(hotel, ["parentAreaId", "parentDestinationId"], ""),
        name: areaName,
        region: first(hotel, ["region", "city"], areaName),
        duration: first(hotel, ["duration", "idealStay"], "7–10 nights"),
        tags: normalizeTags(first(hotel, ["tags", "hotelTags"], [])),
        image: toImageUrl(first(hotel, ["areaImage", "destinationImage", "image", "mainImage"], "")),
        title: `${areaName} hotels`,
        description: first(
          hotel,
          ["areaDescription", "destinationDescription", "summary", "description"],
          `Compare selected SKANDI hotels in ${areaName}.`
        ),
        bestFor: first(hotel, ["bestFor"], "Hotels, transfers and local stays"),
        stay: first(hotel, ["idealStay", "duration"], "7–10 nights"),
        airport: first(hotel, ["airport", "nearestAirport"], "Nearest airport"),
        airportIata: cleanIata(first(hotel, ["airportIata", "nearestAirportIata", "destinationIata"], "")),
        nearestAirportIata: cleanIata(first(hotel, ["nearestAirportIata", "airportIata", "destinationIata"], "")),
        destinationIata: cleanIata(first(hotel, ["destinationIata", "airportIata", "nearestAirportIata"], "")),
        transfer: first(hotel, ["transfer", "transferTime"], "Transfer time varies by hotel"),
        weather: first(hotel, ["weather", "season"], "Seasonal conditions vary"),
        coordinates: {
          latitude: toNumber(first(hotel, ["latitude", "lat"], null)),
          longitude: toNumber(first(hotel, ["longitude", "lng"], null))
        },
        map: first(hotel, ["map", "location"], areaName)
      });
    }
  });

  return Array.from(map.values());
}

function buildHotels(hotels, areas, countries) {
  return hotels.map((item) => {
    const areaId = resolveAreaIdForHotel(item, areas);
    const matchedArea = areas.find((area) => area.id === areaId);

    const countryName = first(item, ["country", "countryName"], "");
    const countryId =
      first(item, ["countryId"], "") ||
      matchedArea?.countryId ||
      slug(countryName) ||
      countries[0]?.id ||
      "global";

    const image = toImageUrl(first(item, ["image", "mainImage", "heroImage", "photo"], ""));

    return {
      id:
        first(item, ["hotelId", "code", "slug"], "") ||
        item._id,

      areaId,
      countryId,

      name: first(item, ["title", "name", "hotelName"], "Hotel"),
      location: first(item, ["location", "address", "area"], matchedArea?.name || ""),
      area: first(item, ["area", "destination", "city"], matchedArea?.name || ""),

      airportIata: cleanIata(first(item, ["airportIata", "nearestAirportIata", "destinationIata"], "")),
      nearestAirportIata: cleanIata(first(item, ["nearestAirportIata", "airportIata", "destinationIata"], "")),
      destinationIata: cleanIata(first(item, ["destinationIata", "airportIata", "nearestAirportIata"], "")),

      rating: toNumber(first(item, ["rating", "guestRating", "score"], 4.2)),
      tripadvisor: toNumber(first(item, ["tripadvisor", "tripAdvisor", "tripadvisorRating"], 4.3)),

      price: toNumber(first(item, ["price", "fromPrice", "startingPrice", "packagePrice"], 2495)),
      priceText: first(item, ["priceText", "fromPriceText"], ""),

      badge: first(item, ["badge", "label", "hotelBadge"], "SKANDI selected"),
      tags: normalizeTags(first(item, ["tags", "hotelTags", "features"], [])),

      image,
      gallery: buildGallery(item, image),

      short: first(
        item,
        ["short", "summary", "description"],
        "A SKANDI-selected hotel matched to this destination and travel style."
      ),

      bullets: buildBullets(item),
      facts: buildFacts(item),
      rooms: buildRooms(item, image),
      climate: toArray(first(item, ["climate", "weatherAverages"], [])),
      map: first(item, ["map", "mapQuery", "location"], first(item, ["title", "name"], "Hotel"))
    };
  });
}

function makeCountryObject(item, countryName, countryId) {
  const source = item || {};
  const image = toImageUrl(first(source, ["image", "mainImage", "heroImage"], ""));

  return {
    id: countryId,
    name: countryName,

    iata: cleanIata(first(source, ["iata", "airportIata", "nearestAirportIata", "destinationIata"], "")),
    airportIata: cleanIata(first(source, ["airportIata", "nearestAirportIata", "destinationIata", "iata"], "")),
    nearestAirportIata: cleanIata(first(source, ["nearestAirportIata", "airportIata", "destinationIata", "iata"], "")),
    destinationIata: cleanIata(first(source, ["destinationIata", "airportIata", "nearestAirportIata", "iata"], "")),

    eyebrow: first(source, ["eyebrow"], `${countryName} vacations`),
    title: first(source, ["headline", "title"], `${countryName} vacations with SKANDI.`),
    intro: first(
      source,
      ["intro", "summary", "description"],
      `Explore curated SKANDI trips, hotels, transfers and experiences in ${countryName}.`
    ),
    image,
    gallery: buildGallery(source, image),
    tags: normalizeTags(first(source, ["tags"], [])),
    bestFor: first(source, ["bestFor"], "Couples, families and custom trips"),
    idealStay: first(source, ["idealStay", "duration"], "7–12 nights"),
    route: first(source, ["route", "classicRoute"], "Flexible SKANDI itinerary"),
    style: first(source, ["style", "tripStyle"], "Beach, culture and hotels"),
    card: first(
      source,
      ["card", "cardText", "summary"],
      `${countryName} hotels, tours, transfers and curated vacation planning.`
    ),
    badgeTitle: first(source, ["badgeTitle"], "SKANDI destination"),
    badgeText: first(source, ["badgeText"], "Hotels, transfers, tours and support in one itinerary.")
  };
}

function makeAreaObject(item, countryId, areaId) {
  const image = toImageUrl(first(item, ["image", "mainImage", "heroImage"], ""));

  return {
    id: areaId,
    countryId,
    parentAreaId: first(item, ["parentAreaId", "parentDestinationId"], ""),
    name: first(item, ["title", "name"], "Area"),
    region: first(item, ["region", "city"], ""),
    duration: first(item, ["duration", "idealStay"], "7–10 nights"),
    tags: normalizeTags(first(item, ["tags"], [])),
    image,

    iata: cleanIata(first(item, ["iata", "airportIata", "nearestAirportIata", "destinationIata"], "")),
    airportIata: cleanIata(first(item, ["airportIata", "nearestAirportIata", "destinationIata", "iata"], "")),
    nearestAirportIata: cleanIata(first(item, ["nearestAirportIata", "airportIata", "destinationIata", "iata"], "")),
    destinationIata: cleanIata(first(item, ["destinationIata", "airportIata", "nearestAirportIata", "iata"], "")),

    title: first(item, ["headline", "title"], first(item, ["name"], "Area")),
    description: first(
      item,
      ["description", "summary", "intro"],
      "Compare hotels, transfer notes and travel fit for this area."
    ),
    bestFor: first(item, ["bestFor"], "Hotels and local experiences"),
    stay: first(item, ["stay", "idealStay", "duration"], "7–10 nights"),
    airport: first(item, ["airport", "nearestAirport"], "Nearest airport"),
    transfer: first(item, ["transfer", "transferTime"], "Transfer time varies"),
    weather: first(item, ["weather", "season"], "Seasonal weather varies"),
    coordinates: {
      latitude: toNumber(first(item, ["latitude", "lat"], null)),
      longitude: toNumber(first(item, ["longitude", "lng"], null))
    },
    map: first(item, ["map", "mapQuery"], first(item, ["title", "name"], ""))
  };
}

function resolveAreaIdForHotel(item, areas) {
  const raw =
    first(item, ["areaId", "destinationId", "destinationCode", "areaSlug"], "") ||
    slug(first(item, ["area", "destination", "destinationName", "city", "region"], ""));

  const direct = areas.find((area) => area.id === raw);
  if (direct) return direct.id;

  const bySlug = areas.find((area) => slug(area.name) === slug(raw));
  if (bySlug) return bySlug.id;

  return raw || areas[0]?.id || "general-area";
}

function buildGallery(item, fallbackImage) {
  const gallery = toArray(first(item, ["gallery", "images", "photos"], []))
    .map(toImageUrl)
    .filter(Boolean);

  if (!gallery.length && fallbackImage) {
    gallery.push(fallbackImage);
  }

  return gallery;
}

function buildBullets(item) {
  const bullets = toArray(first(item, ["bullets", "highlights", "features"], []))
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (bullets.length) return bullets.slice(0, 6);

  const tags = normalizeTags(first(item, ["tags", "hotelTags"], []));

  if (tags.length) {
    return tags.slice(0, 5).map(labelFromTag);
  }

  return [
    "SKANDI selected hotel",
    "Good destination fit",
    "Room and package details confirmed before booking"
  ];
}

function buildFacts(item) {
  const existing = toObject(first(item, ["facts", "hotelFacts"], {}));

  if (Object.keys(existing).length) {
    return existing;
  }

  return {
    category: first(item, ["category", "hotelType"], "Hotel"),
    boardBasis: first(item, ["boardBasis", "mealPlan"], "Varies by room"),
    beach: first(item, ["beach", "beachDistance"], "Check hotel details"),
    airport: first(item, ["airportDistance", "transferTime"], "Transfer varies"),
    pool: first(item, ["pool", "pools"], "Check hotel details"),
    family: first(item, ["family", "familyFriendly"], "Check hotel details")
  };
}

function buildRooms(item, fallbackImage) {
  const rawRooms = toArray(first(item, ["rooms", "roomTypes", "availableRooms"], []));

  if (!rawRooms.length) {
    return [
      {
        name: "Standard Room",
        image: fallbackImage,
        bullets: ["Room category confirmed before payment", "Meal plan varies by offer"]
      }
    ];
  }

  return rawRooms.map((room) => {
    if (typeof room === "string") {
      return {
        name: room,
        image: fallbackImage,
        bullets: ["Room details confirmed before payment"]
      };
    }

    return {
      name: first(room, ["name", "title", "roomName"], "Room"),
      image: toImageUrl(first(room, ["image", "photo"], fallbackImage)),
      bullets: toArray(first(room, ["bullets", "features"], []))
    };
  });
}

function filterCuratedHotels(hotels, curations) {
  const selectedIds = new Set();

  curations.forEach((item) => {
    [
      ...toArray(item.hotelIds),
      ...toArray(item.hotels),
      ...toArray(item.selectedHotels)
    ].forEach((value) => {
      const id = extractReferenceId(value);
      if (id) selectedIds.add(String(id));
    });
  });

  if (!selectedIds.size) {
    return hotels;
  }

  return hotels.filter((hotel) => {
    const ids = [
      hotel._id,
      hotel.hotelId,
      hotel.code,
      hotel.slug,
      hotel.title,
      hotel.name
    ].filter(Boolean).map(String);

    return ids.some((id) => selectedIds.has(id));
  });
}

function extractReferenceId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value._id || value.id || value.hotelId || value.code || value.slug || "";
  }

  return String(value);
}

function isCountryDestination(item) {
  const type = String(first(item, ["destinationType", "type", "level", "kind"], "")).toUpperCase();

  return (
    type === "COUNTRY" ||
    type === "COUNTRY_PAGE" ||
    type === "DESTINATION_COUNTRY" ||
    item.isCountry === true
  );
}

function isVisible(item) {
  if (!item) return false;

  if (item.active === false) return false;
  if (item.published === false) return false;
  if (item.publicVisible === false) return false;
  if (item.showOnNetwork === false) return false;
  if (item.hidden === true) return false;
  if (item.archived === true) return false;

  return true;
}

function postToDestinationHtml(message) {
  const html = safeElement(HTML_ID);
  const safeMessage = {
    source: PARENT_SOURCE,
    timestamp: new Date().toISOString(),
    ...(message || {})
  };

  if (html?.postMessage) {
    html.postMessage(safeMessage);
  }
}

function findById(items, id) {
  if (!id) return null;
  return (items || []).find((item) => String(item.id) === String(id)) || null;
}

function first(item, keys, fallback = "") {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function toArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        // Continue to comma split.
      }
    }

    return trimmed
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [value];
}

function toObject(value) {
  if (!value) return {};

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  return {};
}

function normalizeTags(value) {
  return toArray(value)
    .map((tag) => slug(tag))
    .filter(Boolean);
}

function labelFromTag(tag) {
  return String(tag)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanIata(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

function cleanDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function cleanCabin(value) {
  const cabin = String(value || "").trim().toUpperCase();

  if (["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"].includes(cabin)) {
    return cabin;
  }

  return "ECONOMY";
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(Math.max(Math.round(number), min), max);
}

function toImageUrl(value) {
  if (!value) return FALLBACK_IMAGE;

  if (typeof value === "object") {
    const src = value.src || value.url || value.fileUrl || "";
    return toImageUrl(src);
  }

  const url = String(value);

  if (url.startsWith("http")) {
    return url;
  }

  if (url.startsWith("wix:image://v1/")) {
    const mediaPart = url
      .replace("wix:image://v1/", "")
      .split("/")[0]
      .split("#")[0];

    if (mediaPart) {
      return `https://static.wixstatic.com/media/${mediaPart}`;
    }
  }

  return url || FALLBACK_IMAGE;
}

function safeElement(id) {
  try {
    return $w(id);
  } catch (error) {
    return null;
  }
}
