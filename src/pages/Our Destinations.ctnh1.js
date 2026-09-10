import wixLocation from "wix-location-frontend";
import { session } from "wix-storage";

import {
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";

import {
  searchDuffelStays
} from "src/backend/RIA/duffelGroundProducts.web";

import {
  getDestinationFlowCatalog
} from "backend/FINAL/destinationFlowOnePage.web";

const DESTINATION_EMBED_IDS = ["#htmlDestinations", "#destinationFlowEmbed", "#htmlDestination", "#destinationsEmbed"];

const FLOW_SOURCE = "SKANDI_DESTINATION_FLOW";
const INDEX_SOURCE = "SKANDI_DESTINATIONS_INDEX";
const COUNTRY_SOURCE = "SKANDI_DYNAMIC_COUNTRY_PAGE";
const DESTINATION_SOURCE = "SKANDI_DYNAMIC_DESTINATION_PAGE";
const AREA_SOURCE = "SKANDI_DYNAMIC_DESTINATION_AREA";
const HOTEL_SEARCH_SOURCES = new Set([
  "SKANDI_AREA_HOTEL_SEARCH",
  "SKANDI_HOTEL_SEARCH"
]);
const HOTEL_DETAIL_SOURCE = "SKANDI_HOTEL_DETAIL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const PROTOCOL_VERSION = "2026.09.10.destination-v9";

let catalog = [];
let catalogPromise = null;
let flowState = {
  level: "index",
  countrySlug: "",
  destinationSlug: "",
  areaSlug: "",
  hotelSlug: "",
  hotelId: ""
};

function post(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function lower(value, max = 5000) {
  return clean(value, max).toLowerCase();
}

function slug(value) {
  return clean(value, 240)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function first(...values) {
  return values.find(
    value =>
      value !== undefined &&
      value !== null &&
      value !== ""
  ) ?? "";
}

function numeric(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function normalizeLanguage(value) {
  const language = clean(value || "EN", 12).toUpperCase();
  return ["EN", "SV", "NO", "DA"].includes(language)
    ? language
    : "EN";
}

function normalizeCurrency(value) {
  const currency = clean(value || "USD", 3).toUpperCase();
  return ["USD", "SEK", "NOK", "DKK", "EUR"].includes(currency)
    ? currency
    : "USD";
}


function firstDestinationEmbed() {
  for (const id of DESTINATION_EMBED_IDS) {
    try {
      const candidate = $w(id);
      if (
        candidate &&
        typeof candidate.onMessage === "function" &&
        typeof candidate.postMessage === "function"
      ) {
        console.log(`[Destination Flow V9] Bound HTML Component ${id}.`);
        return candidate;
      }
    } catch (_) {}
  }

  console.error(
    `[Destination Flow V9] No HTML Component found. Checked: ${DESTINATION_EMBED_IDS.join(", ")}`
  );
  return null;
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(clean(value, 10));
}

function nightsBetween(from, to) {
  if (!validDate(from) || !validDate(to)) return 0;
  const value = Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86400000
  );
  return value > 0 ? value : 0;
}


function assertDateRange(search = {}) {
  const from = clean(search.departureDate || search.checkInDate, 10);
  const to = clean(search.returnDate || search.checkOutDate, 10);
  if (!validDate(from) || !validDate(to)) {
    throw new Error("Select both From and To dates.");
  }
  if (nightsBetween(from, to) < 1) {
    throw new Error("To date must be after From date.");
  }
  return { from, to };
}

function wixInitialFlowState() {
  let query = {};
  let path = [];
  try { query = obj(wixLocation.query); } catch (_) {}
  try { path = arr(wixLocation.path).map(value => clean(value, 240)); } catch (_) {}

  const countrySlug = slug(first(query.country, query.countrySlug));
  const destinationSlug = slug(first(query.destination, query.destinationSlug));
  const areaSlug = slug(first(query.area, query.areaSlug));
  const hotelSlug = slug(first(query.hotel, query.hotelSlug));
  const hotelId = clean(first(query.hotelId, query.inventoryMasterId), 160);
  const view = lower(query.view, 40);

  // Query parameters are authoritative. They survive direct links and refreshes.
  let level = "index";
  if (view === "hotel" || hotelSlug || hotelId) level = "hotel";
  else if (view === "hotels") level = "hotels";
  else if (areaSlug) level = "area";
  else if (destinationSlug) level = "destination";
  else if (countrySlug) level = "country";

  // Backward-compatible nested V9/V8 paths, when Wix exposes them through path[].
  const destinationIndex = path.findIndex(part => ["destinations", "our-destinations"].includes(lower(part, 80)));
  if (destinationIndex >= 0 && level === "index") {
    const tail = path.slice(destinationIndex + 1).filter(Boolean);
    const meaningful = tail.filter(part => !["country", "destination", "area", "hotel-list"].includes(lower(part, 80)));
    if (meaningful[0]) {
      return {
        level: meaningful.length >= 3 ? "area" : meaningful.length >= 2 ? "destination" : "country",
        countrySlug: slug(meaningful[0]),
        destinationSlug: slug(meaningful[1]),
        areaSlug: slug(meaningful[2]),
        hotelSlug: "",
        hotelId: ""
      };
    }
  }

  return { level, countrySlug, destinationSlug, areaSlug, hotelSlug, hotelId };
}

function sameFlowState(a = {}, b = {}) {
  return ["level", "countrySlug", "destinationSlug", "areaSlug", "hotelSlug", "hotelId"]
    .every(key => clean(a[key], 300) === clean(b[key], 300));
}

function syncWixFlowQuery(next = {}) {
  try {
    if (!wixLocation?.queryParams) return;
    const desired = {};
    if (next.countrySlug) desired.country = slug(next.countrySlug);
    if (next.destinationSlug) desired.destination = slug(next.destinationSlug);
    if (next.areaSlug) desired.area = slug(next.areaSlug);
    if (next.level === "hotels") desired.view = "hotels";
    if (next.level === "hotel") {
      desired.view = "hotel";
      if (next.hotelSlug) desired.hotel = slug(next.hotelSlug);
      if (next.hotelId) desired.hotelId = clean(next.hotelId, 160);
    }

    const keys = ["country", "destination", "area", "view", "hotel", "hotelId"];
    const current = obj(wixLocation.query);
    const remove = keys.filter(key => !desired[key] && current[key] !== undefined);
    if (remove.length) wixLocation.queryParams.remove(remove);

    const changed = Object.entries(desired).some(([key, value]) => clean(current[key], 300) !== clean(value, 300));
    if (changed) wixLocation.queryParams.add(desired);
  } catch (error) {
    console.warn("[Destination Flow V9] Could not mirror flow state to Wix URL.", error?.message || error);
  }
}

function airportDirectory() {
  return records("AIRPORT")
    .map(record => {
      const details = obj(record.details);
      return {
        id: record.id,
        publicId: record.publicId,
        iata: clean(first(details.iata, record.code), 3).toUpperCase(),
        icao: clean(details.icao, 4).toUpperCase(),
        code: clean(first(details.iata, record.code), 3).toUpperCase(),
        name: clean(record.name, 500),
        city: clean(details.city, 500),
        country: clean(details.country, 500)
      };
    })
    .filter(item => item.iata)
    .sort((a, b) =>
      `${a.city} ${a.name}`.localeCompare(`${b.city} ${b.name}`)
    );
}

function airportFromValue(value) {
  const raw = clean(value, 500);
  if (!raw) return null;

  const bracketCode = raw.match(/\(([A-Z0-9]{3,4})\)\s*$/i)?.[1] || "";
  const needle = clean(bracketCode || raw, 500);
  const compact = slug(needle).replace(/-/g, "");

  return records("AIRPORT").find(record => {
    const details = obj(record.details);
    const iata = clean(first(details.iata, record.code), 3).toUpperCase();
    const icao = clean(details.icao, 4).toUpperCase();
    const values = [
      iata,
      icao,
      record.name,
      details.city,
      `${details.city || ""} ${record.name || ""}`
    ].map(value => slug(value).replace(/-/g, ""));

    return values.some(value => value && (
      value === compact ||
      (compact.length >= 3 && value.startsWith(compact))
    ));
  }) || null;
}

function airportFor(record) {
  if (!record) return null;
  if (clean(record.entityType, 60).toUpperCase() === "AIRPORT") return record;

  const details = obj(record.details);
  const explicitCode = clean(first(
    details.searchAirportIata,
    details.destinationIata,
    details.nearestAirportIata,
    details.arrivalAirportIata,
    details.iata
  ), 4).toUpperCase();

  if (explicitCode) {
    const byCode = records("AIRPORT").find(airport => {
      const d = obj(airport.details);
      return [clean(first(d.iata, airport.code), 4), clean(d.icao, 4)]
        .map(value => value.toUpperCase())
        .includes(explicitCode);
    });
    if (byCode) return byCode;
  }

  const related = relationTarget(
    record,
    ["NEAREST_AIRPORT", "ARRIVAL_AIRPORT", "AIRPORT"],
    ["AIRPORT"]
  );
  if (related) return related;

  const parent = parentOf(record);
  return parent && parent.id !== record.id ? airportFor(parent) : null;
}

function v9BookingSearch(search = {}, scopeRecord = null) {
  const raw = obj(search);
  const departureDate = clean(first(raw.departureDate, raw.checkInDate), 10);
  let returnDate = clean(first(raw.returnDate, raw.checkOutDate), 10);

  // Backward compatibility only: old inbound links may still carry nights/duration.
  // The V9 UI itself never exposes a duration selector.
  if (!validDate(returnDate) && validDate(departureDate)) {
    const oldNights = Math.max(0, numeric(raw.nights, raw.duration, raw.QueryDur));
    if (oldNights) returnDate = addDays(departureDate, oldNights);
  }

  const originAirport = airportFromValue(first(raw.originIata, raw.origin));
  const destinationAirport = airportFor(scopeRecord);
  const destinationType = clean(scopeRecord?.entityType, 60).toUpperCase();
  const canonicalDestination = ["DESTINATION", "AREA"].includes(destinationType)
    ? clean(first(scopeRecord.code, scopeRecord.slug, scopeRecord.publicId), 160)
    : clean(first(raw.destinationCode, raw.destinationRegion, raw.destination), 160);
  const destinationIata = destinationAirport
    ? clean(first(obj(destinationAirport.details).iata, destinationAirport.code), 3).toUpperCase()
    : clean(raw.destinationIata, 3).toUpperCase();
  const nights = nightsBetween(departureDate, returnDate);

  return {
    ...raw,
    origin: originAirport
      ? clean(first(obj(originAirport.details).iata, originAirport.code), 3).toUpperCase()
      : clean(raw.origin, 500),
    originIata: originAirport
      ? clean(first(obj(originAirport.details).iata, originAirport.code), 3).toUpperCase()
      : clean(raw.originIata, 3).toUpperCase(),
    originLabel: originAirport
      ? clean(first(obj(originAirport.details).city, originAirport.name), 500)
      : clean(raw.originLabel, 500),
    departureDate,
    returnDate,
    checkInDate: departureDate,
    checkOutDate: returnDate,
    nights,
    destination: destinationIata || clean(raw.destination, 160),
    destinationIata,
    destinationCode: canonicalDestination || clean(raw.destinationCode, 160),
    destinationRegion: canonicalDestination || clean(raw.destinationRegion, 160),
    destinationType: destinationType || clean(raw.destinationType, 60),
    language: normalizeLanguage(first(raw.language, raw.locale, "EN")),
    locale: normalizeLanguage(first(raw.locale, raw.language, "EN")),
    currency: normalizeCurrency(raw.currency)
  };
}

async function ensureCatalog() {
  if (catalog.length) return catalog;

  if (!catalogPromise) {
    catalogPromise = getDestinationFlowCatalog()
      .then(result => {
        if (!result?.ok) {
          const code = clean(result?.code, 160);
          const message = clean(
            result?.publicMessage || "Destination inventory is unavailable.",
            500
          );
          throw new Error(code ? `${message} [${code}]` : message);
        }
        catalog = arr(result.records);
        return catalog;
      })
      .finally(() => {
        catalogPromise = null;
      });
  }

  return catalogPromise;
}

function records(type) {
  const target = clean(type, 60).toUpperCase();
  return catalog.filter(
    record => clean(record.entityType, 60).toUpperCase() === target
  );
}

function byId(id) {
  const needle = clean(id, 120);
  return catalog.find(
    record =>
      clean(record.id, 120) === needle ||
      clean(record.publicId, 120) === needle
  ) || null;
}

function byTypeSlug(type, value) {
  const needle = slug(value);
  if (!needle) return null;

  return records(type).find(
    record =>
      slug(record.slug) === needle ||
      slug(record.name) === needle ||
      slug(record.code) === needle ||
      slug(record.publicId) === needle
  ) || null;
}

function relationTarget(record, relationTypes = [], targetTypes = []) {
  const relationSet = new Set(
    arr(relationTypes).map(value => clean(value, 80).toUpperCase())
  );
  const targetSet = new Set(
    arr(targetTypes).map(value => clean(value, 80).toUpperCase())
  );

  for (const relation of arr(record?.relations)) {
    const relationType = clean(
      first(relation.relationType, relation.type),
      80
    ).toUpperCase();

    const targetType = clean(
      first(relation.targetEntityType, relation.targetType),
      80
    ).toUpperCase();

    if (
      relationSet.size &&
      !relationSet.has(relationType)
    ) {
      continue;
    }

    if (
      targetSet.size &&
      !targetSet.has(targetType)
    ) {
      continue;
    }

    const target =
      byId(first(
        relation.targetEntityId,
        relation.targetId,
        relation.entityId
      )) ||
      byTypeSlug(
        targetType,
        first(
          relation.targetSlug,
          relation.slug,
          relation.targetName
        )
      );

    if (target) return target;
  }

  return null;
}

function parentOf(record) {
  if (!record) return null;

  const direct = byId(record.parentEntityId);
  if (direct) return direct;

  return relationTarget(
    record,
    ["PARENT"],
    []
  );
}

function ancestors(record) {
  const result = [];
  const seen = new Set();
  let current = record;

  while (current) {
    const parent = parentOf(current);
    if (
      !parent ||
      seen.has(parent.id)
    ) {
      break;
    }

    seen.add(parent.id);
    result.push(parent);
    current = parent;
  }

  return result;
}

function countryOf(record) {
  if (!record) return null;
  if (record.entityType === "COUNTRY") return record;

  const details = obj(record.details);

  const explicit =
    byId(first(details.countryId, details.countryEntityId)) ||
    relationTarget(record, ["COUNTRY"], ["COUNTRY"]);

  if (explicit) return explicit;

  return ancestors(record).find(
    item => item.entityType === "COUNTRY"
  ) || null;
}

function destinationOf(record) {
  if (!record) return null;
  if (record.entityType === "DESTINATION") return record;

  const details = obj(record.details);

  const explicit =
    byId(first(details.destinationId, details.destinationEntityId)) ||
    relationTarget(
      record,
      ["DESTINATION"],
      ["DESTINATION"]
    );

  if (explicit) return explicit;

  return ancestors(record).find(
    item => item.entityType === "DESTINATION"
  ) || null;
}

function areaOf(record) {
  if (!record) return null;
  if (record.entityType === "AREA") return record;

  const details = obj(record.details);

  const explicit =
    byId(first(details.areaId, details.areaEntityId)) ||
    relationTarget(record, ["AREA"], ["AREA"]);

  if (explicit) return explicit;

  return ancestors(record).find(
    item => item.entityType === "AREA"
  ) || null;
}

function isDirectChild(child, parent) {
  if (!child || !parent) return false;

  if (
    clean(child.parentEntityId, 120) &&
    clean(child.parentEntityId, 120) === clean(parent.id, 120)
  ) {
    return true;
  }

  return arr(child.relations).some(relation =>
    clean(
      first(relation.relationType, relation.type),
      80
    ).toUpperCase() === "PARENT" &&
    clean(
      first(relation.targetEntityId, relation.targetId),
      120
    ) === clean(parent.id, 120)
  );
}

function directChildren(parent, types = []) {
  const allowed = new Set(
    arr(types).map(value => clean(value, 60).toUpperCase())
  );

  return catalog.filter(record => {
    if (
      allowed.size &&
      !allowed.has(clean(record.entityType, 60).toUpperCase())
    ) {
      return false;
    }

    return isDirectChild(record, parent);
  });
}

function isUnder(record, ancestor) {
  if (!record || !ancestor) return false;
  if (record.id === ancestor.id) return true;

  if (
    ancestors(record).some(
      item => item.id === ancestor.id
    )
  ) {
    return true;
  }

  const details = obj(record.details);
  const ancestorType = clean(ancestor.entityType, 60).toUpperCase();

  if (
    ancestorType === "COUNTRY" &&
    [
      details.countryId,
      details.countryEntityId
    ].map(clean).includes(clean(ancestor.id))
  ) {
    return true;
  }

  if (
    ancestorType === "DESTINATION" &&
    [
      details.destinationId,
      details.destinationEntityId
    ].map(clean).includes(clean(ancestor.id))
  ) {
    return true;
  }

  if (
    ancestorType === "AREA" &&
    [
      details.areaId,
      details.areaEntityId
    ].map(clean).includes(clean(ancestor.id))
  ) {
    return true;
  }

  return false;
}

function localized(record, language = "EN") {
  const rows = arr(record?.localized);
  if (!rows.length) return {};

  const target = normalizeLanguage(language);

  return (
    rows.find(
      row =>
        clean(row.language, 12).toUpperCase() === target
    ) ||
    rows.find(
      row =>
        clean(row.language, 12).toUpperCase() === "EN"
    ) ||
    rows[0] ||
    {}
  );
}

function mediaRows(record) {
  return arr(record?.media)
    .filter(Boolean)
    .sort(
      (a, b) =>
        numeric(a.sortOrder, 0) -
        numeric(b.sortOrder, 0)
    );
}

function mediaUrl(value) {
  if (typeof value === "string") {
    return clean(value, 1800);
  }

  return clean(
    first(
      value?.url,
      value?.src,
      value?.imageUrl
    ),
    1800
  );
}

function imagesOf(record) {
  const rows = mediaRows(record);
  const hero = rows.filter(row =>
    row.isHero === true ||
    clean(row.role, 60).toUpperCase() === "HERO"
  );

  const rest = rows.filter(row => !hero.includes(row));

  const details = obj(record?.details);

  return [
    ...new Set(
      [
        ...hero.map(mediaUrl),
        ...rest.map(mediaUrl),
        mediaUrl(details.heroImage),
        mediaUrl(details.image),
        mediaUrl(record?.heroImage),
        mediaUrl(record?.image)
      ].filter(Boolean)
    )
  ];
}

function imageOf(record) {
  return imagesOf(record)[0] || "";
}

function cardImageOf(record) {
  const card = mediaRows(record).find(row =>
    row.isCard === true ||
    clean(row.role, 60).toUpperCase() === "CARD"
  );

  return mediaUrl(card) || imageOf(record);
}

function summaryOf(record, language = "EN") {
  const local = localized(record, language);
  const details = obj(record?.details);
  const seo = obj(record?.seo);

  return clean(
    first(
      local.shortDescription,
      local.description,
      details.shortDescription,
      details.summary,
      seo.description,
      details.description
    ),
    8000
  );
}

function descriptionOf(record, language = "EN") {
  const local = localized(record, language);
  const details = obj(record?.details);

  return clean(
    first(
      local.fullDescription,
      local.description,
      details.longDescription,
      details.description,
      summaryOf(record, language)
    ),
    20000
  );
}

function paragraphs(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => clean(item, 5000))
      .filter(Boolean);
  }

  return clean(value, 20000)
    .split(/\n\s*\n|\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function pageFacts(record) {
  const details = obj(record?.details);

  return arr(
    first(
      details.pageFacts,
      details.quickFactsJson,
      details.quickFacts,
      details.facts,
      []
    )
  );
}

function climate(record) {
  const details = obj(record?.details);

  return arr(details.climate)
    .map((item, index) => ({
      month: numeric(item.month, index + 1),
      temperature: numeric(
        item.temperature,
        item.high,
        item.day,
        0
      ),
      rain: numeric(
        item.rain,
        item.rainfall,
        0
      ),
      high: numeric(
        item.high,
        item.temperature,
        item.day,
        0
      ),
      low: numeric(
        item.low,
        item.night,
        item.temperature,
        0
      ),
      sun: numeric(
        item.sun,
        item.sunHours,
        0
      ),
      water: numeric(
        item.water,
        item.waterTemperature,
        item.sea,
        0
      ),
      dry: numeric(
        item.dry,
        item.dryDays,
        0
      ),
      air: numeric(
        item.air,
        item.high,
        item.temperature,
        0
      )
    }));
}

function faqs(record) {
  const details = obj(record?.details);

  return arr(details.faqs).map(item => ({
    question: clean(
      first(item.question, item.q, item.title),
      2000
    ),
    answer: clean(
      first(item.answer, item.a, item.text),
      6000
    ),
    q: clean(
      first(item.q, item.question, item.title),
      2000
    ),
    a: clean(
      first(item.a, item.answer, item.text),
      6000
    )
  })).filter(item => item.question || item.q);
}

function signature(record) {
  const details = obj(record?.details);
  const raw = details.signature;

  if (Array.isArray(raw)) {
    return {
      title: clean(raw[0]?.title || record?.name, 500),
      copy: clean(
        first(
          raw[0]?.copy,
          raw[0]?.text,
          raw[0]?.description
        ),
        5000
      ),
      points: raw.map(item =>
        clean(
          first(
            item.point,
            item.title,
            item.text,
            item.description
          ),
          1000
        )
      ).filter(Boolean)
    };
  }

  const value = obj(raw);

  return {
    title: clean(
      first(
        value.title,
        value.heading,
        record?.name
      ),
      500
    ),
    copy: clean(
      first(
        value.copy,
        value.text,
        value.description
      ),
      5000
    ),
    points: arr(
      first(
        value.points,
        value.items,
        []
      )
    ).map(item =>
      clean(
        typeof item === "string"
          ? item
          : first(
              item.text,
              item.title,
              item.description
            ),
        1200
      )
    ).filter(Boolean)
  };
}

function guide(record) {
  const details = obj(record?.details);
  const raw =
    first(
      details.guide,
      details.guideSections,
      {}
    );

  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw)
  ) {
    return Object.fromEntries(
      Object.entries(raw)
        .map(([key, value]) => {
          const item =
            typeof value === "string"
              ? { text: value }
              : obj(value);

          return [
            slug(key) || key,
            {
              title: clean(
                first(item.title, item.heading, key),
                500
              ),
              text: clean(
                first(
                  item.text,
                  item.description,
                  item.body
                ),
                7000
              ),
              image: mediaUrl(
                first(
                  item.image,
                  item.imageUrl
                )
              )
            }
          ];
        })
    );
  }

  const rows = arr(raw);

  return Object.fromEntries(
    rows.map((item, index) => {
      const key =
        slug(
          first(
            item.key,
            item.category,
            item.title,
            `guide-${index + 1}`
          )
        ) || `guide-${index + 1}`;

      return [
        key,
        {
          title: clean(
            first(
              item.title,
              item.heading,
              item.category
            ),
            500
          ),
          text: clean(
            first(
              item.text,
              item.description,
              item.body
            ),
            7000
          ),
          image: mediaUrl(
            first(
              item.image,
              item.imageUrl
            )
          )
        }
      ];
    })
  );
}

function stories(record) {
  const details = obj(record?.details);

  const raw =
    arr(details.stories).length
      ? arr(details.stories)
      : arr(details.guideSections);

  return raw.slice(0, 6).map(item => ({
    title: clean(
      first(
        item.title,
        item.heading,
        item.category
      ),
      500
    ),
    body: clean(
      first(
        item.body,
        item.text,
        item.description
      ),
      5000
    )
  })).filter(item => item.title || item.body);
}

function badges(record) {
  const details = obj(record?.details);

  return [
    ...new Set(
      [
        clean(details.skandiTier, 60),
        ...arr(details.tags).map(value => clean(value, 80)),
        ...arr(details.badges).map(value => clean(value, 80))
      ].filter(Boolean)
    )
  ].slice(0, 8);
}

function customPath(level, data = {}) {
  const query = new URLSearchParams();

  if (data.countrySlug) query.set("country", data.countrySlug);
  if (data.destinationSlug) query.set("destination", data.destinationSlug);
  if (data.areaSlug) query.set("area", data.areaSlug);
  if (data.hotelSlug) query.set("hotel", data.hotelSlug);
  if (data.hotelId) query.set("hotelId", data.hotelId);

  if (level === "hotels") query.set("view", "hotels");

  const qs = query.toString();

  if (level === "hotel") {
    return `/hotel-detail${qs ? `?${qs}` : ""}`;
  }

  return `/destinations${qs ? `?${qs}` : ""}`;
}

function hierarchy(record) {
  const country = countryOf(record);
  const destination = destinationOf(record);
  const area = areaOf(record);

  return {
    country,
    destination,
    area,
    countrySlug: slug(country?.slug || country?.name),
    destinationSlug: slug(destination?.slug || destination?.name),
    areaSlug: slug(area?.slug || area?.name)
  };
}

function hotelsForScope(scope) {
  if (!scope) return records("HOTEL");

  return records("HOTEL").filter(
    hotel => isUnder(hotel, scope)
  );
}

function directoryDestinations() {
  return records("DESTINATION").map(destination => {
    const country = countryOf(destination);

    return {
      countrySlug: slug(country?.slug || country?.name),
      countryName: clean(country?.name, 500),
      destinationSlug: slug(destination.slug || destination.name),
      slug: slug(destination.slug || destination.name),
      name: clean(destination.name, 500)
    };
  });
}

function directoryAreas() {
  return records("AREA").map(area => {
    const country = countryOf(area);
    const destination = destinationOf(area);

    return {
      countrySlug: slug(country?.slug || country?.name),
      countryName: clean(country?.name, 500),
      destinationSlug: slug(destination?.slug || destination?.name),
      destinationName: clean(destination?.name, 500),
      areaSlug: slug(area.slug || area.name),
      name: clean(area.name, 500)
    };
  });
}

function countryFactKey(label) {
  const value = lower(label);

  if (value.includes("currenc")) return "currency";
  if (value.includes("language")) return "language";
  if (value.includes("time")) return "timezone";
  if (
    value.includes("flight") ||
    value.includes("journey")
  ) return "flight";
  if (
    value.includes("season") ||
    value.includes("best time")
  ) return "season";
  if (
    value.includes("best for") ||
    value.includes("good for")
  ) return "best";

  return "";
}

function countryFacts(record) {
  const details = obj(record.details);

  const fromPage = pageFacts(record)
    .map(item => ({
      key: clean(
        first(
          item.key,
          countryFactKey(
            first(
              item.label,
              item.title
            )
          )
        ),
        40
      ),
      value: clean(
        first(
          item.value,
          item.text,
          item.description
        ),
        1000
      )
    }))
    .filter(item => item.key && item.value);

  const fallback = [
    {
      key: "currency",
      value: clean(details.currency, 100)
    },
    {
      key: "language",
      value: arr(details.languages).join(" · ")
    },
    {
      key: "timezone",
      value: clean(details.timezone, 120)
    },
    {
      key: "flight",
      value: clean(
        first(
          details.typicalJourney,
          details.flightTime,
          details.typicalFlightTime
        ),
        300
      )
    },
    {
      key: "season",
      value: clean(
        first(
          details.popularSeason,
          details.season
        ),
        300
      )
    },
    {
      key: "best",
      value: arr(
        first(
          details.goodFor,
          details.bestFor,
          []
        )
      ).join(" · ")
    }
  ];

  const map = new Map();

  [...fromPage, ...fallback].forEach(item => {
    if (
      item.key &&
      item.value &&
      !map.has(item.key)
    ) {
      map.set(item.key, item);
    }
  });

  return [
    "currency",
    "language",
    "timezone",
    "flight",
    "season",
    "best"
  ].map(key => map.get(key))
    .filter(Boolean);
}

function quickFacts(record, extra = {}) {
  const details = obj(record.details);

  const rows = pageFacts(record).map(item => ({
    label: clean(
      first(
        item.label,
        item.title,
        item.key
      ),
      300
    ),
    labelKey: clean(item.labelKey, 120),
    value: clean(
      first(
        item.value,
        item.text,
        item.description
      ),
      1000
    )
  })).filter(item => item.value);

  if (rows.length) return rows.slice(0, 7);

  return [
    ["Country", extra.countryName],
    ["Arrival airport", clean(first(details.nearestAirportIata, details.searchAirportIata), 20)],
    ["Typical transfer", numeric(details.transferTimeMinutes) ? `${numeric(details.transferTimeMinutes)} min` : ""],
    ["Currency", clean(details.currency, 100)],
    ["Time zone", clean(details.timezone, 120)],
    ["Popular season", clean(first(details.popularSeason, details.season), 300)],
    ["Best for", arr(first(details.goodFor, details.bestFor, [])).join(" · ")]
  ].filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }))
    .slice(0, 7);
}

