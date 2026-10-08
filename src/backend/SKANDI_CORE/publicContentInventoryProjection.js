// /src/backend/SKANDI_CORE/publicContentInventoryProjection.js
// SKANDI V12 — canonical Inventory/Supabase projection adapter for public Travel Info.
//
// Data authority:
//   Duffel -> Inventory Control -> Supabase canonical record -> public consumers.
//
// This module does not create a second content model. It only overlays the publicContent
// Travel Info payload with the canonical `inventory_details` / `media_assets` values from
// the same travel_info_airlines and travel_info_airports rows. Legacy flat columns remain
// compatibility projections maintained by the accompanying database migration.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer";

const ACTIVE = "eq.true";
const PUBLISHED = "eq.PUBLISHED";

const clean = (value, max = 12000) => String(value ?? "").trim().slice(0, max);
const upper = (value, max = 120) => clean(value, max).toUpperCase();
const arr = value => Array.isArray(value) ? value : [];
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

function first(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function canonical(details, key, ...fallbacks) {
  return first(details?.[key], ...fallbacks);
}

function structured(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); }
  catch (_) { return value; }
}

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function section(value, title = "") {
  if (value === undefined || value === null || value === "") return null;
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return { ...(title ? { title } : {}), body: clean(value, 16000) };
}

function canonicalSections(details = {}) {
  const stored = structured(details.sectionsJson, {});
  const sections = stored && typeof stored === "object" && !Array.isArray(stored) ? { ...stored } : {};
  const map = [
    ["arrival", "arrivalInfo", "Arrival"],
    ["departure", "departureInfo", "Departure"],
    ["checkin", "checkinInfo", "Check-in"],
    ["security", "securityInfo", "Security"],
    ["transfer", "transferInfo", "Transfer"],
    ["transport", "transportInfo", "Transport"],
    ["parking", "parkingInfo", "Parking"],
    ["wifi", "wifi", "Wi-Fi"],
    ["accessibility", "accessibility", "Accessibility"],
    ["assistance", "specialAssistance", "Special assistance"]
  ];
  for (const [sectionKey, detailKey, title] of map) {
    if (sections[sectionKey] !== undefined && sections[sectionKey] !== null && sections[sectionKey] !== "") continue;
    const next = section(details[detailKey], title);
    if (next) sections[sectionKey] = next;
  }
  return sections;
}

function mediaUrl(row = {}, preferredRoles = []) {
  const media = arr(row.media_assets).filter(item => item && item.active !== false && clean(item.url, 3000));
  for (const role of preferredRoles) {
    const wanted = upper(role, 40);
    const hit = media.find(item => upper(item.role, 40) === wanted);
    if (hit) return clean(hit.url, 3000);
  }
  const semantic = media.find(item => item.isHero === true || item.isPrimary === true || item.isCard === true);
  return clean(semantic?.url || media[0]?.url, 3000);
}

function publicBaggage(value) {
  const parsed = structured(value, null);
  if (Array.isArray(parsed)) {
    const cabins = parsed.slice(0, 20).map(cabin => ({
      cabinType: clean(first(cabin?.cabin_type, cabin?.cabinType, cabin?.travel_class, cabin?.travelClass), 250),
      travelClass: clean(first(cabin?.travel_class, cabin?.travelClass, cabin?.cabin_type, cabin?.cabinType), 250),
      fares: arr(cabin?.fares).slice(0, 30).map(fare => {
        const allowance = obj(first(fare?.baggage_allowance, fare?.baggageAllowance));
        return {
          name: clean(fare?.name, 250),
          description: clean(fare?.description, 2500),
          underSeatBag: clean(first(allowance.under_seat_bag, allowance.underSeatBag), 1200),
          overheadCarryOn: clean(first(allowance.overhead_carry_on, allowance.overheadCarryOn), 1200),
          checkedBag: clean(first(allowance.checked_bag, allowance.checkedBag), 1200)
        };
      }).filter(fare => fare.name || fare.underSeatBag || fare.overheadCarryOn || fare.checkedBag)
    })).filter(cabin => cabin.cabinType || cabin.fares.length);
    if (cabins.length) return { mode: "structured", cabins };
  }
  const text = typeof parsed === "string" ? clean(parsed, 16000) : clean(value, 16000);
  return text ? { mode: "narrative", text } : { mode: "none" };
}

