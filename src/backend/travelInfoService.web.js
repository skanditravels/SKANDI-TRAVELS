// /src/backend/travelInfoService.web.js
// SKANDI Travel Info — canonical public backend boundary.
// Recovery R-003.6
//
// Public contract preserved:
// - getTravelInfoPayload()
// - createTravelInfoSupportRequest(payload)
// - askTravelInfoAgent(payload)
// - getTravelWeather(payload)
// - getTravelInfoBootstrap() (compatibility)
//
// Source of truth:
// - Supabase public Travel Info objects
// - inventory_public_entities_v for publication-gated Inventory content
// - Travel Info aircraft/cabin/view/walkthrough tables
//
// Security rule: raw Inventory/operations rows are never returned to the browser.

import { webMethod, Permissions } from "wix-web-module";
import { fetch } from "wix-fetch";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { randomUUID } from "crypto";
import { restRequest } from "./SKANDI_CORE/supabaseServer.js";

const OPENWEATHER_SECRET_NAME = "OPENWEATHER_API_KEY";
const elevatedGetSecretValue = elevate(secrets.getSecretValue);

const DEFAULT_WEATHER_LOCATIONS = Object.freeze([
  { locationId: "NYC", title: "New York City", country: "US", query: "New York,US", latitude: 40.7128, longitude: -74.0060, sortOrder: 1, active: true },
  { locationId: "STOCKHOLM", title: "Stockholm", country: "SE", query: "Stockholm,SE", latitude: 59.3293, longitude: 18.0686, sortOrder: 2, active: true },
  { locationId: "KOH_SAMUI", title: "Koh Samui", country: "TH", query: "Ko Samui,TH", latitude: 9.5120, longitude: 100.0136, sortOrder: 3, active: true },
  { locationId: "SANTORINI", title: "Santorini", country: "GR", query: "Santorini,GR", latitude: 36.3932, longitude: 25.4615, sortOrder: 4, active: true }
]);

const PRODUCT_TYPE_TO_LIBRARY = Object.freeze({
  HOTEL: "hotels",
  TRANSFER: "transfers",
  GUIDED_TOUR: "tours",
  ACTIVITY: "activities",
  PARTNER_TICKET: "tickets"
});

function clean(value, max = 30000) {
  return String(value ?? "").trim().slice(0, max);
}
function upper(value, max = 100) {
  return clean(value, max).toUpperCase();
}
function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(number(value, 0) * factor) / factor;
}
function array(value) {
  return Array.isArray(value) ? value : [];
}
function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function present(value) {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) return value.some(present);
  if (typeof value === "object") return Object.keys(value).some((key) => present(value[key]));
  return true;
}
function first(...values) {
  return values.find(present);
}
function qeq(value) {
  return `eq.${String(value)}`;
}

/**
 * Supabase contains several historical JSON representations:
 * real jsonb, arrays of JSON strings, and JSON encoded strings.
 * Normalize them once at the backend boundary.
 */
