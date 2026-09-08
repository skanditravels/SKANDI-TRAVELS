import { webMethod, Permissions } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const getSecretValue = elevate(secrets.getSecretValue);

const TIERS = ["SELECT", "SIGNATURE", "EXCELSIOR"];
const PUBLIC_ENTITY_TYPES = new Set([
  "DESTINATION", "HOTEL", "GUIDED_TOUR", "ACTIVITY",
  "AIRLINE", "AIRPORT", "PACKAGE", "TRANSFER", "CAR_RENTAL"
]);

let configPromise = null;
let cache = { at: 0, language: "", payload: null };
const CACHE_MS = 30 * 1000;

const clean = (v, max = 1000) => String(v ?? "").trim().slice(0, max);
const upper = (v, max = 1000) => clean(v, max).toUpperCase();
const obj = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = v => Array.isArray(v) ? v : [];

function secretText(response) {
  if (typeof response === "string") return response.trim();
  return String(response?.value ?? response?.secretValue ?? response?.secret?.value ?? "").trim();
}

async function readSecret(name) {
  const value = secretText(await getSecretValue(name));
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}

async function config() {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    const url = (await readSecret("SUPABASE_URL")).replace(/\/+$/, "");
    let key = "";
    try { key = await readSecret("SUPABASE_SECRET_KEY"); }
    catch (_) { key = await readSecret("SUPABASE_SERVICE_ROLE_KEY"); }

    if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(url)) throw new Error("SUPABASE_URL_INVALID");
    if (!key) throw new Error("SUPABASE_SERVER_KEY_MISSING");

    return { url, key, legacy: key.startsWith("eyJ") };
  })();

  try { return await configPromise; }
  catch (error) { configPromise = null; throw error; }
}