async function referenceRows() {
  const [airlines, airports, masters] = await Promise.all([
    restRequest({
      table: "travel_info_airlines",
      method: "GET",
      query: {
        select: "ID,Title,shortName,iataCode,icaoCode,source,source_reference,inventory_details,media_assets,sort_order",
        active: ACTIVE,
        customer_visible: ACTIVE,
        status: PUBLISHED,
        order: "sort_order.asc",
        limit: "250"
      },
      prefer: ""
    }),
    restRequest({
      table: "travel_info_airports",
      method: "GET",
      query: {
        select: "ID,title,iata,icao,source,source_reference,inventory_details,media_assets,sort_order",
        active: ACTIVE,
        customer_visible: ACTIVE,
        status: PUBLISHED,
        order: "sort_order.asc",
        limit: "500"
      },
      prefer: ""
    }),
    restRequest({
      table: "inventory_public_entities_v",
      method: "GET",
      query: {
        select: "id,entity_type,code,name,slug,details,localized,media,sort_priority",
        entity_type: "in.(HOTEL,TRANSFER,GUIDED_TOUR,ACTIVITY,PARTNER_TICKET)",
        order: "sort_priority.asc,name.asc",
        limit: "2000"
      },
      prefer: ""
    })
  ]);
  return {
    airlines: Array.isArray(airlines) ? airlines : [],
    airports: Array.isArray(airports) ? airports : [],
    masters: Array.isArray(masters) ? masters : []
  };
}

function indexes(rows, codeField, nameField) {
  const byId = new Map();
  const byCode = new Map();
  const byName = new Map();
  for (const row of rows) {
    const id = clean(row.ID || row.id, 180);
    const code = upper(row[codeField], 12);
    const name = clean(row[nameField], 500).toLowerCase();
    if (id) byId.set(id, row);
    if (code) byCode.set(code, row);
    if (name) byName.set(name, row);
  }
  return { byId, byCode, byName };
}

function matchReference(item = {}, index, codeFields = []) {
  const id = clean(item.id, 180);
  if (id && index.byId.has(id)) return index.byId.get(id);
  for (const field of codeFields) {
    const code = upper(item[field], 12);
    if (code && index.byCode.has(code)) return index.byCode.get(code);
  }
  const name = clean(first(item.name, item.title, item.shortName), 500).toLowerCase();
  return name ? index.byName.get(name) || null : null;
}

function projectAirline(item = {}, row = {}) {
  const d = obj(row.inventory_details);
  const baggage = publicBaggage(canonical(d, "baggageAllowance", item.baggageAllowance));
  const hero = mediaUrl(row, ["HERO", "PRIMARY", "CARD"]);
  const logo = mediaUrl(row, ["LOGO"]);
  const icon = mediaUrl(row, ["THUMBNAIL", "ICON", "LOGO"]);
  const sections = structured(canonical(d, "sectionsJson", item.sections), {});
  return {
    ...item,
    id: clean(row.ID || item.id, 180),
    name: clean(first(row.Title, d.shortName, item.name), 500),
    title: clean(first(row.Title, d.shortName, item.title, item.name), 500),
    shortName: clean(canonical(d, "shortName", row.shortName, item.shortName), 250),
    iataCode: upper(first(row.iataCode, item.iataCode), 8),
    icaoCode: upper(first(d.icaoCode, row.icaoCode, item.icaoCode), 12),
    code: upper(first(row.iataCode, item.code), 8),
    alliance: clean(canonical(d, "alliance", item.alliance), 180),
    website: clean(canonical(d, "website", item.website), 2000),
    contactUrl: clean(canonical(d, "contactUrl", item.contactUrl), 2000),
    summary: clean(canonical(d, "summary", item.summary), 5000),
    primaryColor: clean(canonical(d, "primaryColor", item.primaryColor), 40),
    accentColor: clean(canonical(d, "accentColor", item.accentColor), 40),
    logo: clean(first(logo, item.logo), 3000),
    logoIcon: clean(first(icon, item.logoIcon, logo), 3000),
    heroImage: clean(first(hero, item.heroImage), 3000),
    checkInDeadline: clean(canonical(d, "checkIn", d.checkInDeadline, item.checkInDeadline), 5000),
    boarding: canonical(d, "boarding", item.boarding),
    lounges: structured(canonical(d, "lounges", item.lounges), []),
    cabins: structured(canonical(d, "cabinsJson", item.cabins), []),
    sections: sections && typeof sections === "object" ? sections : {},
    fleetSummary: structured(canonical(d, "fleetSummaryJson", item.fleetSummary), []),
    baggage,
    baggageAllowance: baggage.mode === "narrative" ? baggage.text : "",
    mealInfo: structured(canonical(d, "foodDrinksJson", item.mealInfo), {}),
    wifiInfo: structured(canonical(d, "wifiOnboardJson", item.wifiInfo), {}),
    childrenInfants: structured(canonical(d, "childrenInfantsJson", item.childrenInfants), {}),
    ticketTypes: structured(canonical(d, "ticketTypesJson", item.ticketTypes), {}),
    loyaltyProgram: clean(canonical(d, "loyaltyProgram", item.loyaltyProgram), 500),
    loyaltyProgramUrl: clean(canonical(d, "loyaltyProgramUrl", item.loyaltyProgramUrl), 2000),
    hubs: structured(canonical(d, "hubsJson", item.hubs), []),
    specialAssistance: canonical(d, "specialAssistance", item.specialAssistance),
    sortOrder: finite(row.sort_order, item.sortOrder ?? 100),
    canonicalSource: "INVENTORY_CONTROL_SUPABASE"
  };
}