function introFor(record, language = "EN") {
  const details = obj(record.details);
  const local = localized(record, language);
  const sig = signature(record);

  const copy = first(
    details.introParagraphs,
    local.fullDescription,
    details.longDescription,
    details.description,
    summaryOf(record, language)
  );

  return {
    title: clean(
      first(
        details.introTitle,
        local.title,
        record.name
      ),
      500
    ),
    paragraphs: paragraphs(copy).slice(0, 8),
    signature: clean(
      first(
        sig.copy,
        localized(record, language).importantInformation
      ),
      5000
    ),
    signatureTitle: sig.title || record.name,
    signatureCopy: clean(
      first(
        sig.copy,
        localized(record, language).importantInformation
      ),
      5000
    ),
    signaturePoints: sig.points
  };
}

function heroFor(record, language = "EN", parentName = "") {
  const details = obj(record.details);
  const local = localized(record, language);

  return {
    kicker: clean(
      first(
        details.heroKicker,
        details.kicker,
        parentName
          ? `SKANDI · ${parentName}`
          : "SKANDI DESTINATIONS"
      ),
      500
    ),
    title: clean(
      first(
        details.heroTitle,
        local.heroTitle,
        local.title,
        record.name
      ),
      1000
    ),
    summary: clean(
      first(
        details.heroSummary,
        local.shortDescription,
        summaryOf(record, language)
      ),
      5000
    ),
    images: imagesOf(record)
  };
}

