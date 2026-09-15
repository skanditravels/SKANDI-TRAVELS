// /src/backend/SKANDI_CORE/publicContent.js
// SKANDI Backend Base 1.0 — B-011.1 public experience read core.
//
// One public-content authority for About, SKANDI Collection and Travel Info.
// Reads only existing public-safe Inventory/Travel Info projections through the
// canonical Supabase transport. No page routing, booking mutation, support
// mutation, provider secrets, supplier costs or operational fields live here.

import { rpcRequest, restRequest } from "backend/SKANDI_CORE/supabaseServer.js";
import { checkExternalTravelRequirements } from "backend/SKANDI_CORE/travelRequirements.js";

export const PUBLIC_CONTENT_VERSION = "BACKEND-BASE-1.0-B011.2";

const READ_RPCS = new Set(["get_public_about_payload", "get_public_network_map_payload"]);
const COLLECTION_TYPES = "in.(SKANDI_COLLECTION,SKANDI_PARTNER)";
const PUBLISHED = "eq.PUBLISHED";
const ACTIVE = "eq.true";
const MAX_PUBLIC_ROWS = "1000";

const clean = (value, max = 6000) => String(value ?? "").trim().slice(0, max);
const upper = (value, max = 120) => clean(value, max).toUpperCase();
const arr = value => Array.isArray(value) ? value : [];
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function jsonValue(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); }
  catch (_) { return fallback; }
}

function first(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "";
}

async function select(table, query = {}) {
  const result = await restRequest({ table, method: "GET", query, prefer: "" });
  return Array.isArray(result) ? result : [];
}

export async function callPublicContentRpc(functionName) {
  if (!READ_RPCS.has(functionName)) throw new Error("PUBLIC_CONTENT_RPC_NOT_ALLOWED");
  return rpcRequest({ functionName, body: {} });
}

function localizedRecord(row = {}, language = "EN") {
  const wanted = upper(language, 5) || "EN";
  const localized = arr(row.localized);
  return obj(
    localized.find(item => upper(item?.language, 5) === wanted) ||
    localized.find(item => upper(item?.language, 5) === "EN") ||
    localized[0]
  );
}

function publicImage(row = {}) {
  const details = obj(row.details);
  const media = arr(row.media);
  const preferred = media.find(item => item?.isPrimary === true || item?.is_primary === true) || media[0] || {};
  return clean(first(
    preferred.publicUrl,
    preferred.public_url,
    preferred.imageUrl,
    preferred.image_url,
    preferred.url,
    details.heroImageUrl,
    details.hero_image_url
  ), 2000);
}

function collectionTypeFor(entityType) {
  switch (upper(entityType, 80)) {
    case "DESTINATION": case "COUNTRY": case "AREA": return "destinations";
    case "HOTEL": return "hotels";
    case "GUIDED_TOUR": case "TOUR": case "ACTIVITY": case "PARTNER_TICKET": return "tours";
    case "AIRLINE": return "airlines";
    case "AIRPORT": return "airports";
    case "PACKAGE": return "packages";
    case "TRANSFER": return "transfers";
    case "CAR_RENTAL": return "car-rental";
    default: return "selected";
  }
}

function routeKeyFor(entityType) {
  switch (upper(entityType, 80)) {
    case "DESTINATION": case "COUNTRY": case "AREA": return "destinations";
    case "HOTEL": return "hotels";
    case "GUIDED_TOUR": case "TOUR": case "ACTIVITY": case "PARTNER_TICKET": return "tours";
    case "AIRLINE": case "AIRPORT": return "travelInfo";
    case "PACKAGE": return "packages";
    case "TRANSFER": return "transfers";
    case "CAR_RENTAL": return "carRental";
    default: return "";
  }
}