function projectAirport(item = {}, row = {}) {
  const d = obj(row.inventory_details);
  const sections = canonicalSections(d);
  const hero = mediaUrl(row, ["HERO", "PRIMARY", "CARD"]);
  const logo = mediaUrl(row, ["LOGO"]);
  const overview = canonical(d, "information", d.summary, item.body, item.summary);
  return {
    ...item,
    id: clean(row.ID || item.id, 180),
    name: clean(first(row.title, item.name), 500),
    title: clean(first(row.title, item.title, item.name), 500),
    iata: upper(first(row.iata, item.iata), 8),
    iataCode: upper(first(row.iata, item.iataCode), 8),
    icao: upper(first(d.icaoCode, row.icao, item.icao), 12),
    icaoCode: upper(first(d.icaoCode, row.icao, item.icaoCode), 12),
    code: upper(first(row.iata, item.code), 8),
    city: clean(canonical(d, "city", item.city), 250),
    country: clean(canonical(d, "country", d.countryCode, item.country), 250),
    latitude: finite(canonical(d, "latitude", item.latitude), null),
    longitude: finite(canonical(d, "longitude", item.longitude), null),
    distanceToCityCenterKm: finite(canonical(d, "distanceToCityCenterKm", item.distanceToCityCenterKm), null),
    website: clean(canonical(d, "website", item.website), 2000),
    contactUrl: clean(canonical(d, "contactUrl", item.contactUrl), 2000),
    summary: clean(canonical(d, "summary", item.summary, overview), 7000),
    body: clean(overview, 16000),
    information: canonical(d, "information", item.information, overview),
    primaryColor: clean(canonical(d, "primaryColor", item.primaryColor), 40),
    accentColor: clean(canonical(d, "accentColor", item.accentColor), 40),
    heroImage: clean(first(hero, item.heroImage), 3000),
    image: clean(first(hero, item.image), 3000),
    logo: clean(first(logo, item.logo), 3000),
    sections,
    arrival: canonical(d, "arrivalInfo", item.arrival),
    departure: canonical(d, "departureInfo", item.departure),
    checkIn: canonical(d, "checkinInfo", d.checkInInfo, item.checkIn),
    security: canonical(d, "securityInfo", item.security),
    transfer: canonical(d, "transferInfo", item.transfer),
    wifi: canonical(d, "wifi", item.wifi),
    accessibility: canonical(d, "accessibility", item.accessibility),
    parkingInfo: canonical(d, "parkingInfo", item.parkingInfo),
    lounges: structured(canonical(d, "lounges", item.lounges), []),
    terminals: structured(canonical(d, "terminalsJson", item.terminals), []),
    transport: structured(canonical(d, "transportJson", item.transport), []),
    airportHotels: structured(canonical(d, "airportHotels", item.airportHotels), []),
    foodDrinks: structured(canonical(d, "foodDrinksJson", item.foodDrinks), []),
    lostFound: structured(canonical(d, "lostFoundJson", item.lostFound), {}),
    destinationsServing: structured(canonical(d, "destinationsServing", item.destinationsServing), []),
    timezone: clean(canonical(d, "timezone", item.timezone), 160),
    sortOrder: finite(row.sort_order, item.sortOrder ?? 100),
    canonicalSource: "INVENTORY_CONTROL_SUPABASE"
  };
}

