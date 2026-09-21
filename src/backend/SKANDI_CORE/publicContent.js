// /src/backend/SKANDI_CORE/publicContent.js
// SKANDI Backend Base 1.0 — B-011.1 public experience read core.
//
// One public-content authority for About, SKANDI Collection and Travel Info.
// Reads only existing public-safe Inventory/Travel Info projections through the
// canonical Supabase transport. No page routing, booking mutation, support
// mutation, provider secrets, supplier costs or operational fields live here.

import { currentMember } from "wix-members-backend";
import { rpcRequest, restRequest } from "backend/SKANDI_CORE/supabaseServer";
import { requireStaffPortalSessionCore } from "backend/SKANDI_CORE/staffAuth";
import { checkExternalTravelRequirements } from "backend/SKANDI_CORE/travelRequirements";

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


// -----------------------------------------------------------------------------
// B-011.17 Editorial / VOY + Newsroom admin core
// Existing publicContent.js remains the single content authority. This section
// restores the full Magazine Manager feature contract against the live
// magazine_manager + newsroom tables without reintroducing FINAL/RIA services.
// -----------------------------------------------------------------------------

const EDITORIAL_SCHEMA = "magazine_manager";
const EDITORIAL_ENTITY_TYPES = new Set([
  "article", "asset", "campaign", "approval", "category", "banner",
  "travel_card", "brand_kit", "quality_report", "distribution_kit",
  "print_package", "api_attribution"
]);
const EDITORIAL_ISSUE_STATUSES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);
const EDITORIAL_PAGE_STATUSES = new Set(["DRAFT", "IN PROGRESS", "REVIEW", "APPROVED", "PUBLISHED"]);
const EDITORIAL_PAGE_TEMPLATES = new Set([
  "cover", "contents", "brand-feature", "offers", "section-opener", "feature",
  "destination-grid", "nightlife", "experiences", "travel-well", "airline-guide",
  "airline-profile", "onboard-guide", "airport-guide", "route-map",
  "transfer-promise", "signature-collection", "back-cover"
]);
const EDITORIAL_FONTS = new Set([
  "Montserrat", "Inter", "Playfair Display", "Cormorant Garamond", "Georgia", "Arial"
]);
const EDITORIAL_IMAGE_FITS = new Set(["cover", "contain", "fill", "scale-down", "none"]);

