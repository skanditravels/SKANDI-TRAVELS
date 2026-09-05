// SKANDI public destination/content service.
// Inventory Control V2 is authoritative for editorial/product content.
// Live air/stay availability is intentionally handled by bookingOrchestrator.web.js,
// whose backend provider adapter is not exposed to customer HTML.

import { webMethod, Permissions } from "wix-web-module";
import { restRequest } from "./RIA/supabaseServer.js";

const LANGUAGES = new Set(["EN","SV","NO","DA","ES","FI","DE","FR-FR","FR-CA","TH"]);
const PUBLISHED = {
  status: "eq.PUBLISHED",
  active: "eq.true",
  customer_visible: "eq.true"
};

function text(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function arr(value) {
  return Array.isArray(value) ? value : [];
}
function lang(value) {
  const v = text(value || "EN", 12).toUpperCase();
  return LANGUAGES.has(v) ? v : "EN";
}
function currency(value) {
  const v = text(value || "USD", 3).toUpperCase();
  return /^[A-Z]{3}$/.test(v) ? v : "USD";
}
function slug(value) {
  return text(value, 160).toLowerCase().replace(/[^a-z0-9-]/g, "");
}
function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function publishedQuery(extra = {}) {
  return { ...PUBLISHED, ...extra };
}
async function masters(extra = {}) {
  const rows = await restRequest({
    table: "inventory_master_entities",
    query: publishedQuery({
      select: "*",
      order: "sort_priority.asc,name.asc",
      limit: 1000,
      ...extra
    })
  });
  return arr(rows);
}
async function masterBySlug(entityType, targetSlug, level = "") {
  const query = {
    entity_type: `eq.${entityType}`,
    slug: `eq.${slug(targetSlug)}`,
    limit: 1
  };
  const rows = await masters(query);
  if (!level) return rows[0] || null;
  return rows.find(row => text(obj(row.details).level, 30).toUpperCase() === level) || null;
}
async function masterById(id) {
  const rows = await masters({ id: `eq.${text(id, 80)}`, limit: 1 });
  return rows[0] || null;
}
async function localizedMap(ids, language) {
  if (!ids.length) return new Map();
  const requested = lang(language);
  const rows = await restRequest({
    table: "inventory_localized_content",
    query: {
      select: "*",
      entity_id: `in.(${ids.join(",")})`,
      language: `in.(${requested},EN)`,
      limit: 2000
    }
  });
  const grouped = new Map();
  arr(rows).forEach(row => {
    if (!grouped.has(row.entity_id)) grouped.set(row.entity_id, {});
    grouped.get(row.entity_id)[text(row.language, 12).toUpperCase()] = row;
  });
  const result = new Map();
  grouped.forEach((byLanguage, id) => {
    result.set(id, byLanguage[requested] || byLanguage.EN || Object.values(byLanguage)[0] || {});
  });
  return result;
}
async function mediaMap(ids) {
  if (!ids.length) return new Map();
  const rows = await restRequest({
    table: "inventory_media_assets",
    query: {
      select: "*",
      entity_id: `in.(${ids.join(",")})`,
      active: "eq.true",
      order: "sort_order.asc,created_at.asc",
      limit: 3000
    }
  });
  const map = new Map();
  arr(rows).forEach(row => {
    if (!map.has(row.entity_id)) map.set(row.entity_id, []);
    map.get(row.entity_id).push(row);
  });
  return map;
}
async function relationRows(ids) {
  if (!ids.length) return [];
  const rows = await restRequest({
    table: "inventory_entity_relations",
    query: {
      select: "*",
      source_entity_id: `in.(${ids.join(",")})`,
      active: "eq.true",
      order: "sequence_no.asc",
      limit: 3000
    }
  });
  return arr(rows);
}
async function enrich(rows, language) {
  const records = arr(rows);
  const ids = records.map(row => row.id).filter(Boolean);
  const [local, media] = await Promise.all([localizedMap(ids, language), mediaMap(ids)]);
  return records.map(row => publicRecord(row, local.get(row.id) || {}, media.get(row.id) || []));
}
function mediaList(rows) {
  return arr(rows).map(row => ({
    id: row.id || "",
    url: row.url || "",
    alt: row.alt_text || "",
    caption: row.caption || "",
    role: row.is_hero ? "HERO" : row.is_card ? "CARD" : row.is_mobile ? "MOBILE" : "GALLERY",
    isHero: row.is_hero === true,
    isCard: row.is_card === true,
    isMobile: row.is_mobile === true,
    sortOrder: Number(row.sort_order || 100)
  })).filter(item => item.url);
}
function publicRecord(row, localized = {}, mediaRows = []) {
  const details = obj(row.details);
  const commercial = obj(row.commercial);
  const operations = obj(row.operations);
  const seo = obj(row.seo);
  const publication = obj(row.publication);
  const pageContent = obj(localized.content);
  const media = mediaList(mediaRows);
  const heroImages = media.filter(m => m.isHero).map(m => m.url);
  const gallery = media.map(m => m.url);
  const heroImage = heroImages[0] || media[0]?.url || details.heroImageUrl || "";
  const title = localized.title || row.name || "";
  const shortDescription = localized.short_description || "";
  const fullDescription = localized.full_description || "";
  return {
    ...details,
    ...pageContent,
    id: row.id || "",
    publicId: row.public_id || "",
    entityType: row.entity_type || "",
    code: row.code || "",
    slug: row.slug || "",
    name: title,
    title,
    eyebrow: localized.eyebrow || "",
    summary: pageContent.summary || shortDescription,
    shortDescription,
    about: pageContent.about || fullDescription,
    fullDescription,
    highlights: arr(localized.highlights),
    included: arr(localized.included),
    notIncluded: arr(localized.not_included),
    important: localized.important_information || pageContent.important || "",
    status: row.status || "",
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: Number(row.sort_priority || 100),
    parentEntityId: row.parent_entity_id || "",
    supplierEntityId: row.supplier_entity_id || "",
    commercial,
    operations,
    seo: { ...seo, title: localized.seo_title || seo.title || "", description: localized.seo_description || seo.description || "" },
    publication,
    media,
    gallery,
    heroImage,
    hero: {
      ...(obj(pageContent.hero)),
      image: obj(pageContent.hero).image || heroImage,
      images: arr(obj(pageContent.hero).images).length ? obj(pageContent.hero).images : gallery
    },
    updatedAt: row.updated_at || ""
  };
}
async function allDestinationHierarchy(language) {
  const rows = await masters({ entity_type: "eq.DESTINATION" });
  const enriched = await enrich(rows, language);
  const byId = new Map(enriched.map(item => [item.id, item]));
  return enriched.map(item => {
    const parent = byId.get(item.parentEntityId);
    const grand = parent ? byId.get(parent.parentEntityId) : null;
    const level = text(item.level, 30).toUpperCase();
    return {
      ...item,
      level,
      countrySlug: level === "COUNTRY" ? item.slug : (grand?.level === "COUNTRY" ? grand.slug : parent?.level === "COUNTRY" ? parent.slug : item.countrySlug || ""),
      countryName: level === "COUNTRY" ? item.name : (grand?.level === "COUNTRY" ? grand.name : parent?.level === "COUNTRY" ? parent.name : item.countryName || ""),
      countryCode: level === "COUNTRY" ? (item.countryCode || item.code) : (grand?.level === "COUNTRY" ? (grand.countryCode || grand.code) : parent?.level === "COUNTRY" ? (parent.countryCode || parent.code) : item.countryCode || ""),
      destinationSlug: level === "DESTINATION" ? item.slug : (parent?.level === "DESTINATION" ? parent.slug : item.destinationSlug || ""),
      destinationName: level === "DESTINATION" ? item.name : (parent?.level === "DESTINATION" ? parent.name : item.destinationName || ""),
      areaSlug: level === "AREA" ? item.slug : item.areaSlug || ""
    };
  });
}
async function airportLookup(language) {
  const rows = await masters({ entity_type: "eq.AIRPORT" });
  const list = await enrich(rows, language);
  return new Map(list.map(item => [item.id, item]));
}
function searchAirportFor(entity, airportMap) {
  const direct = airportMap.get(entity.nearestAirportId || entity.details?.nearestAirportId);
  return entity.searchAirportIata || entity.destinationIata || direct?.iata || "";
}
function relationTargets(relations, sourceId, relationType, targetMap) {
  const type = text(relationType, 60).toUpperCase();
  return relations
    .filter(r => r.source_entity_id === sourceId && text(r.relation_type, 60).toUpperCase() === type)
    .map(r => targetMap.get(r.target_entity_id))
    .filter(Boolean);
}
async function relatedPublished(source, language) {
  const all = await masters();
  const enriched = await enrich(all, language);
  const byId = new Map(enriched.map(item => [item.id, item]));
  const relations = await relationRows([source.id]);
  return { all: enriched, byId, relations };
}
function hotelCard(hotel, hierarchyById = new Map()) {
  const area = hierarchyById.get(hotel.areaId);
  const destination = hierarchyById.get(hotel.destinationId);
  return {
    ...hotel,
    hotelId: hotel.id,
    hotelSlug: hotel.slug,
    path: hotel.path || [
      "/destinations",
      area?.countrySlug || destination?.countrySlug || hotel.countrySlug,
      area?.destinationSlug || destination?.slug || hotel.destinationSlug,
      area?.slug || hotel.areaSlug,
      "hotels",
      hotel.slug
    ].filter(Boolean).join("/"),
    image: hotel.heroImage,
    imageUrl: hotel.heroImage,
    location: [area?.name, destination?.name].filter(Boolean).join(", "),
    rating: hotel.skandiRating || hotel.officialStarRating || null,
    classification: hotel.officialStarRating || null,
    price: hotel.commercial?.publicPrice ? { amount: Number(hotel.commercial.publicPrice), currency: hotel.commercial.currency || "USD" } : null,
    providerAccommodationId: hotel.providerAccommodationId || hotel.liveAccommodationId || hotel.sourceReference || ""
  };
}
async function datedInventoryMap(ids) {
  if (!ids.length) return new Map();
  const today = new Date().toISOString().slice(0,10);
  const rows = await restRequest({
    table: "inventory_dated_inventory",
    query: {
      select: "*",
      entity_id: `in.(${ids.join(",")})`,
      service_date: `gte.${today}`,
      stop_sale: "eq.false",
      blackout: "eq.false",
      status: "in.(OPEN,AVAILABLE)",
      order: "service_date.asc,start_time.asc",
      limit: 3000
    }
  }).catch(() => []);
  const map = new Map();
  arr(rows).forEach(row => {
    if (!map.has(row.entity_id)) map.set(row.entity_id, []);
    map.get(row.entity_id).push({
      id: row.id || "",
      serviceDate: row.service_date || "",
      startTime: row.start_time || "",
      endTime: row.end_time || "",
      variantCode: row.variant_code || "",
      variantName: row.variant_name || "",
      capacityTotal: Number(row.capacity_total || 0),
      available: Number(row.available || 0),
      publicPrice: numberOrNull(row.public_price),
      adultPrice: numberOrNull(row.adult_price),
      childPrice: numberOrNull(row.child_price),
      infantPrice: numberOrNull(row.infant_price),
      currency: row.currency || "USD",
      priceBasis: row.price_basis || "PER_PERSON",
      status: row.status || "OPEN"
    });
  });
  return map;
}

function activityCard(item, hierarchyById = new Map()) {
  const area = hierarchyById.get(item.areaId);
  const destination = hierarchyById.get(item.destinationId);
  return {
    ...item,
    activityId: item.id,
    image: item.heroImage,
    imageUrl: item.heroImage,
    location: [area?.name, destination?.name].filter(Boolean).join(", "),
    duration: item.duration || (item.durationMinutes ? `${item.durationMinutes} min` : ""),
    price: item.commercial?.publicPrice ? { amount: Number(item.commercial.publicPrice), currency: item.commercial.currency || "USD" } : null
  };
}

async function getCountryInternal(input = {}) {
  const language = lang(input.language || input.locale);
  const hierarchy = await allDestinationHierarchy(language);
  const country = hierarchy.find(item => item.level === "COUNTRY" && item.slug === slug(input.slug));
  if (!country) throw new Error("Published country not found in Inventory Control.");
  const [airportMap, context] = await Promise.all([airportLookup(language), relatedPublished(country, language)]);
  const hierarchyById = new Map(hierarchy.map(item => [item.id, item]));
  const destinations = hierarchy.filter(item => item.level === "DESTINATION" && item.parentEntityId === country.id)
    .map(item => ({ ...item, destinationIata: searchAirportFor(item, airportMap), searchAirportIata: searchAirportFor(item, airportMap) }));
  const destinationIds = new Set(destinations.map(item => item.id));
  const areas = hierarchy.filter(item => item.level === "AREA" && destinationIds.has(item.parentEntityId));
  const allHotels = context.all.filter(x => x.entityType === "HOTEL");
  const hotels = allHotels.filter(h => destinationIds.has(h.destinationId) || areas.some(a => a.id === h.areaId)).map(h => hotelCard(h, hierarchyById));
  const activities = context.all.filter(x => ["ACTIVITY","GUIDED_TOUR"].includes(x.entityType))
    .filter(x => destinationIds.has(x.destinationId) || areas.some(a => a.id === x.areaId))
    .map(x => activityCard(x, hierarchyById));
  const airports = context.all.filter(x => x.entityType === "AIRPORT").filter(a => destinations.some(d => d.nearestAirportId === a.id));
  const directory = hierarchy.filter(x => x.level === "COUNTRY").map(x => ({ slug: x.slug, code: x.countryCode || x.code, name: x.name }));
  return {
    page: {
      ...country,
      code: country.countryCode || country.code,
      countryCode: country.countryCode || country.code,
      directory,
      regions: destinations,
      destinations,
      areas,
      hotels,
      previewHotels: hotels.slice(0, 12),
      activities,
      inspiration: arr(country.inspiration),
      airlines: arr(country.airlines),
      airports,
      destinationIata: searchAirportFor(country, airportMap),
      searchAirportIata: searchAirportFor(country, airportMap)
    }
  };
}

async function getDestinationInternal(input = {}) {
  const language = lang(input.language || input.locale);
  const hierarchy = await allDestinationHierarchy(language);
  const country = hierarchy.find(item => item.level === "COUNTRY" && item.slug === slug(input.countrySlug));
  if (!country) throw new Error("Published country not found in Inventory Control.");
  const destination = hierarchy.find(item => item.level === "DESTINATION" && item.slug === slug(input.destinationSlug) && item.parentEntityId === country.id);
  if (!destination) throw new Error("Published destination not found in Inventory Control.");
  const [airportMap, allRows] = await Promise.all([airportLookup(language), masters()]);
  const all = await enrich(allRows, language);
  const hierarchyById = new Map(hierarchy.map(item => [item.id, item]));
  const areas = hierarchy.filter(item => item.level === "AREA" && item.parentEntityId === destination.id);
  const areaIds = new Set(areas.map(x => x.id));
  const hotels = all.filter(x => x.entityType === "HOTEL" && (x.destinationId === destination.id || areaIds.has(x.areaId))).map(x => hotelCard(x, hierarchyById));
  const activities = all.filter(x => ["ACTIVITY","GUIDED_TOUR"].includes(x.entityType) && (x.destinationId === destination.id || areaIds.has(x.areaId))).map(x => activityCard(x, hierarchyById));
  const airport = airportMap.get(destination.nearestAirportId);
  const directory = hierarchy.filter(x => x.level === "DESTINATION").map(x => ({
    countrySlug: x.countrySlug,
    destinationSlug: x.slug,
    slug: x.slug,
    countryCode: x.countryCode,
    countryName: x.countryName,
    name: x.name
  }));
  return {
    page: {
      ...destination,
      countrySlug: country.slug,
      countryName: country.name,
      countryCode: country.countryCode || country.code,
      destinationSlug: destination.slug,
      directory,
      areas,
      hotels,
      previewHotels: hotels.slice(0, 12),
      activities,
      excursions: activities,
      destinationIata: destination.searchAirportIata || airport?.iata || "",
      searchAirportIata: destination.searchAirportIata || airport?.iata || ""
    }
  };
}

async function getAreaInternal(input = {}) {
  const destinationResult = await getDestinationInternal(input);
  const language = lang(input.language || input.locale);
  const hierarchy = await allDestinationHierarchy(language);
  const destination = hierarchy.find(x => x.level === "DESTINATION" && x.slug === slug(input.destinationSlug) && x.countrySlug === slug(input.countrySlug));
  const area = hierarchy.find(x => x.level === "AREA" && x.slug === slug(input.areaSlug) && x.parentEntityId === destination?.id);
  if (!area) throw new Error("Published holiday area not found in Inventory Control.");
  const allRows = await masters();
  const all = await enrich(allRows, language);
  const hierarchyById = new Map(hierarchy.map(item => [item.id, item]));
  const hotels = all.filter(x => x.entityType === "HOTEL" && x.areaId === area.id).map(x => hotelCard(x, hierarchyById));
  const activities = all.filter(x => ["ACTIVITY","GUIDED_TOUR"].includes(x.entityType) && x.areaId === area.id).map(x => activityCard(x, hierarchyById));
  const nearby = hierarchy.filter(x => x.level === "AREA" && x.parentEntityId === area.parentEntityId && x.id !== area.id);
  return {
    page: {
      ...area,
      countrySlug: destinationResult.page.countrySlug,
      countryName: destinationResult.page.countryName,
      countryCode: destinationResult.page.countryCode,
      destinationSlug: destinationResult.page.slug,
      destinationName: destinationResult.page.name,
      areaSlug: area.slug,
      directory: hierarchy.filter(x => x.level === "AREA").map(x => ({
        countrySlug: x.countrySlug, destinationSlug: x.destinationSlug, areaSlug: x.slug, slug: x.slug, name: x.name
      })),
      hotels,
      previewHotels: hotels,
      excursions: activities,
      activities,
      nearby,
      destinationIata: area.searchAirportIata || destinationResult.page.destinationIata || "",
      searchAirportIata: area.searchAirportIata || destinationResult.page.searchAirportIata || ""
    }
  };
}

async function getHotelInternal(input = {}) {
  const language = lang(input.language || input.locale);
  const targetSlug = slug(input.hotelSlug || input.slug);
  let rows = await masters({ entity_type: "eq.HOTEL", slug: `eq.${targetSlug}`, limit: 1 });
  if (!rows.length && input.hotelId) rows = await masters({ entity_type: "eq.HOTEL", id: `eq.${text(input.hotelId,80)}`, limit: 1 });
  const hotelRow = rows[0];
  if (!hotelRow) throw new Error("Published hotel not found in Inventory Control.");
  const [hotel] = await enrich([hotelRow], language);
  const hierarchy = await allDestinationHierarchy(language);
  const byId = new Map(hierarchy.map(x => [x.id, x]));
  const area = byId.get(hotel.areaId);
  const destination = byId.get(hotel.destinationId) || byId.get(area?.parentEntityId);
  const country = byId.get(destination?.parentEntityId);
  const airportMap = await airportLookup(language);
  const airport = airportMap.get(hotel.nearestAirportId || destination?.nearestAirportId);
  const locationTransfer = {
    ...(obj(hotel.locationTransfer)),
    address: hotel.address || obj(hotel.locationTransfer).address || "",
    beachDistance: hotel.distanceToBeach ? `${hotel.distanceToBeach} m` : obj(hotel.locationTransfer).beachDistance || "",
    centerDistance: hotel.distanceToCenter ? `${hotel.distanceToCenter} m` : obj(hotel.locationTransfer).centerDistance || "",
    transferTime: hotel.transferTimeMinutes ? `${hotel.transferTimeMinutes} min` : obj(hotel.locationTransfer).transferTime || ""
  };
  return {
    page: {
      ...hotel,
      countrySlug: country?.slug || hotel.countrySlug || "",
      countryName: country?.name || hotel.countryName || "",
      countryCode: country?.countryCode || hotel.countryCode || "",
      destinationSlug: destination?.slug || hotel.destinationSlug || "",
      destinationName: destination?.name || hotel.destinationName || "",
      areaSlug: area?.slug || hotel.areaSlug || "",
      areaName: area?.name || hotel.areaName || "",
      collection: text(hotel.skandiTier,30).toUpperCase() === "SIGNATURE" ? "signature" : hotel.collection || "",
      classification: hotel.officialStarRating || hotel.classification || 0,
      officialClassification: hotel.officialStarRating || hotel.officialClassification || "",
      guestRating: hotel.skandiRating || hotel.guestRating || 0,
      facts: arr(hotel.facts).length ? hotel.facts : [
        hotel.checkinTime ? { label: "Check-in", value: hotel.checkinTime } : null,
        hotel.checkoutTime ? { label: "Check-out", value: hotel.checkoutTime } : null,
        hotel.boardOptions ? { label: "Board", value: hotel.boardOptions } : null
      ].filter(Boolean),
      facilities: hotel.facilities,
      locationTransfer,
      providerAccommodationId: hotel.providerAccommodationId || hotel.liveAccommodationId || hotel.sourceReference || "",
      destinationIata: hotel.searchAirportIata || airport?.iata || destination?.searchAirportIata || "",
      searchAirportIata: hotel.searchAirportIata || airport?.iata || destination?.searchAirportIata || "",
      price: hotel.commercial?.publicPrice ? { amount: Number(hotel.commercial.publicPrice), currency: hotel.commercial.currency || currency(input.currency) } : null
    }
  };
}

async function getToursInternal(input = {}) {
  const language = lang(input.language || input.locale);
  const hierarchy = await allDestinationHierarchy(language);
  const allRows = await masters({ entity_type: "in.(ACTIVITY,GUIDED_TOUR,PARTNER_TICKET)" });
  const enrichedRows = await enrich(allRows, language);
  const dated = await datedInventoryMap(enrichedRows.map(x => x.id));
  const experiences = enrichedRows.map(x => {
    const item = activityCard(x, new Map(hierarchy.map(h => [h.id,h])));
    const inventory = dated.get(x.id) || [];
    const next = inventory.find(row => row.available > 0) || inventory[0] || null;
    return {
      ...item,
      datedInventory: inventory,
      nextAvailability: next,
      price: next && (next.publicPrice != null || next.adultPrice != null)
        ? { amount: next.publicPrice ?? next.adultPrice, currency: next.currency }
        : item.price
    };
  });
  return {
    destinations: hierarchy.filter(x => ["DESTINATION","AREA"].includes(x.level)).map(x => ({
      id: x.id, slug: x.slug, name: x.name, countrySlug: x.countrySlug, destinationSlug: x.destinationSlug || x.slug,
      areaSlug: x.areaSlug, latitude: numberOrNull(x.latitude), longitude: numberOrNull(x.longitude), image: x.heroImage
    })),
    experiences,
    collections: [...new Set(experiences.map(x => x.category).filter(Boolean))].map(name => ({ id: slug(name), name }))
  };
}

export const getCountryDestinationPage = webMethod(Permissions.Anyone, getCountryInternal);
export const getDestinationDetailPage = webMethod(Permissions.Anyone, getDestinationInternal);
export const getHolidayAreaPage = webMethod(Permissions.Anyone, getAreaInternal);
export const getAreaHotelSearchPage = webMethod(Permissions.Anyone, getAreaInternal);
export const getHotelDetailPage = webMethod(Permissions.Anyone, getHotelInternal);

export const getToursActivitiesBootstrap = webMethod(Permissions.Anyone, async (input = {}) => {
  return getToursInternal(input);
});
export const searchToursActivities = webMethod(Permissions.Anyone, async (input = {}) => {
  const data = await getToursInternal(input);
  const query = text(input.query || input.search || "", 160).toLowerCase();
  const category = text(input.category || "", 80).toLowerCase();
  const destination = text(input.destination || input.destinationSlug || input.areaSlug || "", 160).toLowerCase();
  const items = data.experiences.filter(item => {
    if (category && category !== "all" && text(item.category,80).toLowerCase() !== category) return false;
    if (destination) {
      const hay = [item.location,item.destinationSlug,item.areaSlug,item.destinationId,item.areaId].map(v => text(v,160).toLowerCase()).join(" ");
      if (!hay.includes(destination)) return false;
    }
    if (query) {
      const hay = [item.name,item.summary,item.about,item.category,item.location].map(v => text(v,1000).toLowerCase()).join(" ");
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  return { items, total: items.length };
});
export const getTourActivityDetail = webMethod(Permissions.Anyone, async (input = {}) => {
  const language = lang(input.language || input.locale);
  const id = text(input.activityId || input.id, 80);
  let rows = id ? await masters({ id: `eq.${id}`, entity_type: "in.(ACTIVITY,GUIDED_TOUR,PARTNER_TICKET)", limit: 1 }) : [];
  if (!rows.length && input.slug) rows = await masters({ slug: `eq.${slug(input.slug)}`, entity_type: "in.(ACTIVITY,GUIDED_TOUR,PARTNER_TICKET)", limit: 1 });
  if (!rows.length) throw new Error("Published activity not found in Inventory Control.");
  const [item] = await enrich(rows, language);
  return { activity: item };
});
export const searchNearbyToursActivities = webMethod(Permissions.Anyone, async (input = {}) => {
  const data = await getToursInternal(input);
  const lat = Number(input.latitude), lng = Number(input.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { items: data.experiences };
  const items = data.experiences.filter(item => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
    .map(item => ({ ...item, distanceKm: haversine(lat,lng,Number(item.latitude),Number(item.longitude)) }))
    .sort((a,b) => a.distanceKm-b.distanceKm).slice(0,30);
  return { items };
});

function haversine(lat1, lon1, lat2, lon2) {
  const R=6371,toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export const getPublicNetworkMapData = webMethod(Permissions.Anyone, async (input = {}) => {
  const language = lang(input.language || input.locale);
  const hierarchy = await allDestinationHierarchy(language);
  const hotels = await enrich(await masters({ entity_type:"eq.HOTEL" }), language);
  const airports = await enrich(await masters({ entity_type:"eq.AIRPORT" }), language);
  const destinations = hierarchy.filter(x => ["DESTINATION","AREA"].includes(x.level) && Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude)))
    .map(x => ({
      id:x.id,name:x.name,slug:x.slug,countrySlug:x.countrySlug,destinationSlug:x.destinationSlug||x.slug,areaSlug:x.areaSlug,
      lat:Number(x.latitude),lng:Number(x.longitude),latitude:Number(x.latitude),longitude:Number(x.longitude),
      summary:x.summary,image:x.heroImage,tags:arr(x.tags),path:x.level==="AREA"?`/destinations/${x.countrySlug}/${x.destinationSlug}/${x.slug}`:`/destinations/${x.countrySlug}/${x.slug}`
    }));
  const hotelPoints = hotels.filter(x => Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude))).map(x => ({
    id:x.id,name:x.name,slug:x.slug,lat:Number(x.latitude),lng:Number(x.longitude),latitude:Number(x.latitude),longitude:Number(x.longitude),
    summary:x.summary,image:x.heroImage,type:"HOTEL"
  }));
  const relations = await relationRows(airports.map(x => x.id));
  const airportMap = new Map(airports.map(x => [x.id,x]));
  const destinationMap = new Map(hierarchy.map(x => [x.id,x]));
  const routes = relations.filter(r => ["ROUTE","SERVES_DESTINATION","FLIES_TO"].includes(text(r.relation_type,60).toUpperCase())).map(r => {
    const airport=airportMap.get(r.source_entity_id), dest=destinationMap.get(r.target_entity_id);
    if(!airport||!dest)return null;
    return {id:r.id,origin:airport.iata||airport.code,destination:dest.searchAirportIata||dest.code||dest.slug,originLat:Number(airport.latitude),originLng:Number(airport.longitude),destinationLat:Number(dest.latitude),destinationLng:Number(dest.longitude)};
  }).filter(Boolean);
  return {
    destinations,
    hotels: hotelPoints,
    routes,
    stats: { destinations: destinations.length, hotels: hotelPoints.length, routes: routes.length },
    publicNote: "Published SKANDI network content from Inventory Control.",
    meta: { source:"INVENTORY_CONTROL_V2", generatedAt:new Date().toISOString() }
  };
});

export const getSignatureCollectionData = webMethod(Permissions.Anyone, async (input = {}) => {
  const language=lang(input.language||input.locale);
  const all=await enrich(await masters({ featured:"eq.true" }), language);
  const hierarchy=await allDestinationHierarchy(language);
  const hierarchyMap=new Map(hierarchy.map(x=>[x.id,x]));
  const destinations=hierarchy.filter(x=>x.featured);
  const hotels=all.filter(x=>x.entityType==="HOTEL").map(x=>hotelCard(x,hierarchyMap));
  const tours=all.filter(x=>["GUIDED_TOUR","ACTIVITY","PARTNER_TICKET"].includes(x.entityType)).map(x=>activityCard(x,hierarchyMap));
  const flights=all.filter(x=>x.entityType==="PACKAGE"&&String(x.operations?.bookingFlow||"").toLowerCase().includes("flight"));
  const airlines=all.filter(x=>x.entityType==="AIRLINE");
  const airports=all.filter(x=>x.entityType==="AIRPORT");
  return { destinations, hotels, tours, flights, airlines, airports, source:"INVENTORY_CONTROL_V2" };
});