function countryPage(record, language) {
  const browse = directChildren(
    record,
    ["DESTINATION", "AREA"]
  );

  const details = obj(record.details);

  const regions = browse.map(child => {
    const type = clean(child.entityType, 60).toUpperCase();
    const destinationSlug =
      type === "DESTINATION"
        ? slug(child.slug || child.name)
        : "";

    const areaSlug =
      type === "AREA"
        ? slug(child.slug || child.name)
        : "";

    const hotelCount =
      hotelsForScope(child).length;

    return {
      name: clean(child.name, 500),
      slug: slug(child.slug || child.name),
      image: cardImageOf(child),
      description: summaryOf(child, language),
      hotelCount,
      path:
        type === "AREA"
          ? customPath("area", {
              countrySlug: slug(record.slug || record.name),
              areaSlug
            })
          : customPath("destination", {
              countrySlug: slug(record.slug || record.name),
              destinationSlug
            }),
      hotelsPath: customPath("hotels", {
        countrySlug: slug(record.slug || record.name),
        destinationSlug,
        areaSlug
      })
    };
  });

  const practical = arr(details.practicalInfo)
    .map(item => ({
      icon: clean(first(item.icon, "•"), 20),
      title: clean(first(item.title, item.label), 500),
      summary: clean(
        first(
          item.summary,
          item.text,
          item.description
        ),
        5000
      ),
      path: clean(
        first(
          item.path,
          item.url,
          "/travel-info"
        ),
        1000
      )
    }))
    .filter(item => item.title || item.summary);

  const inspiration = arr(details.inspiration)
    .map(item => ({
      image: mediaUrl(
        first(
          item.image,
          item.imageUrl
        )
      ),
      title: clean(
        first(item.title, item.name),
        500
      ),
      path: clean(
        first(
          item.path,
          item.url,
          "/voy-magazine"
        ),
        1000
      )
    }))
    .filter(item => item.title);

  const airlineRows = arr(details.airlines);

  const airlines = airlineRows.map(item => {
    if (typeof item === "string") {
      const airline =
        byTypeSlug("AIRLINE", item) ||
        records("AIRLINE").find(
          row =>
            clean(row.code, 20).toUpperCase() ===
            clean(item, 20).toUpperCase()
        );

      return airline
        ? {
            code: clean(airline.code, 20),
            name: clean(airline.name, 500),
            summary: summaryOf(airline, language),
            path: "/flights"
          }
        : {
            code: clean(item, 20),
            name: clean(item, 500),
            summary: "",
            path: "/flights"
          };
    }

    const row = obj(item);

    return {
      code: clean(first(row.code, row.iata), 20),
      name: clean(first(row.name, row.title), 500),
      summary: clean(first(row.summary, row.description), 2000),
      path: clean(first(row.path, row.url, "/flights"), 1000)
    };
  });

  return {
    airports: airportDirectory(),
    id: record.id,
    name: clean(record.name, 500),
    slug: slug(record.slug || record.name),
    code: clean(record.code, 20).toUpperCase(),
    hero: heroFor(record, language),
    directory: records("COUNTRY").map(country => ({
      slug: slug(country.slug || country.name),
      name: clean(country.name, 500)
    })),
    facts: countryFacts(record),
    intro: introFor(record, language),
    stories: stories(record),
    regions,
    weather: clean(
      first(
        details.weatherSummary,
        details.weather,
        details.climateSummary
      ),
      5000
    ),
    climate: climate(record),
    info: practical,
    inspiration,
    airlines,
    faqs: faqs(record)
  };
}