function deepNormalize(value, depth = 0) {
  if (depth > 8 || value === undefined || value === null) return value;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return "";
    const likelyJson =
      (text.startsWith("{") && text.endsWith("}")) ||
      (text.startsWith("[") && text.endsWith("]")) ||
      (text.startsWith('"') && text.endsWith('"'));
    if (likelyJson) {
      try {
        const parsed = JSON.parse(text);
        if (parsed !== value) return deepNormalize(parsed, depth + 1);
      } catch (_) {
        // Keep the original customer-facing string.
      }
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => deepNormalize(item, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = deepNormalize(child, depth + 1);
    return out;
  }
  return value;
}

function humanKey(key) {
  return clean(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function primitiveText(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined) return "";
  return clean(value);
}

function structuredBullets(value, { prefix = "", depth = 0, max = 80 } = {}) {
  const normalized = deepNormalize(value);
  const out = [];
  const add = (line) => {
    const v = clean(line, 1000);
    if (v && !out.includes(v) && out.length < max) out.push(v);
  };
  const walk = (item, label, level) => {
    if (out.length >= max || level > 5 || !present(item)) return;
    if (Array.isArray(item)) {
      for (const child of item) walk(child, label, level + 1);
      return;
    }
    if (item && typeof item === "object") {
      for (const [key, child] of Object.entries(item)) {
        const childLabel = label ? `${label} · ${humanKey(key)}` : humanKey(key);
        walk(child, childLabel, level + 1);
      }
      return;
    }
    const text = primitiveText(item);
    if (!text) return;
    add(label ? `${label}: ${text}` : text);
  };
  walk(normalized, prefix, depth);
  return out;
}

function section(title, { body = "", data = null, bullets = [] } = {}) {
  const normalizedData = deepNormalize(data);
  const normalizedBullets = [
    ...array(bullets).map((item) => primitiveText(item)).filter(Boolean),
    ...(present(normalizedData) ? structuredBullets(normalizedData) : [])
  ].filter((value, index, all) => value && all.indexOf(value) === index);
  const value = {
    title: clean(title),
    body: clean(body, 12000),
    bullets: normalizedBullets.slice(0, 80),
    ...(present(normalizedData) ? { data: normalizedData } : {})
  };
  return present(value.body) || value.bullets.length || present(value.data) ? value : null;
}

function compactSections(sections) {
  return Object.fromEntries(Object.entries(sections).filter(([, value]) => present(value)));
}

function localizedFor(row, language = "EN") {
  const list = array(deepNormalize(row.localized));
  return list.find((item) => upper(item?.language, 8) === upper(language, 8)) ||
    list.find((item) => upper(item?.language, 8) === "EN") || list[0] || {};
}

function mediaFor(row) {
  return array(deepNormalize(row.media)).filter((item) => item?.active !== false);
}
function primaryMedia(row) {
  const media = mediaFor(row);
  return media.find((item) => item.isHero === true) ||
    media.find((item) => item.isPrimary === true) ||
    media.find((item) => upper(item.role) === "HERO") ||
    media.find((item) => upper(item.role) === "PRIMARY") || media[0] || {};
}
function relationFor(row, type) {
  const wanted=upper(type,80);
  return array(deepNormalize(row.relations)).find((item) => upper(item?.targetType || item?.target_type,80) === wanted || upper(item?.relationType || item?.relation_type,80) === wanted) || {};
}
function relationName(row, type) {
  const relation=relationFor(row,type);
  return clean(relation.targetName || relation.target_name || relation.name);
}

function galleryFor(row) {
  return mediaFor(row)
    .filter((item) => present(item.url))
    .map((item) => ({
      url: clean(item.url, 4000),
      altText: clean(item.altText || item.alt_text),
      caption: clean(item.caption),
      credit: clean(item.credit),
      role: upper(item.role, 40)
    }));
}

function productIdentity(row, type) {
  const content = localizedFor(row, "EN");
  const details = object(deepNormalize(row.details));
  const hero = primaryMedia(row);
  return {
    id: clean(row.public_id || row.code || row.slug),
    type,
    code: clean(row.code),
    name: clean(content.title || row.name),
    title: clean(content.title || row.name),
    slug: clean(row.slug),
    summary: clean(content.shortDescription || details.shortDescription || details.summary),
    intro: clean(content.fullDescription || content.shortDescription || details.description || details.summary),
    heroImage: clean(hero.url),
    gallery: galleryFor(row),
    localized: {
      language: clean(content.language || "EN"),
      eyebrow: clean(content.eyebrow),
      shortDescription: clean(content.shortDescription),
      fullDescription: clean(content.fullDescription),
      importantInformation: clean(content.importantInformation),
      highlights: array(deepNormalize(content.highlights)),
      included: array(deepNormalize(content.included)),
      notIncluded: array(deepNormalize(content.notIncluded))
    }
  };
}

function hotelRecord(row) {
  const d = object(deepNormalize(row.details));
  const identity = productIdentity(row, "hotels");
  const content = identity.localized;
  return {
    ...identity,
    city: clean(d.city),
    country: clean(d.countryName || d.countryCode),
    destination: clean(relationName(row,"DESTINATION") || d.city),
    starRating: number(d.officialStarRating, 0) || null,
    badges: [d.propertyType, d.skandiTier, d.officialStarRating ? `${d.officialStarRating} star` : ""].filter(Boolean),
    amenities: array(deepNormalize(d.facilities)),
    included: content.included,
    sections: compactSections({
      overview: section("Overview", { body: content.fullDescription || identity.intro, bullets: content.highlights }),
      facilities: section("Facilities", { data: d.facilities }),
      rooms: section("Rooms", { data: d.rooms }),
      location: section("Location", {
        data: {
          address: d.address,
          city: d.city,
          postalCode: d.postalCode,
          distanceToCenter: d.distanceToCenter,
          distanceToBeach: d.distanceToBeach,
          distanceToAirport: d.distanceToAirport,
          transferTimeMinutes: d.transferTimeMinutes
        }
      }),
      family: section("Family", { data: { familyRooms: d.familyRooms, minimumCheckinAge: d.minimumCheckinAge, childPolicy: d.childPolicy } }),
      accessibility: section("Accessibility", { body: clean(d.accessibility || d.accessibilityNotes), data: d.accessibilityDetails }),
      guestNotes: section("Important Information", { body: content.importantInformation, data: d.facts })
    })
  };
}

function guidedTourRecord(row, customerOps = {}) {
  const d = object(deepNormalize(row.details));
  const identity = productIdentity(row, "tours");
  const content = identity.localized;
  return {
    ...identity,
    destination: clean(relationName(row,"DESTINATION") || relationName(row,"AREA") || d.city || d.countryName),
    durationText: d.durationMinutes ? `${d.durationMinutes} minutes` : clean(d.duration),
    difficulty: clean(d.difficulty),
    publicType: clean(d.tourType || "GUIDED_TOUR"),
    badges: [d.tourType, d.difficulty, d.durationMinutes ? `${d.durationMinutes} min` : ""].filter(Boolean),
    included: content.included,
    meetingPoint: clean(d.meetingPoint || d.startLocation),
    sections: compactSections({
      overview: section("Overview", { body: content.fullDescription || identity.intro, bullets: content.highlights }),
      itinerary: section("Itinerary", { data: customerOps.itinerary }),
      pickup: section("Pickup / Meeting Point", { body: clean(d.meetingPoint || d.startLocation), data: customerOps.pickups }),
      included: section("Included", { data: content.included }),
      notIncluded: section("Not Included", { data: content.notIncluded }),
      accessibility: section("Accessibility / Restrictions", {
        body: clean(d.accessibility),
        data: { difficulty: d.difficulty, minimumAge: d.minimumAge, childPolicy: d.childPolicy }
      }),
      changes: section("Changes & Cancellation", { data: { cancellationRule: customerOps.cancellationRule, amendmentPolicy: customerOps.amendmentPolicy } }),
      information: section("Important Information", { body: content.importantInformation })
    })
  };
}

function activityRecord(row, customerOps = {}) {
  const d = object(deepNormalize(row.details));
  const identity = productIdentity(row, "activities");
  const content = identity.localized;
  return {
    ...identity,
    destination: clean(relationName(row,"DESTINATION") || relationName(row,"AREA") || d.city || d.countryName),
    durationText: d.durationMinutes ? `${d.durationMinutes} minutes` : clean(d.duration),
    publicType: clean(d.activityType || d.category || "ACTIVITY"),
    meetingPoint: clean(d.meetingPoint || d.startLocation),
    included: content.included,
    sections: compactSections({
      overview: section("Overview", { body: content.fullDescription || identity.intro, bullets: content.highlights }),
      meeting: section("Pickup / Meeting Point", {
        body: clean(d.meetingPoint || d.startLocation),
        data: { pickupAvailable: d.pickupAvailable, hotelPickupAvailable: d.hotelPickupAvailable }
      }),
      included: section("Included", { data: content.included }),
      restrictions: section("Accessibility / Restrictions", {
        body: clean(d.accessibility),
        data: { minimumAge: d.minimumAge, maximumAge: d.maximumAge, childPolicy: d.childPolicy }
      }),
      changes: section("Changes & Cancellation", { data: { cancellationRule: customerOps.cancellationRule, amendmentPolicy: customerOps.amendmentPolicy } }),
      information: section("Important Information", { body: content.importantInformation })
    })
  };
}

function ticketRecord(row, customerOps = {}) {
  const d = object(deepNormalize(row.details));
  const identity = productIdentity(row, "tickets");
  const content = identity.localized;
  return {
    ...identity,
    destination: clean(relationName(row,"DESTINATION") || relationName(row,"AREA") || d.city || d.countryName),
    durationText: clean(d.duration),
    publicType: clean(d.ticketType || d.category || "PARTNER_TICKET"),
    meetingPoint: clean(d.meetingLocation),
    included: content.included,
    sections: compactSections({
      overview: section("Overview", { body: content.fullDescription || identity.intro, bullets: content.highlights }),
      ticket: section("Ticket Information", {
        data: { validityType: d.validityType, duration: d.duration, meetingLocation: d.meetingLocation, deliveryMethod: customerOps.deliveryMethod }
      }),
      included: section("Included", { data: content.included }),
      restrictions: section("Restrictions", { body: clean(d.restrictions) }),
      changes: section("Changes & Cancellation", { data: { cancellationRule: customerOps.cancellationRule, amendmentPolicy: customerOps.amendmentPolicy } }),
      information: section("Important Information", { body: content.importantInformation })
    })
  };
}

function transferRecord(row, customerOps = {}) {
  const d = object(deepNormalize(row.details));
  const identity = productIdentity(row, "transfers");
  const content = identity.localized;

  // Most customer facts come from the publication-gated public view.
  // customerOps contains only the explicit server-side whitelist created after that
  // publication gate; the raw canonical operations object is never returned.
  const customerFacts = {
    transferType: d.transferType,
    direction: d.direction,
    transportMode: d.transportMode,
    vehicleType: d.vehicleType,
    vehicleClass: d.vehicleClass,
    publishedTimeMin: d.publishedTimeMin,
    publishedTimeMax: d.publishedTimeMax,
    luggageCapacity: d.luggageCapacity,
    childSeatAvailable: d.childSeatAvailable,
    accessibleVehicleAvailable: d.accessibleVehicleAvailable
  };
  return {
    ...identity,
    destination: clean(relationName(row,"DESTINATION") || relationName(row,"AREA") || d.zoneName || d.city || d.countryName),
    fromLocation: clean(d.airportIata || d.searchAirportIata || d.arrivalHall),
    toLocation: clean(relationName(row,"DESTINATION") || relationName(row,"AREA") || d.zoneName || d.city),
    publicType: clean(d.transferType || "TRANSFER"),
    meetingPoint: clean(d.meetingPoint),
    badges: [d.transferType, d.transportMode, d.vehicleClass].filter(Boolean),
    sections: compactSections({
      overview: section("Overview", { body: content.fullDescription || identity.intro, bullets: content.highlights, data: customerFacts }),
      meetingPoint: section("Meeting Point", { body: clean(d.meetingPointDescription || d.meetingPoint), data: { terminal: d.terminal, arrivalHall: d.arrivalHall, airportExitNumber: d.airportExitNumber, waitingArea: d.waitingArea } }),
      luggage: section("Luggage", { data: { luggageCapacity: d.luggageCapacity, extraBagPolicy: d.extraBagPolicy, sportsEquipmentPolicy: d.sportsEquipmentPolicy } }),
      accessibility: section("Accessibility", { body: clean(d.accessibilityNotes), data: { accessibleVehicleAvailable: d.accessibleVehicleAvailable, accessibleVehicleGuaranteed: d.accessibleVehicleGuaranteed, accessibilityRequestRequired: d.accessibilityRequestRequired } }),
      timing: section("Transfer Time", { data: {
        publishedTimeMin: d.publishedTimeMin, publishedTimeMax: d.publishedTimeMax,
        sharedTimeMin: d.sharedTimeMin, sharedTimeMax: d.sharedTimeMax,
        directTimeMin: d.directTimeMin, directTimeMax: d.directTimeMax,
        delayProtection: customerOps.delayProtection,
        maximumDelayWaitMinutes: customerOps.maximumDelayWaitMinutes,
        reconfirmationRequired: customerOps.reconfirmationRequired,
        previousDayNotification: customerOps.previousDayNotification
      } }),
      pickupInstructions: section("Pickup Instructions", { data: { pickupLocationInstructions: customerOps.pickupLocationInstructions, afterBaggageInstructions: customerOps.afterBaggageInstructions } }),
      changes: section("Changes & Cancellation", { data: { cancellationRule: customerOps.cancellationRule, amendmentPolicy: customerOps.amendmentPolicy } }),
      contact: section("Contact", { data: { emergencyPhone: d.emergencyPhone } }),
      information: section("Important Information", { body: content.importantInformation })
    })
  };
}

function publicProduct(row, customerOps = {}) {
  const type = upper(row.entity_type);
  if (type === "HOTEL") return hotelRecord(row);
  if (type === "GUIDED_TOUR") return guidedTourRecord(row, customerOps);
  if (type === "ACTIVITY") return activityRecord(row, customerOps);
  if (type === "PARTNER_TICKET") return ticketRecord(row, customerOps);
  if (type === "TRANSFER") return transferRecord(row, customerOps);
  return null;
}

// Server-only operational enrichment. The publication-gated public view decides
// which products may be exposed. We read canonical master operations only for
// those already-public records, then whitelist customer-safe fields. Raw
// operations, guide/dispatch notes, staff assignments and internal procedures
// never cross the public DTO boundary.
function customerSafeOperations(entityType, value = {}) {
  const o = object(deepNormalize(value));
  switch (upper(entityType)) {
    case "GUIDED_TOUR":
      return {
        itinerary: array(o.itinerary),
        pickups: array(o.pickups),
        cancellationRule: clean(o.cancellationRule || o.cancellationPolicy),
        amendmentPolicy: clean(o.amendmentPolicy)
      };
    case "ACTIVITY":
      return {
        cancellationRule: clean(o.cancellationRule || o.cancellationPolicy),
        amendmentPolicy: clean(o.amendmentPolicy)
      };
    case "PARTNER_TICKET":
      return {
        deliveryMethod: clean(o.deliveryMethod),
        cancellationRule: clean(o.cancellationRule || o.cancellationPolicy),
        amendmentPolicy: clean(o.amendmentPolicy)
      };
    case "TRANSFER":
      return {
        delayProtection: o.delayProtection === true,
        maximumDelayWaitMinutes: present(o.maximumDelayWaitMinutes) ? number(o.maximumDelayWaitMinutes, 0) : null,
        reconfirmationRequired: o.reconfirmationRequired === true,
        previousDayNotification: o.previousDayNotification === true,
        pickupLocationInstructions: clean(o.pickupLocationInstructions),
        afterBaggageInstructions: clean(o.afterBaggageInstructions),
        cancellationRule: clean(o.cancellationRule || o.cancellationPolicy),
        amendmentPolicy: clean(o.amendmentPolicy)
      };
    default:
      return {};
  }
}

async function publicOperationMap(publicRows = []) {
  const publicIds = new Set(publicRows.map((row) => clean(row.id, 80)).filter(Boolean));
  if (!publicIds.size) return new Map();
  const masterRows = await select("inventory_master_entities", {
    select: "id,entity_type,operations",
    active: "eq.true",
    limit: "3000"
  });
  return new Map(masterRows
    .filter((row) => publicIds.has(clean(row.id, 80)))
    .map((row) => [clean(row.id, 80), customerSafeOperations(row.entity_type, row.operations)]));
}

function helpGroup(row = {}) {
  return {
    groupId: clean(row.group_id),
    title: clean(row.title),
    subtitle: clean(row.subtitle),
    eyebrow: clean(row.eyebrow || "SKANDI Help Center"),
    icon: clean(row.icon || "support"),
    sortOrder: number(row.sort_order, 999),
    active: row.active !== false
  };
}
function helpTopic(row = {}) {
  return {
    topicId: clean(row.topicId || row.topic_id || row.id),
    groupId: clean(row.groupId || row.group_id),
    title: clean(row.title),
    subtitle: clean(row.subtitle),
    body: clean(row.body, 16000),
    bullets: array(deepNormalize(row.bulletsJson || row.bullets_json)),
    actionType: clean(row.actionType || row.action_type || "article"),
    actionTarget: clean(row.actionTarget || row.action_target),
    linkedLibrary: clean(row.linkedLibrary || row.linked_library),
    tags: clean(row.tags),
    sortOrder: number(row.sort_order, 999),
    active: row.active !== false,
    featured: row.featured === true
  };
}

function airlineRecord(row, aircraftForAirline = []) {
  const details = object(deepNormalize(row.inventory_details));
  const localized = array(deepNormalize(row.localized_content));
  const en = localized.find((item) => upper(item?.language, 8) === "EN") || localized[0] || {};
  const media = array(deepNormalize(row.media_assets));
  const title = clean(row.Title || row.title || en.title || row.shortName);
  const id = clean(row["Record ID"] || row.recordId || row.iataCode || row.ID);
  const aircraft = array(aircraftForAirline);

  const customSections = deepNormalize(row.sectionsJson);
  const custom = Array.isArray(customSections)
    ? Object.fromEntries(customSections.map((item, index) => [clean(item?.key || `guide${index + 1}`), section(item?.title || `Guide ${index + 1}`, { body: item?.body, data: item?.data, bullets: item?.bullets })]).filter(([, value]) => value))
    : object(customSections);

  const inflightData = aircraft.length ? aircraft : deepNormalize(row.aircraftConfigurationsJson);
  const sections = compactSections({
    overview: section("Overview", { body: clean(en.fullDescription || en.shortDescription || row.summary), data: deepNormalize(row.quickFactsJson) }),
    baggage: section("Baggage", { body: clean(row.baggageAllowence), data: details.baggage || details.baggageAllowance }),
    checkin: section("Check-in", { body: clean(row.checkInDeadline), data: details.checkin }),
    cabins: section("Seats / Cabins", { body: clean(row.classComparisonText), data: deepNormalize(row.cabinsJson) }),
    lounges: section("Lounges", { data: deepNormalize(row.lounges) }),
    boarding: section("Boarding", { data: deepNormalize(row.boarding) }),
    food: section("Food & Drinks", { data: deepNormalize(row.foodDrinksJson) }),
    wifi: section("Wi-Fi / Connectivity", { data: deepNormalize(row.wifiOnboardJson) }),
    kids: section("Children / Infants", { data: deepNormalize(row.childrenInfantsJson) }),
    irregularities: section("Delays / Cancellations", { data: deepNormalize(row.delayCancellationJson) }),
    damaged: section("Damaged Baggage", { data: deepNormalize(row.damagedBaggageJson) }),
    lost: section("Lost & Found", { data: deepNormalize(row.lostFoundJson) }),
    loyalty: section("Loyalty", { body: clean(row.loyaltyProgram), data: { program: row.loyaltyProgram, url: row.loyaltyProgramUrl } }),
    ticketTypes: section("Ticket Types", { data: deepNormalize(row.ticketTypesJson) }),
    inflightExperience: section("Inflight Experience", { data: inflightData }),
    sources: section("Sources", { data: deepNormalize(row.sourceUrlsJson || row.servicePolicySourceUrlsJson) }),
    contact: section("Contact", { body: clean(row.contactUrl) }),
    ...Object.fromEntries(Object.entries(custom).filter(([, value]) => value && typeof value === "object" && (present(value.title) || present(value.body) || present(value.data) || present(value.bullets))))
  });

  return {
    id,
    name: title,
    shortName: clean(row.shortName),
    initials: clean(row.iataCode),
    iataCode: clean(row.iataCode),
    icaoCode: clean(row.icaoCode),
    country: clean(row.locationCountry),
    hub: clean(row.locationCity),
    website: clean(row.website),
    logo: clean(row.logoFile || row.logoUrl),
    textmarkLogo: clean(row.logoFile),
    heroImage: clean(row.heroAircraftUrl || media.find((item) => item?.isHero)?.url),
    aircraftLogo: clean(row.heroAircraftUrl),
    color: clean(row.primaryColor || "#022e64"),
    accent: clean(row.accentColor || "#d7e6ff"),
    summary: clean(en.shortDescription || row.summary),
    intro: clean(en.fullDescription || en.shortDescription || row.summary),
    meta: array(deepNormalize(row.quickFactsJson)).length
      ? array(deepNormalize(row.quickFactsJson)).map((fact) => typeof fact === "string" ? fact : [fact?.label, fact?.value].filter(Boolean).join(": ")).filter(Boolean)
      : [row.iataCode, row.locationCountry, row.locationCity].filter(Boolean),
    sections,
    sourceUrls: array(deepNormalize(row.sourceUrlsJson || row.servicePolicySourceUrlsJson)),
    publicDisclaimer: "Airline services, inclusions and policies can change by route, fare, aircraft and date. Confirm booking-specific details with the operating carrier."
  };
}

function airportRecord(row) {
  const details = object(deepNormalize(row.inventory_details));
  const localized = array(deepNormalize(row.localized_content));
  const en = localized.find((item) => upper(item?.language, 8) === "EN") || localized[0] || {};
  const customSections = deepNormalize(row.sectionsJson);
  const custom = Array.isArray(customSections)
    ? Object.fromEntries(customSections.map((item, index) => [clean(item?.key || `guide${index + 1}`), section(item?.title || `Guide ${index + 1}`, { body: item?.body, data: item?.data, bullets: item?.bullets })]).filter(([, value]) => value))
    : object(customSections);

  return {
    id: clean(row.iata || row.itemId || row.ID),
    code: clean(row.iata),
    name: clean(en.title || row.title),
    city: clean(row.locationCity),
    country: clean(row.country),
    region: clean(details.region || row.country),
    summary: clean(en.shortDescription || row.summary || row.body),
    tagline: clean(row.information || en.eyebrow || row.summary),
    heroImage: clean(row.heroImageUrl || row.image_url),
    logo: clean(row.logoUrl),
    badges: [row.iata ? `IATA ${row.iata}` : "", row.icao ? `ICAO ${row.icao}` : "", row.locationCity, row.country].filter(Boolean),
    sections: compactSections({
      overview: section("Overview", { body: clean(en.fullDescription || row.information || row.summary), data: deepNormalize(row.quickFactsJson) }),
      arrivals: section("Arrivals", { body: clean(details.arrivalInfo || details.arrivals) }),
      departures: section("Departures", { body: clean(details.departureInfo || details.departures) }),
      terminals: section("Terminals", { data: deepNormalize(row.terminalsJson) }),
      transport: section("Transport", { body: clean(details.transportInfo), data: deepNormalize(row.transportJson) }),
      runways: section("Runways", { data: deepNormalize(row.runwaysJson) }),
      lounges: section("Lounges", { data: deepNormalize(row.lounges) }),
      food: section("Food & Drinks", { data: deepNormalize(row.foodDrinksJson) }),
      hotels: section("Airport Hotels", { data: deepNormalize(row.airportHotels) }),
      lost: section("Lost & Found", { data: deepNormalize(row.lostFoundJson) }),
      routes: section("Destinations / Routes", { data: deepNormalize(row.destinationsServing) }),
      sources: section("Sources", { data: deepNormalize(row.sourceUrlsJson) }),
      contact: section("Contact", { body: clean(row.contactUrl || row.website) }),
      ...Object.fromEntries(Object.entries(custom).filter(([, value]) => value && typeof value === "object" && (present(value.title) || present(value.body) || present(value.data) || present(value.bullets))))
    })
  };
}

function aircraftPublic(row, children = {}) {
  const cabins = array(children.cabins).filter((item) => clean(item.aircraft_id) === clean(row.id));
  const views = array(children.views).filter((item) => clean(item.aircraft_id) === clean(row.id));
  const scenes = array(children.scenes).filter((item) => clean(item.aircraft_id) === clean(row.id));
  const viewIds = new Set(views.map((item) => clean(item.id)));
  const sceneIds = new Set(scenes.map((item) => clean(item.id)));
  const hotspots = array(children.hotspots).filter((item) => viewIds.has(clean(item.view_id)));
  const sceneHotspots = array(children.sceneHotspots).filter((item) => sceneIds.has(clean(item.scene_id)));
  const publicAircraftId = [clean(row.airline_code), clean(row.aircraft_code), clean(row.variant || row.family)].filter(Boolean).join("-");
  return {
    id: publicAircraftId,
    airlineCode: clean(row.airline_code),
    aircraftCode: clean(row.aircraft_code),
    aircraftName: clean(row.aircraft_name),
    manufacturer: clean(row.manufacturer),
    family: clean(row.family),
    variant: clean(row.variant),
    totalSeats: number(row.total_seats, 0),
    configuration: deepNormalize(row.configuration),
    displayTitle: clean(row.display_title || row.aircraft_name),
    displaySummary: clean(row.display_summary),
    heroImageUrl: clean(row.hero_image_url),
    exteriorImageUrl: clean(row.exterior_image_url),
    seatmapImageUrl: clean(row.seatmap_image_url),
    thumbnailImageUrl: clean(row.thumbnail_image_url),
    defaultCabinCode: clean(row.default_cabin_code),
    defaultViewType: clean(row.default_view_type),
    walkthrough: {
      title: clean(row.walkthrough_title),
      subtitle: clean(row.walkthrough_subtitle),
      startSceneCode: clean(row.walkthrough_start_scene_code),
      accuracyLabel: clean(row.walkthrough_accuracy_label),
      scenes: scenes.map((scene) => ({
        sceneCode: clean(scene.scene_code), title: clean(scene.title), shortTitle: clean(scene.short_title), summary: clean(scene.summary),
        imageUrl: clean(scene.image_url), mobileImageUrl: clean(scene.mobile_image_url), forwardSceneCode: clean(scene.forward_scene_code), backSceneCode: clean(scene.back_scene_code),
        forwardLabel: clean(scene.forward_label), backLabel: clean(scene.back_label), sortOrder: number(scene.sort_order, 999),
        hotspots: sceneHotspots.filter((item) => clean(item.scene_id) === clean(scene.id)).map((item) => ({
          hotspotCode: clean(item.hotspot_code), label: clean(item.label), title: clean(item.title), description: clean(item.description), hotspotType: clean(item.hotspot_type),
          x: number(item.x, 0), y: number(item.y, 0), action: clean(item.action), targetCabinCode: clean(item.target_cabin_code), sortOrder: number(item.sort_order, 999)
        }))
      }))
    },
    cabins: cabins.map((cabin) => ({
      cabinCode: clean(cabin.cabin_code), cabinName: clean(cabin.cabin_name), rank: number(cabin.rank, 999), seatCount: number(cabin.seat_count, 0),
      summary: clean(cabin.summary), description: clean(cabin.description), mealTitle: clean(cabin.meal_title), mealDescription: clean(cabin.meal_description), amenities: deepNormalize(cabin.amenities), displaySettings: deepNormalize(cabin.display_settings)
    })),
    views: views.map((view) => ({
      viewCode: clean(view.view_code), label: clean(view.label), viewType: clean(view.view_type),
      imageUrl: clean(view.image_url), mobileImageUrl: clean(view.mobile_image_url), thumbnailUrl: clean(view.thumbnail_url), altText: clean(view.alt_text), caption: clean(view.caption), credit: clean(view.credit), isDefault: view.is_default === true,
      hotspots: hotspots.filter((item) => clean(item.view_id) === clean(view.id)).map((item) => ({
        hotspotCode: clean(item.hotspot_code), label: clean(item.label), title: clean(item.title), description: clean(item.description), x: number(item.x, 0), y: number(item.y, 0), action: clean(item.action),
        focusX: number(item.focus_x, 0), focusY: number(item.focus_y, 0), focusZoom: number(item.focus_zoom, 0), targetCabinCode: clean(item.target_cabin_code), thumbnailUrl: clean(item.thumbnail_url), sortOrder: number(item.sort_order, 999)
      }))
    }))
  };
}

async function select(table, query = {}) {
  const result = await restRequest({ table, method: "GET", query, prefer: "" });
  return Array.isArray(result) ? result : [];
}

async function buildPublicPayload() {
  const [
    groups, topics, airlineRows, airportRows, inventoryRows,
    aircraftRows, cabinRows, viewRows, hotspotRows, sceneRows, sceneHotspotRows
  ] = await Promise.all([
    select("travel_info_faq_groups", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "250" }),
    select("travel_info_faq", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "1000" }),
    select("travel_info_airlines", { select: "*", active: "eq.true", customer_visible: "eq.true", published: "eq.true", order: "sort_order.asc", limit: "250" }),
    select("travel_info_airports", { select: "*", active: "eq.true", customer_visible: "eq.true", published: "eq.true", order: "sort_order.asc", limit: "500" }),
    select("inventory_public_entities_v", { select: "*", order: "entity_type.asc,sort_priority.asc", limit: "3000" }),
    select("travel_info_aircraft", { select: "*", active: "eq.true", customer_visible: "eq.true", status: "eq.PUBLISHED", order: "airline_code.asc,sort_order.asc", limit: "1500" }),
    select("travel_info_aircraft_cabins", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "5000" }),
    select("travel_info_aircraft_views", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "5000" }),
    select("travel_info_aircraft_hotspots", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "10000" }),
    select("travel_info_aircraft_walk_scenes", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "5000" }),
    select("travel_info_aircraft_scene_hotspots", { select: "*", active: "eq.true", order: "sort_order.asc", limit: "10000" })
  ]);

  const children = { cabins: cabinRows, views: viewRows, hotspots: hotspotRows, scenes: sceneRows, sceneHotspots: sceneHotspotRows };
  const aircraftPairs = aircraftRows.map((row) => ({ raw: row, item: aircraftPublic(row, children) }));
  const aircraft = aircraftPairs.map(({ item }) => item);
  const aircraftByAirline = new Map();
  for (const { raw, item } of aircraftPairs) {
    for (const key of [raw.airline_id, item.airlineCode].filter(Boolean)) {
      const normalized = upper(key);
      aircraftByAirline.set(normalized, [...(aircraftByAirline.get(normalized) || []), item]);
    }
  }

  const airlines = {};
  for (const row of airlineRows) {
    const keys = [row.ID, row["Record ID"], row.iataCode].map((value) => upper(value)).filter(Boolean);
    const matches = keys.flatMap((key) => aircraftByAirline.get(key) || []);
    const uniqueAircraft = [...new Map(matches.map((item) => [item.id, item])).values()];
    const item = airlineRecord(row, uniqueAircraft);
    if (item.id) airlines[item.id] = item;
  }

  const customerOperations = await publicOperationMap(inventoryRows);
  const products = { hotels: [], transfers: [], tours: [], activities: [], tickets: [] };
  for (const row of inventoryRows) {
    const library = PRODUCT_TYPE_TO_LIBRARY[upper(row.entity_type)];
    if (!library) continue;
    const item = publicProduct(row, customerOperations.get(clean(row.id, 80)) || {});
    if (item) products[library].push(item);
  }

  return {
    type: "TRAVEL_INFO_DATA",
    source: "SKANDI_PUBLIC_TRAVEL_INFO",
    generatedAt: new Date().toISOString(),
    helpCenter: { groups: groups.map(helpGroup), topics: topics.map(helpTopic) },
    airlines,
    airports: airportRows.map(airportRecord),
    ...products,
    aircraft,
    travelRequirements: {
      countries: [], visaDurations: {}, passportValidityRules: {}, healthRules: {}, transitRules: {}, airlineOverrides: {},
      disclaimer: "Travel requirements change. Always confirm passport, visa, health and transit requirements with official authorities and the operating carrier before departure."
    },
    baggageRules: {},
    loyaltyPrograms: {},
    excessBaggagePricing: {}
  };
}