function collectionItem(row = {}, language = "EN") {
  const details = obj(row.details);
  const payload = obj(row.payload);
  const localized = localizedRecord(row, language);
  const catalogType = upper(row.collection_type || payload.catalogType, 80);
  const tier = catalogType === "SKANDI_PARTNER"
    ? "PARTNER"
    : upper(first(details.skandiTier, details.partnerTier, row.partner_tier), 80);

  return {
    id: clean(row.id, 160),
    publicId: clean(row.public_id, 200),
    entityType: upper(row.entity_type, 80),
    type: collectionTypeFor(row.entity_type),
    routeKey: routeKeyFor(row.entity_type),
    typeLabel: clean(row.entity_type, 100).replace(/_/g, " "),
    code: clean(row.code, 100),
    slug: clean(row.slug, 300),
    title: clean(first(localized.pageTitle, localized.title, row.name, row.code), 500),
    summary: clean(first(localized.shortDescription, localized.short_description, localized.fullDescription, localized.description, details.summary), 2000),
    city: clean(first(details.city, details.locationCity), 200),
    country: clean(first(details.countryName, details.country), 200),
    imageUrl: publicImage(row),
    tier,
    catalogType,
    collectionLabel: clean(first(payload.publicLabel, catalogType === "SKANDI_PARTNER" ? "SKANDI Partners" : "SKANDI Collection"), 180),
    featured: row.featured === true,
    searchPriority: num(row.search_priority, 100)
  };
}

export async function getPublicSkandiCollectionCore(input = {}) {
  const language = upper(input.language || "EN", 5) || "EN";
  const rows = await select("inventory_searchable_catalog_v", {
    select: "id,public_id,entity_type,code,name,slug,status,active,customer_visible,searchable,collection_type,partner_tier,search_priority,featured,details,payload,localized,media",
    status: PUBLISHED,
    active: ACTIVE,
    customer_visible: ACTIVE,
    searchable: ACTIVE,
    collection_type: COLLECTION_TYPES,
    order: "search_priority.asc,name.asc",
    limit: MAX_PUBLIC_ROWS
  });

  const items = rows.map(row => collectionItem(row, language)).filter(item => item.title);
  const tiers = items.reduce((memo, item) => {
    const key = item.tier || "UNASSIGNED";
    memo[key] = (memo[key] || 0) + 1;
    return memo;
  }, {});
  const counts = items.reduce((memo, item) => {
    memo[item.type] = (memo[item.type] || 0) + 1;
    return memo;
  }, {});

  return {
    ok: true,
    source: "SUPABASE_INVENTORY_SEARCHABLE_CATALOG",
    version: PUBLIC_CONTENT_VERSION,
    language,
    items,
    collectionItems: items.filter(item => item.catalogType === "SKANDI_COLLECTION"),
    partners: items.filter(item => item.catalogType === "SKANDI_PARTNER"),
    tiers,
    counts,
    settings: {},
    generatedAt: new Date().toISOString()
  };
}

export async function getPublicAboutPayloadCore(input = {}) {
  const [about, collection] = await Promise.all([
    callPublicContentRpc("get_public_about_payload"),
    getPublicSkandiCollectionCore(input)
  ]);

  const base = obj(about);
  return {
    ...base,
    ok: base.ok !== false,
    source: "SKANDI_PUBLIC_CONTENT",
    version: PUBLIC_CONTENT_VERSION,
    partners: collection.partners,
    collection: {
      items: collection.collectionItems,
      tiers: collection.tiers,
      counts: collection.counts
    },
    generatedAt: new Date().toISOString()
  };
}

function genericTravelRow(row = {}) {
  return {
    id: clean(row.id || row.ID, 160),
    title: clean(first(row.title, row.Title, row.name), 500),
    slug: clean(row.slug, 300),
    category: clean(row.category, 160),
    body: clean(first(row.body, row.summary, row.information), 12000),
    summary: clean(first(row.summary, row.subtitle, row.body), 2500),
    image: clean(first(row.image_url, row.heroImageUrl, row.hero_image_url), 2000),
    image_url: clean(first(row.image_url, row.heroImageUrl, row.hero_image_url), 2000),
    sortOrder: num(first(row.sort_order, row.sortOrder), 100)
  };
}

function publicBaggagePayload(value) {
  const parsed = jsonValue(value, null);
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
  const text = clean(value, 16000);
  return text ? { mode: "narrative", text } : { mode: "none" };
}