function destinationPage(record, language) {
  const country = countryOf(record);
  const areas = directChildren(record, ["AREA"]);
  const directHotels = directChildren(record, ["HOTEL"]);

  const areaCards = areas.map(area => ({
    name: clean(area.name, 500),
    slug: slug(area.slug || area.name),
    image: cardImageOf(area),
    description: summaryOf(area, language),
    hotelCount: hotelsForScope(area).length,
    path: customPath("area", {
      countrySlug: slug(country?.slug || country?.name),
      destinationSlug: slug(record.slug || record.name),
      areaSlug: slug(area.slug || area.name)
    }),
    hotelsPath: customPath("hotels", {
      countrySlug: slug(country?.slug || country?.name),
      destinationSlug: slug(record.slug || record.name),
      areaSlug: slug(area.slug || area.name)
    })
  }));

  const hotelCards = directHotels.map(hotel =>
    previewHotel(hotel, language)
  );

  const details = obj(record.details);

  return {
    airports: airportDirectory(),
    id: record.id,
    name: clean(record.name, 500),
    slug: slug(record.slug || record.name),
    countrySlug: slug(country?.slug || country?.name),
    countryName: clean(country?.name, 500),
    countryCode: clean(country?.code, 20).toUpperCase(),
    hero: heroFor(record, language, country?.name || ""),
    directory: directoryDestinations(),
    quickFacts: quickFacts(record, {
      countryName: country?.name || ""
    }),
    intro: introFor(record, language),
    stories: stories(record),
    hotels: hotelCards,
    guide: guide(record),
    climate: climate(record),
    weatherSummary: clean(
      first(
        details.weatherSummary,
        details.weather,
        details.climateSummary
      ),
      5000
    ),
    areas: areaCards,
    inspiration: arr(details.inspiration)
      .map(item => ({
        image: mediaUrl(first(item.image, item.imageUrl)),
        title: clean(first(item.title, item.name), 500),
        path: clean(first(item.path, item.url, "/voy-magazine"), 1000)
      }))
      .filter(item => item.title),
    faqs: faqs(record)
  };
}