export const getTravelInfoPayload = webMethod(Permissions.Anyone, async function () {
  return buildPublicPayload();
});

function supportTicketId() {
  return `TRAVEL-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export const createTravelInfoSupportRequest = webMethod(Permissions.Anyone, async function (payload = {}) {
  const message = clean(payload.message, 12000);
  if (!message) return { ok: false, error: "Message is required." };

  const ticketId = supportTicketId();
  const createdAt = new Date().toISOString();
  const row = {
    title: `Travel Info request ${ticketId}`,
    slug: ticketId.toLowerCase(),
    category: clean(payload.category || "General", 160),
    body: message,
    active: true,
    sort_order: 999,
    payload: {
      ticketId,
      source: "travel-info",
      name: clean(payload.name, 250),
      email: clean(payload.email, 500).toLowerCase(),
      bookingReference: upper(payload.bookingReference, 80),
      message,
      status: "NEW",
      createdAt
    }
  };
  try {
    await restRequest({ table: "travel_info_support_requests", method: "POST", body: row, prefer: "return=representation" });
    return { ok: true, ticketId, message: "Request received." };
  } catch (error) {
    console.error("[Travel Info] support request failed", error);
    return { ok: false, error: "Support request could not be created." };
  }
});

function tokenize(text) {
  return [...new Set(clean(text, 10000).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter((word) => word.length > 2))];
}
function searchableText(item) {
  return clean(JSON.stringify({
    name: item.name || item.title,
    code: item.code || item.iataCode,
    city: item.city,
    country: item.country,
    destination: item.destination,
    summary: item.summary || item.intro,
    sections: item.sections,
    tags: item.tags
  }), 120000).toLowerCase();
}
function knowledgeRows(payload) {
  const rows = [];
  const push = (kind, item) => rows.push({ kind, item, text: searchableText(item) });
  Object.values(payload.airlines || {}).forEach((item) => push("Airline", item));
  array(payload.airports).forEach((item) => push("Airport", item));
  for (const [kind, list] of [["Hotel", payload.hotels], ["Transfer", payload.transfers], ["Tour", payload.tours], ["Activity", payload.activities], ["Ticket", payload.tickets]]) array(list).forEach((item) => push(kind, item));
  array(payload.helpCenter?.topics).forEach((item) => push("Help", item));
  return rows;
}
function answerFromMatch(match, query) {
  const item = match.item;
  const sections = Object.values(object(item.sections)).slice(0, 4);
  const facts = sections.flatMap((part) => [clean(part?.body), ...array(part?.bullets).slice(0, 3).map(clean)]).filter(Boolean).slice(0, 6);
  const intro = clean(item.summary || item.intro || item.body || item.subtitle);
  const parts = [intro, ...facts].filter(Boolean);
  const answer = parts.length ? parts.join("\n\n") : `I found ${clean(item.name || item.title || item.code)} in SKANDI Travel Info, but there is no additional published guidance for that question yet.`;
  return {
    ok: true,
    answer,
    reply: answer,
    message: answer,
    subject: clean(item.name || item.title || item.code),
    kind: match.kind,
    query: clean(query),
    suggestions: Object.values(object(item.sections)).slice(0, 5).map((part) => clean(part?.title)).filter(Boolean)
  };
}

export const askTravelInfoAgent = webMethod(Permissions.Anyone, async function (payload = {}) {
  const query = clean(payload.question || payload.query || payload.message, 4000);
  if (!query) return { ok: false, answer: "What would you like to know about your trip?", suggestions: ["Baggage", "Airport information", "Transfers", "Hotels"] };
  const publicPayload = await buildPublicPayload();
  const words = tokenize(query);
  const rows = knowledgeRows(publicPayload).map((row) => ({
    ...row,
    score: words.reduce((sum, word) => sum + (row.text.includes(word) ? (row.text.startsWith(word) ? 5 : 2) : 0), 0)
  })).sort((a, b) => b.score - a.score);
  const best = rows[0];
  if (!best || best.score < 2) {
    const answer = "I could not find a reliable published SKANDI Travel Info answer for that yet. For booking-specific or urgent help, please contact SKANDI support from this page.";
    return { ok: true, answer, reply: answer, message: answer, query, suggestions: ["Contact support", "Airline information", "Airport information", "Travel Info Help Center"], matches: [] };
  }
  const result = answerFromMatch(best, query);
  return { ...result, matches: rows.slice(0, 5).filter((row) => row.score > 0).map((row) => ({ kind: row.kind, id: clean(row.item.id || row.item.topicId), title: clean(row.item.name || row.item.title), score: row.score })) };
});

function secretValue(response) {
  if (typeof response === "string") return response.trim();
  return clean(response?.value ?? response?.secretValue ?? response?.secret?.value ?? "", 10000);
}
async function getOpenWeatherKey() {
  const response = await elevatedGetSecretValue(OPENWEATHER_SECRET_NAME);
  const key = secretValue(response);
  if (!key) throw new Error(`Missing Wix Secret: ${OPENWEATHER_SECRET_NAME}`);
  return key;
}
function normalizeLocationInput(input = {}) {
  return {
    locationId: clean(input.locationId || input.id, 120),
    title: clean(input.title || input.name || input.city || input.query, 250),
    country: upper(input.country, 8),
    query: clean(input.query || input.city || input.title || input.name, 300),
    latitude: input.latitude !== undefined || input.lat !== undefined ? number(input.latitude ?? input.lat) : undefined,
    longitude: input.longitude !== undefined || input.lon !== undefined || input.lng !== undefined ? number(input.longitude ?? input.lon ?? input.lng) : undefined,
    sortOrder: number(input.sortOrder, 0),
    active: input.active !== false
  };
}
function buildWeatherUrl(location, apiKey) {
  const base = "https://api.openweathermap.org/data/2.5/weather";
  const params = new URLSearchParams();
  if (location.latitude !== undefined && location.longitude !== undefined) {
    params.set("lat", String(location.latitude));
    params.set("lon", String(location.longitude));
  } else {
    params.set("q", location.query || location.title || "");
  }
  params.set("appid", apiKey);
  params.set("units", "metric");
  return `${base}?${params.toString()}`;
}
function unixToIso(seconds) {
  const n = number(seconds, 0);
  return n ? new Date(n * 1000).toISOString() : "";
}
function normalizeOpenWeatherCurrent(raw = {}, location = {}) {
  const weather = array(raw.weather)[0] || {};
  const main = object(raw.main), wind = object(raw.wind), clouds = object(raw.clouds), sys = object(raw.sys), coord = object(raw.coord);
  const title = location.title || raw.name || location.query || "Destination";
  return {
    locationId: location.locationId || clean(title).toUpperCase().replace(/\W+/g, "_"), title, country: location.country || clean(sys.country), query: location.query || "",
    latitude: number(coord.lat, location.latitude), longitude: number(coord.lon, location.longitude), provider: "OpenWeather", providerStatusCode: number(raw.cod, 200), providerCityId: raw.id || "", fetchedAt: new Date().toISOString(),
    condition: clean(weather.main), description: clean(weather.description), icon: clean(weather.icon), iconUrl: weather.icon ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png` : "",
    tempC: round(main.temp, 1), feelsLikeC: round(main.feels_like, 1), tempMinC: round(main.temp_min, 1), tempMaxC: round(main.temp_max, 1), humidity: number(main.humidity, 0), pressureHpa: number(main.pressure, 0),
    windSpeedMps: round(wind.speed, 1), windDirectionDeg: number(wind.deg, 0), cloudiness: number(clouds.all, 0), visibilityMeters: number(raw.visibility, 0), sunrise: unixToIso(sys.sunrise), sunset: unixToIso(sys.sunset), timezoneOffsetSeconds: number(raw.timezone, 0),
    displayTemp: `${round(main.temp, 0)}°C`, displayWind: `${round(wind.speed, 1)} m/s`, displayHumidity: `${number(main.humidity, 0)}%`
  };
}
async function fetchCurrentWeather(location, apiKey) {
  const response = await fetch(buildWeatherUrl(location, apiKey), { method: "get" });
  let body = {};
  try { body = await response.json(); } catch (_) { body = {}; }
  if (!response.ok) throw new Error(clean(body.message) || `OpenWeather request failed with HTTP ${response.status}`);
  return normalizeOpenWeatherCurrent(body, location);
}

