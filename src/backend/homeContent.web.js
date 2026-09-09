import { webMethod, Permissions } from "wix-web-module";
import { sbSelect } from "backend/supabaseClient";

const T = Object.freeze({
  inventory: "inventory_master_entities",
  media: "inventory_media_assets",
  airports: "travel_info_airports",
  offers: "storefront_promotions",
  inspiration: "travel_info_articles"
});

const clean = (v, max = 4000) => String(v ?? "").trim().slice(0, max);
const upper = (v, max = 4000) => clean(v, max).toUpperCase();
const arr = v => Array.isArray(v) ? v : [];
const obj = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const first = (...values) => values.find(v => v !== undefined && v !== null && v !== "") ?? "";
const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
const bool = (v, fallback = true) => v === undefined || v === null || v === "" ? fallback : (v === true || v === "true" || v === 1 || v === "1" || upper(v) === "YES");

function slug(value) {
  return clean(value, 180)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function tagArray(value) {
  if (Array.isArray(value)) return value.map(v => clean(v, 80)).filter(Boolean);
  return clean(value, 1000).split(/[|,]/).map(v => v.trim()).filter(Boolean);
}
function validDateRange(fromValue, toValue) {
  const now = Date.now();
  const from = fromValue ? Date.parse(fromValue) : NaN;
  const to = toValue ? Date.parse(toValue) : NaN;
  return (!Number.isFinite(from) || from <= now) && (!Number.isFinite(to) || to >= now);
}
function entitySummary(row = {}) {
  const d = obj(row.details);
  const p = obj(row.payload);
  const facts = arr(d.pageFacts);
  return clean(first(
    d.homepageSummary,
    d.shortDescription,
    d.summary,
    d.description,
    p.homepageSummary,
    p.shortDescription,
    p.summary,
    facts.find(x => clean(x?.label).toLowerCase().includes("elevator"))?.value,
    facts[0]?.value
  ), 900);
}
function mediaFor(entityId, media = []) {
  const rows = media
    .filter(m => clean(m.entity_id) === clean(entityId) && m.active !== false && m.url)
    .sort((a,b) => Number(a.sort_order ?? 100) - Number(b.sort_order ?? 100));
  return clean(
    rows.find(m => m.is_card)?.url ||
    rows.find(m => m.is_primary)?.url ||
    rows.find(m => m.is_hero)?.url ||
    rows[0]?.url ||
    "",
    1600
  );
}
function countrySlug(row = {}) {
  const d = obj(row.details);
  return slug(first(d.countrySlug, d.countryName, d.countryCode));
}
function entityPath(row = {}, byId = new Map()) {
  const d = obj(row.details);
  const type = upper(row.entity_type, 30);
  const cSlug = countrySlug(row);
  if (type === "HOTEL") {
    const destination = byId.get(clean(d.destinationId)) || byId.get(clean(row.parent_entity_id)) || null;
    const dSlug = slug(first(d.destinationSlug, destination?.slug, destination?.name, d.city));
    return `/hotels/${cSlug || "destination"}/${dSlug || "destination"}/${slug(first(row.slug, row.name))}`;
  }
  if (type === "DESTINATION" || type === "AREA") {
    return `/destinations/${cSlug || "destination"}/${slug(first(row.slug, row.name))}`;
  }
  return "/destinations";
}
function destinationCard(row, media, byId, airportByIata) {
  const d = obj(row.details);
  const iata = upper(first(d.searchAirportIata, d.nearestAirportIata), 3);
  const airport = airportByIata.get(iata) || {};
  const title = clean(row.name, 220);
  const country = clean(first(d.countryName, d.countryCode), 120);
  return {
    id: row.id,
    publicId: row.public_id || "",
    entityType: row.entity_type,
    title,
    name: title,
    slug: row.slug || slug(title),
    destinationCode: upper(row.code, 20),
    iata,
    icao: upper(airport.icao, 4),
    airportName: clean(airport.title, 220),
    airportCity: clean(airport.locationCity, 160),
    country,
    description: entitySummary(row),
    imageUrl: mediaFor(row.id, media),
    tags: tagArray(first(d.homepageTags, d.tags, d.goodFor)).slice(0, 6),
    path: entityPath(row, byId),
    livePrice: true,
    searchTerms: [title, row.code, country, iata, airport.title, airport.locationCity, airport.icao, ...tagArray(d.tags)].filter(Boolean),
    priceLookup: {
      destination: first(row.code, title),
      iata,
      latitude: num(d.latitude),
      longitude: num(d.longitude),
      label: title
    }
  };
}
function hotelCard(row, media, byId) {
  const d = obj(row.details);
  return {
    id: row.id,
    publicId: row.public_id || "",
    entityType: "HOTEL",
    title: row.name,
    name: row.name,
    slug: row.slug || slug(row.name),
    destinationCode: "",
    country: first(d.countryName, d.countryCode),
    city: d.city || "",
    description: entitySummary(row),
    imageUrl: mediaFor(row.id, media),
    tags: tagArray(first(d.homepageTags, d.facilities)).slice(0, 4),
    rating: num(first(d.officialStarRating, d.skandiRating)),
    guestRating: num(d.guestRating),
    path: entityPath(row, byId),
    livePrice: true,
    duffelAccommodationId: clean(first(d.duffelAccommodationId, d.providerAccommodationId), 180),
    priceLookup: {
      destination: first(d.city, d.searchAirportIata, row.name),
      iata: upper(d.searchAirportIata, 3),
      latitude: num(d.latitude),
      longitude: num(d.longitude),
      label: row.name
    }
  };
}
function offerVisible(row = {}) {
  const p = obj(row.payload);
  if (upper(row.status) !== "PUBLISHED") return false;
  if (!bool(first(p.active, p.enabled), true)) return false;
  if (!bool(first(p.customerVisible, p.customer_visible), true)) return false;
  return validDateRange(first(p.validFrom, p.valid_from), first(p.validTo, p.valid_to));
}
function offerCard(row = {}) {
  const p = obj(row.payload);
  const tags = [...arr(p.destinations), ...arr(p.productTypes), ...tagArray(p.tags)].filter(Boolean);
  return {
    id: row.id,
    promotionId: row.promotion_id || "",
    title: row.title || clean(first(p.title, "SKANDI Offer"), 220),
    description: clean(first(p.subtitle, p.bannerText, p.description, p.summary), 900),
    imageUrl: clean(first(p.imageUrl, p.image_url, p.image), 1600),
    badge: clean(first(p.badge, p.promotionType, "Offer"), 80),
    tags: [...new Set(tags)].slice(0, 4),
    path: clean(first(p.path, p.linkUrl, p.url, "/offers"), 600),
    search: obj(p.search),
    terms: clean(first(p.terms, p.termsSummary), 1400),
    fromPrice: num(first(p.fromPrice, p.priceFrom, p.price)),
    currency: upper(first(p.currency, "USD"), 3),
    priority: Number(first(p.priority, p.sortOrder, 100)) || 100
  };
}
function inspirationCard(row = {}) {
  const p = obj(row.payload);
  return {
    id: row.id,
    title: row.title || "Travel inspiration",
    description: clean(first(row.excerpt, p.excerpt, p.summary, row.body), 900),
    imageUrl: clean(first(row.image_url, p.imageUrl, p.image), 1600),
    kicker: clean(first(row.kicker, p.kicker, row.category, "Travel inspiration"), 100),
    category: row.category || "",
    tags: tagArray(first(row.tags, p.tags)).slice(0, 4),
    path: clean(first(row.path, p.path, p.linkUrl, row.slug ? `/travel-info/${row.slug}` : "/travel-info"), 600),
    sortOrder: Number(row.sort_order ?? 100)
  };
}
function airportCard(row = {}) {
  const city = clean(first(row.locationCity, row.title, row.iata), 160);
  const name = clean(first(row.title, row.locationCity, row.iata), 220);
  const iata = upper(row.iata, 3);
  const icao = upper(row.icao, 4);
  const country = clean(row.country, 120);
  return {
    city,
    name,
    iata,
    icao,
    country,
    searchTerms: [city, name, iata, icao, country].filter(Boolean)
  };
}

async function safeSelect(key, table, query) {
  try {
    const rows = await sbSelect(table, query);
    return { key, rows: arr(rows), error: "" };
  } catch (error) {
    const message = clean(error?.message || error || "SUPABASE_QUERY_FAILED", 500);
    console.error(`[HomeContent] ${key} failed:`, message);
    return { key, rows: [], error: message };
  }
}

async function buildHomeContent() {
  const results = await Promise.all([
    // Public homepage content: only records deliberately published to customers.
    safeSelect("inventory", T.inventory, "select=id,public_id,entity_type,code,name,slug,parent_entity_id,status,active,customer_visible,homepage_featured,sort_priority,details,payload&status=eq.PUBLISHED&active=eq.true&customer_visible=eq.true&order=sort_priority.asc,name.asc&limit=1000"),
    // Booking search catalogue: intentionally separate from homepage publication.
    // REVIEW destinations remain hidden as editorial/page cards but must still be searchable in the booking engine.
    safeSelect("searchInventory", T.inventory, "select=id,public_id,entity_type,code,name,slug,parent_entity_id,status,active,customer_visible,homepage_featured,sort_priority,search_priority,search_keywords,details,payload&active=eq.true&order=search_priority.asc,sort_priority.asc,name.asc&limit=1000"),
    safeSelect("media", T.media, "select=entity_id,url,is_card,is_primary,is_hero,sort_order,active&active=eq.true&order=sort_order.asc&limit=2000"),
    // storefront_promotions currently stores commercial display fields in payload. Do not order by a non-existent priority column.
    safeSelect("offers", T.offers, "select=id,promotion_id,title,status,payload,created_at,updated_at&status=eq.PUBLISHED&order=updated_at.desc&limit=100"),
    safeSelect("inspiration", T.inspiration, "select=id,title,slug,category,body,image_url,active,sort_order,status,customer_visible,homepage_featured,excerpt,path,kicker,tags,payload,updated_at&status=eq.PUBLISHED&active=eq.true&customer_visible=eq.true&order=sort_order.asc,updated_at.desc&limit=100"),
    safeSelect("airports", T.airports, "select=iata,icao,title,locationCity,country,active,published,customer_visible,status&active=eq.true&published=eq.true&customer_visible=eq.true&order=locationCity.asc,title.asc&limit=1000")
  ]);

  const byKey = Object.fromEntries(results.map(r => [r.key, r]));
  const entities = arr(byKey.inventory?.rows);
  const searchEntities = arr(byKey.searchInventory?.rows)
    .filter(r => r.active !== false && ["DESTINATION","AREA"].includes(upper(r.entity_type, 30)));
  const media = arr(byKey.media?.rows);
  const airportRows = arr(byKey.airports?.rows);
  const airports = airportRows.filter(r => r.iata).map(airportCard);
  const airportByIata = new Map(airportRows.filter(r => r.iata).map(r => [upper(r.iata, 3), r]));
  const allEntityRows = [...searchEntities, ...entities];
  const byId = new Map(allEntityRows.map(r => [clean(r.id), r]));
  const featured = entities.filter(r => r.homepage_featured === true);

  const searchDestinations = searchEntities
    .map(r => destinationCard(r, media, byId, airportByIata))
    .sort((a,b) => {
      const aRow = searchEntities.find(r => clean(r.id) === clean(a.id)) || {};
      const bRow = searchEntities.find(r => clean(r.id) === clean(b.id)) || {};
      return Number(aRow.search_priority ?? aRow.sort_priority ?? 100) - Number(bRow.search_priority ?? bRow.sort_priority ?? 100)
        || String(a.title || "").localeCompare(String(b.title || ""));
    });

  const destinations = featured
    .filter(r => ["DESTINATION","AREA"].includes(upper(r.entity_type, 30)))
    .slice(0, 12)
    .map(r => destinationCard(r, media, byId, airportByIata));

  const hotels = featured
    .filter(r => upper(r.entity_type, 30) === "HOTEL")
    .slice(0, 10)
    .map(r => hotelCard(r, media, byId));

  const offers = arr(byKey.offers?.rows)
    .filter(offerVisible)
    .map(offerCard)
    .sort((a,b) => Number(a.priority || 100) - Number(b.priority || 100))
    .slice(0, 12);

  const inspiration = arr(byKey.inspiration?.rows)
    .filter(row => upper(row.status) === "PUBLISHED" && row.active !== false && row.customer_visible !== false)
    .map(inspirationCard)
    .sort((a,b) => Number(a.sortOrder || 100) - Number(b.sortOrder || 100))
    .slice(0, 12);

  const errors = results.filter(r => r.error).map(r => ({ source:r.key, message:r.error }));
  return {
    airports,
    destinations,
    searchDestinations,
    hotels,
    offers,
    inspiration,
    tripTypes: [],
    trust: [],
    why: [],
    source: "SUPABASE_CANONICAL_HOME",
    sync: {
      ok: errors.length === 0,
      fetchedAt: new Date().toISOString(),
      counts: {
        airports: airports.length,
        publishedEntities: entities.length,
        activeSearchEntities: searchEntities.length,
        searchDestinations: searchDestinations.length,
        homepageDestinations: destinations.length,
        homepageHotels: hotels.length,
        offers: offers.length,
        inspiration: inspiration.length,
        media: media.length
      },
      errors
    },
    pricing: {
      supplier: "DUFFEL_STAYS",
      destinationMode: "LIVE_LOCATION_CHEAPEST_STAY",
      hotelMode: "LIVE_EXACT_ACCOMMODATION"
    }
  };
}

export const getHomeContent = webMethod(Permissions.Anyone, async function () {
  return buildHomeContent();
});

// Backwards-compatible export for any older page code still importing the previous name.
export const getOldStyleHomeContent = webMethod(Permissions.Anyone, async function () {
  return buildHomeContent();
});