function relatedRecords(record, relationTypes, entityTypes = []) {
  const relationSet = new Set(
    arr(relationTypes).map(value => clean(value, 80).toUpperCase())
  );
  const typeSet = new Set(
    arr(entityTypes).map(value => clean(value, 80).toUpperCase())
  );

  return arr(record?.relations)
    .filter(relation => {
      const relationType = clean(
        first(relation.relationType, relation.type),
        80
      ).toUpperCase();

      const targetType = clean(
        first(relation.targetEntityType, relation.targetType),
        80
      ).toUpperCase();

      return (
        (!relationSet.size || relationSet.has(relationType)) &&
        (!typeSet.size || typeSet.has(targetType))
      );
    })
    .map(relation =>
      byId(
        first(
          relation.targetEntityId,
          relation.targetId
        )
      ) ||
      byTypeSlug(
        first(
          relation.targetEntityType,
          relation.targetType
        ),
        first(
          relation.targetSlug,
          relation.targetName
        )
      )
    )
    .filter(Boolean);
}

function areaPage(record, language) {
  const country = countryOf(record);
  const destination = destinationOf(record);
  const details = obj(record.details);

  const hotelRows = directChildren(record, ["HOTEL"]);
  const hotelCards = hotelRows.map(hotel =>
    previewHotel(hotel, language)
  );

  const siblings = records("AREA").filter(
    area =>
      area.id !== record.id &&
      (
        (
          destination &&
          destinationOf(area)?.id === destination.id
        ) ||
        (
          !destination &&
          country &&
          countryOf(area)?.id === country.id
        )
      )
  );

  const excursionRecords = relatedRecords(
    record,
    [
      "FEATURED_GUIDED_TOUR",
      "FEATURED_ACTIVITY",
      "RELATED_ACTIVITY"
    ],
    ["GUIDED_TOUR", "ACTIVITY"]
  );

  const excursions = [
    ...excursionRecords.map(item => ({
      image: cardImageOf(item),
      title: clean(item.name, 500),
      summary: summaryOf(item, language),
      path: "/tours"
    })),
    ...arr(details.excursions).map(item => ({
      image: mediaUrl(first(item.image, item.imageUrl)),
      title: clean(first(item.title, item.name), 500),
      summary: clean(first(item.summary, item.description), 5000),
      path: clean(first(item.path, item.url, "/tours"), 1000)
    }))
  ];

  const practicalFacts = arr(details.practicalInfo)
    .map(item => ({
      icon: clean(first(item.icon, "•"), 20),
      title: clean(first(item.title, item.label), 500),
      text: clean(
        first(
          item.text,
          item.summary,
          item.description
        ),
        5000
      )
    }))
    .filter(item => item.title || item.text);

  const transferRecord =
    relatedRecords(
      record,
      ["TRANSFER"],
      ["TRANSFER"]
    )[0] || null;

  const transferDetails = obj(transferRecord?.details);
  const airport =
    byId(details.nearestAirportId) ||
    relationTarget(
      record,
      ["NEAREST_AIRPORT"],
      ["AIRPORT"]
    );

  const transfer = {
    airport: clean(
      first(
        airport?.code,
        airport?.name,
        details.nearestAirportIata,
        details.searchAirportIata
      ),
      500
    ),
    time:
      numeric(
        details.transferTimeMinutes,
        transferDetails.transferTimeMinutes
      )
        ? `${numeric(
            details.transferTimeMinutes,
            transferDetails.transferTimeMinutes
          )} min`
        : "",
    modes: arr(
      first(
        details.transferModes,
        transferDetails.modes,
        []
      )
    ),
    combination: clean(
      first(
        details.transferCombination,
        transferDetails.combination
      ),
      1000
    ),
    summary: clean(
      first(
        details.transferSummary,
        summaryOf(transferRecord, language)
      ),
      5000
    )
  };

  const match = obj(
    first(
      details.match,
      details.areaMatch,
      {}
    )
  );

  return {
    airports: airportDirectory(),
    id: record.id,
    name: clean(record.name, 500),
    slug: slug(record.slug || record.name),
    countrySlug: slug(country?.slug || country?.name),
    countryName: clean(country?.name, 500),
    countryCode: clean(country?.code, 20).toUpperCase(),
    destinationSlug: slug(destination?.slug || destination?.name),
    destinationName: clean(destination?.name, 500),
    hero: heroFor(
      record,
      language,
      destination?.name ||
      country?.name ||
      ""
    ),
    directory: directoryAreas(),
    quickFacts: quickFacts(record, {
      countryName: country?.name || ""
    }),
    intro: introFor(record, language),
    goodToKnow: arr(
      first(
        details.goodToKnow,
        details.goodFor,
        []
      )
    ).map(item =>
      clean(
        typeof item === "string"
          ? item
          : first(
              item.text,
              item.title,
              item.description
            ),
        1200
      )
    ).filter(Boolean),
    match: {
      title: clean(first(match.title, record.name), 500),
      copy: clean(first(match.copy, match.text, summaryOf(record, language)), 5000),
      values: {
        beach: numeric(match.beach),
        dining: numeric(match.dining),
        evening: numeric(match.evening),
        family: numeric(match.family),
        calm: numeric(match.calm),
        active: numeric(match.active)
      }
    },
    hotels: hotelCards,
    hotelsPath: customPath("hotels", {
      countrySlug: slug(country?.slug || country?.name),
      destinationSlug: slug(destination?.slug || destination?.name),
      areaSlug: slug(record.slug || record.name)
    }),
    guide: guide(record),
    excursions,
    practicalFacts,
    transfer,
    climate: climate(record),
    weatherSummary: clean(
      first(
        details.weatherSummary,
        details.weather,
        details.climateSummary
      ),
      5000
    ),
    reviews: obj(
      first(
        details.reviewSummary,
        details.reviewsSummary,
        {}
      )
    ),
    nearby: siblings.map(area => {
      const siblingCountry = countryOf(area);
      const siblingDestination = destinationOf(area);

      return {
        image: cardImageOf(area),
        name: clean(area.name, 500),
        description: summaryOf(area, language),
        countrySlug: slug(siblingCountry?.slug || siblingCountry?.name),
        destinationSlug: slug(siblingDestination?.slug || siblingDestination?.name),
        areaSlug: slug(area.slug || area.name)
      };
    }),
    inspiration: arr(details.inspiration)
      .map(item => ({
        image: mediaUrl(first(item.image, item.imageUrl)),
        title: clean(first(item.title, item.name), 500),
        path: clean(first(item.path, item.url, "/voy-magazine"), 1000)
      }))
      .filter(item => item.title),
    faqs: faqs(record)
  };
}

function previewHotel(record, language = "EN") {
  const details = obj(record.details);
  const h = hierarchy(record);
  const tier = clean(
    first(
      details.skandiTier,
      details.collection
    ),
    60
  ).toUpperCase();

  const hotelSlug = slug(record.slug || record.name);

  return {
    id: record.id,
    inventoryMasterId: record.id,
    publicId: record.publicId,
    hotelId: record.publicId || record.id,
    hotelSlug,
    slug: hotelSlug,
    name: clean(record.name, 500),
    location: clean(
      first(
        details.city,
        details.areaName,
        details.destinationName,
        h.area?.name,
        h.destination?.name,
        h.country?.name
      ),
      500
    ),
    image: cardImageOf(record),
    imageUrl: cardImageOf(record),
    heroImage: imageOf(record),
    classification: numeric(
      details.officialStarRating,
      details.classification,
      details.stars
    ),
    standard: numeric(
      details.officialStarRating,
      details.classification,
      details.stars
    ),
    guestRating: numeric(
      details.guestRating,
      details.reviewScore
    ),
    reviewCount: numeric(details.reviewCount),
    beachDistance: numeric(
      details.distanceToBeach,
      99999
    ),
    centerDistance: numeric(
      details.distanceToCenter,
      99999
    ),
    longitude: numeric(details.longitude),
    latitude: numeric(details.latitude),
    facilities: arr(details.facilities),
    tags: arr(details.tags),
    boardOptions: arr(details.boardOptions),
    meal: clean(arr(details.boardOptions)[0], 200),
    skandiTier: tier,
    collection: tier,
    details,
    description: summaryOf(record, language),
    summary: summaryOf(record, language),
    countrySlug: h.countrySlug,
    destinationSlug: h.destinationSlug,
    areaSlug: h.areaSlug,
    path: customPath("hotel", {
      countrySlug: h.countrySlug,
      destinationSlug: h.destinationSlug,
      areaSlug: h.areaSlug,
      hotelSlug,
      hotelId: record.id
    })
  };
}