function publicAirline(row = {}) {
  const baggage = publicBaggagePayload(row.baggageAllowence);
  const cabins = jsonValue(row.cabinsJson, []);
  const sections = jsonValue(row.sectionsJson, {});
  const fleet = jsonValue(row.fleetSummaryJson, []);
  return {
    id: clean(row.ID || row.id, 160),
    name: clean(first(row.Title, row.shortName, row.iataCode), 500),
    title: clean(first(row.Title, row.shortName, row.iataCode), 500),
    shortName: clean(row.shortName, 250),
    iataCode: upper(row.iataCode, 8),
    icaoCode: upper(row.icaoCode, 12),
    code: upper(row.iataCode, 8),
    alliance: clean(row.alliance, 180),
    website: clean(row.website, 2000),
    contactUrl: clean(row.contactUrl, 2000),
    summary: clean(row.summary, 5000),
    primaryColor: clean(row.primaryColor, 40),
    accentColor: clean(row.accentColor, 40),
    logo: clean(first(row.logoFile, row.logoIcon), 2000),
    logoIcon: clean(row.logoIcon, 2000),
    heroImage: clean(row.heroAircraftUrl, 2000),
    checkInDeadline: clean(row.checkInDeadline, 2500),
    boarding: clean(row.boarding, 5000),
    lounges: jsonValue(row.lounges, []),
    cabins,
    sections,
    fleetSummary: fleet,
    baggage,
    baggageAllowance: baggage.mode === "narrative" ? baggage.text : "",
    mealInfo: jsonValue(row.foodDrinksJson, {}),
    wifiInfo: jsonValue(row.wifiOnboardJson, {}),
    childrenInfants: jsonValue(row.childrenInfantsJson, {}),
    ticketTypes: jsonValue(row.ticketTypesJson, {}),
    loyaltyProgram: clean(row.loyaltyProgram, 500),
    loyaltyProgramUrl: clean(row.loyaltyProgramUrl, 2000),
    hubs: jsonValue(row.hubsJson, []),
    sortOrder: num(row.sort_order, 100)
  };
}

function publicAirport(row = {}) {
  return {
    id: clean(row.ID || row.id, 160),
    name: clean(first(row.title, row.iata), 500),
    title: clean(first(row.title, row.iata), 500),
    iata: upper(row.iata, 8),
    iataCode: upper(row.iata, 8),
    icao: upper(row.icao, 12),
    icaoCode: upper(row.icao, 12),
    code: upper(row.iata, 8),
    city: clean(row.locationCity, 250),
    country: clean(row.country, 250),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    distanceToCityCenterKm: row.distanceToCityCenterKm ?? null,
    website: clean(row.website, 2000),
    contactUrl: clean(row.contactUrl, 2000),
    summary: clean(first(row.summary, row.body, row.information), 7000),
    body: clean(first(row.body, row.information, row.summary), 12000),
    heroImage: clean(first(row.heroImageUrl, row.image_url), 2000),
    image: clean(first(row.heroImageUrl, row.image_url), 2000),
    lounges: jsonValue(row.lounges, []),
    terminals: jsonValue(row.terminalsJson, []),
    transport: jsonValue(row.transportJson, []),
    airportHotels: jsonValue(row.airportHotels, []),
    foodDrinks: jsonValue(row.foodDrinksJson, []),
    lostFound: jsonValue(row.lostFoundJson, {}),
    destinationsServing: jsonValue(row.destinationsServing, []),
    timezone: clean(row.timezone, 160),
    sortOrder: num(first(row.sort_order, row.sortOrder), 100)
  };
}