async function getTravelWeatherCore(payload = {}) {
  const apiKey = await getOpenWeatherKey();
  const requested = Array.isArray(payload.locations) && payload.locations.length ? payload.locations.map(normalizeLocationInput).filter((item) => item.active) : DEFAULT_WEATHER_LOCATIONS;
  const results = [];
  for (const location of requested) {
    try {
      results.push({ ok: true, ...(await fetchCurrentWeather(location, apiKey)) });
    } catch (error) {
      results.push({ ok: false, locationId: location.locationId || "", title: location.title || location.query || "Destination", query: location.query || "", error: error.message || "Weather unavailable", fetchedAt: new Date().toISOString() });
    }
  }
  return { ok: true, source: "OPENWEATHER", units: "metric", refreshedAt: new Date().toISOString(), locations: results };
}

export const getTravelWeather = webMethod(Permissions.Anyone, async function (payload = {}) {
  return getTravelWeatherCore(payload);
});

export const getTravelInfoBootstrap = webMethod(Permissions.Anyone, async function () {
  const [travelInfo, weather] = await Promise.all([
    buildPublicPayload(),
    getTravelWeatherCore({}).catch(() => ({ ok: false, source: "OPENWEATHER", units: "metric", refreshedAt: new Date().toISOString(), locations: [] }))
  ]);
  return { ok: true, source: "SKANDI_TRAVEL_INFO_SERVICE", refreshedAt: new Date().toISOString(), travelInfo, weather, helpCenter: { title: "SKANDI Travel Info", alexandraName: "Alexandra", alexandraTitle: "SKANDI TRAVELS Digital Customer Service Agent" } };
});