function hotelListPage(
  countrySlug,
  destinationSlug,
  areaSlug,
  language
) {
  const country =
    byTypeSlug("COUNTRY", countrySlug) ||
    records("COUNTRY")[0] ||
    null;

  const destination =
    byTypeSlug("DESTINATION", destinationSlug);

  const area =
    byTypeSlug("AREA", areaSlug);

  const scope =
    area ||
    destination ||
    country;

  const previewHotels =
    hotelsForScope(scope).map(hotel =>
      previewHotel(hotel, language)
    );

  const scopeName =
    clean(
      first(
        area?.name,
        destination?.name,
        country?.name,
        "Hotels"
      ),
      500
    );

  return {
    airports: airportDirectory(),
    name: scopeName,
    countrySlug: slug(country?.slug || country?.name),
    countryName: clean(country?.name, 500),
    destinationSlug: slug(destination?.slug || destination?.name),
    destinationName: clean(destination?.name, 500),
    areaSlug: slug(area?.slug || area?.name),
    areaName: clean(area?.name, 500),
    slug: slug(area?.slug || destination?.slug || country?.slug || scopeName),
    heroImage: imageOf(scope),
    intro: summaryOf(scope, language),
    description: descriptionOf(scope, language),
    previewHotels
  };
}

function normalizeRoom(room = {}, gallery = []) {
  return {
    id: clean(
      first(
        room.id,
        room.code,
        slug(room.name)
      ),
      160
    ),
    code: clean(room.code, 80),
    name: clean(room.name, 500),
    description: clean(room.description, 6000),
    image: mediaUrl(
      first(
        room.image,
        room.photo,
        gallery[0]
      )
    ),
    capacity: numeric(
      room.maxGuests,
      room.capacity
    ),
    size:
      numeric(
        room.sizeSqm,
        room.size
      )
        ? `${numeric(
            room.sizeSqm,
            room.size
          )} m²`
        : "",
    bedType: clean(room.bedType, 160),
    roomType: clean(room.roomType, 160),
    features: arr(
      first(
        room.features,
        room.amenities,
        []
      )
    )
  };
}

function hotelPage(record, language, query = {}) {
  const details = obj(record.details);
  const h = hierarchy(record);
  const gallery = imagesOf(record);

  const lat = Number(
    first(
      details.latitude,
      record.latitude
    )
  );

  const lng = Number(
    first(
      details.longitude,
      record.longitude
    )
  );

  const address = [
    details.address,
    details.postalCode,
    details.city
  ].filter(Boolean).join(", ");

  const food = obj(
    first(
      details.food,
      details.foodDrink,
      details.dining,
      {}
    )
  );

  const poolBeach = obj(
    first(
      details.poolBeach,
      details.poolAndBeach,
      {}
    )
  );

  const activities = obj(
    first(
      details.activities,
      details.trainingActivities,
      {}
    )
  );

  const accessibility = obj(
    first(
      details.accessibility,
      {}
    )
  );

  const tier = clean(
    first(
      details.skandiTier,
      details.collection
    ),
    60
  ).toUpperCase();

  return {
    airports: airportDirectory(),
    id: record.id,
    hotelKey: record.publicId || record.id,
    hotelSlug: slug(record.slug || record.name),
    providerHotelId: clean(
      first(
        details.duffelAccommodationId,
        details.providerAccommodationId
      ),
      180
    ),
    name: clean(record.name, 500),
    countrySlug: h.countrySlug,
    countryName: clean(h.country?.name, 500),
    destinationSlug: h.destinationSlug,
    destinationName: clean(h.destination?.name, 500),
    areaSlug: h.areaSlug,
    areaName: clean(h.area?.name, 500),
    destinationCode: clean(
      first(
        details.searchAirportIata,
        details.destinationIata
      ),
      20
    ).toUpperCase(),
    gallery,
    heroImage: gallery[0] || "",
    summary: summaryOf(record, language),
    about: descriptionOf(record, language),
    important: clean(
      first(
        localized(record, language).importantInformation,
        details.importantInformation
      ),
      6000
    ),
    skandiTier: tier,
    collection: tier,
    officialClassification: numeric(
      details.officialStarRating,
      details.classification,
      details.stars
    ),
    classification: numeric(
      details.officialStarRating,
      details.classification,
      details.stars
    ),
    skandiRating: numeric(details.skandiRating),
    guestRating: numeric(details.guestRating),
    reviewCount: numeric(details.reviewCount),
    highlights: [
      ...new Set([
        ...arr(details.tags),
        ...arr(details.goodFor),
        ...arr(details.facilities).slice(0, 5)
      ].map(value => clean(value, 120)).filter(Boolean))
    ].slice(0, 10),
    facts: pageFacts(record).map(item => ({
      label: clean(first(item.label, item.title, item.key), 300),
      value: clean(first(item.value, item.text, item.description), 1000)
    })),
    roomsIntro: clean(
      first(
        details.roomsIntro,
        details.roomDescription
      ),
      5000
    ),
    rooms: arr(details.rooms).map(room =>
      normalizeRoom(room, gallery)
    ),
    food,
    accessibility,
    poolBeach,
    activities,
    locationTransfer: {
      text: clean(
        first(
          details.locationText,
          details.locationDescription
        ),
        5000
      ),
      address,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      airportDistance:
        numeric(details.distanceToAirport)
          ? `${numeric(details.distanceToAirport)} km`
          : "",
      transferTime:
        numeric(details.transferTimeMinutes)
          ? `${numeric(details.transferTimeMinutes)} min`
          : "",
      centerDistance:
        numeric(details.distanceToCenter)
          ? `${numeric(details.distanceToCenter)} km`
          : "",
      beachDistance:
        numeric(details.distanceToBeach)
          ? `${numeric(details.distanceToBeach)} m`
          : "",
      phone: clean(first(details.phone, details.contactPhone), 100),
      email: clean(first(details.email, details.contactEmail), 254)
    },
    climate: climate(record).map(item => ({
      month: item.month,
      air: item.air || item.high || item.temperature,
      water: item.water
    })),
    reviews: arr(details.reviews),
    selection: {
      origin: clean(query.origin, 100),
      departureDate: clean(
        first(
          query.QueryDepDate,
          query.departureDate,
          query.checkIn
        ),
        10
      ),
      returnDate: (() => {
        const from = clean(first(query.QueryDepDate, query.departureDate, query.checkIn), 10);
        const explicit = clean(first(query.returnDate, query.checkOutDate), 10);
        if (validDate(explicit)) return explicit;
        const legacy = Math.max(0, numeric(query.QueryDur, query.nights, query.duration));
        return validDate(from) && legacy ? addDays(from, legacy) : "";
      })(),
      nights: (() => {
        const from = clean(first(query.QueryDepDate, query.departureDate, query.checkIn), 10);
        const explicit = clean(first(query.returnDate, query.checkOutDate), 10);
        const to = validDate(explicit)
          ? explicit
          : (validDate(from) && Math.max(0, numeric(query.QueryDur, query.nights, query.duration))
              ? addDays(from, Math.max(0, numeric(query.QueryDur, query.nights, query.duration)))
              : "");
        return nightsBetween(from, to);
      })(),
      travelers:
        numeric(
          query.adults,
          2
        ) || 2,
      meal: clean(
        first(
          query.SelectedMeals,
          "noselection"
        ),
        80
      ),
      roomKey: clean(query.RoomKey, 160)
    },
    supplier: "DUFFEL_STAYS",
    liveAvailability: true
  };
}

function addDays(date, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(date, 10))) {
    return "";
  }

  const number =
    Math.max(
      1,
      Math.min(
        60,
        Number(days) || 1
      )
    );

  return new Date(
    Date.parse(`${date}T00:00:00Z`) +
    number * 86400000
  ).toISOString().slice(0, 10);
}

function hotelSearch(payload = {}, record = {}) {
  const details = obj(record.details);

  const departureDate = clean(
    first(
      payload.checkInDate,
      payload.departureDate
    ),
    10
  );

  let returnDate = clean(
    first(
      payload.checkOutDate,
      payload.returnDate
    ),
    10
  );

  // Backward-compatible inbound links only. V9 UI always chooses From -> To.
  if (!validDate(returnDate) && validDate(departureDate)) {
    const legacyNights = Math.max(
      0,
      Number(first(payload.nights, payload.duration, 0)) || 0
    );
    if (legacyNights) returnDate = addDays(departureDate, legacyNights);
  }

  const normalized = v9BookingSearch({
    ...payload,
    productType: "holiday",
    accommodationType: "hotel",
    destination: clean(
      first(
        payload.destination,
        payload.destinationIata,
        payload.destinationCode,
        details.searchAirportIata,
        details.city,
        flowState.destinationSlug
      ),
      160
    ),
    destinationRegion: clean(
      first(
        payload.destinationRegion,
        details.city
      ),
      160
    ),
    departureDate,
    returnDate,
    adults: Math.max(
      1,
      Number(first(payload.adults, payload.travelers, 2)) || 2
    ),
    children: Math.max(
      0,
      Number(first(payload.children, 0)) || 0
    ),
    childAges: arr(payload.childAges),
    rooms: Math.max(
      1,
      Number(first(payload.rooms, 1)) || 1
    )
  }, record);

  return normalized;
}

