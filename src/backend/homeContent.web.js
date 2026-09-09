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
function activePublished(row = {}) {
  return upper(row.status) === "PUBLISHED" && row.active !== false && row.customer_visible !== false;
}
function validNow(row = {}) {
  const now = Date.now();
  const from = row.valid_from ? Date.parse(row.valid_from) : NaN;
  const to = row.valid_to ? Date.parse(row.valid_to) : NaN;
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
  const rows = media.filter(m => clean(m.entity_id) === clean(entityId) && m.active !== false && m.url);
  return clean(
    rows.find(m => m.is_card)?.url ||
    rows.find(m => m.is_primary)?.url ||
    rows.find(m => m.is_hero)?.url ||
    rows.sort((a,b) => Number(a.sort_order || 100) - Number(b.sort_order || 100))[0]?.url ||
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
function destinationCard(row, media, byId) {
  const d = obj(row.details);
  return {
    id: row.id,
    publicId: row.public_id || "",
    entityType: row.entity_type,
    title: row.name,
    name: row.name,
    slug: row.slug || slug(row.name),
    destinationCode: row.code || "",
    iata: upper(first(d.searchAirportIata, d.nearestAirportIata), 3),
    country: first(d.countryName, d.countryCode),
    description: entitySummary(row),
    imageUrl: mediaFor(row.id, media),
    tags: tagArray(first(d.homepageTags, d.tags, d.goodFor)).slice(0, 4),
    path: entityPath(row, byId),
    livePrice: true,
    priceLookup: {
      destination: first(row.code, row.name),
      iata: upper(first(d.searchAirportIata, d.nearestAirportIata), 3),
      latitude: num(d.latitude),
      longitude: num(d.longitude),
      label: row.name
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
function offerCard(row = {}) {
  const p = obj(row.payload);
  const tags = [...arr(row.destinations), ...arr(row.product_types), ...tagArray(p.tags)].filter(Boolean);
  return {
    id: row.id,
    promotionId: row.promotion_id || "",
    title: row.title || "SKANDI Offer",
    description: clean(first(row.subtitle, row.banner_text, p.description, p.summary), 900),
    imageUrl: clean(first(row.image_url, p.imageUrl, p.image), 1600),
    badge: clean(first(p.badge, row.promotion_type, "Offer"), 80),
    tags: [...new Set(tags)].slice(0, 4),
    path: clean(first(p.path, p.linkUrl, p.url, "/offers"), 600),
    search: obj(p.search),
    terms: clean(row.terms, 1400),
    priority: Number(row.priority || 100)
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
    sortOrder: Number(row.sort_order || 100)
  };
}
function airportCard(row = {}) {
  return {
    city: first(row.locationCity, row.title, row.iata),
    name: first(row.title, row.locationCity, row.iata),
    iata: upper(row.iata, 3),
    icao: upper(row.icao, 4),
    country: first(row.country, "")
  };
}

export const getOldStyleHomeContent = webMethod(Permissions.Anyone, async function () {
  const [entities, media, offersRaw, inspirationRaw, airportsRaw] = await Promise.all([
    sbSelect(T.inventory, "select=id,public_id,entity_type,code,name,slug,parent_entity_id,status,active,customer_visible,homepage_featured,sort_priority,details,payload&status=eq.PUBLISHED&active=eq.true&customer_visible=eq.true&order=sort_priority.asc,name.asc&limit=500").catch(() => []),
    sbSelect(T.media, "select=entity_id,url,is_card,is_primary,is_hero,sort_order,active&active=eq.true&limit=1000").catch(() => []),
    sbSelect(T.offers, "select=*&status=eq.PUBLISHED&order=priority.asc,updated_at.desc&limit=50").catch(() => []),
    sbSelect(T.inspiration, "select=id,title,slug,category,body,image_url,active,sort_order,status,customer_visible,homepage_featured,excerpt,path,kicker,tags,payload&status=eq.PUBLISHED&active=eq.true&customer_visible=eq.true&order=sort_order.asc,updated_at.desc&limit=50").catch(() => []),
    sbSelect(T.airports, "select=iata,icao,title,locationCity,country,active,published,customer_visible&limit=500").catch(() => [])
  ]);

  const rows = arr(entities);
  const byId = new Map(rows.map(r => [clean(r.id), r]));
  const featured = rows.filter(r => r.homepage_featured === true);

  const searchDestinations = rows
    .filter(r => ["DESTINATION","AREA"].includes(upper(r.entity_type, 30)))
    .map(r => destinationCard(r, arr(media), byId));

  const destinations = featured
    .filter(r => ["DESTINATION","AREA"].includes(upper(r.entity_type, 30)))
    .slice(0, 8)
    .map(r => destinationCard(r, arr(media), byId));

  const hotels = featured
    .filter(r => upper(r.entity_type, 30) === "HOTEL")
    .slice(0, 6)
    .map(r => hotelCard(r, arr(media), byId));

  const offers = arr(offersRaw)
    .filter(row => activePublished({ ...row, active: true, customer_visible: true }) && validNow(row))
    .sort((a,b) => Number(a.priority || 100) - Number(b.priority || 100))
    .slice(0, 8)
    .map(offerCard);

  const inspiration = arr(inspirationRaw)
    .filter(activePublished)
    .slice(0, 8)
    .map(inspirationCard);

  const airports = arr(airportsRaw)
    .filter(r => r.active !== false && r.published !== false && r.customer_visible !== false && r.iata)
    .map(airportCard);

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
    pricing: {
      supplier: "DUFFEL_STAYS",
      destinationMode: "LIVE_LOCATION_CHEAPEST_STAY",
      hotelMode: "LIVE_EXACT_ACCOMMODATION"
    }
  };
});