async function loadPublicTravelInfoRows() {
  const [airlines, airports, hotels, transfers, tours, activities, tickets, articles, groups, topics, requirements] = await Promise.all([
    select("travel_info_airlines", { select: "*", active: ACTIVE, customer_visible: ACTIVE, status: PUBLISHED, order: "sort_order.asc", limit: "250" }),
    select("travel_info_airports", { select: "*", active: ACTIVE, customer_visible: ACTIVE, status: PUBLISHED, order: "sort_order.asc", limit: "500" }),
    select("travel_info_hotels", { select: "id,title,slug,category,body,image_url,active,sort_order", active: ACTIVE, order: "sort_order.asc", limit: "500" }),
    select("travel_info_transfers", { select: "id,title,slug,category,body,image_url,active,sort_order", active: ACTIVE, order: "sort_order.asc", limit: "500" }),
    select("travel_info_tours", { select: "id,title,slug,category,body,image_url,active,sort_order", active: ACTIVE, order: "sort_order.asc", limit: "500" }),
    select("travel_info_activities", { select: "id,title,slug,category,body,image_url,active,sort_order", active: ACTIVE, order: "sort_order.asc", limit: "500" }),
    select("travel_info_tickets", { select: "id,title,slug,category,body,image_url,active,sort_order", active: ACTIVE, order: "sort_order.asc", limit: "500" }),
    select("travel_info_articles", { select: "id,title,slug,category,body,image_url,excerpt,path,kicker,tags,active,status,customer_visible,homepage_featured,sort_order", active: ACTIVE, customer_visible: ACTIVE, status: PUBLISHED, order: "sort_order.asc", limit: "1000" }),
    select("travel_info_faq_groups", { select: "id,group_id,title,subtitle,eyebrow,icon,active,sort_order", active: ACTIVE, order: "sort_order.asc", limit: "100" }),
    select("travel_info_faq", { select: "id,title,slug,category,body,image_url,active,sort_order,topicId,groupId,subtitle,bulletsJson,tags,featured,actionType,actionTarget,linkedLibrary", active: ACTIVE, order: "sort_order.asc", limit: "1000" }),
    select("travel_requirements", { select: "id,title,slug,category,body,image_url,active,sort_order", active: ACTIVE, order: "sort_order.asc", limit: "1000" })
  ]);

  return {
    airlines: airlines.map(publicAirline),
    airports: airports.map(publicAirport),
    hotels: hotels.map(genericTravelRow),
    transfers: transfers.map(genericTravelRow),
    tours: tours.map(genericTravelRow),
    activities: activities.map(genericTravelRow),
    tickets: tickets.map(genericTravelRow),
    articles: articles.map(row => ({ ...genericTravelRow(row), excerpt: clean(row.excerpt, 2500), path: clean(row.path, 500), kicker: clean(row.kicker, 300), tags: arr(row.tags) })),
    helpCenter: {
      groups: groups.map(row => ({ id: clean(row.group_id || row.id, 160), groupId: clean(row.group_id || row.id, 160), title: clean(row.title, 500), subtitle: clean(row.subtitle, 2500), eyebrow: clean(row.eyebrow, 300), icon: clean(row.icon, 120), sortOrder: num(row.sort_order, 100) })),
      topics: topics.map(row => ({ id: clean(row.id, 160), topicId: clean(row.topicId || row.id, 160), groupId: clean(row.groupId, 160), title: clean(row.title, 500), subtitle: clean(row.subtitle, 2500), body: clean(row.body, 12000), category: clean(row.category, 160), image: clean(row.image_url, 2000), bullets: jsonValue(row.bulletsJson, []), tags: clean(row.tags, 2000), featured: row.featured === true, actionType: clean(row.actionType, 100), actionTarget: clean(row.actionTarget, 500), linkedLibrary: clean(row.linkedLibrary, 100), sortOrder: num(row.sort_order, 100) }))
    },
    travelRequirements: requirements.map(genericTravelRow)
  };
}

export async function getPublicTravelInfoPayloadCore(input = {}) {
  const language = upper(input.language || "EN", 5) || "EN";
  const payload = await loadPublicTravelInfoRows();
  return {
    ok: true,
    source: "SUPABASE_TRAVEL_INFO",
    version: PUBLIC_CONTENT_VERSION,
    language,
    ...payload,
    generatedAt: new Date().toISOString()
  };
}

function publicAircraft(row = {}) {
  return {
    id: clean(row.id, 160), airlineId: clean(row.airline_id, 160), airlineCode: upper(row.airline_code, 8),
    aircraftCode: upper(row.aircraft_code, 30), aircraftName: clean(row.aircraft_name, 500), manufacturer: clean(row.manufacturer, 250),
    family: clean(row.family, 250), variant: clean(row.variant, 250), totalSeats: num(row.total_seats, 0), configuration: obj(row.configuration),
    displayTitle: clean(row.display_title, 500), displaySummary: clean(row.display_summary, 5000), heroImageUrl: clean(row.hero_image_url, 2000),
    exteriorImageUrl: clean(row.exterior_image_url, 2000), seatmapImageUrl: clean(row.seatmap_image_url, 2000), thumbnailImageUrl: clean(row.thumbnail_image_url, 2000),
    defaultCabinCode: clean(row.default_cabin_code, 80), defaultViewType: clean(row.default_view_type, 80), walkthroughTitle: clean(row.walkthrough_title, 500),
    walkthroughSubtitle: clean(row.walkthrough_subtitle, 2500), walkthroughStartSceneCode: clean(row.walkthrough_start_scene_code, 120),
    walkthroughAccuracyLabel: clean(row.walkthrough_accuracy_label, 500), sortOrder: num(row.sort_order, 100)
  };
}