function sameAccommodation(item, record) {
  const details = obj(record.details);

  const targetId = clean(
    first(
      details.duffelAccommodationId,
      details.providerAccommodationId
    ),
    180
  );

  if (
    targetId &&
    clean(item.accommodationId, 180) === targetId
  ) {
    return true;
  }

  const a =
    lower(record.name, 500)
      .replace(/[^a-z0-9]/g, "");

  const b =
    lower(item.title, 500)
      .replace(/[^a-z0-9]/g, "");

  return Boolean(a && b && a === b);
}

function liveHotel(item, language = "EN") {
  const accommodationId = clean(item.accommodationId, 180);
  const titleKey = lower(item.title, 500);

  const matched = records("HOTEL").find(record => {
    const details = obj(record.details);

    return (
      (
        accommodationId &&
        [
          details.duffelAccommodationId,
          details.providerAccommodationId
        ].map(value => clean(value, 180))
          .includes(accommodationId)
      ) ||
      (
        titleKey &&
        lower(record.name, 500) === titleKey
      )
    );
  });

  const preview =
    matched
      ? previewHotel(matched, language)
      : {};

  return {
    ...preview,
    ...item,
    id: clean(
      first(
        item.id,
        item.staySearchResultId,
        preview.id
      ),
      180
    ),
    name: clean(
      first(
        preview.name,
        item.title
      ),
      500
    ),
    image: clean(
      first(
        preview.image,
        item.imageUrl
      ),
      1800
    ),
    imageUrl: clean(
      first(
        preview.image,
        item.imageUrl
      ),
      1800
    ),
    location: clean(
      first(
        preview.location,
        item.location
      ),
      500
    ),
    price: numeric(
      item.total,
      item.price?.total,
      item.price?.amount
    ),
    currency: normalizeCurrency(
      first(
        item.currency,
        item.price?.currency,
        "USD"
      )
    ),
    isLive: true,
    offer: item,
    supplier: "DUFFEL_STAYS"
  };
}

async function makeCart(offer, search) {
  const cart =
    await createBookingCartFromOffer({
      offer,
      search
    });

  if (!cart?.cartId) {
    throw new Error(
      "The booking cart could not be created."
    );
  }

  if (cart.cartId) {
    session.setItem(
      "SKANDI_BOOKING_CART_ID",
      cart.cartId
    );
  }

  if (cart.cartToken) {
    session.setItem(
      "SKANDI_BOOKING_CART_TOKEN",
      cart.cartToken
    );
  }

  return cart;
}

function bookingUrl(cart) {
  return (
    `/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}` +
    (
      cart.cartToken
        ? `&cartToken=${encodeURIComponent(cart.cartToken)}`
        : ""
    )
  );
}

function resolveHotel(payload = {}) {
  const query = obj(payload.query);

  return (
    (
      query.hotelId &&
      byId(query.hotelId)
    ) ||
    byTypeSlug(
      "HOTEL",
      first(
        query.hotel,
        payload.hotelSlug,
        flowState.hotelSlug
      )
    ) ||
    (
      flowState.hotelId &&
      byId(flowState.hotelId)
    )
  );
}

function safeExternalPath(path) {
  const value = clean(path, 1200);
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/^(javascript|data|vbscript):/i.test(value)
  )
    ? value
    : "";
}