function editorialText(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function editorialObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function editorialArray(value) { return Array.isArray(value) ? value : []; }
function editorialNow() { return new Date().toISOString(); }
function editorialEq(value) { return `eq.${editorialText(value, 500)}`; }
function editorialKey(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function editorialRequiredId(value, label) {
  const v = editorialText(value, 180);
  if (!v || !/^[A-Za-z0-9._:-]+$/.test(v)) throw new Error(`VOY_INVALID_${String(label).toUpperCase()}`);
  return v;
}
function editorialOptionalId(value) {
  const v = editorialText(value, 180);
  return v ? editorialRequiredId(v, "id") : "";
}
function editorialInteger(value, min, max, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`VOY_INVALID_${String(label).toUpperCase()}`);
  return n;
}
function editorialDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function editorialUrl(value) {
  const v = editorialText(value, 4000);
  return !v || /^https:\/\//i.test(v) ? v : "";
}
function editorialUrlOrPath(value) {
  const v = editorialText(value, 4000);
  if (!v) return "";
  if (/^https:\/\//i.test(v) || /^\/[A-Za-z0-9/_?&=.%+-]*$/.test(v)) return v;
  return "";
}
function editorialPath(value) {
  const v = editorialText(value, 1000);
  if (!v) return "";
  return /^\/[A-Za-z0-9/_?&=.%+-]*$/.test(v) ? v : "";
}
function editorialHex(value, fallback) {
  const v = editorialText(value, 20);
  return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : fallback;
}
function editorialFont(value, fallback) {
  const v = editorialText(value, 80);
  return EDITORIAL_FONTS.has(v) ? v : fallback;
}
function editorialImagePosition(value) {
  const v = editorialText(value || "center center", 60);
  return /^[a-z0-9.% -]+$/i.test(v) ? v : "center center";
}
function editorialStrings(value, maxItems = 50, maxLen = 160) {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  return list.map(x => editorialText(x, maxLen)).filter(Boolean).slice(0, maxItems);
}
function editorialJsonArray(value) {
  let list = value;
  if (typeof value === "string") {
    try { list = JSON.parse(value); } catch (_) { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return JSON.parse(JSON.stringify(list.slice(0, 100)));
}
function editorialJsonObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const cleanValue = JSON.parse(JSON.stringify(value));
  if (JSON.stringify(cleanValue).length > 100000) throw new Error("VOY_ENTITY_TOO_LARGE");
  return cleanValue;
}
function editorialSlug(value) {
  const slug = editorialText(value, 240).toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 180);
  if (!slug) throw new Error("VOY_INVALID_SLUG");
  return slug;
}
function editorialProfileName(profile = {}) {
  return editorialText(profile.displayName || profile.fullName || profile.preferredName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "VOY Editor", 240);
}
function editorialRole(session = {}) {
  if (session.isSystemAdmin === true) return "super_admin";
  if (session.canManage === true) return "admin";
  return "manager";
}
function editorialCanAccess(session = {}) {
  if (session.isSystemAdmin === true || session.canManage === true) return true;
  const values = [
    ...editorialArray(session.allowedApps), ...editorialArray(session.permissionKeys),
    ...editorialArray(session.permissionGroups), ...editorialArray(session.permissions),
    ...editorialArray(session.profile?.allowedApps), ...editorialArray(session.profile?.permissionKeys)
  ].map(v => editorialText(typeof v === "string" ? v : (v?.id || v?.key || v?.permission), 120).toLowerCase());
  return values.some(v => ["*", "all", "media-control", "marketing", "content", "newsroom", "system-admin"].includes(v));
}
async function editorialRows(table, query = {}, schema = EDITORIAL_SCHEMA) {
  const rows = await restRequest({ table, schema, method: "GET", query, prefer: "" });
  return Array.isArray(rows) ? rows : [];
}
async function editorialFirst(table, query = {}, schema = EDITORIAL_SCHEMA) {
  return (await editorialRows(table, { ...query, limit: query.limit || "1" }, schema))[0] || null;
}
async function editorialInsert(table, body, schema = EDITORIAL_SCHEMA) {
  const rows = await restRequest({ table, schema, method: "POST", body, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] || null : rows || null;
}
async function editorialPatch(table, query, body, schema = EDITORIAL_SCHEMA) {
  const rows = await restRequest({ table, schema, method: "PATCH", query, body, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] || null : rows || null;
}
async function editorialDelete(table, query, schema = EDITORIAL_SCHEMA) {
  return restRequest({ table, schema, method: "DELETE", query, prefer: "return=representation" });
}
async function currentWixMemberIdForEditorial() {
  const member = await currentMember.getMember().catch(() => null);
  return editorialText(member?._id || member?.id, 200);
}
async function ensureEditorialContext() {
  const session = await requireStaffPortalSessionCore();
  if (!editorialCanAccess(session)) throw new Error("VOY_EDITOR_ACCESS_DENIED");
  const wixMemberId = await currentWixMemberIdForEditorial();
  if (!wixMemberId) throw new Error("VOY_NOT_AUTHENTICATED");

  // Canonical staffAuth is the authorization source of truth. The magazine
  // organization is only the relational partition key for VOY content; the
  // legacy dashboard_members table is not used as a second permission store.
  const organization = await editorialFirst("organizations", {
    select: "id,name,is_active", is_active: "eq.true", order: "created_at.asc"
  });
  const organizationId = editorialText(organization?.id, 80);
  if (!organizationId) throw new Error("VOY_ORGANIZATION_NOT_CONFIGURED");

  const role = editorialRole(session);
  return {
    session, wixMemberId, organizationId, role,
    profile: {
      ...editorialObject(session.profile),
      name: editorialProfileName(session.profile),
      role
    }
  };
}

function normalizeVoyIssue(input = {}) {
  const issueId = editorialRequiredId(input.issueId || input.issue_id || input._id, "issueId");
  const title = editorialText(input.title, 240);
  if (!title) throw new Error("VOY_ISSUE_TITLE_REQUIRED");
  const requestedStatus = String(input.publishStatus || input.publish_status || "DRAFT").toUpperCase();
  return {
    issue_id: issueId,
    title,
    edition: editorialText(input.edition, 160),
    slug: editorialSlug(input.slug || title),
    summary: editorialText(input.summary, 6000),
    cover_image_url: editorialUrl(input.coverImageUrl || input.cover_image_url),
    publish_status: EDITORIAL_ISSUE_STATUSES.has(requestedStatus) ? requestedStatus : "DRAFT",
    publish_date: editorialDate(input.publishDate || input.publish_date),
    featured: input.featured === true,
    categories: editorialStrings(input.categories, 40, 120),
    destinations: editorialStrings(input.destinations, 60, 160),
    search_text: editorialText(input.searchText || input.search_text, 20000),
    print_settings: editorialText(input.printSettings || input.print_settings, 6000),
    pdf_url: editorialUrl(input.pdfUrl || input.pdf_url || input.fileUrl),
    public_url: editorialUrlOrPath(input.publicUrl || input.public_url)
  };
}
function normalizeVoyPage(input = {}) {
  const pageId = editorialRequiredId(input.pageId || input.page_id || input._id, "pageId");
  const issueId = editorialRequiredId(input.issueId || input.issue_id, "issueId");
  const title = editorialText(input.title, 300);
  if (!title) throw new Error("VOY_PAGE_TITLE_REQUIRED");
  const template = editorialText(input.template, 80) || "feature";
  if (!EDITORIAL_PAGE_TEMPLATES.has(template)) throw new Error(`VOY_UNSUPPORTED_TEMPLATE:${template}`);
  const status = String(input.status || "DRAFT").toUpperCase();
  const imageFit = editorialText(input.imageFit || input.image_fit, 40);
  return {
    issue_id: issueId,
    page_id: pageId,
    page_no: editorialInteger(input.pageNo || input.page_no, 1, 500, "pageNo"),
    template,
    status: EDITORIAL_PAGE_STATUSES.has(status) ? status : "DRAFT",
    category: editorialText(input.category, 160),
    kicker: editorialText(input.kicker, 300),
    title,
    deck: editorialText(input.deck, 6000),
    body: editorialText(input.body, 100000),
    image_url: editorialUrl(input.imageUrl || input.image_url),
    secondary_image_url: editorialUrl(input.secondaryImageUrl || input.secondary_image_url),
    image_credit: editorialText(input.imageCredit || input.image_credit, 1000),
    image_fit: EDITORIAL_IMAGE_FITS.has(imageFit) ? imageFit : "cover",
    image_position: editorialImagePosition(input.imagePosition || input.image_position),
    destination: editorialText(input.destination, 300),
    cta_label: editorialText(input.ctaLabel || input.cta_label, 160),
    cta_path: editorialPath(input.ctaPath || input.cta_path),
    background_color: editorialHex(input.backgroundColor || input.background_color, "#ffffff"),
    text_color: editorialHex(input.textColor || input.text_color, "#103154"),
    accent_color: editorialHex(input.accentColor || input.accent_color, "#4dcad6"),
    heading_font: editorialFont(input.headingFont || input.heading_font, "Montserrat"),
    body_font: editorialFont(input.bodyFont || input.body_font, "Inter"),
    footer_text: editorialText(input.footerText || input.footer_text || "VOY by SKANDI · skanditravels.com", 500),
    blocks: editorialJsonArray(input.blocks),
    seo_notes: editorialText(input.seoNotes || input.seo_notes, 10000)
  };
}
function mapVoyIssue(row = {}) {
  return {
    issueId: row.issue_id, title: row.title, edition: row.edition || "", slug: row.slug || "",
    summary: row.summary || "", coverImageUrl: row.cover_image_url || "",
    publishStatus: row.publish_status || "DRAFT", publishDate: row.publish_date || null,
    publishedAt: row.published_at || null, featured: row.featured === true,
    categories: row.categories || [], destinations: row.destinations || [],
    searchText: row.search_text || "", printSettings: row.print_settings || "",
    pdfUrl: row.pdf_url || "", publicUrl: row.public_url || "", revision: row.revision || 1,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}
function mapVoyPage(row = {}) {
  return {
    pageId: row.page_id, issueId: row.issue_id, pageNo: row.page_no, template: row.template,
    status: row.status, category: row.category || "", kicker: row.kicker || "", title: row.title || "",
    deck: row.deck || "", body: row.body || "", imageUrl: row.image_url || "",
    secondaryImageUrl: row.secondary_image_url || "", imageCredit: row.image_credit || "",
    imageFit: row.image_fit || "cover", imagePosition: row.image_position || "center center",
    destination: row.destination || "", ctaLabel: row.cta_label || "", ctaPath: row.cta_path || "",
    backgroundColor: row.background_color || "#ffffff", textColor: row.text_color || "#103154",
    accentColor: row.accent_color || "#4dcad6", headingFont: row.heading_font || "Montserrat",
    bodyFont: row.body_font || "Inter", footerText: row.footer_text || "VOY by SKANDI · skanditravels.com",
    blocks: row.blocks || [], seoNotes: row.seo_notes || "", revision: row.revision || 1,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}
function normalizeVoyEntityType(value) {
  const type = editorialText(value, 80).toLowerCase();
  if (!EDITORIAL_ENTITY_TYPES.has(type)) throw new Error("VOY_INVALID_ENTITY_TYPE");
  return type;
}
function inferVoyEntityId(type, item = {}) {
  const keys = {
    article: ["articleId", "article_id", "_id"], asset: ["assetId", "asset_id", "_id", "id"],
    campaign: ["campaignId", "campaign_id", "_id"], approval: ["approvalId", "approval_id", "_id"],
    category: ["categoryId", "category_id", "_id"], banner: ["bannerId", "banner_id", "_id"],
    travel_card: ["cardId", "card_id", "_id"], brand_kit: ["brandKitId", "brand_kit_id", "name"],
    quality_report: ["reportId", "report_id", "_id"], distribution_kit: ["kitId", "kit_id", "_id"],
    print_package: ["packageId", "package_id", "_id"], api_attribution: ["attributionId", "attribution_id", "_id"]
  };
  for (const key of keys[type] || []) if (item[key]) return String(item[key]);
  return editorialKey(type.toUpperCase());
}
function mapVoyEntity(row = {}) {
  return {
    ...editorialObject(row.data), entityType: row.entity_type, entityId: row.entity_id,
    issueId: row.issue_id || "", active: row.is_active !== false, updatedAt: row.updated_at
  };
}
function groupVoyEntities(rows = []) {
  const out = {};
  for (const row of rows) {
    const key = row.entity_type;
    if (!out[key]) out[key] = [];
    out[key].push(mapVoyEntity(row));
  }
  return out;
}
function buildVoyAdminPayload(issueRows, pageRows, entityRows) {
  const grouped = groupVoyEntities(entityRows);
  return {
    issues: issueRows.map(mapVoyIssue), pages: pageRows.map(mapVoyPage),
    articles: grouped.article || [], assets: grouped.asset || [], campaigns: grouped.campaign || [],
    approvals: grouped.approval || [], categories: grouped.category || [], banners: grouped.banner || [],
    travelCards: grouped.travel_card || [], brandKits: grouped.brand_kit || [],
    qualityReports: grouped.quality_report || [], distributionKits: grouped.distribution_kit || [],
    printPackages: grouped.print_package || [], apiAttributions: grouped.api_attribution || []
  };
}
async function saveVoyIssueWithContext(context, input = {}) {
  const issue = normalizeVoyIssue(input);
  const existing = await editorialFirst("voy_issues", {
    select: "*", organization_id: editorialEq(context.organizationId), issue_id: editorialEq(issue.issue_id)
  });
  if (existing?.publish_status === "PUBLISHED" || existing?.publish_status === "ARCHIVED") {
    issue.publish_status = existing.publish_status;
  } else if (!["DRAFT", "REVIEW"].includes(issue.publish_status)) {
    issue.publish_status = "DRAFT";
  }
  const body = {
    organization_id: context.organizationId, ...issue, revision: Number(existing?.revision || 1),
    created_by_wix_member_id: existing?.created_by_wix_member_id || context.wixMemberId,
    updated_by_wix_member_id: context.wixMemberId, updated_at: editorialNow()
  };
  const saved = existing
    ? await editorialPatch("voy_issues", { id: editorialEq(existing.id) }, body)
    : await editorialInsert("voy_issues", { ...body, created_at: editorialNow() });
  if (!saved) throw new Error("VOY_SERVICE_UNAVAILABLE:save_issue");
  return mapVoyIssue(saved);
}
async function saveVoyPagesWithContext(context, inputPages, fallbackIssueId = "") {
  if (!Array.isArray(inputPages) || !inputPages.length || inputPages.length > 500) throw new Error("VOY_INVALID_PAGES");
  const output = [];
  for (const raw of inputPages) {
    const page = normalizeVoyPage({ ...raw, issueId: raw.issueId || fallbackIssueId });
    const existing = await editorialFirst("voy_pages", {
      select: "*", organization_id: editorialEq(context.organizationId), page_id: editorialEq(page.page_id)
    });
    const body = {
      organization_id: context.organizationId, ...page, revision: Number(existing?.revision || 1),
      created_by_wix_member_id: existing?.created_by_wix_member_id || context.wixMemberId,
      updated_by_wix_member_id: context.wixMemberId, updated_at: editorialNow()
    };
    const saved = existing
      ? await editorialPatch("voy_pages", { id: editorialEq(existing.id) }, body)
      : await editorialInsert("voy_pages", { ...body, created_at: editorialNow() });
    if (!saved) throw new Error("VOY_SERVICE_UNAVAILABLE:save_page");
    output.push(mapVoyPage(saved));
  }
  return output.sort((a, b) => a.pageNo - b.pageNo);
}

export async function getVoyAdminBootstrapCore() {
  const context = await ensureEditorialContext();
  const [issues, pages, entities] = await Promise.all([
    editorialRows("voy_issues", { select: "*", organization_id: editorialEq(context.organizationId), order: "updated_at.desc", limit: "500" }),
    editorialRows("voy_pages", { select: "*", organization_id: editorialEq(context.organizationId), order: "issue_id.asc,page_no.asc", limit: "2000" }),
    editorialRows("voy_entities", { select: "*", organization_id: editorialEq(context.organizationId), is_active: "eq.true", order: "updated_at.desc", limit: "3000" })
  ]);
  return { ok: true, profile: context.profile, role: context.role, apps: context.session.apps || [], ...buildVoyAdminPayload(issues, pages, entities) };
}
export async function saveVoyIssueCore(input = {}) {
  const context = await ensureEditorialContext();
  return { ok: true, issue: await saveVoyIssueWithContext(context, input.issue || input.item || input) };
}
export async function saveVoyIssuePackageCore(input = {}) {
  const context = await ensureEditorialContext();
  const issue = await saveVoyIssueWithContext(context, input.issue || {});
  const pages = await saveVoyPagesWithContext(context, input.pages || [], issue.issueId);
  return { ok: true, issue, pages };
}
export async function saveVoyPageCore(input = {}) {
  const context = await ensureEditorialContext();
  const pages = await saveVoyPagesWithContext(context, [input.page || input.item || input]);
  return { ok: true, page: pages[0] };
}
export async function saveVoyPagesCore(input = {}) {
  const context = await ensureEditorialContext();
  const issueId = editorialRequiredId(input.issueId || input.pages?.[0]?.issueId || input.pages?.[0]?.issue_id, "issueId");
  if (input.replaceIssuePages === true) {
    await editorialDelete("voy_pages", {
      organization_id: editorialEq(context.organizationId),
      issue_id: editorialEq(issueId)
    });
  }
  const pages = await saveVoyPagesWithContext(context, input.pages || [], issueId);
  return { ok: true, pages };
}
export async function reorderVoyPagesCore(input = {}) {
  const context = await ensureEditorialContext();
  const issueId = editorialRequiredId(input.issueId, "issueId");
  const rows = editorialArray(input.pages);
  if (!rows.length || rows.length > 500) throw new Error("VOY_INVALID_PAGE_ORDER");
  const seen = new Set();
  for (const item of rows) {
    const pageId = editorialRequiredId(item.pageId, "pageId");
    const pageNo = editorialInteger(item.pageNo, 1, 500, "pageNo");
    if (seen.has(pageNo)) throw new Error("VOY_DUPLICATE_PAGE_NUMBER");
    seen.add(pageNo);
    await editorialPatch("voy_pages", {
      organization_id: editorialEq(context.organizationId), issue_id: editorialEq(issueId), page_id: editorialEq(pageId)
    }, { page_no: pageNo, updated_by_wix_member_id: context.wixMemberId, updated_at: editorialNow() });
  }
  return { ok: true, issueId, count: rows.length };
}
export async function deleteVoyPageCore(input = {}) {
  const context = await ensureEditorialContext();
  const pageId = editorialRequiredId(input.pageId, "pageId");
  await editorialDelete("voy_pages", { organization_id: editorialEq(context.organizationId), page_id: editorialEq(pageId) });
  return { ok: true, pageId };
}
export async function deleteVoyIssueCore(input = {}) {
  const context = await ensureEditorialContext();
  const issueId = editorialRequiredId(input.issueId, "issueId");
  const existing = await editorialFirst("voy_issues", {
    select: "id,publish_status", organization_id: editorialEq(context.organizationId), issue_id: editorialEq(issueId)
  });
  if (!existing) return { ok: true, issueId };
  if (existing.publish_status === "PUBLISHED") throw new Error("VOY_ARCHIVE_BEFORE_DELETE");
  await editorialDelete("voy_issues", { id: editorialEq(existing.id) });
  return { ok: true, issueId };
}
export async function publishVoyIssueCore(input = {}) {
  const context = await ensureEditorialContext();
  if (input.issue) await saveVoyIssueWithContext(context, input.issue);
  if (editorialArray(input.pages).length) await saveVoyPagesWithContext(context, input.pages, input.issueId || input.issue?.issueId);
  const issueId = editorialRequiredId(input.issueId || input.issue?.issueId, "issueId");
  const result = await rpcRequest({
    schema: EDITORIAL_SCHEMA,
    functionName: "publish_voy_issue",
    body: { p_organization_id: context.organizationId, p_issue_id: issueId, p_wix_member_id: context.wixMemberId }
  });
  const published = Array.isArray(result) ? result[0] : result;
  if (!published) throw new Error("VOY_PUBLISH_EMPTY_RESULT");
  const slug = published.payload?.issue?.slug || input.issue?.slug || issueId;
  return {
    ok: true, issueId, revision: published.revision,
    publishedAt: published.published_at || editorialNow(),
    publicUrl: `/voy-magazine?issue=${encodeURIComponent(slug)}`
  };
}
export async function archiveVoyIssueCore(input = {}) {
  const context = await ensureEditorialContext();
  const issueId = editorialRequiredId(input.issueId, "issueId");
  await editorialPatch("voy_issues", {
    organization_id: editorialEq(context.organizationId), issue_id: editorialEq(issueId)
  }, { publish_status: "ARCHIVED", featured: false, updated_by_wix_member_id: context.wixMemberId, updated_at: editorialNow() });
  await restRequest({
    table: "voy_publications", schema: EDITORIAL_SCHEMA, method: "PATCH",
    query: { organization_id: editorialEq(context.organizationId), issue_id: editorialEq(issueId), is_current: "eq.true" },
    body: { is_current: false }, prefer: "return=minimal"
  });
  return { ok: true, issueId };
}
export async function saveVoyEntityCore(input = {}) {
  const context = await ensureEditorialContext();
  const entityType = normalizeVoyEntityType(input.entityType || input.type);
  const item = editorialJsonObject(input.item || input.data || {});
  const entityId = editorialRequiredId(input.entityId || inferVoyEntityId(entityType, item), "entityId");
  const issueId = editorialOptionalId(input.issueId || item.issueId || item.issue_id);
  const existing = await editorialFirst("voy_entities", {
    select: "*", organization_id: editorialEq(context.organizationId), entity_type: editorialEq(entityType), entity_id: editorialEq(entityId)
  });
  const body = {
    organization_id: context.organizationId, entity_type: entityType, entity_id: entityId,
    issue_id: issueId || null, data: { ...item, entityId }, is_active: input.isActive !== false,
    created_by_wix_member_id: existing?.created_by_wix_member_id || context.wixMemberId,
    updated_by_wix_member_id: context.wixMemberId, updated_at: editorialNow()
  };
  const saved = existing
    ? await editorialPatch("voy_entities", { id: editorialEq(existing.id) }, body)
    : await editorialInsert("voy_entities", { ...body, created_at: editorialNow() });
  if (!saved) throw new Error("VOY_SERVICE_UNAVAILABLE:save_entity");
  return { ok: true, entity: mapVoyEntity(saved) };
}
export async function deleteVoyEntityCore(input = {}) {
  const context = await ensureEditorialContext();
  const entityType = normalizeVoyEntityType(input.entityType || input.type);
  const entityId = editorialRequiredId(input.entityId, "entityId");
  await editorialDelete("voy_entities", {
    organization_id: editorialEq(context.organizationId), entity_type: editorialEq(entityType), entity_id: editorialEq(entityId)
  });
  return { ok: true, entityType, entityId };
}

function safeNewsroomUrl(value) {
  const url = editorialText(value, 2000);
  return /^https:\/\//i.test(url) ? url : "";
}
function mapNewsroomCategory(row = {}) {
  return { ...editorialObject(row.payload), id: row.id || "", categoryId: row.category_id || row.id || "", title: row.title || "", slug: row.slug || "", active: row.active === true, payload: row.payload || {} };
}
function mapNewsroomPost(row = {}) {
  return {
    ...editorialObject(row.payload),
    id: row.id || "", articleId: row.article_id || row.id || "", postId: row.article_id || row.id || "",
    categoryId: row.category_id || "", title: row.title || "", excerpt: row.excerpt || "", summary: row.excerpt || editorialObject(row.payload).summary || "",
    body: row.body || "", bodyHtml: editorialObject(row.payload).bodyHtml || row.body || "",
    imageUrl: safeNewsroomUrl(row.image_url), heroImage: safeNewsroomUrl(row.image_url),
    status: row.status || "DRAFT", publishedAt: row.published_at || "", publishDate: row.published_at || editorialObject(row.payload).publishDate || null,
    payload: row.payload || {}
  };
}
function mapNewsroomMedia(row = {}) {
  return { ...editorialObject(row.payload), ...row, assetId: row.asset_id || row.id || "", mimeType: row.mime_type || "", url: row.url || "" };
}
function mapNewsroomContact(row = {}) {
  return { ...editorialObject(row.payload), id: row.id || "", contactId: row.contact_id || row.id || "", name: row.name || "", email: row.email || "", phone: row.phone || "", active: row.active !== false, payload: row.payload || {} };
}
async function requireNewsroomEditor() { return ensureEditorialContext(); }
async function newsroomOne(table, id, namedColumn) {
  const value = editorialText(id, 180);
  if (!value) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  return editorialFirst(table, { select: "*", [isUuid ? "id" : namedColumn]: editorialEq(value) }, "public");
}
async function newsroomAdminDataCore() {
  await requireNewsroomEditor();
  const [categories, posts, media, contacts] = await Promise.all([
    editorialRows("newsroom_categories", { select: "*", order: "title.asc", limit: "500" }, "public"),
    editorialRows("newsroom_articles", { select: "*", order: "updated_at.desc", limit: "1000" }, "public"),
    editorialRows("newsroom_media_assets", { select: "*", order: "updated_at.desc", limit: "1000" }, "public"),
    editorialRows("newsroom_press_contacts", { select: "*", order: "name.asc", limit: "500" }, "public")
  ]);
  return { ok: true, categories: categories.map(mapNewsroomCategory), posts: posts.map(mapNewsroomPost), media: media.map(mapNewsroomMedia), contacts: contacts.map(mapNewsroomContact) };
}
export async function listNewsroomAdminDataCore() { return newsroomAdminDataCore(); }
export async function getNewsroomAdminBootstrapCore() {
  const context = await requireNewsroomEditor();
  return { ...(await newsroomAdminDataCore()), profile: context.profile, apps: context.session.apps || [] };
}
export async function saveNewsroomCategoryCore(input = {}) {
  await requireNewsroomEditor();
  const item = input.item || input;
  const categoryId = editorialText(item.categoryId || item.id, 160) || editorialKey("CAT");
  const existing = await newsroomOne("newsroom_categories", categoryId, "category_id");
  const body = {
    category_id: categoryId, title: editorialText(item.title, 240) || "Untitled category",
    slug: editorialText(item.slug, 240) || null, active: item.active !== false,
    payload: { ...editorialObject(existing?.payload), ...editorialObject(item) }, updated_at: editorialNow()
  };
  const saved = existing
    ? await editorialPatch("newsroom_categories", { id: editorialEq(existing.id) }, body, "public")
    : await editorialInsert("newsroom_categories", { ...body, created_at: editorialNow() }, "public");
  return { ok: true, category: mapNewsroomCategory(saved || body) };
}
export async function saveNewsroomPostCore(input = {}) {
  await requireNewsroomEditor();
  const item = input.item || input;
  const articleId = editorialText(item.articleId || item.postId || item.id, 160) || editorialKey("NEWS");
  const existing = await newsroomOne("newsroom_articles", articleId, "article_id");
  const body = {
    article_id: articleId, category_id: editorialText(item.categoryId, 160) || null,
    title: editorialText(item.title, 500) || "Untitled post", excerpt: editorialText(item.excerpt, 3000) || null,
    body: editorialText(item.body || item.content, 50000) || null,
    image_url: safeNewsroomUrl(item.imageUrl || item.image_url) || null,
    status: editorialText(item.status || existing?.status || "DRAFT", 60).toUpperCase(),
    published_at: item.publishedAt || existing?.published_at || null,
    payload: { ...editorialObject(existing?.payload), ...editorialObject(item) }, updated_at: editorialNow()
  };
  const saved = existing
    ? await editorialPatch("newsroom_articles", { id: editorialEq(existing.id) }, body, "public")
    : await editorialInsert("newsroom_articles", { ...body, created_at: editorialNow() }, "public");
  return { ok: true, post: mapNewsroomPost(saved || body) };
}
export async function publishNewsroomPostCore(input = {}) {
  await requireNewsroomEditor();
  const id = editorialText(input.id || input.articleId || input.postId, 160);
  const existing = await newsroomOne("newsroom_articles", id, "article_id");
  if (!existing) throw new Error("NEWSROOM_POST_NOT_FOUND");
  const saved = await editorialPatch("newsroom_articles", { id: editorialEq(existing.id) }, { status: "PUBLISHED", published_at: editorialNow(), updated_at: editorialNow() }, "public");
  return { ok: true, post: mapNewsroomPost(saved || existing) };
}
export async function archiveNewsroomPostCore(input = {}) {
  await requireNewsroomEditor();
  const id = editorialText(input.id || input.articleId || input.postId, 160);
  const existing = await newsroomOne("newsroom_articles", id, "article_id");
  if (!existing) throw new Error("NEWSROOM_POST_NOT_FOUND");
  const saved = await editorialPatch("newsroom_articles", { id: editorialEq(existing.id) }, { status: "ARCHIVED", updated_at: editorialNow() }, "public");
  return { ok: true, post: mapNewsroomPost(saved || existing) };
}
export async function saveNewsroomMediaAssetCore(input = {}) {
  await requireNewsroomEditor();
  const item = input.item || input;
  const assetId = editorialText(item.assetId || item.id, 160) || editorialKey("MEDIA");
  const existing = await newsroomOne("newsroom_media_assets", assetId, "asset_id");
  const body = {
    asset_id: assetId, title: editorialText(item.title, 500) || null,
    url: safeNewsroomUrl(item.url || item.fileUrl || item.imageUrl) || null,
    mime_type: editorialText(item.mimeType || item.mime_type, 120) || null,
    payload: { ...editorialObject(existing?.payload), ...editorialObject(item) }, updated_at: editorialNow()
  };
  const saved = existing
    ? await editorialPatch("newsroom_media_assets", { id: editorialEq(existing.id) }, body, "public")
    : await editorialInsert("newsroom_media_assets", { ...body, created_at: editorialNow() }, "public");
  return { ok: true, media: mapNewsroomMedia(saved || body) };
}
export async function saveNewsroomPressContactCore(input = {}) {
  await requireNewsroomEditor();
  const item = input.item || input;
  const contactId = editorialText(item.contactId || item.id, 160) || editorialKey("PRESS");
  const existing = await newsroomOne("newsroom_press_contacts", contactId, "contact_id");
  const body = {
    contact_id: contactId, name: editorialText(item.name, 240) || null,
    email: editorialText(item.email, 240).toLowerCase() || null, phone: editorialText(item.phone, 80) || null,
    active: item.active !== false, payload: { ...editorialObject(existing?.payload), ...editorialObject(item) }, updated_at: editorialNow()
  };
  const saved = existing
    ? await editorialPatch("newsroom_press_contacts", { id: editorialEq(existing.id) }, body, "public")
    : await editorialInsert("newsroom_press_contacts", { ...body, created_at: editorialNow() }, "public");
  return { ok: true, contact: mapNewsroomContact(saved || body) };
}