export async function getPublicTravelInfoAircraftCore(input = {}) {
  const airlineCode = upper(input.airlineCode, 8);
  const airlineId = clean(input.airlineId, 160);
  const query = { select: "*", active: ACTIVE, customer_visible: ACTIVE, status: PUBLISHED, order: "sort_order.asc", limit: "500" };
  if (airlineCode) query.airline_code = `eq.${airlineCode}`;
  else if (airlineId) query.airline_id = `eq.${airlineId}`;

  const aircraftRows = await select("travel_info_aircraft", query);
  const aircraftIds = aircraftRows.map(row => clean(row.id, 160)).filter(Boolean);
  if (!aircraftIds.length) return { ok: true, aircraft: [], cabins: [], views: [], hotspots: [], walkScenes: [], sceneHotspots: [] };
  const ids = `in.(${aircraftIds.join(",")})`;
  const [cabins, views, scenes] = await Promise.all([
    select("travel_info_aircraft_cabins", { select: "id,aircraft_id,cabin_code,cabin_name,rank,seat_count,summary,description,meal_title,meal_description,amenities,display_settings,active,sort_order", aircraft_id: ids, active: ACTIVE, order: "sort_order.asc", limit: "3000" }),
    select("travel_info_aircraft_views", { select: "id,aircraft_id,cabin_id,view_code,label,view_type,image_url,mobile_image_url,thumbnail_url,alt_text,caption,credit,is_default,active,sort_order", aircraft_id: ids, active: ACTIVE, order: "sort_order.asc", limit: "3000" }),
    select("travel_info_aircraft_walk_scenes", { select: "id,aircraft_id,scene_code,title,short_title,summary,image_url,mobile_image_url,forward_scene_code,back_scene_code,forward_label,back_label,active,sort_order", aircraft_id: ids, active: ACTIVE, order: "sort_order.asc", limit: "3000" })
  ]);
  const viewIds = views.map(row => row.id).filter(Boolean);
  const sceneIds = scenes.map(row => row.id).filter(Boolean);
  const [hotspots, sceneHotspots] = await Promise.all([
    viewIds.length ? select("travel_info_aircraft_hotspots", { select: "id,view_id,hotspot_code,label,title,description,x,y,action,focus_x,focus_y,focus_zoom,target_cabin_code,thumbnail_url,active,sort_order", view_id: `in.(${viewIds.join(",")})`, active: ACTIVE, order: "sort_order.asc", limit: "5000" }) : [],
    sceneIds.length ? select("travel_info_aircraft_scene_hotspots", { select: "id,scene_id,hotspot_code,label,title,description,hotspot_type,x,y,action,target_cabin_code,active,sort_order", scene_id: `in.(${sceneIds.join(",")})`, active: ACTIVE, order: "sort_order.asc", limit: "5000" }) : []
  ]);
  return { ok: true, source: "SUPABASE_TRAVEL_INFO_AIRCRAFT", version: PUBLIC_CONTENT_VERSION, aircraft: aircraftRows.map(publicAircraft), cabins, views, hotspots, walkScenes: scenes, sceneHotspots };
}

export async function getPublicBaggagePayloadCore(input = {}) {
  const payload = await getPublicTravelInfoPayloadCore(input);
  return {
    ok: true,
    source: "SUPABASE_TRAVEL_INFO_AIRLINES",
    version: PUBLIC_CONTENT_VERSION,
    airlines: payload.airlines.map(({ id, name, title, shortName, iataCode, icaoCode, logo, website, contactUrl, baggage, baggageAllowance }) => ({
      id, name, title, shortName, iataCode, icaoCode, logo, website, contactUrl, baggage, baggageAllowance
    })),
    guidance: payload.articles.filter(item => /baggage|bagage/i.test(`${item.category} ${item.title} ${item.tags?.join?.(" ") || ""}`)),
    generatedAt: payload.generatedAt
  };
}