$w.onReady(function () {
  const html = firstDestinationEmbed();
  if (!html) return;

  html.onMessage(async event => {
    const message = event.data || {};
    const source = clean(message.source, 120);
    const type = clean(message.type, 160);
    const payload = obj(message.payload);

    try {
      if (source === FLOW_SOURCE) {
        if (type === "DESTINATION_FLOW_READY") {
          flowState = {
            ...flowState,
            ...payload
          };
          await ensureCatalog();
          return;
        }

        if (type === "DESTINATION_FLOW_STATE_CHANGED") {
          flowState = {
            ...flowState,
            ...payload
          };
          syncWixFlowQuery(flowState);
          return;
        }

        if (type === "DESTINATION_FLOW_RESIZE") {
          const requested = Number(payload.height);
          const height =
            Number.isFinite(requested)
              ? Math.max(
                  680,
                  Math.min(
                    30000,
                    Math.round(requested)
                  )
                )
              : 1200;

          try {
            if ("height" in html) {
              html.height = height;
            }
          } catch (_) {}

          return;
        }

        if (type === "DESTINATION_FLOW_NAVIGATE_EXTERNAL") {
          const path = safeExternalPath(payload.path);
          if (path) wixLocation.to(path);
          return;
        }
      }

      if (source === INDEX_SOURCE) {
        if (type === "DESTINATIONS_INDEX_READY") {
          await ensureCatalog();
          const language = normalizeLanguage(payload.language);

          const countries = records("COUNTRY")
            .map(country => {
              const children =
                directChildren(
                  country,
                  ["DESTINATION", "AREA"]
                );

              return {
                id: country.id,
                code: clean(country.code, 20),
                slug: slug(country.slug || country.name),
                name: clean(country.name, 500),
                image: cardImageOf(country),
                heroImage: imageOf(country),
                cardImage: cardImageOf(country),
                intro: summaryOf(country, language),
                description: summaryOf(country, language),
                areaCount: children.length,
                hotelCount: hotelsForScope(country).length,
                areas: children.slice(0, 6).map(child => {
                  const isArea =
                    child.entityType === "AREA";

                  return {
                    name: clean(child.name, 500),
                    slug: slug(child.slug || child.name),
                    destinationSlug:
                      isArea
                        ? ""
                        : slug(child.slug || child.name),
                    areaSlug:
                      isArea
                        ? slug(child.slug || child.name)
                        : "",
                    path:
                      isArea
                        ? customPath("area", {
                            countrySlug: slug(country.slug || country.name),
                            areaSlug: slug(child.slug || child.name)
                          })
                        : customPath("destination", {
                            countrySlug: slug(country.slug || country.name),
                            destinationSlug: slug(child.slug || child.name)
                          })
                  };
                })
              };
            });

          post(
            html,
            "DESTINATIONS_INDEX_DATA",
            { countries }
          );
          return;
        }
      }

      if (source === COUNTRY_SOURCE) {
        if (type === "COUNTRY_READY") {
          await ensureCatalog();

          const record =
            byTypeSlug(
              "COUNTRY",
              first(
                payload.slug,
                flowState.countrySlug
              )
            );

          if (!record) {
            throw new Error("Country not found.");
          }

          post(
            html,
            "COUNTRY_PAGE_RESULT",
            {
              page: countryPage(
                record,
                normalizeLanguage(
                  payload.settings?.language
                )
              )
            }
          );
          return;
        }

        if (type === "COUNTRY_SEARCH_OFFERS") {
          const scope = byTypeSlug("COUNTRY", first(payload.countrySlug, flowState.countrySlug));
          const search = v9BookingSearch(payload.search || {}, scope);
          assertDateRange(search);
          const result =
            await searchUnifiedOffers({
              search
            });

          post(
            html,
            "COUNTRY_OFFERS_RESULT",
            {
              items: arr(result?.items),
              search
            }
          );
          return;
        }

        if (type === "COUNTRY_SELECT_OFFER") {
          const search =
            payload.search ||
            payload.searchContext ||
            payload.offer?.searchContext ||
            {};

          const cart =
            await makeCart(
              payload.offer || {},
              search
            );

          wixLocation.to(
            bookingUrl(cart)
          );
          return;
        }
      }

      if (source === DESTINATION_SOURCE) {
        if (type === "DESTINATION_READY") {
          await ensureCatalog();

          const record =
            byTypeSlug(
              "DESTINATION",
              first(
                payload.destinationSlug,
                flowState.destinationSlug
              )
            );

          if (!record) {
            throw new Error("Destination not found.");
          }

          post(
            html,
            "DESTINATION_PAGE_RESULT",
            {
              page: destinationPage(
                record,
                normalizeLanguage(
                  payload.settings?.language
                )
              )
            }
          );
          return;
        }

        if (type === "DESTINATION_SEARCH_OFFERS") {
          const scope = byTypeSlug("DESTINATION", first(payload.destinationSlug, flowState.destinationSlug));
          const search = v9BookingSearch(payload.search || {}, scope);
          assertDateRange(search);
          const result =
            await searchUnifiedOffers({
              search
            });

          post(
            html,
            "DESTINATION_OFFERS_RESULT",
            {
              items: arr(result?.items),
              search
            }
          );
          return;
        }

        if (type === "DESTINATION_SELECT_OFFER") {
          const search =
            payload.search ||
            payload.searchContext ||
            payload.offer?.searchContext ||
            {};

          const cart =
            await makeCart(
              payload.offer || {},
              search
            );

          wixLocation.to(
            bookingUrl(cart)
          );
          return;
        }
      }

      if (source === AREA_SOURCE) {
        if (type === "AREA_READY") {
          await ensureCatalog();

          const record =
            byTypeSlug(
              "AREA",
              first(
                payload.areaSlug,
                flowState.areaSlug
              )
            );

          if (!record) {
            throw new Error("Holiday area not found.");
          }

          post(
            html,
            "AREA_PAGE_RESULT",
            {
              page: areaPage(
                record,
                normalizeLanguage(
                  payload.settings?.language
                )
              )
            }
          );
          return;
        }

        if (type === "AREA_SEARCH_OFFERS") {
          const scope = byTypeSlug("AREA", first(payload.areaSlug, flowState.areaSlug));
          const search = v9BookingSearch(payload.search || {}, scope);
          assertDateRange(search);
          const result =
            await searchUnifiedOffers({
              search
            });

          post(
            html,
            "AREA_OFFERS_RESULT",
            {
              items: arr(result?.items),
              search
            }
          );
          return;
        }

        if (type === "AREA_SELECT_OFFER") {
          const search =
            payload.search ||
            payload.searchContext ||
            payload.offer?.searchContext ||
            {};

          const cart =
            await makeCart(
              payload.offer || {},
              search
            );

          wixLocation.to(
            bookingUrl(cart)
          );
          return;
        }
      }

      if (HOTEL_SEARCH_SOURCES.has(source)) {
        if (type === "HOTEL_SEARCH_READY") {
          await ensureCatalog();

          const language =
            normalizeLanguage(
              payload.settings?.language
            );

          post(
            html,
            "HOTEL_SEARCH_PAGE_RESULT",
            {
              page: hotelListPage(
                first(
                  payload.countrySlug,
                  flowState.countrySlug
                ),
                first(
                  payload.destinationSlug,
                  flowState.destinationSlug
                ),
                first(
                  payload.areaSlug,
                  flowState.areaSlug
                ),
                language
              )
            }
          );
          return;
        }

        if (type === "HOTEL_SEARCH_RUN") {
          await ensureCatalog();

          const rawSearch = payload.search || {};
          const scope =
            byTypeSlug("AREA", first(rawSearch.destinationAreaSlug, flowState.areaSlug)) ||
            byTypeSlug("DESTINATION", first(rawSearch.destinationSlug, flowState.destinationSlug)) ||
            byTypeSlug("COUNTRY", first(rawSearch.destinationCountrySlug, flowState.countrySlug));
          const search = v9BookingSearch(rawSearch, scope);

          assertDateRange(search);

          const result =
            await searchUnifiedOffers({
              search
            });

          const language =
            normalizeLanguage(
              first(
                search.language,
                search.locale,
                "EN"
              )
            );

          post(
            html,
            "HOTEL_SEARCH_RESULTS",
            {
              items: arr(result?.items).map(item =>
                liveHotel(
                  item,
                  language
                )
              ),
              search,
              supplier: "DUFFEL_STAYS"
            }
          );
          return;
        }

        if (type === "HOTEL_SEARCH_SELECT") {
          const offer =
            payload.offer ||
            payload.hotel?.offer ||
            payload.hotel ||
            {};

          const search =
            payload.search ||
            offer.searchContext ||
            {};

          const cart =
            await makeCart(
              offer,
              search
            );

          post(
            html,
            "HOTEL_SEARCH_BOOKING_CART",
            cart
          );

          wixLocation.to(
            bookingUrl(cart)
          );
          return;
        }

        if (type === "HOTEL_SEARCH_FAVOURITE") {
          wixLocation.to(
            "/my-profile?tab=favourites"
          );
          return;
        }
      }

      if (source === HOTEL_DETAIL_SOURCE) {
        if (type === "HOTEL_DETAIL_READY") {
          await ensureCatalog();

          const record =
            resolveHotel(payload);

          if (!record) {
            throw new Error("Hotel not found.");
          }

          post(
            html,
            "HOTEL_DETAIL_DATA",
            {
              page: hotelPage(
                record,
                normalizeLanguage(
                  payload.settings?.language
                ),
                obj(payload.query)
              ),
              supplier: "DUFFEL_STAYS"
            }
          );
          return;
        }

        if (type === "HOTEL_DETAIL_CHECK_AVAILABILITY") {
          await ensureCatalog();

          const record =
            resolveHotel({
              ...payload,
              query: {
                hotel:
                  flowState.hotelSlug,
                hotelId:
                  flowState.hotelId
              }
            });

          if (!record) {
            throw new Error(
              "Hotel information is not loaded yet."
            );
          }

          const search =
            hotelSearch(
              payload.search || payload,
              record
            );

          assertDateRange(search);

          const details =
            obj(record.details);

          const accommodationId =
            clean(
              first(
                details.duffelAccommodationId,
                details.providerAccommodationId
              ),
              180
            );

          let items = [];

          if (accommodationId) {
            const targeted =
              await searchDuffelStays({
                accommodationId,
                checkInDate:
                  search.departureDate,
                checkOutDate:
                  search.returnDate,
                adults:
                  search.adults,
                children:
                  search.children,
                childAges:
                  search.childAges,
                rooms:
                  search.rooms,
                fetchRates:
                  true
              });

            items =
              arr(targeted?.items).map(
                item => ({
                  ...item,
                  itemType: "HOTEL",
                  productType: "HOTEL",
                  provider: "SKANDI",
                  source: "LIVE_STAY",
                  sourceLabel:
                    "Live hotel availability",
                  price: {
                    amount:
                      Number(item.total || 0),
                    total:
                      Number(item.total || 0),
                    currency:
                      item.currency ||
                      search.currency
                  },
                  total:
                    Number(item.total || 0),
                  currency:
                    item.currency ||
                    search.currency,
                  tripType: "Hotel",
                  searchContext: search
                })
              );
          } else {
            const result =
              await searchUnifiedOffers({
                search
              });

            items =
              arr(result?.items).filter(
                item =>
                  sameAccommodation(
                    item,
                    record
                  )
              );
          }

          post(
            html,
            "HOTEL_DETAIL_AVAILABILITY_RESULT",
            {
              items,
              search,
              supplier: "DUFFEL_STAYS"
            }
          );

          return;
        }

        if (type === "HOTEL_DETAIL_SELECT_OFFER") {
          const offer =
            payload.offer || {};

          if (
            !offer?.id &&
            !offer?.staySearchResultId
          ) {
            throw new Error(
              "Select a live hotel rate first."
            );
          }

          const record =
            resolveHotel({
              query: {
                hotel:
                  flowState.hotelSlug,
                hotelId:
                  flowState.hotelId
              }
            }) || {};

          const search =
            hotelSearch(
              payload.search ||
              offer.searchContext ||
              {},
              record
            );

          const cart =
            await makeCart(
              offer,
              search
            );

          post(
            html,
            "HOTEL_DETAIL_BOOKING_CART",
            cart
          );

          wixLocation.to(
            bookingUrl(cart)
          );

          return;
        }

        if (type === "HOTEL_DETAIL_FAVOURITE") {
          wixLocation.to(
            "/my-profile?tab=favourites"
          );
          return;
        }
      }
    } catch (error) {
      const messageText =
        error?.publicMessage ||
        error?.message ||
        "Destination information is temporarily unavailable.";

      if (source === INDEX_SOURCE) {
        post(
          html,
          "DESTINATIONS_INDEX_ERROR",
          { message: messageText }
        );
        return;
      }

      if (source === COUNTRY_SOURCE) {
        post(
          html,
          "COUNTRY_ERROR",
          { message: messageText }
        );
        return;
      }

      if (source === DESTINATION_SOURCE) {
        post(
          html,
          "DESTINATION_ERROR",
          { message: messageText }
        );
        return;
      }

      if (source === AREA_SOURCE) {
        post(
          html,
          "AREA_ERROR",
          { message: messageText }
        );
        return;
      }

      if (HOTEL_SEARCH_SOURCES.has(source)) {
        post(
          html,
          "HOTEL_SEARCH_ERROR",
          { message: messageText }
        );
        return;
      }

      if (source === HOTEL_DETAIL_SOURCE) {
        post(
          html,
          "HOTEL_DETAIL_ERROR",
          { message: messageText }
        );
        return;
      }

      console.error(
        "[Destination Flow] Unhandled error.",
        error
      );
    }
  });

  // Listener first. The child resends its READY handshake after host confirmation.
  try {
    if (typeof wixLocation.onChange === "function") {
      wixLocation.onChange(() => {
        const next = wixInitialFlowState();
        if (!sameFlowState(next, flowState)) {
          flowState = { ...flowState, ...next };
          post(html, "DESTINATION_FLOW_SET_STATE", { state: next });
        }
      });
    }
  } catch (error) {
    console.warn("[Destination Flow V9] Wix location change listener unavailable.", error?.message || error);
  }

  const initialState = wixInitialFlowState();
  flowState = { ...flowState, ...initialState };

  post(html, "DESTINATION_FLOW_HOST_READY", {
    protocolVersion: PROTOCOL_VERSION,
    embedId: clean(html.id, 80),
    initialState,
    readyAt: new Date().toISOString()
  });
});
