import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";

import { restRequest } from "backend/RIA/supabaseServer.js";
import {
  findAgentByMemberOrEmail,
  isAgentAuthorized,
  publicAgent
} from "backend/RIA/staffPortalAuth.repository.js";

const ENTITY_TYPES = new Set([
  "DESTINATION",
  "AIRPORT",
  "AIRLINE",
  "SUPPLIER",
  "HOTEL",
  "GUIDED_TOUR",
  "ACTIVITY",
  "PARTNER_TICKET",
  "TRANSFER",
  "CAR_RENTAL",
  "PACKAGE",
  "ANCILLARY"
]);

const LANGUAGES = new Set(["EN", "SV", "NO", "DA"]);
const STATUS_VALUES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "HIDDEN", "SUSPENDED", "ARCHIVED"]);
const PUBLICATION_ACTIONS = new Set(["DRAFT", "REVIEW", "PUBLISH", "HIDE", "SUSPEND", "ARCHIVE"]);

function text(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function upper(value, max = 100) {
  return text(value, max).toUpperCase();
}

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === 1 || value === "1" || value === "YES";
}

function integer(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function slugify(value) {
  return text(value, 180)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function entityPrefix(type) {
  const map = {
    DESTINATION: "DST",
    AIRPORT: "APT",
    AIRLINE: "AIR",
    SUPPLIER: "SUP",
    HOTEL: "HTL",
    GUIDED_TOUR: "GTR",
    ACTIVITY: "ACT",
    PARTNER_TICKET: "TKT",
    TRANSFER: "TRF",
    CAR_RENTAL: "CAR",
    PACKAGE: "PKG",
    ANCILLARY: "EXT"
  };
  return map[type] || "MST";
}

function generatedCode(type, name) {
  const base = slugify(name).replace(/-/g, "_").toUpperCase().slice(0, 48) || "NEW";
  return `${entityPrefix(type)}_${base}_${Date.now().toString(36).toUpperCase()}`;
}


function pseudoUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

function isTravelCanonical(type) {
  return type === "AIRPORT" || type === "AIRLINE";
}

function parseJsonValue(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch (_) { return fallback; }
}

function camelLocalized(items = []) {
  return array(items).map(item => ({
    id: item.id || "",
    entityId: item.entityId || "",
    language: upper(item.language || "EN", 2),
    title: text(item.title, 300),
    eyebrow: text(item.eyebrow, 180),
    shortDescription: text(item.shortDescription ?? item.short_description, 3000),
    fullDescription: text(item.fullDescription ?? item.full_description, 50000),
    highlights: array(item.highlights),
    included: array(item.included),
    notIncluded: array(item.notIncluded ?? item.not_included),
    importantInformation: text(item.importantInformation ?? item.important_information, 10000),
    seoTitle: text(item.seoTitle ?? item.seo_title, 500),
    seoDescription: text(item.seoDescription ?? item.seo_description, 1000),
    content: object(item.content)
  }));
}

function camelMedia(items = []) {
  return array(items).map((item, index) => ({
    id: item.id || "",
    entityId: item.entityId || "",
    mediaType: upper(item.mediaType ?? item.media_type ?? "IMAGE", 30),
    url: text(item.url, 3000),
    altText: text(item.altText ?? item.alt_text, 1000),
    caption: text(item.caption, 2000),
    credit: text(item.credit, 500),
    language: upper(item.language, 2),
    sortOrder: integer(item.sortOrder ?? item.sort_order, (index + 1) * 10),
    isPrimary: bool(item.isPrimary ?? item.is_primary),
    isCard: bool(item.isCard ?? item.is_card),
    isHero: bool(item.isHero ?? item.is_hero),
    isMobile: bool(item.isMobile ?? item.is_mobile),
    active: item.active === false ? false : true,
    payload: object(item.payload)
  })).filter(item => item.url);
}

function airportDetails(row = {}) {
  return {
    ...object(row.inventory_details),
    iata: row.iata || "",
    icao: row.icao || "",
    city: row.locationCity || "",
    country: row.country || "",
    timezone: row.timezone || "",
    latitude: row.latitude ?? "",
    longitude: row.longitude ?? "",
    distanceToCityCenterKm: row.distanceToCityCenterKm ?? "",
    website: row.website || "",
    overview: row.summary || row.body || "",
    information: row.information || "",
    quickFactsJson: row.quickFactsJson || [],
    transportJson: row.transportJson || [],
    runwaysJson: row.runwaysJson || [],
    terminalsJson: row.terminalsJson || [],
    logoUrl: row.logoUrl || "",
    logoIconUrl: row.logoIconUrl || "",
    logoAltText: row.logoAltText || "",
    heroImageUrl: row.heroImageUrl || "",
    sourceUrlsJson: row.sourceUrlsJson || [],
    lounges: row.lounges || "",
    foodDrinksJson: row.foodDrinksJson || [],
    airportHotels: row.airportHotels || "",
    lostFoundJson: row.lostFoundJson || [],
    destinationsServing: row.destinationsServing || "",
    contactUrl: row.contactUrl || "",
    sectionsJson: row.sectionsJson || [],
    primaryColor: row.primaryColor || "",
    accentColor: row.accentColor || "",
    notes: row.notes || "",
    lastReviewed: row.lastReviewed || ""
  };
}

function airlineDetails(row = {}) {
  return {
    ...object(row.inventory_details),
    iata: row.iataCode || "",
    icao: row.icaoCode || "",
    shortName: row.shortName || "",
    alliance: row.alliance || "",
    brandGroup: row.brandGroup || "",
    country: row.locationCountry || "",
    city: row.locationCity || "",
    website: row.website || "",
    quickFactsJson: row.quickFactsJson || {},
    primaryColor: row.primaryColor || "",
    accentColor: row.accentColor || "",
    logoUrl: row.logoFile || "",
    logoIconUrl: row.logoIcon || "",
    logoAltText: row.logoAltText || "",
    heroImageUrl: row.heroAircraftUrl || "",
    sourceUrlsJson: parseJsonValue(row.sourceUrlsJson, []),
    cabinsJson: parseJsonValue(row.cabinsJson, []),
    checkInDeadline: row.checkInDeadline || "",
    lounges: row.lounges || "",
    classComparisonText: row.classComparisonText || "",
    loyaltyProgram: row.loyaltyProgram || "",
    loyaltyProgramUrl: row.loyaltyProgramUrl || "",
    hubsJson: row.hubsJson || [],
    fleetSummaryJson: parseJsonValue(row.fleetSummaryJson, []),
    aircraftFamiliesText: row.aircraftFamiliesText || "",
    aircraftConfigurationsJson: parseJsonValue(row.aircraftConfigurationsJson, []),
    boarding: row.boarding || "",
    foodDrinksJson: parseJsonValue(row.foodDrinksJson, []),
    wifiOnboardJson: parseJsonValue(row.wifiOnboardJson, []),
    delayCancellationJson: parseJsonValue(row.delayCancellationJson, []),
    damagedBaggageJson: parseJsonValue(row.damagedBaggageJson, []),
    lostFoundJson: parseJsonValue(row.lostFoundJson, []),
    childrenInfantsJson: parseJsonValue(row.childrenInfantsJson, []),
    ticketTypesJson: parseJsonValue(row.ticketTypesJson, []),
    baggageAllowance: row.baggageAllowence || "",
    contactUrl: row.contactUrl || "",
    sectionsJson: parseJsonValue(row.sectionsJson, []),
    notes: row.notes || "",
    lastReviewed: row.lastReviewed || ""
  };
}

function mapAirportMaster(row = {}) {
  const details = airportDetails(row);
  const code = upper(row.iata || row.icao || row.itemId || row.ID || "", 120);
  return {
    id: String(row.ID || ""),
    publicId: `APT-${code || String(row.ID || "")}`,
    entityType: "AIRPORT",
    code,
    name: row.title || "",
    slug: row.slug || "",
    status: row.status || (row.published === false || row.active === false ? "HIDDEN" : "PUBLISHED"),
    active: row.active !== false,
    customerVisible: row.customer_visible !== false && row.published !== false && row.active !== false,
    staffVisible: row.staff_visible !== false,
    alteaVisible: row.altea_visible !== false,
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: row.sort_order ?? row.sortOrder ?? 100,
    parentEntityId: "",
    supplierEntityId: "",
    source: row.source || "SKANDI",
    sourceReference: row.source_reference || row.itemId || "",
    details,
    commercial: object(row.commercial),
    operations: object(row.operations),
    seo: object(row.seo),
    publication: object(row.publication),
    payload: object(row.payload),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function mapAirlineMaster(row = {}) {
  const details = airlineDetails(row);
  const code = upper(row.iataCode || row.icaoCode || row["Record ID"] || row.ID || "", 120);
  return {
    id: String(row.ID || ""),
    publicId: `AIR-${code || String(row.ID || "")}`,
    entityType: "AIRLINE",
    code,
    name: row.Title || "",
    slug: row.slug || "",
    status: row.status || (row.active === false ? "HIDDEN" : "PUBLISHED"),
    active: row.active !== false,
    customerVisible: row.customer_visible !== false && row.published !== false && row.active !== false,
    staffVisible: row.staff_visible !== false,
    alteaVisible: row.altea_visible !== false,
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: row.sort_order ?? 100,
    parentEntityId: "",
    supplierEntityId: "",
    source: row.source || "SKANDI",
    sourceReference: row.source_reference || row["Record ID"] || "",
    details,
    commercial: object(row.commercial),
    operations: object(row.operations),
    seo: object(row.seo),
    publication: object(row.publication),
    payload: object(row.payload),
    createdAt: row["Created Date"] || "",
    updatedAt: row.updated_at || ""
  };
}

function mapCanonical(type, row) {
  return type === "AIRPORT" ? mapAirportMaster(row) : mapAirlineMaster(row);
}

async function requireStaffAgent() {
  const member = await currentMember.getMember().catch(() => null);
  if (!member) throw new Error("Staff login required.");

  const memberId = member._id || member.id || "";
  const email =
    member.loginEmail ||
    member.email ||
    member.contactDetails?.emails?.[0] ||
    "";

  const agent = await findAgentByMemberOrEmail({ memberId, email });
  if (!agent || !isAgentAuthorized(agent)) {
    throw new Error("You are not authorized to access Master Inventory Control.");
  }

  return { member, agent };
}

function cleanEntityType(value) {
  const type = upper(value, 60);
  if (!ENTITY_TYPES.has(type)) throw new Error("Unsupported inventory entity type.");
  return type;
}

function mapMaster(row = {}) {
  return {
    id: row.id || "",
    publicId: row.public_id || "",
    entityType: row.entity_type || "",
    code: row.code || "",
    name: row.name || "",
    slug: row.slug || "",
    status: row.status || "DRAFT",
    active: row.active !== false,
    customerVisible: row.customer_visible === true,
    staffVisible: row.staff_visible !== false,
    alteaVisible: row.altea_visible !== false,
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: row.sort_priority ?? 100,
    parentEntityId: row.parent_entity_id || "",
    supplierEntityId: row.supplier_entity_id || "",
    source: row.source || "SKANDI",
    sourceReference: row.source_reference || "",
    details: row.details || {},
    commercial: row.commercial || {},
    operations: row.operations || {},
    seo: row.seo || {},
    publication: row.publication || {},
    payload: row.payload || {},
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function mapLocalized(row = {}) {
  return {
    id: row.id || "",
    entityId: row.entity_id || "",
    language: row.language || "EN",
    title: row.title || "",
    eyebrow: row.eyebrow || "",
    shortDescription: row.short_description || "",
    fullDescription: row.full_description || "",
    highlights: row.highlights || [],
    included: row.included || [],
    notIncluded: row.not_included || [],
    importantInformation: row.important_information || "",
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    content: row.content || {}
  };
}

function mapMedia(row = {}) {
  return {
    id: row.id || "",
    entityId: row.entity_id || "",
    mediaType: row.media_type || "IMAGE",
    url: row.url || "",
    altText: row.alt_text || "",
    caption: row.caption || "",
    credit: row.credit || "",
    language: row.language || "",
    sortOrder: row.sort_order ?? 100,
    isPrimary: row.is_primary === true,
    isCard: row.is_card === true,
    isHero: row.is_hero === true,
    isMobile: row.is_mobile === true,
    active: row.active !== false,
    payload: row.payload || {}
  };
}

function mapRelation(row = {}) {
  return {
    id: row.id || "",
    sourceEntityId: row.source_entity_id || "",
    targetEntityId: row.target_entity_id || "",
    relationType: row.relation_type || "",
    sequenceNo: row.sequence_no ?? 100,
    active: row.active !== false,
    payload: row.payload || {}
  };
}

function mapInventory(row = {}) {
  return {
    id: row.id || "",
    entityId: row.entity_id || "",
    inventoryType: row.inventory_type || "GENERAL",
    serviceDate: row.service_date || "",
    startTime: row.start_time || "",
    endTime: row.end_time || "",
    variantCode: row.variant_code || "",
    variantName: row.variant_name || "",
    capacityTotal: row.capacity_total ?? 0,
    held: row.held ?? 0,
    sold: row.sold ?? 0,
    available: row.available ?? 0,
    waitlistLimit: row.waitlist_limit ?? 0,
    overbookingLimit: row.overbooking_limit ?? 0,
    stopSale: row.stop_sale === true,
    blackout: row.blackout === true,
    status: row.status || "OPEN",
    supplierCost: row.supplier_cost ?? 0,
    publicPrice: row.public_price ?? 0,
    adultPrice: row.adult_price ?? 0,
    childPrice: row.child_price ?? 0,
    infantPrice: row.infant_price ?? 0,
    privatePrice: row.private_price ?? 0,
    currency: row.currency || "USD",
    priceBasis: row.price_basis || "PER_PERSON",
    bookingCutoffHours: row.booking_cutoff_hours ?? 0,
    minStay: row.min_stay ?? 0,
    maxStay: row.max_stay ?? 0,
    releaseDays: row.release_days ?? 0,
    supplierReference: row.supplier_reference || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

async function audit(agent, eventType, entity, before = null, after = null, message = "") {
  await restRequest({
    table: "master_inventory_audit",
    method: "POST",
    body: {
      event_type: eventType,
      domain: "inventory_v2",
      entity_table: "inventory_master_entities",
      entity_id: entity?.id || "",
      product_key: entity?.code || entity?.public_id || "",
      before_value: before ? JSON.stringify(before).slice(0, 500) : "",
      after_value: after ? JSON.stringify(after).slice(0, 500) : "",
      source: "inventory-control-v2",
      message: text(message || eventType, 500),
      payload: { entityType: entity?.entity_type || entity?.entityType || "", before, after },
      created_by_agent_user_id: agent?.id || null,
      created_by_name:
        agent?.preferred_name ||
        agent?.display_name ||
        agent?.email ||
        agent?.sk_id ||
        ""
    },
    prefer: "return=minimal"
  });
}


async function listTravelCanonical(type, input = {}) {
  const table = type === "AIRPORT" ? "travel_info_airports" : "travel_info_airlines";
  const rows = await restRequest({
    table,
    query: {
      select: "*",
      limit: Math.min(Math.max(integer(input.limit, 500), 1), 1000)
    }
  });

  const q = text(input.query, 160).toLowerCase();
  const status = upper(input.status, 30);
  const visibleFilter = input.customerVisible === undefined || input.customerVisible === ""
    ? null
    : bool(input.customerVisible);

  return array(rows)
    .map(row => mapCanonical(type, row))
    .filter(record => !status || record.status === status)
    .filter(record => visibleFilter === null || record.customerVisible === visibleFilter)
    .filter(record => !q || [record.name, record.code, record.publicId, record.slug]
      .some(value => String(value || "").toLowerCase().includes(q)))
    .sort((a, b) => (a.sortPriority - b.sortPriority) || a.name.localeCompare(b.name));
}

async function listMasters(input = {}) {
  const requestedType = input.entityType ? cleanEntityType(input.entityType) : "";
  if (requestedType === "AIRPORT" || requestedType === "AIRLINE") {
    return listTravelCanonical(requestedType, input);
  }

  const query = {
    select: "*",
    order: "sort_priority.asc,name.asc",
    limit: Math.min(Math.max(integer(input.limit, 500), 1), 1000)
  };

  if (requestedType) query.entity_type = `eq.${requestedType}`;
  if (input.status) query.status = `eq.${upper(input.status, 30)}`;
  if (input.customerVisible !== undefined && input.customerVisible !== "") {
    query.customer_visible = `eq.${bool(input.customerVisible)}`;
  }
  if (text(input.query, 160)) {
    const q = text(input.query, 160).replace(/[(),]/g, " ");
    query.or = `(name.ilike.*${q}*,code.ilike.*${q}*,public_id.ilike.*${q}*,slug.ilike.*${q}*)`;
  }

  const masterRows = await restRequest({ table: "inventory_master_entities", query });
  const mapped = array(masterRows).map(mapMaster).filter(row => !isTravelCanonical(row.entityType));

  if (requestedType) return mapped;

  const [airports, airlines] = await Promise.all([
    listTravelCanonical("AIRPORT", input),
    listTravelCanonical("AIRLINE", input)
  ]);

  return [...mapped, ...airports, ...airlines]
    .sort((a, b) => a.entityType.localeCompare(b.entityType) || (a.sortPriority - b.sortPriority) || a.name.localeCompare(b.name));
}

async function getRecordSource(id) {
  const recordId = text(id, 120);
  if (!recordId) return null;

  const master = first(await restRequest({
    table: "inventory_master_entities",
    query: { select: "*", id: `eq.${recordId}`, limit: 1 }
  }));
  if (master && !isTravelCanonical(master.entity_type)) {
    return { type: master.entity_type, table: "inventory_master_entities", raw: master, record: mapMaster(master) };
  }

  const [airports, airlines] = await Promise.all([
    restRequest({ table: "travel_info_airports", query: { select: "*", ID: `eq.${recordId}`, limit: 1 } }).catch(() => []),
    restRequest({ table: "travel_info_airlines", query: { select: "*", ID: `eq.${recordId}`, limit: 1 } }).catch(() => [])
  ]);

  if (first(airports)) return { type: "AIRPORT", table: "travel_info_airports", raw: first(airports), record: mapAirportMaster(first(airports)) };
  if (first(airlines)) return { type: "AIRLINE", table: "travel_info_airlines", raw: first(airlines), record: mapAirlineMaster(first(airlines)) };
  return null;
}

async function resolveReference(id) {
  const source = await getRecordSource(id);
  return source ? source.record : null;
}

async function getRelationsFor(type, id) {
  const rows = await restRequest({
    table: "inventory_entity_relations",
    query: {
      select: "*",
      source_record_type: `eq.${type}`,
      source_record_id: `eq.${id}`,
      active: "eq.true",
      order: "sequence_no.asc"
    }
  });

  return Promise.all(array(rows).map(async row => {
    const targetId = row.target_record_id || row.target_entity_id || "";
    const target = targetId ? await resolveReference(targetId) : null;
    return {
      ...mapRelation(row),
      sourceEntityId: row.source_record_id || row.source_entity_id || "",
      targetEntityId: targetId,
      targetEntityType: row.target_record_type || target?.entityType || "",
      target
    };
  }));
}

async function getMasterBundle(id) {
  const source = await getRecordSource(id);
  if (!source) throw new Error("Master record not found.");

  if (isTravelCanonical(source.type)) {
    return {
      record: source.record,
      localizedContent: camelLocalized(source.raw.localized_content || []),
      media: camelMedia(source.raw.media_assets || []),
      relations: await getRelationsFor(source.type, source.record.id)
    };
  }

  const entityId = source.record.id;
  const [localizedRows, mediaRows] = await Promise.all([
    restRequest({
      table: "inventory_localized_content",
      query: { select: "*", entity_id: `eq.${entityId}`, order: "language.asc" }
    }),
    restRequest({
      table: "inventory_media_assets",
      query: { select: "*", entity_id: `eq.${entityId}`, order: "sort_order.asc,created_at.asc" }
    })
  ]);

  return {
    record: source.record,
    localizedContent: array(localizedRows).map(mapLocalized),
    media: array(mediaRows).map(mapMedia),
    relations: await getRelationsFor(source.type, entityId)
  };
}

async function replaceLocalized(entityId, items = []) {
  await restRequest({
    table: "inventory_localized_content",
    method: "DELETE",
    query: { entity_id: `eq.${entityId}` },
    prefer: "return=minimal"
  });

  const rows = array(items)
    .map(item => {
      const language = upper(item.language, 2);
      if (!LANGUAGES.has(language)) return null;
      return {
        entity_id: entityId,
        language,
        title: text(item.title, 300),
        eyebrow: text(item.eyebrow, 180),
        short_description: text(item.shortDescription ?? item.short_description, 3000),
        full_description: text(item.fullDescription ?? item.full_description, 50000),
        highlights: array(item.highlights),
        included: array(item.included),
        not_included: array(item.notIncluded ?? item.not_included),
        important_information: text(item.importantInformation ?? item.important_information, 10000),
        seo_title: text(item.seoTitle ?? item.seo_title, 500),
        seo_description: text(item.seoDescription ?? item.seo_description, 1000),
        content: object(item.content),
        updated_at: new Date().toISOString()
      };
    })
    .filter(Boolean);

  if (rows.length) {
    await restRequest({
      table: "inventory_localized_content",
      method: "POST",
      body: rows
    });
  }
}

async function replaceMedia(entityId, items = []) {
  await restRequest({
    table: "inventory_media_assets",
    method: "DELETE",
    query: { entity_id: `eq.${entityId}` },
    prefer: "return=minimal"
  });

  const rows = array(items)
    .map((item, index) => {
      const url = text(item.url, 3000);
      if (!url) return null;
      const language = upper(item.language, 2);
      return {
        entity_id: entityId,
        media_type: upper(item.mediaType ?? item.media_type ?? "IMAGE", 30),
        url,
        alt_text: text(item.altText ?? item.alt_text, 1000),
        caption: text(item.caption, 2000),
        credit: text(item.credit, 500),
        language: LANGUAGES.has(language) ? language : null,
        sort_order: integer(item.sortOrder ?? item.sort_order, (index + 1) * 10),
        is_primary: bool(item.isPrimary ?? item.is_primary),
        is_card: bool(item.isCard ?? item.is_card),
        is_hero: bool(item.isHero ?? item.is_hero),
        is_mobile: bool(item.isMobile ?? item.is_mobile),
        active: item.active === false ? false : true,
        payload: object(item.payload),
        updated_at: new Date().toISOString()
      };
    })
    .filter(Boolean);

  if (rows.length) {
    await restRequest({
      table: "inventory_media_assets",
      method: "POST",
      body: rows
    });
  }
}


async function replaceRelations(sourceType, sourceId, items = []) {
  await restRequest({
    table: "inventory_entity_relations",
    method: "DELETE",
    query: {
      source_record_type: `eq.${sourceType}`,
      source_record_id: `eq.${sourceId}`
    },
    prefer: "return=minimal"
  });

  const rows = [];
  for (let index = 0; index < array(items).length; index += 1) {
    const item = array(items)[index];
    const targetId = text(item.targetEntityId ?? item.target_entity_id, 120);
    const relation = upper(item.relationType ?? item.relation_type, 80);
    if (!targetId || !relation || targetId === sourceId) continue;

    const target = await resolveReference(targetId);
    if (!target) continue;

    rows.push({
      source_entity_id: isTravelCanonical(sourceType) ? null : sourceId,
      target_entity_id: isTravelCanonical(target.entityType) ? null : targetId,
      source_record_type: sourceType,
      source_record_id: sourceId,
      target_record_type: target.entityType,
      target_record_id: targetId,
      relation_type: relation,
      sequence_no: integer(item.sequenceNo ?? item.sequence_no, (index + 1) * 10),
      active: item.active === false ? false : true,
      payload: object(item.payload),
      updated_at: new Date().toISOString()
    });
  }

  if (rows.length) {
    await restRequest({
      table: "inventory_entity_relations",
      method: "POST",
      body: rows
    });
  }
}

function normalizedLocalizedForStorage(items = []) {
  return camelLocalized(items).filter(item => LANGUAGES.has(item.language));
}

function normalizedMediaForStorage(items = []) {
  return camelMedia(items);
}

function primaryMedia(items, role) {
  return normalizedMediaForStorage(items).find(item => {
    if (role === "HERO") return item.isHero || item.isPrimary;
    if (role === "CARD") return item.isCard;
    if (role === "MOBILE") return item.isMobile;
    return false;
  });
}

function localizedLanguage(items, lang = "EN") {
  return normalizedLocalizedForStorage(items).find(item => item.language === lang) || null;
}

async function saveTravelCanonical(input = {}, agent = {}) {
  const raw = input.record || input.master || input;
  const type = cleanEntityType(raw.entityType ?? raw.entity_type);
  if (!isTravelCanonical(type)) throw new Error("Travel canonical type required.");

  const name = text(raw.name, 300);
  if (!name) throw new Error("Name / title is required.");

  const id = text(raw.id, 120);
  const table = type === "AIRPORT" ? "travel_info_airports" : "travel_info_airlines";
  let existing = null;
  if (id) {
    existing = first(await restRequest({ table, query: { select: "*", ID: `eq.${id}`, limit: 1 } }));
    if (!existing) throw new Error("Master record not found.");
  }

  const statusRequested = upper(raw.status || (existing?.status) || "DRAFT", 30);
  const status = STATUS_VALUES.has(statusRequested) ? statusRequested : "DRAFT";
  const active = status === "ARCHIVED" ? false : (raw.active === undefined ? existing?.active !== false : bool(raw.active, true));
  const customerVisible = status === "PUBLISHED"
    ? true
    : ["HIDDEN", "SUSPENDED", "ARCHIVED", "DRAFT"].includes(status)
      ? false
      : bool(raw.customerVisible ?? raw.customer_visible ?? existing?.customer_visible);

  const localized = normalizedLocalizedForStorage(input.localizedContent ?? existing?.localized_content ?? []);
  const media = normalizedMediaForStorage(input.media ?? existing?.media_assets ?? []);
  const en = localizedLanguage(localized, "EN");
  const hero = primaryMedia(media, "HERO");
  const card = primaryMedia(media, "CARD");
  const details = object(raw.details);
  const publication = {
    ...object(raw.publication),
    ...(status === "PUBLISHED" ? { publishedAt: new Date().toISOString(), publishedBy: agent?.id || null } : {})
  };

  let row;
  if (type === "AIRPORT") {
    row = {
      title: name,
      slug: slugify(raw.slug || existing?.slug || name),
      category: existing?.category || "airport",
      body: en?.fullDescription || details.information || existing?.body || "",
      image_url: card?.url || existing?.image_url || "",
      active,
      sort_order: integer(raw.sortPriority ?? raw.sort_priority ?? existing?.sort_order ?? existing?.sortOrder, 100),
      iata: upper(details.iata || existing?.iata || raw.code, 10),
      icao: upper(details.icao || existing?.icao, 10),
      country: text(details.country || existing?.country, 120),
      locationCity: text(details.city || existing?.locationCity, 160),
      distanceToCityCenterKm: number(details.distanceToCityCenterKm ?? existing?.distanceToCityCenterKm, 0),
      website: text(details.website || existing?.website, 1500),
      summary: en?.shortDescription || details.overview || existing?.summary || "",
      latitude: details.latitude === "" ? null : number(details.latitude, existing?.latitude ?? 0),
      longitude: details.longitude === "" ? null : number(details.longitude, existing?.longitude ?? 0),
      information: en?.fullDescription || details.information || existing?.information || "",
      quickFactsJson: array(details.quickFactsJson ?? existing?.quickFactsJson),
      transportJson: array(details.transportJson ?? existing?.transportJson),
      runwaysJson: array(details.runwaysJson ?? existing?.runwaysJson),
      terminalsJson: array(details.terminalsJson ?? existing?.terminalsJson),
      logoUrl: text(details.logoUrl || existing?.logoUrl, 3000),
      logoIconUrl: text(details.logoIconUrl || existing?.logoIconUrl, 3000),
      logoAltText: text(details.logoAltText || existing?.logoAltText, 1000),
      heroImageUrl: hero?.url || details.heroImageUrl || existing?.heroImageUrl || "",
      sourceUrlsJson: array(details.sourceUrlsJson ?? existing?.sourceUrlsJson),
      lounges: text(details.lounges ?? existing?.lounges, 12000),
      foodDrinksJson: array(details.foodDrinksJson ?? existing?.foodDrinksJson),
      airportHotels: text(details.airportHotels ?? existing?.airportHotels, 12000),
      lostFoundJson: array(details.lostFoundJson ?? existing?.lostFoundJson),
      destinationsServing: text(details.destinationsServing ?? existing?.destinationsServing, 12000),
      contactUrl: text(details.contactUrl || existing?.contactUrl, 1500),
      sectionsJson: array(details.sectionsJson ?? existing?.sectionsJson),
      primaryColor: text(details.primaryColor || existing?.primaryColor, 30),
      accentColor: text(details.accentColor || existing?.accentColor, 30),
      notes: text(details.notes ?? existing?.notes, 12000),
      lastReviewed: details.lastReviewed || existing?.lastReviewed || null,
      published: customerVisible,
      timezone: text(details.timezone || existing?.timezone, 100),
      status,
      customer_visible: customerVisible,
      staff_visible: bool(raw.staffVisible ?? raw.staff_visible, true),
      altea_visible: bool(raw.alteaVisible ?? raw.altea_visible, true),
      featured: bool(raw.featured),
      homepage_featured: bool(raw.homepageFeatured ?? raw.homepage_featured),
      source: text(raw.source || existing?.source || "SKANDI", 100),
      source_reference: text(raw.sourceReference ?? raw.source_reference ?? existing?.source_reference, 300) || null,
      inventory_details: details,
      commercial: object(raw.commercial),
      operations: object(raw.operations),
      seo: object(raw.seo),
      publication,
      localized_content: localized,
      media_assets: media,
      payload: {
        ...object(existing?.payload),
        ...object(raw.payload),
        arrivalInfo: details.arrivalInfo || "",
        departureInfo: details.departureInfo || "",
        transferInfo: details.transferInfo || "",
        checkinInfo: details.checkinInfo || "",
        securityInfo: details.securityInfo || "",
        transportInfo: details.transportInfo || "",
        parkingInfo: details.parkingInfo || "",
        wifiInfo: details.wifiInfo || "",
        accessibilityInfo: details.accessibilityInfo || ""
      },
      updated_at: new Date().toISOString()
    };
  } else {
    const stringify = value => typeof value === "string" ? value : JSON.stringify(value ?? []);
    row = {
      Title: name,
      slug: slugify(raw.slug || existing?.slug || name),
      shortName: text(details.shortName || existing?.shortName, 200),
      alliance: text(details.alliance || existing?.alliance, 200),
      brandGroup: text(details.brandGroup || existing?.brandGroup, 200),
      locationCountry: text(details.country || existing?.locationCountry, 120),
      locationCity: text(details.city || existing?.locationCity, 160),
      website: text(details.website || existing?.website, 1500),
      summary: en?.shortDescription || existing?.summary || "",
      quickFactsJson: object(details.quickFactsJson ?? existing?.quickFactsJson),
      primaryColor: text(details.primaryColor || existing?.primaryColor, 30),
      accentColor: text(details.accentColor || existing?.accentColor, 30),
      notes: text(details.notes ?? existing?.notes, 12000),
      cabinsJson: stringify(details.cabinsJson ?? parseJsonValue(existing?.cabinsJson, [])),
      logoFile: text(details.logoUrl || existing?.logoFile, 3000),
      logoIcon: text(details.logoIconUrl || existing?.logoIcon, 3000),
      logoAltText: text(details.logoAltText || existing?.logoAltText, 1000),
      heroAircraftUrl: hero?.url || details.heroImageUrl || existing?.heroAircraftUrl || "",
      sourceUrlsJson: stringify(details.sourceUrlsJson ?? parseJsonValue(existing?.sourceUrlsJson, [])),
      checkInDeadline: text(details.checkInDeadline ?? existing?.checkInDeadline, 1000),
      lounges: text(details.lounges ?? existing?.lounges, 12000),
      classComparisonText: text(details.classComparisonText ?? existing?.classComparisonText, 12000),
      loyaltyProgram: text(details.loyaltyProgram ?? existing?.loyaltyProgram, 500),
      loyaltyProgramUrl: text(details.loyaltyProgramUrl ?? existing?.loyaltyProgramUrl, 1500),
      hubsJson: array(details.hubsJson ?? existing?.hubsJson),
      fleetSummaryJson: stringify(details.fleetSummaryJson ?? parseJsonValue(existing?.fleetSummaryJson, [])),
      aircraftFamiliesText: text(details.aircraftFamiliesText ?? existing?.aircraftFamiliesText, 12000),
      aircraftConfigurationsJson: stringify(details.aircraftConfigurationsJson ?? parseJsonValue(existing?.aircraftConfigurationsJson, [])),
      boarding: text(details.boarding ?? existing?.boarding, 12000),
      foodDrinksJson: stringify(details.foodDrinksJson ?? parseJsonValue(existing?.foodDrinksJson, [])),
      wifiOnboardJson: stringify(details.wifiOnboardJson ?? parseJsonValue(existing?.wifiOnboardJson, [])),
      delayCancellationJson: stringify(details.delayCancellationJson ?? parseJsonValue(existing?.delayCancellationJson, [])),
      damagedBaggageJson: stringify(details.damagedBaggageJson ?? parseJsonValue(existing?.damagedBaggageJson, [])),
      lostFoundJson: stringify(details.lostFoundJson ?? parseJsonValue(existing?.lostFoundJson, [])),
      childrenInfantsJson: stringify(details.childrenInfantsJson ?? parseJsonValue(existing?.childrenInfantsJson, [])),
      ticketTypesJson: stringify(details.ticketTypesJson ?? parseJsonValue(existing?.ticketTypesJson, [])),
      baggageAllowence: text(details.baggageAllowance ?? existing?.baggageAllowence, 12000),
      contactUrl: text(details.contactUrl ?? existing?.contactUrl, 1500),
      sectionsJson: stringify(details.sectionsJson ?? parseJsonValue(existing?.sectionsJson, [])),
      lastReviewed: text(details.lastReviewed ?? existing?.lastReviewed, 200),
      active,
      iataCode: upper(details.iata || existing?.iataCode || raw.code, 10),
      icaoCode: upper(details.icao || existing?.icaoCode, 10),
      sort_order: number(raw.sortPriority ?? raw.sort_priority ?? existing?.sort_order, 100),
      status,
      customer_visible: customerVisible,
      staff_visible: bool(raw.staffVisible ?? raw.staff_visible, true),
      altea_visible: bool(raw.alteaVisible ?? raw.altea_visible, true),
      featured: bool(raw.featured),
      homepage_featured: bool(raw.homepageFeatured ?? raw.homepage_featured),
      published: customerVisible,
      source: text(raw.source || existing?.source || "SKANDI", 100),
      source_reference: text(raw.sourceReference ?? raw.source_reference ?? existing?.source_reference, 300) || null,
      inventory_details: details,
      commercial: object(raw.commercial),
      operations: object(raw.operations),
      seo: object(raw.seo),
      publication,
      localized_content: localized,
      media_assets: media,
      payload: {
        ...object(existing?.payload),
        ...object(raw.payload),
        checkinInfo: details.checkinInfo || "",
        baggageInfo: details.baggageInfo || details.baggageAllowance || "",
        cabinClasses: details.cabinClasses || details.classComparisonText || "",
        mealInfo: details.mealInfo || "",
        wifiInfo: details.wifiInfo || "",
        seatInfo: details.seatInfo || "",
        specialAssistanceInfo: details.specialAssistanceInfo || "",
        frequentFlyerInfo: details.frequentFlyerInfo || details.loyaltyProgram || ""
      },
      updated_at: new Date().toISOString()
    };
  }

  let savedRows;
  if (existing) {
    savedRows = await restRequest({ table, method: "PATCH", query: { ID: `eq.${existing.ID}` }, body: row });
  } else {
    const insertRow = type === "AIRLINE" ? { ...row, ID: pseudoUuid() } : row;
    savedRows = await restRequest({ table, method: "POST", body: insertRow });
  }

  const savedRaw = first(savedRows);
  if (!savedRaw) throw new Error("Master record could not be saved.");
  const saved = mapCanonical(type, savedRaw);
  if (input.relations !== undefined) await replaceRelations(type, saved.id, input.relations);

  await audit(agent, existing ? "inventory_master_update" : "inventory_master_create", {
    id: saved.id, code: saved.code, entity_type: type
  }, existing, savedRaw, `${type} canonical Travel Info record ${existing ? "updated" : "created"}.`);

  return getMasterBundle(saved.id);
}


async function saveMaster(input = {}, agent = {}) {
  const raw = input.record || input.master || input;
  const type = cleanEntityType(raw.entityType ?? raw.entity_type);
  if (isTravelCanonical(type)) return saveTravelCanonical(input, agent);

  const name = text(raw.name, 300);
  if (!name) throw new Error("Name / title is required.");

  const id = text(raw.id, 80);
  let existing = null;
  if (id) {
    existing = first(await restRequest({
      table: "inventory_master_entities",
      query: { select: "*", id: `eq.${id}`, limit: 1 }
    }));
    if (!existing) throw new Error("Master record not found.");
  }

  const code = upper(raw.code || existing?.code || generatedCode(type, name), 120);
  const publicId = text(
    raw.publicId ?? raw.public_id ?? existing?.public_id ?? `${entityPrefix(type)}-${code}`,
    160
  );
  const statusRequested = upper(raw.status || existing?.status || "DRAFT", 30);
  const status = STATUS_VALUES.has(statusRequested) ? statusRequested : "DRAFT";

  const row = {
    public_id: publicId,
    entity_type: type,
    code,
    name,
    slug: slugify(raw.slug || existing?.slug || name),
    status,
    active: raw.active === undefined ? existing?.active !== false : bool(raw.active, true),
    customer_visible: raw.customerVisible === undefined && raw.customer_visible === undefined
      ? existing?.customer_visible === true
      : bool(raw.customerVisible ?? raw.customer_visible),
    staff_visible: raw.staffVisible === undefined && raw.staff_visible === undefined
      ? existing?.staff_visible !== false
      : bool(raw.staffVisible ?? raw.staff_visible, true),
    altea_visible: raw.alteaVisible === undefined && raw.altea_visible === undefined
      ? existing?.altea_visible !== false
      : bool(raw.alteaVisible ?? raw.altea_visible, true),
    featured: bool(raw.featured ?? existing?.featured),
    homepage_featured: bool(raw.homepageFeatured ?? raw.homepage_featured ?? existing?.homepage_featured),
    sort_priority: integer(raw.sortPriority ?? raw.sort_priority ?? existing?.sort_priority, 100),
    parent_entity_id: text(raw.parentEntityId ?? raw.parent_entity_id, 80) || null,
    supplier_entity_id: text(raw.supplierEntityId ?? raw.supplier_entity_id, 80) || null,
    source: text(raw.source || existing?.source || "SKANDI", 100),
    source_reference: text(raw.sourceReference ?? raw.source_reference ?? existing?.source_reference, 300) || null,
    details: object(raw.details),
    commercial: object(raw.commercial),
    operations: object(raw.operations),
    seo: object(raw.seo),
    publication: object(raw.publication),
    payload: object(raw.payload),
    updated_by_agent_user_id: agent?.id || null,
    updated_at: new Date().toISOString()
  };

  if (status === "PUBLISHED") {
    row.customer_visible = true;
    row.publication = { ...row.publication, publishedAt: new Date().toISOString(), publishedBy: agent?.id || null };
  } else if (["HIDDEN", "SUSPENDED", "ARCHIVED"].includes(status)) {
    row.customer_visible = false;
  }
  if (status === "ARCHIVED") row.active = false;

  let savedRows;
  if (existing) {
    savedRows = await restRequest({ table: "inventory_master_entities", method: "PATCH", query: { id: `eq.${existing.id}` }, body: row });
  } else {
    savedRows = await restRequest({ table: "inventory_master_entities", method: "POST", body: { ...row, created_by_agent_user_id: agent?.id || null } });
  }

  const saved = first(savedRows);
  if (!saved) throw new Error("Master record could not be saved.");

  if (input.localizedContent !== undefined) await replaceLocalized(saved.id, input.localizedContent);
  if (input.media !== undefined) await replaceMedia(saved.id, input.media);
  if (input.relations !== undefined) await replaceRelations(type, saved.id, input.relations);

  await audit(agent, existing ? "inventory_master_update" : "inventory_master_create", saved, existing, saved,
    `${type} master record ${existing ? "updated" : "created"}.`);

  return getMasterBundle(saved.id);
}

async function setPublication(input = {}, agent = {}) {
  const id = text(input.id || input.entityId, 120);
  const action = upper(input.action, 30);
  if (!id || !PUBLICATION_ACTIONS.has(action)) throw new Error("Invalid publishing action.");

  const source = await getRecordSource(id);
  if (!source) throw new Error("Master record not found.");

  if (isTravelCanonical(source.type)) {
    const nextStatus = action === "DRAFT" ? "DRAFT" :
      action === "REVIEW" ? "REVIEW" :
      action === "PUBLISH" ? "PUBLISHED" :
      action === "HIDE" ? "HIDDEN" :
      action === "SUSPEND" ? "SUSPENDED" : "ARCHIVED";

    return saveTravelCanonical({
      record: {
        ...source.record,
        status: nextStatus,
        active: nextStatus !== "ARCHIVED",
        customerVisible: nextStatus === "PUBLISHED"
      },
      localizedContent: source.raw.localized_content || [],
      media: source.raw.media_assets || [],
      relations: (await getRelationsFor(source.type, id)).map(r => ({
        relationType: r.relationType,
        targetEntityId: r.targetEntityId,
        targetEntityType: r.targetEntityType,
        sequenceNo: r.sequenceNo,
        active: r.active
      }))
    }, agent);
  }

  const existing = source.raw;
  const now = new Date().toISOString();
  const currentPublication = object(existing.publication);
  const updates = { updated_by_agent_user_id: agent?.id || null, updated_at: now };

  if (action === "DRAFT") { updates.status = "DRAFT"; updates.customer_visible = false; }
  else if (action === "REVIEW") { updates.status = "REVIEW"; }
  else if (action === "PUBLISH") {
    updates.status = "PUBLISHED"; updates.customer_visible = true;
    updates.publication = { ...currentPublication, publishedAt: now, publishedBy: agent?.id || null };
  }
  else if (action === "HIDE") { updates.status = "HIDDEN"; updates.customer_visible = false; }
  else if (action === "SUSPEND") { updates.status = "SUSPENDED"; updates.customer_visible = false; }
  else if (action === "ARCHIVE") { updates.status = "ARCHIVED"; updates.active = false; updates.customer_visible = false; }

  const rows = await restRequest({ table: "inventory_master_entities", method: "PATCH", query: { id: `eq.${id}` }, body: updates });
  const saved = first(rows);
  await audit(agent, `inventory_${action.toLowerCase()}`, saved, existing, saved, `${existing.entity_type} ${action.toLowerCase()}.`);
  return getMasterBundle(id);
}

async function saveInventory(input = {}, agent = {}) {
  const raw = input.row || input.inventory || input;
  const entityId = text(raw.entityId ?? raw.entity_id, 80);
  const serviceDate = text(raw.serviceDate ?? raw.service_date, 10);
  if (!entityId || !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
    throw new Error("Entity and service date are required.");
  }

  const entity = first(await restRequest({
    table: "inventory_master_entities",
    query: { select: "id,entity_type,code,name", id: `eq.${entityId}`, limit: 1 }
  }));
  if (!entity) throw new Error("Master entity not found.");

  const capacity = integer(raw.capacityTotal ?? raw.capacity_total, 0);
  const held = integer(raw.held, 0);
  const sold = integer(raw.sold, 0);
  const availableInput = raw.available;
  const available = availableInput === undefined || availableInput === null || availableInput === ""
    ? Math.max(0, capacity - held - sold)
    : integer(availableInput, 0);

  const row = {
    entity_id: entityId,
    inventory_type: upper(raw.inventoryType ?? raw.inventory_type ?? "GENERAL", 60),
    service_date: serviceDate,
    start_time: text(raw.startTime ?? raw.start_time, 8) || null,
    end_time: text(raw.endTime ?? raw.end_time, 8) || null,
    variant_code: text(raw.variantCode ?? raw.variant_code, 100) || null,
    variant_name: text(raw.variantName ?? raw.variant_name, 240) || null,
    capacity_total: capacity,
    held,
    sold,
    available,
    waitlist_limit: integer(raw.waitlistLimit ?? raw.waitlist_limit, 0),
    overbooking_limit: integer(raw.overbookingLimit ?? raw.overbooking_limit, 0),
    stop_sale: bool(raw.stopSale ?? raw.stop_sale),
    blackout: bool(raw.blackout),
    status: upper(raw.status || "OPEN", 40),
    supplier_cost: number(raw.supplierCost ?? raw.supplier_cost, 0),
    public_price: number(raw.publicPrice ?? raw.public_price, 0),
    adult_price: number(raw.adultPrice ?? raw.adult_price, 0),
    child_price: number(raw.childPrice ?? raw.child_price, 0),
    infant_price: number(raw.infantPrice ?? raw.infant_price, 0),
    private_price: number(raw.privatePrice ?? raw.private_price, 0),
    currency: upper(raw.currency || "USD", 3),
    price_basis: upper(raw.priceBasis ?? raw.price_basis ?? "PER_PERSON", 40),
    booking_cutoff_hours: integer(raw.bookingCutoffHours ?? raw.booking_cutoff_hours, 0),
    min_stay: integer(raw.minStay ?? raw.min_stay, 0),
    max_stay: integer(raw.maxStay ?? raw.max_stay, 0),
    release_days: integer(raw.releaseDays ?? raw.release_days, 0),
    supplier_reference: text(raw.supplierReference ?? raw.supplier_reference, 300) || null,
    payload: object(raw.payload),
    updated_by_agent_user_id: agent?.id || null,
    updated_at: new Date().toISOString()
  };

  let rows;
  const id = text(raw.id, 80);
  if (id) {
    rows = await restRequest({
      table: "inventory_dated_inventory",
      method: "PATCH",
      query: { id: `eq.${id}`, entity_id: `eq.${entityId}` },
      body: row
    });
  } else {
    rows = await restRequest({
      table: "inventory_dated_inventory",
      method: "POST",
      body: { ...row, created_by_agent_user_id: agent?.id || null }
    });
  }

  const saved = first(rows);
  await audit(agent, "dated_inventory_save", entity, null, saved, "Dated inventory saved.");
  return mapInventory(saved);
}


export const getInventoryControlV2Bootstrap = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    const { agent } = await requireStaffAgent();
    const records = await listMasters(input);

    const [masterRefsRaw, airportRefs, airlineRefs] = await Promise.all([
      restRequest({
        table: "inventory_master_entities",
        query: {
          select: "id,public_id,entity_type,code,name,slug,status,customer_visible,parent_entity_id,active,sort_priority",
          active: "eq.true",
          order: "entity_type.asc,name.asc",
          limit: 2000
        }
      }),
      listTravelCanonical("AIRPORT", { limit: 1000 }),
      listTravelCanonical("AIRLINE", { limit: 1000 })
    ]);

    const references = [
      ...array(masterRefsRaw).map(mapMaster).filter(row => !isTravelCanonical(row.entityType)),
      ...airportRefs,
      ...airlineRefs
    ].sort((a, b) => a.entityType.localeCompare(b.entityType) || a.name.localeCompare(b.name));

    return {
      ok: true,
      session: publicAgent(agent),
      records,
      references,
      entityTypes: Array.from(ENTITY_TYPES),
      languages: Array.from(LANGUAGES),
      canonicalSources: {
        AIRPORT: "travel_info_airports",
        AIRLINE: "travel_info_airlines"
      },
      lastSync: new Date().toISOString()
    };
  }
);

export const getInventoryMasterRecord = webMethod(
  Permissions.SiteMember,
  async ({ id } = {}) => {
    await requireStaffAgent();
    return { ok: true, ...(await getMasterBundle(id)) };
  }
);

export const saveInventoryMasterRecord = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    const { agent } = await requireStaffAgent();
    return { ok: true, ...(await saveMaster(input, agent)) };
  }
);

export const setInventoryMasterPublication = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    const { agent } = await requireStaffAgent();
    return { ok: true, ...(await setPublication(input, agent)) };
  }
);

export const getInventoryDatedInventory = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    await requireStaffAgent();
    const entityId = text(input.entityId ?? input.entity_id, 80);
    if (!entityId) throw new Error("Master entity is required.");

    const query = {
      select: "*",
      entity_id: `eq.${entityId}`,
      order: "service_date.asc,start_time.asc,variant_name.asc",
      limit: Math.min(Math.max(integer(input.limit, 1000), 1), 2000)
    };
    if (input.dateFrom && input.dateTo) {
      query.and = `(service_date.gte.${text(input.dateFrom, 10)},service_date.lte.${text(input.dateTo, 10)})`;
    } else if (input.dateFrom) {
      query.service_date = `gte.${text(input.dateFrom, 10)}`;
    } else if (input.dateTo) {
      query.service_date = `lte.${text(input.dateTo, 10)}`;
    }

    const rows = await restRequest({ table: "inventory_dated_inventory", query });
    return { ok: true, inventory: array(rows).map(mapInventory), lastSync: new Date().toISOString() };
  }
);

export const saveInventoryDatedInventory = webMethod(
  Permissions.SiteMember,
  async (input = {}) => {
    const { agent } = await requireStaffAgent();
    return { ok: true, row: await saveInventory(input, agent) };
  }
);

export const deleteInventoryDatedInventory = webMethod(
  Permissions.SiteMember,
  async ({ id } = {}) => {
    const { agent } = await requireStaffAgent();
    const rowId = text(id, 80);
    if (!rowId) throw new Error("Inventory row ID is required.");

    const oldRows = await restRequest({
      table: "inventory_dated_inventory",
      query: { select: "*", id: `eq.${rowId}`, limit: 1 }
    });
    const existing = first(oldRows);
    if (!existing) return { ok: true, deleted: false };

    await restRequest({
      table: "inventory_dated_inventory",
      method: "DELETE",
      query: { id: `eq.${rowId}` },
      prefer: "return=minimal"
    });

    const entity = first(await restRequest({
      table: "inventory_master_entities",
      query: { select: "id,entity_type,code,name", id: `eq.${existing.entity_id}`, limit: 1 }
    }));
    await audit(agent, "dated_inventory_delete", entity || {}, existing, null, "Dated inventory row deleted.");
    return { ok: true, deleted: true, id: rowId };
  }
);