export async function getPublicPassportVisaPayloadCore(input = {}) {
  const [travel, destinations] = await Promise.all([
    getPublicTravelInfoPayloadCore(input),
    select("inventory_public_entities_v", { select: "id,entity_type,code,name,slug,details,localized,media,sort_priority", entity_type: "in.(COUNTRY,DESTINATION,AREA)", order: "sort_priority.asc,name.asc", limit: "2000" })
  ]);
  return {
    ok: true,
    version: PUBLIC_CONTENT_VERSION,
    requirements: travel.travelRequirements,
    guidance: travel.articles.filter(item => /passport|visa|entry|requirement/i.test(`${item.category} ${item.title} ${item.tags?.join?.(" ") || ""}`)),
    destinations: destinations.map(row => {
      const details = obj(row.details);
      const localized = localizedRecord(row, input.language || "EN");
      return {
        id: clean(row.id, 160), type: upper(row.entity_type, 80), code: clean(row.code, 100), slug: clean(row.slug, 300),
        title: clean(first(localized.pageTitle, localized.title, row.name), 500),
        passportSummary: clean(details.passportSummary, 8000), visaSummary: clean(details.visaSummary, 8000),
        importantInformation: clean(first(localized.importantInformation, localized.important_information), 8000)
      };
    }).filter(item => item.passportSummary || item.visaSummary || item.importantInformation),
    generatedAt: travel.generatedAt
  };
}

function publicRequirementRow(row = {}) {
  return {
    id: clean(row.id, 160),
    title: clean(row.title || "Travel requirement", 500),
    slug: clean(row.slug, 300),
    category: clean(row.category || "GUIDANCE", 160),
    body: clean(row.body, 12000),
    image: clean(row.image_url, 2000),
    payload: obj(row.payload),
    sortOrder: num(row.sort_order, 100)
  };
}

function publicProviderField(field = {}) {
  return {
    key: clean(first(field.key, field.code, field.name, field.label), 160),
    label: clean(first(field.label, field.title, field.name, field.key), 500),
    value: clean(first(field.value, field.summary, field.text, field.status), 5000),
    status: clean(field.status, 120),
    category: clean(field.category, 160),
    required: field.required === true
  };
}

export async function searchPublicTravelRequirementsCore(input = {}) {
  const nationality = upper(input.nationality, 3);
  const residenceCountry = upper(input.residenceCountry, 3);
  const origin = upper(input.origin, 12);
  const destination = upper(input.destination, 12);
  const departureDate = clean(input.departureDate, 20);
  const returnDate = clean(input.returnDate, 20);
  const documentType = upper(input.documentType || "PASSPORT", 40);

  if (!nationality || !destination) {
    return {
      ok: false,
      source: "ALTEA_SHARED_TRAVEL_REQUIREMENTS",
      version: PUBLIC_CONTENT_VERSION,
      status: "INPUT_REQUIRED",
      provider: "NONE",
      summary: "Nationality and destination are required to check travel requirements.",
      fields: [],
      notices: ["Enter your nationality and destination to continue."],
      guidance: []
    };
  }

  const localRows = (await select("travel_requirements", {
    select: "id,title,slug,category,body,image_url,payload,active,sort_order",
    active: ACTIVE,
    order: "sort_order.asc",
    limit: "300"
  })).map(publicRequirementRow);

  const needles = [nationality, residenceCountry, origin, destination]
    .filter(Boolean)
    .map(value => value.toLowerCase());
  const guidance = localRows.filter(row => {
    const haystack = `${row.title} ${row.category} ${row.body} ${JSON.stringify(row.payload)}`.toLowerCase();
    return !needles.length || needles.some(needle => haystack.includes(needle));
  }).slice(0, 30);

  let external = { connected: false, status: "NEEDS_PROVIDER", provider: "NONE", fields: [], notices: [] };
  try {
    external = await checkExternalTravelRequirements({
      cart: { searchContext: { origin, destination, departureDate, returnDate } },
      travelers: [{ id: "PUBLIC_LOOKUP", nationality, residenceCountry, documentType }]
    });
  } catch (_) {
    external = { connected: false, status: "PROVIDER_UNAVAILABLE", provider: "NONE", fields: [], notices: [] };
  }

  if (external.connected) {
    return {
      ok: true,
      source: "ALTEA_SHARED_TRAVEL_REQUIREMENTS",
      version: PUBLIC_CONTENT_VERSION,
      connected: true,
      provider: clean(external.provider || "CONFIGURED", 120),
      status: clean(external.status || "PROVIDER_RESULT", 120),
      summary: clean(external.summary || "Travel requirements checked.", 5000),
      fields: arr(external.fields).slice(0, 60).map(publicProviderField),
      notices: arr(external.notices).slice(0, 30).map(item => clean(item, 2500)).filter(Boolean),
      guidance,
      officialSourcesRequired: true,
      generatedAt: new Date().toISOString()
    };
  }

  return {
    ok: true,
    source: "ALTEA_SHARED_TRAVEL_REQUIREMENTS",
    version: PUBLIC_CONTENT_VERSION,
    connected: false,
    provider: "SKANDI_GUIDANCE",
    status: guidance.length ? "SKANDI_GUIDANCE_MATCHED" : "GUIDANCE_ONLY",
    summary: guidance.length
      ? "SKANDI guidance matched this nationality or route. This is not a live Timatic/IATA boarding decision."
      : "No route-specific SKANDI requirement record matched. Confirm official entry requirements before travel.",
    fields: [],
    notices: ["No live Timatic/IATA decision is represented unless the approved external provider is connected."],
    guidance,
    officialSourcesRequired: true,
    generatedAt: new Date().toISOString()
  };
}