function localizedMaster(row = {}, language = "EN") {
  const wanted = upper(language, 8) || "EN";
  const localized = arr(row.localized);
  return obj(
    localized.find(item => upper(item?.language, 8) === wanted) ||
    localized.find(item => upper(item?.language, 8) === "EN") ||
    localized[0]
  );
}

function masterMediaUrl(row = {}) {
  const media = arr(row.media);
  const preferred = media.find(item => item?.isPrimary === true || item?.is_primary === true || upper(item?.role, 40) === "PRIMARY") ||
    media.find(item => item?.isHero === true || item?.is_hero === true || upper(item?.role, 40) === "HERO") ||
    media.find(item => item?.isCard === true || item?.is_card === true || upper(item?.role, 40) === "CARD") ||
    media[0] || {};
  return clean(first(preferred.publicUrl, preferred.public_url, preferred.url, preferred.imageUrl, preferred.image_url), 3000);
}

function projectMaster(row = {}, language = "EN") {
  const d = obj(row.details);
  const localized = localizedMaster(row, language);
  const image = masterMediaUrl(row);
  const title = clean(first(localized.pageTitle, localized.title, row.name, row.code), 500);
  const body = clean(first(
    localized.fullDescription,
    localized.full_description,
    localized.description,
    localized.shortDescription,
    localized.short_description,
    d.information,
    d.description,
    d.summary
  ), 16000);
  const summary = clean(first(localized.shortDescription, localized.short_description, d.summary, body), 3000);
  return {
    ...d,
    id: clean(row.id, 180),
    code: clean(row.code, 180),
    entityType: upper(row.entity_type, 80),
    title,
    name: title,
    slug: clean(row.slug, 300),
    category: upper(row.entity_type, 80),
    body,
    description: body,
    summary,
    image,
    image_url: image,
    heroImage: image,
    sections: structured(first(d.sections, d.sectionsJson), {}),
    sortOrder: finite(row.sort_priority, 100),
    canonicalSource: "INVENTORY_CONTROL_SUPABASE"
  };
}

function masterLibraries(rows = [], language = "EN") {
  const groups = { hotels: [], transfers: [], tours: [], activities: [], tickets: [] };
  const keyFor = {
    HOTEL: "hotels",
    TRANSFER: "transfers",
    GUIDED_TOUR: "tours",
    ACTIVITY: "activities",
    PARTNER_TICKET: "tickets"
  };
  for (const row of rows) {
    const key = keyFor[upper(row?.entity_type, 80)];
    if (key) groups[key].push(projectMaster(row, language));
  }
  return groups;
}

export async function applyInventoryAuthorityToTravelInfoCore(payload = {}) {
  const result = payload && typeof payload === "object" ? payload : {};
  const refs = await referenceRows();
  const airlineIndex = indexes(refs.airlines, "iataCode", "Title");
  const airportIndex = indexes(refs.airports, "iata", "title");
  const masters = masterLibraries(refs.masters, result.language || "EN");
  return {
    ...result,
    airlines: arr(result.airlines).map(item => {
      const row = matchReference(item, airlineIndex, ["iataCode", "code"]);
      return row ? projectAirline(item, row) : item;
    }),
    airports: arr(result.airports).map(item => {
      const row = matchReference(item, airportIndex, ["iata", "iataCode", "code"]);
      return row ? projectAirport(item, row) : item;
    }),
    hotels: masters.hotels,
    transfers: masters.transfers,
    tours: masters.tours,
    activities: masters.activities,
    tickets: masters.tickets,
    dataAuthority: "DUFFEL_TO_INVENTORY_CONTROL_TO_SUPABASE_TO_CONSUMERS"
  };
}