function queryString(query = {}) {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

async function select(table, query = {}) {
  const c = await config();
  const qs = queryString(query);
  const response = await fetch(`${c.url}/rest/v1/${table}${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: {
      apikey: c.key,
      ...(c.legacy ? { Authorization: `Bearer ${c.key}` } : {}),
      Accept: "application/json"
    }
  });

  const raw = await response.text();
  let data = [];
  if (raw) {
    try { data = JSON.parse(raw); }
    catch (_) { throw new Error("SUPABASE_INVALID_RESPONSE"); }
  }

  if (!response.ok) {
    const message = clean(data?.message || data?.error || `SUPABASE_HTTP_${response.status}`, 300);
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

function normalizeTier(value) {
  const v = upper(value, 120);
  if (!v) return "";
  if (v.includes("EXCELSIOR")) return "EXCELSIOR";
  if (v.includes("SIGNATURE")) return "SIGNATURE";
  if (/(^|[^A-Z])SELECT([^A-Z]|$)/.test(v) || v === "SELECT") return "SELECT";
  return "";
}

function activeCatalog(row = {}) {
  if (row.active === false) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (row.valid_from && String(row.valid_from) > today) return false;
  if (row.valid_to && String(row.valid_to) < today) return false;
  return true;
}

function wixMediaToHttps(value) {
  const source = clean(value, 3000);
  if (/^https:\/\//i.test(source)) return source;
  const match = source.match(/^wix:image:\/\/v1\/([^/]+)/i);
  return match ? `https://static.wixstatic.com/media/${match[1]}` : "";
}

function mediaList(row = {}) {
  return arr(row.media).filter(x => x && typeof x === "object");
}

function mediaRole(media = {}) {
  return upper(
    media.role ||
    (media.is_hero || media.isHero ? "HERO" : "") ||
    (media.is_card || media.isCard ? "CARD" : "") ||
    (media.is_primary || media.isPrimary ? "PRIMARY" : ""),
    30
  );
}

function imageFor(row = {}) {
  const media = mediaList(row).filter(x => wixMediaToHttps(x.url));
  for (const role of ["CARD", "HERO", "PRIMARY", "GALLERY"]) {
    const hit = media.find(x => mediaRole(x) === role);
    if (hit) return wixMediaToHttps(hit.url);
  }
  const details = obj(row.details);
  return wixMediaToHttps(details.cardImageUrl || details.heroImageUrl || details.imageUrl || "");
}

function localizedFor(row = {}, language = "EN") {
  const code = upper(language || "EN", 12);
  const list = arr(row.localized);
  const hit =
    list.find(x => upper(x.language, 12) === code) ||
    list.find(x => upper(x.language, 12) === "EN") ||
    list[0] ||
    {};
  return {
    title: clean(hit.title || row.name, 240),
    summary: clean(
      hit.short_description ||
      hit.shortDescription ||
      hit.full_description ||
      hit.fullDescription ||
      obj(row.details).shortDescription ||
      obj(row.details).summary ||
      obj(row.seo).description ||
      "",
      1200
    )
  };
}

function catalogFor(row = {}, catalogRows = []) {
  return catalogRows
    .filter(activeCatalog)
    .filter(c => {
      if (c.target_entity_id && row.id) return String(c.target_entity_id) === String(row.id);
      return upper(c.target_record_type, 40) === upper(row.entity_type, 40) &&
        String(c.target_record_id || "") === String(row.id || row.ID || "");
    })
    .sort((a, b) => Number(a.search_priority || 100) - Number(b.search_priority || 100))[0] || null;
}

function tierFor(row = {}, catalog = null) {
  const details = obj(row.details);
  const candidates = [
    details.skandiTier,
    details.collectionTier,
    details.collection_tier,
    details.tier,
    catalog?.partner_tier,
    catalog?.badge,
    catalog?.public_label
  ];
  for (const candidate of candidates) {
    const tier = normalizeTier(candidate);
    if (tier) return tier;
  }
  return "";
}

function typeFor(entityType) {
  switch (upper(entityType, 40)) {
    case "DESTINATION": return { type: "destinations", label: "Destination" };
    case "HOTEL": return { type: "hotels", label: "Hotel" };
    case "GUIDED_TOUR": return { type: "tours", label: "Guided tour" };
    case "ACTIVITY": return { type: "tours", label: "Activity" };
    case "AIRLINE": return { type: "airlines", label: "Airline" };
    case "AIRPORT": return { type: "airports", label: "Airport" };
    case "PACKAGE": return { type: "packages", label: "Package" };
    case "TRANSFER": return { type: "transfers", label: "Transfer" };
    case "CAR_RENTAL": return { type: "car-rental", label: "Car rental" };
    default: return { type: "other", label: clean(entityType, 80) || "Selected" };
  }
}

function publicPath(row = {}) {
  const details = obj(row.details);
  if (/^\//.test(clean(details.publicPath, 1000))) return clean(details.publicPath, 1000);
  if (/^\//.test(clean(details.path, 1000))) return clean(details.path, 1000);

  const slug = clean(row.slug, 180);
  if (!slug) return "";

  switch (upper(row.entity_type, 40)) {
    case "HOTEL": return `/hotels/${slug}`;
    case "DESTINATION": return `/destinations/${slug}`;
    case "GUIDED_TOUR":
    case "ACTIVITY": return `/tours/${slug}`;
    case "AIRLINE": return `/travel-info/airlines/${slug}`;
    case "AIRPORT": return `/travel-info/airports/${slug}`;
    default: return "";
  }
}

function publicItem(row = {}, catalog = null, language = "EN") {
  const details = obj(row.details);
  const text = localizedFor(row, language);
  const tier = tierFor(row, catalog);
  const catalogType = upper(catalog?.catalog_type, 40) ||
    (tier ? "SKANDI_COLLECTION" : "NONE");
  const type = typeFor(row.entity_type);

  return {
    id: clean(row.id || row.ID, 120),
    publicId: clean(row.public_id || row.publicId || row["Record ID"], 180),
    entityType: upper(row.entity_type, 40),
    type: type.type,
    typeLabel: type.label,
    code: clean(row.code, 80),
    title: text.title,
    summary: text.summary || "Selected by SKANDI.",
    slug: clean(row.slug, 180),
    path: publicPath(row),
    imageUrl: imageFor(row),
    tier,
    catalogType,
    collectionLabel: catalogType === "SKANDI_PARTNER" ? "SKANDI Partner" : "SKANDI Collection",
    partnerTier: clean(catalog?.partner_tier, 100),
    badge: clean(catalog?.badge, 100),
    publicLabel: clean(catalog?.public_label, 160),
    featured: catalog?.featured === true || row.featured === true,
    homepageFeatured: catalog?.homepage_featured === true || row.homepage_featured === true,
    searchable: catalog?.searchable === true,
    searchPriority: Number(catalog?.search_priority ?? 100),
    city: clean(details.city || details.locationCity || details.destinationName, 200),
    country: clean(details.countryName || details.country, 200),
    destination: clean(details.destinationName || details.city, 200),
    iata: clean(details.iata || details.searchAirportIata || row.code, 12),
    sourceTable: clean(row.source_table, 100)
  };
}

function tierSummary(items = []) {
  const output = {};
  for (const tier of TIERS) {
    const list = items.filter(item => item.tier === tier);
    output[tier] = {
      tier,
      count: list.length,
      types: [...new Set(list.map(x => x.type))],
      imageUrl: list.find(x => x.imageUrl)?.imageUrl || "",
      examples: list.slice(0, 4).map(x => ({ id: x.id, title: x.title, type: x.type, path: x.path }))
    };
  }
  return output;
}

async function inventoryPayload(language = "EN") {
  const lang = upper(language || "EN", 12) || "EN";
  if (cache.payload && cache.language === lang && Date.now() - cache.at < CACHE_MS) {
    return cache.payload;
  }

  const [rows, catalogRows] = await Promise.all([
    select("inventory_canonical_entities_v", {
      select: "id,public_id,entity_type,code,name,slug,status,active,customer_visible,featured,homepage_featured,sort_priority,parent_entity_id,details,seo,localized,media,source_table",
      status: "eq.PUBLISHED",
      active: "eq.true",
      customer_visible: "eq.true",
      order: "sort_priority.asc,name.asc",
      limit: 4000
    }),
    select("inventory_catalog_entries", {
      select: "id,target_entity_id,target_record_type,target_record_id,target_code,catalog_type,partner_tier,searchable,featured,homepage_featured,search_priority,search_keywords,market_codes,sales_channels,public_label,badge,valid_from,valid_to,active",
      active: "eq.true",
      order: "search_priority.asc,created_at.asc",
      limit: 4000
    }).catch(() => [])
  ]);

  const publicRows = rows.filter(row =>
    PUBLIC_ENTITY_TYPES.has(upper(row.entity_type, 40)) &&
    row.active !== false &&
    row.customer_visible === true &&
    upper(row.status, 30) === "PUBLISHED"
  );

  const mapped = publicRows.map(row => {
    const catalog = catalogFor(row, catalogRows);
    return publicItem(row, catalog, lang);
  });

  // Tiering in Inventory Control is authoritative for Select / Signature / Excelsior.
  // An explicit SKANDI_COLLECTION catalog record is also included even if no tier is set yet.
  const collection = mapped.filter(item =>
    TIERS.includes(item.tier) || item.catalogType === "SKANDI_COLLECTION"
  );

  const partners = mapped.filter(item => item.catalogType === "SKANDI_PARTNER");

  const sortItems = list => [...list].sort((a, b) =>
    Number(b.homepageFeatured) - Number(a.homepageFeatured) ||
    Number(b.featured) - Number(a.featured) ||
    a.searchPriority - b.searchPriority ||
    a.title.localeCompare(b.title)
  );

  const collectionItems = sortItems(collection);
  const partnerItems = sortItems(partners);
  const allItems = sortItems([...collectionItems, ...partnerItems].filter(
    (item, index, list) => list.findIndex(x => x.id === item.id && x.catalogType === item.catalogType) === index
  ));

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "inventory_canonical_entities_v",
    catalogSource: "inventory_catalog_entries",
    tierField: "details.skandiTier",
    tierOrder: TIERS,
    items: allItems,
    collectionItems,
    partners: partnerItems,
    tiers: tierSummary(collectionItems),
    counts: {
      total: allItems.length,
      collection: collectionItems.length,
      partners: partnerItems.length,
      select: collectionItems.filter(x => x.tier === "SELECT").length,
      signature: collectionItems.filter(x => x.tier === "SIGNATURE").length,
      excelsior: collectionItems.filter(x => x.tier === "EXCELSIOR").length
    }
  };

  cache = { at: Date.now(), language: lang, payload };
  return payload;
}

async function aboutPayload(input = {}) {
  const inventory = await inventoryPayload(input.language || input.locale || "EN");
  const selectedFocus = [...inventory.partners, ...inventory.collectionItems]
    .filter((item, index, list) => list.findIndex(x => x.id === item.id) === index)
    .sort((a, b) =>
      Number(b.homepageFeatured) - Number(a.homepageFeatured) ||
      Number(b.featured) - Number(a.featured) ||
      a.searchPriority - b.searchPriority
    )
    .slice(0, 12);

  return {
    settings: {},
    facts: [],
    timeline: [],
    partners: selectedFocus,
    collection: {
      items: inventory.collectionItems,
      tiers: inventory.tiers,
      counts: inventory.counts,
      tierOrder: inventory.tierOrder,
      generatedAt: inventory.generatedAt
    },
    source: inventory.source,
    // Legacy response keys retained for any older consumer still calling getAboutPagePayload().
    company: {
      name: "SKANDI TRAVELS",
      description: "Curated travel from live SKANDI Inventory Control."
    },
    featuredProducts: inventory.collectionItems.slice(0, 12),
    stories: []
  };
}

export const getSkandiAboutPagePayload = webMethod(Permissions.Anyone, async (input = {}) => {
  return aboutPayload(input);
});

// Backward-compatible export for any older About controller.
export const getAboutPagePayload = webMethod(Permissions.Anyone, async (input = {}) => {
  return aboutPayload(input);
});

export const getSignatureCollectionPayload = webMethod(Permissions.Anyone, async (input = {}) => {
  const inventory = await inventoryPayload(input.language || input.locale || "EN");
  return {
    settings: {},
    items: inventory.items,
    collectionItems: inventory.collectionItems,
    partners: inventory.partners,
    tiers: inventory.tiers,
    counts: inventory.counts,
    tierOrder: inventory.tierOrder,
    generatedAt: inventory.generatedAt,
    source: inventory.source,
    catalogSource: inventory.catalogSource,
    // Legacy keys retained so an older page controller does not crash during rollout.
    products: inventory.collectionItems,
    allProducts: inventory.items
  };
});

export const searchSignatureCollectionPackages = webMethod(Permissions.Anyone, async (input = {}) => {
  // This method now searches Inventory Control editorial records only.
  // Live flight/hotel pricing belongs to bookingOrchestratorCollection.web.js.
  const inventory = await inventoryPayload(input.language || input.locale || "EN");
  const query = clean(input.query || input.search, 200).toLowerCase();
  const items = !query
    ? inventory.items
    : inventory.items.filter(item =>
        `${item.title} ${item.code} ${item.city} ${item.country} ${item.tier} ${item.typeLabel}`
          .toLowerCase()
          .includes(query)
      );
  return { ok: true, query, items: items.slice(0, 100), source: inventory.source };
});