function publicInsuranceProduct(row = {}, language = "EN") {
  const details = obj(row.details);
  const localized = localizedRecord(row, language);
  return {
    id: clean(row.id, 160),
    code: clean(row.code, 100),
    slug: clean(row.slug, 300),
    title: clean(first(localized.pageTitle, localized.title, row.name, row.code), 500),
    summary: clean(first(localized.shortDescription, localized.short_description, localized.fullDescription, localized.description, details.summary), 3000),
    imageUrl: publicImage(row),
    provider: clean(first(details.insurer, details.provider, details.supplierName, details.supplier), 500),
    market: clean(first(details.market, details.marketCode, details.country), 160),
    markets: arr(first(details.markets, details.marketCodes, details.countries)).map(item => clean(item, 100)).filter(Boolean),
    destinations: arr(first(details.destinations, details.destinationCodes)).map(item => clean(item, 160)).filter(Boolean),
    priceLabel: clean(first(details.priceLabel, details.displayPrice), 300),
    termsUrl: clean(first(details.termsUrl, details.policyTermsUrl), 2000),
    ipidUrl: clean(first(details.ipidUrl, details.productInformationDocumentUrl), 2000)
  };
}

export async function getPublicInsurancePayloadCore(input = {}) {
  const language = upper(input.language || "EN", 5) || "EN";
  const [travel, ancillaryRows] = await Promise.all([
    getPublicTravelInfoPayloadCore(input),
    select("inventory_public_entities_v", {
      select: "id,entity_type,code,name,slug,details,localized,media,sort_priority",
      entity_type: "eq.ANCILLARY",
      order: "sort_priority.asc,name.asc",
      limit: "500"
    })
  ]);
  const guidance = travel.articles.filter(item => /insurance|försäkring|forsikring|travel protection|cancellation protection/i.test(`${item.category} ${item.title} ${item.tags?.join?.(" ") || ""} ${item.body || ""}`));
  const products = ancillaryRows
    .map(row => publicInsuranceProduct(row, language))
    .filter(item => /insurance|försäkring|forsikring|travel protection|cancellation protection/i.test(`${item.title} ${item.summary} ${item.code} ${item.provider}`));
  return {
    ok: true,
    source: "SUPABASE_PUBLIC_INSURANCE_CONTENT",
    version: PUBLIC_CONTENT_VERSION,
    configured: guidance.length > 0 || products.length > 0,
    products,
    guidance,
    disclaimer: "Insurance availability, insurer, eligibility, price, coverage, exclusions and terms vary by booking and market. Only the terms shown for the specific offered product at checkout are authoritative.",
    generatedAt: travel.generatedAt
  };
}
