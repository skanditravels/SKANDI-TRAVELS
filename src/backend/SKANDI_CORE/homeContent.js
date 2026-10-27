// /src/backend/SKANDI_CORE/homeContent.js
// SKANDI V12 — canonical Home content and card-price orchestration.
// Public Home content is projected from the same canonical public Inventory view used by Destination Flow.
// Provider access reuses customerBooking; no provider HTTP, secrets or booking mutation here.

import { restRequest, storageGetPublicUrl } from "backend/SKANDI_CORE/supabaseServer";
import { searchLiveFlightOffersCore, searchLiveStaysCore } from "backend/SKANDI_CORE/customerBooking";
import { ensureEditorialContext } from "backend/SKANDI_CORE/publicContent";
import { listAssetsCore, registerAssetUsageCore, deactivateAssetUsageCore } from "backend/SKANDI_CORE/assets";

const PUBLIC_VIEW = "inventory_public_entities_v";
const CACHE_TTL_MS = 60_000;
const MAX_ROWS = 5000;
const HOME_PRICE_CACHE_KEY = "HOME_CARD_V1";
const HOME_PRICE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const HOME_PRICE_MAX_PRODUCTS = 200;
const HOME_PRICE_MAX_WORKERS = 2;
const HOME_PRICE_TYPES = new Set(["flight_only", "charter_package"]);
const HOME_PRICE_CABINS = new Set(["economy", "premium_economy", "business", "first"]);

let cache = null;
let cacheExpiresAt = 0;
let inFlight = null;

function clean(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function coordinate(value, min, max) {
  if (value === null || value === undefined || clean(value) === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}
function upper(value, max = 80) { return clean(value, max).toUpperCase(); }
function lower(value, max = 80) { return clean(value, max).toLowerCase(); }
function slugify(value) {
  return clean(value, 240).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function publicRecord(row = {}) {
  return {
    id: clean(row.id, 120),
    publicId: clean(row.public_id, 160),
    entityType: upper(row.entity_type, 60),
    code: clean(row.code, 80),
    name: clean(row.name, 500),
    slug: clean(row.slug, 240),
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: num(row.sort_priority),
    parentEntityId: clean(row.parent_entity_id, 120),
    details: obj(row.details),
    commercial: obj(row.commercial),
    seo: obj(row.seo),
    localized: arr(row.localized),
    media: arr(row.media),
    relations: arr(row.relations),
    updatedAt: row.updated_at || null
  };
}

async function readCatalog() {
  const rows = await restRequest({
    table: PUBLIC_VIEW,
    query: {
      select: "id,public_id,entity_type,code,name,slug,featured,homepage_featured,sort_priority,parent_entity_id,details,commercial,seo,localized,media,relations,updated_at",
      order: "sort_priority.asc,name.asc",
      limit: MAX_ROWS
    }
  });
  return arr(rows).map(publicRecord);
}

async function catalog(force = false) {
  if (!force && cache && Date.now() < cacheExpiresAt) return cache;
  if (!inFlight) {
    inFlight = readCatalog().then(records => {
      cache = records;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return records;
    }).finally(() => { inFlight = null; });
  }
  return inFlight;
}

function localized(record, language = "EN") {
  const rows = arr(record?.localized);
  const key = upper(language, 12) || "EN";
  return rows.find(row => upper(row?.language, 12) === key)
    || rows.find(row => upper(row?.language, 12) === "EN")
    || rows[0]
    || {};
}

function mediaUrl(record) {
  const rows = arr(record?.media).slice().sort((a, b) => num(a?.sortOrder ?? a?.sort_order) - num(b?.sortOrder ?? b?.sort_order));
  for (const raw of rows) {
    if (typeof raw === "string" && clean(raw, 1800)) return clean(raw, 1800);
    const row = obj(raw);
    const value = clean(row.url || row.publicUrl || row.public_url || row.assetUrl || row.asset_url || row.src, 1800);
    if (value) return value;
  }
  return "";
}

function relationTarget(records, record, relationTypes = [], targetTypes = []) {
  const relSet = new Set(relationTypes.map(v => upper(v, 80)));
  const targetSet = new Set(targetTypes.map(v => upper(v, 80)));
  for (const relation of arr(record?.relations)) {
    const rel = upper(relation?.relationType || relation?.relation_type || relation?.type, 80);
    const targetType = upper(relation?.targetEntityType || relation?.target_entity_type || relation?.targetType, 80);
    if (relSet.size && !relSet.has(rel)) continue;
    if (targetSet.size && !targetSet.has(targetType)) continue;
    const targetId = clean(relation?.targetEntityId || relation?.target_entity_id || relation?.targetId, 120);
    const targetSlug = slugify(relation?.targetSlug || relation?.target_slug || relation?.targetName);
    const found = records.find(row => (targetId && row.id === targetId)
      || (targetSlug && slugify(row.slug || row.name || row.code) === targetSlug));
    if (found) return found;
  }
  return null;
}

function parentOf(records, record) {
  if (!record) return null;
  if (record.parentEntityId) {
    const direct = records.find(row => row.id === record.parentEntityId);
    if (direct) return direct;
  }
  return relationTarget(records, record, ["PARENT"], []);
}

function airportFor(records, record, visited = new Set()) {
  if (!record) return null;
  if (visited.has(record.id)) return null;
  visited.add(record.id);
  if (record.entityType === "AIRPORT") return record;
  const details = obj(record.details);
  const direct = records.find(row => row.entityType === "AIRPORT" && row.id === details.nearestAirportId);
  if (direct) return direct;
  const iata = upper(details.searchAirportIata || details.destinationIata || details.nearestAirportIata || details.arrivalAirportIata || details.iata, 3);
  if (iata) {
    const byCode = records.find(row => row.entityType === "AIRPORT" && upper(obj(row.details).iata || row.code, 3) === iata);
    if (byCode) return byCode;
  }
  const relation = relationTarget(records, record, ["NEAREST_AIRPORT", "ARRIVAL_AIRPORT", "AIRPORT"], ["AIRPORT"]);
  if (relation) return relation;
  const parent = parentOf(records, record);
  return parent && parent.id !== record.id ? airportFor(records, parent, visited) : null;
}

function customerPath(record) {
  const details = obj(record.details);
  const commercial = obj(record.commercial);
  const explicit = clean(details.customerPath || details.customer_path || details.url || commercial.customerPath || commercial.customer_path, 1200);
  if (/^\/(?!\/)/.test(explicit) && !/[\\\u0000-\u0020]/.test(explicit)) return explicit;
  const slug = slugify(record.slug || record.name || record.code);
  if (record.entityType === "HOTEL") return `/hotel-detail?hotel=${encodeURIComponent(slug || record.id)}`;
  if (["COUNTRY", "DESTINATION", "AREA"].includes(record.entityType)) return `/destinations?${record.entityType.toLowerCase()}=${encodeURIComponent(slug)}`;
  return "/destinations";
}

function card(records, record, language = "EN") {
  const loc = localized(record, language);
  const details = obj(record.details);
  const commercial = obj(record.commercial);
  const airport = airportFor(records, record);
  const airportDetails = obj(airport?.details);
  const latitude = coordinate(details.latitude ?? details.lat, -90, 90);
  const longitude = coordinate(details.longitude ?? details.lng ?? details.lon, -180, 180);
  const price = num(commercial.fromPrice ?? commercial.from_price ?? details.fromPrice ?? details.from_price, 0);
  const currency = upper(commercial.currency || details.currency, 3);
  return {
    id: record.id,
    publicId: record.publicId,
    entityType: record.entityType,
    code: record.code,
    slug: record.slug || slugify(record.name),
    name: record.name,
    title: clean(loc.title || loc.pageTitle || loc.page_title || record.name, 500),
    eyebrow: clean(loc.eyebrow, 300),
    description: clean(loc.shortDescription || loc.short_description || loc.description || details.shortDescription || details.short_description, 1500),
    image: mediaUrl(record),
    href: customerPath(record),
    fromPrice: price > 0 ? price : null,
    currency: currency || "",
    badges: arr(details.tags || commercial.tags).map(value => clean(value, 80)).filter(Boolean).slice(0, 8),
    duffelAccommodationId: clean(details.providerAccommodationId || details.duffelAccommodationId || details.duffel_accommodation_id || commercial.duffelAccommodationId, 180),
    priceLookup: {
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      iata: upper(airportDetails.iata || airport?.code || details.searchAirportIata, 3),
      destination: record.code || record.slug || record.name,
      label: record.name
    }
  };
}

function safeProductId(value) {
  const id = clean(value, 160);
  return /^[A-Za-z0-9_-]{1,160}$/.test(id) ? id : "";
}

function inFilter(values) {
  const ids = [...new Set(arr(values).map(safeProductId).filter(Boolean))];
  return ids.length ? `in.(${ids.join(",")})` : "";
}

function homePriceConfiguration(product = {}) {
  const productId = safeProductId(product.product_id);
  const productType = lower(product.product_type, 60);
  const payload = obj(product.payload);
  const raw = obj(payload.homePrice);
  if (!productId || !HOME_PRICE_TYPES.has(productType)) return null;

  const origin = upper(raw.origin, 3);
  const destination = upper(raw.destination, 3);
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) return null;

  const integer = (value, fallback, min, max) => {
    const n = value === undefined || value === null || value === "" ? fallback : Number(value);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };
  const departureDaysOut = integer(raw.departureDaysOut, 60, 1, 330);
  const returnDaysOut = raw.returnDaysOut === undefined || raw.returnDaysOut === null || raw.returnDaysOut === ""
    ? null : integer(raw.returnDaysOut, null, 2, 365);
  const adults = integer(raw.adults, 1, 1, 9);
  const maxConnections = integer(raw.maxConnections, 1, 0, 2);
  const passengers = adults === null ? [] : Array.from({ length:adults }, () => ({ type:"adult" }));
  const rawChildAges = arr(raw.childAges);
  if (rawChildAges.some(age => age === null || age === undefined || clean(age, 8) === "")) return null;
  const childAges = rawChildAges.map(Number);
  if (childAges.some(age => !Number.isInteger(age) || age < 0 || age > 17)) return null;
  passengers.push(...childAges.map(age => ({ age })));
  const packageAddOns = arr(raw.packageAddOns).slice(0, 20).map(item => ({
    name:clean(item?.name, 120),
    retailAmount:Number(item?.retailAmount),
    quantity:Number(item?.quantity ?? 1)
  }));
  if (packageAddOns.some(item => !item.name || !Number.isFinite(item.retailAmount) || item.retailAmount < 0
      || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) return null;

  const cabinClass = lower(raw.cabinClass || "economy", 40);
  const currency = upper(product.currency || "USD", 3);
  const basePrice = Number(product.base_price ?? 0);
  const marginPct = Number(product.margin_pct ?? 0);
  const supplierTimeout = integer(raw.supplierTimeout, 15000, 2000, 20000);
  if (departureDaysOut === null || (returnDaysOut !== null && (returnDaysOut < departureDaysOut || returnDaysOut === departureDaysOut))
      || adults === null || maxConnections === null || supplierTimeout === null
      || passengers.length > 9 || !HOME_PRICE_CABINS.has(cabinClass)
      || !/^[A-Z]{3}$/.test(currency) || !Number.isFinite(basePrice) || basePrice < 0
      || !Number.isFinite(marginPct) || marginPct < 0 || marginPct > 1000) return null;

  return {
    product,
    productId,
    productType,
    origin,
    destination,
    departureDaysOut,
    returnDaysOut,
    adults,
    childAges,
    packageAddOns,
    passengers,
    cabinClass,
    maxConnections,
    supplierTimeout,
    currency,
    basePrice:roundMoney(basePrice),
    marginPct
  };
}

function homePriceProduct(product = {}) {
  const status = lower(product.status, 40);
  if (product.customer_visible !== true || !["published", "active"].includes(status)) return null;
  return homePriceConfiguration(product);
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function targetDate(daysOut) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysOut);
  return date.toISOString().slice(0, 10);
}

async function readHomeCardProducts(productIds) {
  const filter = inFilter(productIds);
  if (!filter) return [];
  const rows = await restRequest({
    table:"travel_products",
    query:{
      select:"product_id,product_type,title,base_price,margin_pct,currency,customer_visible,status,payload,updated_at",
      product_id:filter,
      limit:HOME_PRICE_MAX_PRODUCTS
    }
  });
  return arr(rows);
}

async function readHomePriceProducts(productIds) {
  return (await readHomeCardProducts(productIds)).map(homePriceProduct).filter(Boolean);
}

async function readHomePriceCache(productIds) {
  const filter = inFilter(productIds);
  if (!filter) return new Map();
  const rows = await restRequest({
    table:"travel_product_price_cache",
    query:{
      select:"product_id,cache_key,base_price,live_price,margin_amount,margin_pct,currency,availability,supplier_snapshot,checked_at,expires_at",
      product_id:filter,
      cache_key:`eq.${HOME_PRICE_CACHE_KEY}`,
      limit:HOME_PRICE_MAX_PRODUCTS
    }
  });
  return new Map(arr(rows).map(row => [safeProductId(row.product_id), row]).filter(([id]) => id));
}

function homePriceSettings(config) {
  return {
    productType:config.productType,
    origin:config.origin,
    destination:config.destination,
    departureDaysOut:config.departureDaysOut,
    returnDaysOut:config.returnDaysOut,
    adults:config.adults,
    childAges:config.childAges,
    packageAddOns:config.packageAddOns,
    cabinClass:config.cabinClass,
    maxConnections:config.maxConnections,
    currency:config.currency,
    basePrice:config.basePrice,
    marginPct:config.marginPct
  };
}

function priceTotal(cache, product) {
  const availability = lower(cache?.availability, 40);
  const expiresAt = Date.parse(cache?.expires_at || "");
  const basePrice = Number(cache?.base_price);
  const livePrice = Number(cache?.live_price);
  const marginAmount = Number(cache?.margin_amount ?? 0);
  const cachedMarginPct = Number(cache?.margin_pct ?? 0);
  const currency = upper(cache?.currency || product.currency, 3);
  const snapshot = obj(cache?.supplier_snapshot);
  const cachedSettings = obj(snapshot.homePriceSettings);
  const currentSettings = homePriceSettings(product);
  if (availability !== "available" || !Number.isFinite(expiresAt) || expiresAt <= Date.now()
      || !Number.isFinite(basePrice) || basePrice < 0 || !Number.isFinite(livePrice) || livePrice <= 0
      || !Number.isFinite(marginAmount) || marginAmount < 0 || currency !== product.currency
      || cachedMarginPct !== product.marginPct || JSON.stringify(cachedSettings) !== JSON.stringify(currentSettings)) return null;
  return { total:roundMoney(basePrice + livePrice + marginAmount), basePrice, livePrice, marginAmount, currency };
}

function enrichHomeCard(record, product, cache) {
  const snapshot = obj(cache?.supplier_snapshot);
  const prices = priceTotal(cache, product);
  const unavailable = {
    ...record,
    homePriceConfigured:true,
    homePriceProductType:product.productType,
    fromPrice:null,
    currency:product.currency,
    livePriceFound:false,
    livePriceStatus:cache ? (upper(cache.availability, 40) || "UNAVAILABLE") : "PENDING",
    livePriceType:"DUFFEL_FLIGHT_BASELINE",
    priceExpiresAt:cache?.expires_at || null
  };
  if (!prices) return unavailable;
  return {
    ...unavailable,
    fromPrice:prices.total,
    currency:prices.currency,
    livePriceFound:true,
    livePriceStatus:"AVAILABLE",
    livePriceType:"DUFFEL_FLIGHT_BASELINE",
    flightPrice:prices.livePrice,
    packageBasePrice:prices.basePrice,
    marginAmount:prices.marginAmount,
    pricePeriod:obj(snapshot.pricePeriod),
    priceCheckedAt:cache.checked_at || null,
    priceExpiresAt:cache.expires_at || null
  };
}

async function applyCachedHomePrices(content) {
  const cards = [...arr(content.destinations), ...arr(content.hotels), ...arr(content.offers), ...arr(content.inspiration)];
  const productIds = [...new Set(cards.map(row => safeProductId(row.publicId)).filter(Boolean))];
  if (!productIds.length) return content;
  try {
    const products = await readHomeCardProducts(productIds);
    if (!products.length) return content;
    const enabledProducts = products.map(homePriceProduct).filter(Boolean);
    const cacheById = enabledProducts.length ? await readHomePriceCache(enabledProducts.map(row => row.productId)) : new Map();
    const productsById = new Map(products.map(row => [safeProductId(row.product_id), row]));
    const configsById = new Map(enabledProducts.map(row => [row.productId, row]));
    const imageByAssetId = await readPublicHomeCardImages(products);
    const enrich = rows => arr(rows).map(row => {
      const productId = safeProductId(row.publicId);
      const productRow = productsById.get(productId);
      const config = configsById.get(productId);
      let output = row;
      if (productRow?.customer_visible === true && ["published", "active"].includes(lower(productRow.status, 40))) {
        const homeCard = obj(obj(productRow.payload).homeCard);
        const image = imageByAssetId.get(safeProductId(homeCard.imageAssetId));
        if (image) output = { ...output, image:image.url, imageAlt:clean(homeCard.imageAlt || image.altText, 500), homeCardImageAssetId:image.id };
      }
      return config ? enrichHomeCard(output, config, cacheById.get(productId)) : output;
    });
    return {
      ...content,
      destinations:enrich(content.destinations),
      hotels:enrich(content.hotels),
      offers:enrich(content.offers),
      inspiration:enrich(content.inspiration)
    };
  } catch (error) {
    console.error("[Home] Could not read the flight price cache.", error?.message || error);
    return content;
  }
}

async function readPublicHomeCardImages(products) {
  const assetIds = [...new Set(arr(products).filter(row => row.customer_visible === true)
    .map(row => safeProductId(obj(obj(row.payload).homeCard).imageAssetId)).filter(Boolean))];
  const filter = inFilter(assetIds);
  if (!filter) return new Map();
  const rows = await restRequest({
    table:"platform_assets",
    query:{
      select:"id,bucket,storage_path,public_url,alt_text,status,visibility,asset_type",
      id:filter,
      bucket:"eq.skandi-public-assets",
      status:"eq.ACTIVE",
      visibility:"eq.PUBLIC",
      asset_type:"eq.IMAGE",
      limit:100
    }
  });
  const images = await Promise.all(arr(rows).map(async row => {
    const url = clean(row.public_url, 1800) || clean((await storageGetPublicUrl({ bucket:row.bucket, path:row.storage_path }))?.publicUrl, 1800);
    return url ? [safeProductId(row.id), { id:safeProductId(row.id), url, altText:clean(row.alt_text, 500) }] : null;
  }));
  return new Map(images.filter(Boolean));
}

function quoteDatePeriod(config, departureDate, returnDate) {
  return {
    origin:config.origin,
    destination:config.destination,
    departureDate,
    returnDate,
    adults:config.adults,
    childAges:config.childAges,
    cabinClass:config.cabinClass
  };
}

async function packageBasePrice(config) {
  if (config.productType !== "charter_package") return 0;
  const rows = await restRequest({
    table:"travel_product_components",
    query:{
      select:"component_type,quantity,retail_amount",
      product_id:`eq.${config.productId}`,
      limit:100
    }
  });
  const componentTotal = arr(rows).reduce((total, row) => {
    // Flight components are priced separately through Duffel and must not be counted twice.
    if (/^(FLIGHT|AIR|AIRFARE|AIR_TRAVEL)(_|$)/.test(upper(row.component_type, 80))) return total;
    const amount = Number(row.retail_amount ?? 0);
    const quantity = Number(row.quantity ?? 1);
    if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(quantity) || quantity < 0) return total;
    return total + amount * quantity;
  }, 0);
  const configuredAddOns = config.packageAddOns.reduce((sum, item) => sum + item.retailAmount * item.quantity, 0);
  return roundMoney(config.basePrice + componentTotal + configuredAddOns);
}

async function writeHomePriceCache(config, data) {
  const body = {
    product_id:config.productId,
    cache_key:HOME_PRICE_CACHE_KEY,
    base_price:data.basePrice ?? config.basePrice,
    live_price:data.livePrice ?? null,
    margin_amount:data.marginAmount ?? 0,
    margin_pct:config.marginPct,
    currency:config.currency,
    availability:data.availability,
    supplier_snapshot:data.supplierSnapshot || {},
    checked_at:data.checkedAt || new Date().toISOString(),
    expires_at:data.expiresAt || new Date().toISOString()
  };
  await restRequest({
    table:"travel_product_price_cache",
    method:"POST",
    query:{ on_conflict:"product_id,cache_key" },
    body,
    prefer:"resolution=merge-duplicates,return=representation"
  });
}

async function refreshHomePriceProduct(config) {
  const checkedAt = new Date();
  const checkedIso = checkedAt.toISOString();
  const departureDate = targetDate(config.departureDaysOut);
  const returnDate = config.returnDaysOut === null ? null : targetDate(config.returnDaysOut);
  const pricePeriod = quoteDatePeriod(config, departureDate, returnDate);
  let basePrice = config.basePrice;
  try {
    basePrice = await packageBasePrice(config);
    const result = await searchLiveFlightOffersCore({
      origin:config.origin,
      destination:config.destination,
      departureDate,
      returnDate,
      passengers:config.passengers,
      cabinClass:config.cabinClass,
      maxConnections:config.maxConnections,
      supplierTimeout:config.supplierTimeout
    });
    const match = arr(result?.items).filter(offer => {
      const amount = Number(offer?.totalAmount);
      return Number.isFinite(amount) && amount > 0 && upper(offer?.totalCurrency, 3) === config.currency
        && (!offer.expiresAt || (Number.isFinite(Date.parse(offer.expiresAt)) && Date.parse(offer.expiresAt) > Date.now()));
    }).sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount))[0];
    if (!match) {
      await writeHomePriceCache(config, {
        basePrice,
        availability:"unavailable",
        supplierSnapshot:{ provider:"Duffel", reason:"NO_CURRENCY_MATCHING_OFFER", pricePeriod, homePriceSettings:homePriceSettings(config) }
      });
      return { productId:config.productId, status:"unavailable" };
    }

    const livePrice = roundMoney(match.totalAmount);
    const marginAmount = roundMoney((basePrice + livePrice) * config.marginPct / 100);
    const expiresAt = new Date(checkedAt.getTime() + HOME_PRICE_CACHE_TTL_MS).toISOString();
    await writeHomePriceCache(config, {
      basePrice,
      livePrice,
      marginAmount,
      availability:"available",
      checkedAt:checkedIso,
      expiresAt,
      supplierSnapshot:{
        provider:"Duffel",
        offerRequestId:clean(result?.offerRequestId, 200),
        offerId:clean(match.id, 200),
        supplierOfferExpiresAt:match.expiresAt || null,
        productType:config.productType,
        pricePeriod,
        homePriceSettings:homePriceSettings(config),
        displayedTotal:roundMoney(basePrice + livePrice + marginAmount)
      }
    });
    return { productId:config.productId, status:"available" };
  } catch (error) {
    try {
      await writeHomePriceCache(config, {
        basePrice,
        availability:"error",
        supplierSnapshot:{ provider:"Duffel", reason:clean(error?.code || error?.message || "PRICE_REFRESH_FAILED", 180), pricePeriod, homePriceSettings:homePriceSettings(config) }
      });
    } catch (cacheError) {
      console.error(`[Home] Could not write failed price refresh for ${config.productId}.`, cacheError?.message || cacheError);
    }
    console.error(`[Home] Flight card price refresh failed for ${config.productId}.`, error?.message || error);
    return { productId:config.productId, status:"error" };
  }
}

function airportDto(record) {
  const details = obj(record.details);
  const iata = upper(details.iata || record.code, 3);
  return {
    id: record.id,
    type: "AIRPORT",
    iata,
    icao: upper(details.icao, 4),
    code: iata,
    title: clean(record.name, 500),
    name: clean(record.name, 500),
    city: clean(details.city || details.locationCity || details.location_city, 300),
    country: clean(details.country || details.countryCode || details.country_code, 200),
    label: [clean(details.city, 200), clean(record.name, 300), iata ? `(${iata})` : ""].filter(Boolean).join(" · ")
  };
}


async function readAirportFallback() {
  try {
    const rows = await restRequest({
      table: "travel_info_airports",
      query: {
        select: "*",
        order: "iata.asc",
        limit: 500
      }
    });
    return arr(rows).filter(row => row.active === true && row.customer_visible === true && row.status === "PUBLISHED").map(row => {
      const iata = upper(row.iata || row.code, 3);
      const title = clean(row.title || row.name || row.airport_name || row.airportName, 500);
      const city = clean(row.locationCity || row.location_city || row.city, 300);
      const country = clean(row.country || row.countryCode || row.country_code, 200);
      return {
        id: clean(row.ID || row.id || row._id || iata, 120),
        type: "AIRPORT",
        iata,
        icao: upper(row.icao, 4),
        code: iata,
        title,
        name: title,
        city,
        country,
        label: [city, title, iata ? `(${iata})` : ""].filter(Boolean).join(" · ")
      };
    }).filter(row => row.iata);
  } catch (error) {
    throw new Error("Home airport catalogue is unavailable.");
  }
}

function destinationSearchDto(records, record) {
  const details = obj(record.details);
  const airport = airportFor(records, record);
  const airportDetails = obj(airport?.details);
  return {
    id: record.id,
    type: record.entityType,
    code: clean(record.code, 80),
    slug: record.slug || slugify(record.name),
    title: record.name,
    name: record.name,
    destinationCode: clean(record.code || record.slug, 160),
    iata: upper(airportDetails.iata || airport?.code || details.searchAirportIata, 3),
    label: [record.name, upper(airportDetails.iata || airport?.code, 3) ? `(${upper(airportDetails.iata || airport?.code, 3)})` : ""].filter(Boolean).join(" ")
  };
}

export async function getHomeContentCore(input = {}) {
  const language = upper(input.language || "EN", 12) || "EN";
  const records = await catalog(input.force === true);
  const visible = records.filter(row => !["HIDDEN", "ARCHIVED", "SUSPENDED"].includes(upper(obj(row.details).status, 30)));
  const featured = visible.filter(row => row.homepageFeatured || row.featured).sort((a, b) => a.sortPriority - b.sortPriority || a.name.localeCompare(b.name));
  let airports = visible.filter(row => row.entityType === "AIRPORT").map(airportDto);
  if (!airports.length) airports = await readAirportFallback();
  const searchDestinations = visible.filter(row => ["DESTINATION", "AREA"].includes(row.entityType)).map(row => destinationSearchDto(visible, row));
  const destinations = featured.filter(row => ["DESTINATION", "AREA", "COUNTRY"].includes(row.entityType)).slice(0, 12).map(row => card(visible, row, language));
  const hotels = featured.filter(row => row.entityType === "HOTEL").slice(0, 10).map(row => card(visible, row, language));
  const offers = featured.filter(row => ["PACKAGE", "GUIDED_TOUR", "ACTIVITY", "TRANSFER", "CAR_RENTAL"].includes(row.entityType)).slice(0, 12).map(row => card(visible, row, language));
  const inspiration = featured.filter(row => ["DESTINATION", "AREA", "COUNTRY", "GUIDED_TOUR", "ACTIVITY"].includes(row.entityType)).slice(0, 12).map(row => card(visible, row, language));
  const content = {
    source: "SUPABASE_PUBLIC_INVENTORY",
    protocolVersion: "V12-HOME",
    airports,
    searchDestinations,
    destinations,
    hotels,
    offers,
    inspiration,
    sync: {
      ok: true,
      fetchedAt: new Date().toISOString(),
      counts: { records: visible.length, airports: airports.length, destinations: searchDestinations.length, homepageDestinations: destinations.length, hotels: hotels.length, offers: offers.length }
    }
  };
  return applyCachedHomePrices(content);
}

export async function getHomeSearchLocationsCore(input = {}) {
  const content = await getHomeContentCore(input);
  return {
    source: content.source,
    airports: content.airports,
    destinations: content.searchDestinations,
    searchDestinations: content.searchDestinations,
    sync: content.sync
  };
}

export async function getOldStyleHomeContentCore(input = {}) {
  return getHomeContentCore(input);
}

export async function refreshHomeCardPricesCore() {
  const content = await getHomeContentCore({ force:true });
  const cards = [...arr(content.destinations), ...arr(content.hotels), ...arr(content.offers), ...arr(content.inspiration)];
  const productIds = [...new Set(cards.map(row => safeProductId(row.publicId)).filter(Boolean))];
  if (!productIds.length) return { ok:true, scanned:0, available:0, unavailable:0, errors:0 };

  const products = await readHomePriceProducts(productIds);
  let cursor = 0;
  const results = [];
  async function worker() {
    while (cursor < products.length) {
      const product = products[cursor++];
      results.push(await refreshHomePriceProduct(product));
    }
  }
  await Promise.all(Array.from({ length:Math.min(HOME_PRICE_MAX_WORKERS, products.length) }, worker));
  const summary = {
    ok:results.every(row => row.status !== "error"),
    scanned:results.length,
    available:results.filter(row => row.status === "available").length,
    unavailable:results.filter(row => row.status === "unavailable").length,
    errors:results.filter(row => row.status === "error").length
  };
  console.info("[Home] Scheduled card-price refresh complete.", summary);
  return summary;
}

function uniqueFeaturedHomeCards(content) {
  const rows = [...arr(content.destinations), ...arr(content.hotels), ...arr(content.offers), ...arr(content.inspiration)];
  const seen = new Set();
  return rows.filter(row => {
    const id = safeProductId(row.publicId);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function publicManagerAsset(asset = {}) {
  return {
    id:safeProductId(asset.id),
    displayName:clean(asset.displayName || asset.originalName, 300),
    originalName:clean(asset.originalName, 300),
    bucket:clean(asset.bucket, 120),
    visibility:upper(asset.visibility, 20),
    assetType:upper(asset.assetType, 30),
    status:upper(asset.status, 30),
    publicUrl:clean(asset.publicUrl, 1800),
    altText:clean(asset.altText, 500),
    widthPx:asset.widthPx ?? null,
    heightPx:asset.heightPx ?? null
  };
}

export async function getHomeCardManagerCore() {
  await ensureEditorialContext();
  const content = await getHomeContentCore({ force:true });
  const cards = uniqueFeaturedHomeCards(content);
  const ids = cards.map(row => safeProductId(row.publicId));
  const [products, assets] = await Promise.all([
    readHomeCardProducts(ids),
    listAssetsCore({ visibility:"PUBLIC", assetType:"IMAGE" })
  ]);
  const productById = new Map(products.map(row => [safeProductId(row.product_id), row]));
  const assetRows = arr(assets?.assets).map(publicManagerAsset).filter(asset => asset.id && asset.bucket === "skandi-public-assets"
    && asset.visibility === "PUBLIC" && asset.assetType === "IMAGE" && asset.status === "ACTIVE" && asset.publicUrl);
  const assetById = new Map(assetRows.map(asset => [asset.id, asset]));
  const cacheById = await readHomePriceCache(products.map(row => safeProductId(row.product_id)));
  return {
    ok:true,
    cards:cards.map(row => {
      const productId = safeProductId(row.publicId);
      const product = productById.get(productId) || null;
      const payload = obj(product?.payload);
      const homePrice = obj(payload.homePrice);
      const homeCard = obj(payload.homeCard);
      const imageAssetId = safeProductId(homeCard.imageAssetId);
      const asset = assetById.get(imageAssetId);
      const configured = Object.keys(homePrice).length > 0;
      const validConfiguration = Boolean(product && homePriceConfiguration(product));
      const config = product ? homePriceProduct(product) : null;
      const cache = cacheById.get(productId);
      const price = config && cache ? priceTotal(cache, config) : null;
      const cacheExpired = Date.parse(cache?.expires_at || "") <= Date.now();
      const cacheStatus = !configured ? "DISABLED"
        : !validConfiguration ? "CONFIGURATION_REQUIRED"
          : product.customer_visible !== true ? "HIDDEN"
            : !["published", "active"].includes(lower(product.status, 40)) ? "DRAFT"
              : price ? "AVAILABLE" : cache && lower(cache.availability, 40) !== "available" ? upper(cache.availability, 40)
                : cacheExpired ? "EXPIRED" : "PENDING";
      return {
        publicId:productId,
        id:row.id,
        title:row.title || row.name,
        entityType:row.entityType,
        fallbackImage:row.image || "",
        productExists:Boolean(product),
        productType:lower(product?.product_type, 60) || "flight_only",
        productStatus:upper(product?.status, 40) || "DRAFT",
        customerVisible:product ? product.customer_visible === true : true,
        currency:upper(product?.currency, 3) || "USD",
        basePrice:Number(product?.base_price ?? 0),
        marginPct:Number(product?.margin_pct ?? 0),
        priceEnabled:Boolean(Object.keys(homePrice).length),
        homePrice:{
          origin:upper(homePrice.origin, 3),
          destination:upper(homePrice.destination, 3),
          departureDaysOut:homePrice.departureDaysOut ?? 60,
          returnDaysOut:homePrice.returnDaysOut ?? "",
          adults:homePrice.adults ?? 1,
          childAges:arr(homePrice.childAges),
          packageAddOns:arr(homePrice.packageAddOns),
          cabinClass:lower(homePrice.cabinClass, 40) || "economy",
          maxConnections:homePrice.maxConnections ?? 1,
          supplierTimeout:homePrice.supplierTimeout ?? 15000
        },
        imageAssetId:asset?.id || "",
        imageUrl:asset?.publicUrl || row.image || "",
        imageAlt:clean(homeCard.imageAlt || asset?.altText, 500),
        cachedPrice:price?.total ?? null,
        cacheCurrency:price?.currency || "",
        cacheStatus,
        checkedAt:cache?.checked_at || null,
        expiresAt:cache?.expires_at || null
      };
    }),
    assets:assetRows
  };
}

export async function saveHomeCardManagerCore(input = {}) {
  const context = await ensureEditorialContext();
  const publicId = safeProductId(input.publicId);
  const content = await getHomeContentCore({ force:true });
  const card = uniqueFeaturedHomeCards(content).find(row => safeProductId(row.publicId) === publicId);
  if (!publicId || !card) throw new Error("HOME_CARD_NOT_FOUND");

  const productRows = await readHomeCardProducts([publicId]);
  const existing = productRows.find(row => safeProductId(row.product_id) === publicId) || null;
  const existingPayload = obj(existing?.payload);
  const productType = lower(input.productType, 60);
  const status = upper(input.productStatus || "DRAFT", 40);
  const customerVisible = input.customerVisible === true;
  const currency = upper(input.currency || "USD", 3);
  const basePrice = Number(input.basePrice ?? 0);
  const marginPct = Number(input.marginPct ?? 0);
  if (!HOME_PRICE_TYPES.has(productType) || !["DRAFT", "REVIEW", "PUBLISHED", "ACTIVE"].includes(status)
      || !/^[A-Z]{3}$/.test(currency) || !Number.isFinite(basePrice) || basePrice < 0
      || !Number.isFinite(marginPct) || marginPct < 0 || marginPct > 1000) {
    throw new Error("HOME_CARD_PRODUCT_FIELDS_INVALID");
  }

  const imageAssetId = safeProductId(input.imageAssetId);
  let selectedAsset = null;
  if (imageAssetId) {
    const assets = arr((await listAssetsCore({ visibility:"PUBLIC", assetType:"IMAGE" }))?.assets).map(publicManagerAsset);
    selectedAsset = assets.find(asset => asset.id === imageAssetId && asset.bucket === "skandi-public-assets"
      && asset.visibility === "PUBLIC" && asset.assetType === "IMAGE" && asset.status === "ACTIVE" && asset.publicUrl) || null;
    if (!selectedAsset) throw new Error("HOME_CARD_PUBLIC_IMAGE_REQUIRED");
  }

  const payload = { ...existingPayload };
  if (input.priceEnabled === true) {
    const rawPrice = obj(input.homePrice);
    const rawAddOns = arr(rawPrice.packageAddOns).map(item => ({
      name:clean(item?.name, 120), retailAmount:clean(item?.retailAmount, 40), quantity:item?.quantity ?? 1
    }));
    if (rawAddOns.some(item => (item.name || item.retailAmount) && (!item.name || !item.retailAmount))) {
      throw new Error("HOME_CARD_PACKAGE_ADD_ON_INVALID");
    }
    const homePrice = {
      origin:upper(rawPrice.origin, 3),
      destination:upper(rawPrice.destination, 3),
      departureDaysOut:rawPrice.departureDaysOut === "" ? 60 : Number(rawPrice.departureDaysOut ?? 60),
      returnDaysOut:rawPrice.returnDaysOut === "" || rawPrice.returnDaysOut === null || rawPrice.returnDaysOut === undefined
        ? null : Number(rawPrice.returnDaysOut),
      adults:Number(rawPrice.adults ?? 1),
      childAges:arr(rawPrice.childAges).map(Number),
      packageAddOns:rawAddOns.filter(item => item.name || item.retailAmount).map(item => ({
        name:item.name, retailAmount:Number(item.retailAmount), quantity:Number(item.quantity)
      })),
      cabinClass:lower(rawPrice.cabinClass || "economy", 40),
      maxConnections:Number(rawPrice.maxConnections ?? 1),
      supplierTimeout:Number(rawPrice.supplierTimeout ?? 15000)
    };
    const candidate = {
      product_id:publicId, product_type:productType, status, customer_visible:customerVisible,
      currency, base_price:basePrice, margin_pct:marginPct,
      payload:{ ...payload, homePrice }
    };
    const validated = homePriceConfiguration(candidate);
    if (!validated) throw new Error("HOME_CARD_PRICE_CONFIGURATION_INVALID");
    payload.homePrice = homePrice;
  } else {
    delete payload.homePrice;
  }

  const previousAssetId = safeProductId(obj(existingPayload.homeCard).imageAssetId);
  const imageAlt = clean(input.imageAlt, 500) || clean(selectedAsset?.altText, 500);
  if (selectedAsset) payload.homeCard = { ...obj(existingPayload.homeCard), imageAssetId, imageAlt };
  else delete payload.homeCard;
  const profile = obj(context.session?.profile);
  payload.homeCardManager = {
    updatedAt:new Date().toISOString(),
    updatedBySkId:clean(profile.skId || profile.agentId || "", 60),
    updatedByName:clean(profile.displayName || profile.fullName || profile.name || "Media Control", 180)
  };

  if (selectedAsset && imageAssetId !== previousAssetId) {
    await registerAssetUsageCore({
      assetId:imageAssetId,
      system:"Media Control",
      recordType:"HOME_CARD",
      recordId:publicId,
      usageRole:"CARD",
      fieldName:"homeCard.imageAssetId"
    });
  }

  const body = {
    product_type:productType,
    title:clean(existing?.title || card.title || card.name, 300),
    destination:clean(existing?.destination || card.name, 300),
    base_price:basePrice,
    margin_pct:marginPct,
    currency,
    customer_visible:customerVisible,
    status,
    supplier_source:productType === "flight_only" ? "duffel" : "mixed",
    booking_flow:productType === "flight_only" ? "flightOnly" : "package",
    payload,
    updated_at:new Date().toISOString()
  };
  if (existing) {
    const query = { product_id:`eq.${publicId}` };
    if (existing.updated_at) query.updated_at = `eq.${existing.updated_at}`;
    const saved = await restRequest({ table:"travel_products", method:"PATCH", query, body, prefer:"return=representation" });
    if (!arr(saved).length) throw new Error("HOME_CARD_EDIT_CONFLICT");
  } else {
    await restRequest({
      table:"travel_products",
      method:"POST",
      query:{ on_conflict:"product_id" },
      body:{ product_id:publicId, product_type:productType, title:body.title, destination:body.destination,
        base_price:basePrice, live_price:0, margin_pct:marginPct, currency, availability_status:"available",
        supplier_source:body.supplier_source, customer_visible:customerVisible, staff_visible:true, altea_visible:true,
        booking_flow:body.booking_flow, status, payload, created_at:new Date().toISOString(), updated_at:body.updated_at },
      prefer:"resolution=merge-duplicates,return=representation"
    });
  }

  if (previousAssetId && previousAssetId !== imageAssetId) {
    await deactivateAssetUsageCore({
      assetId:previousAssetId,
      system:"Media Control",
      recordType:"HOME_CARD",
      recordId:publicId,
      usageRole:"CARD",
      fieldName:"homeCard.imageAssetId"
    });
  }
  return getHomeCardManagerCore();
}

function priceSearch(input = {}) {
  const validDate = value => {
    const raw = clean(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
    const date = new Date(raw + "T00:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === raw ? raw : "";
  };
  const plus = (date, days) => {
    const value = new Date(date + "T00:00:00Z");
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  };
  const today = new Date().toISOString().slice(0, 10);
  const requestedIn = validDate(input.checkInDate || input.departureDate);
  const checkInDate = requestedIn && requestedIn >= today ? requestedIn : plus(today, 60);
  const requestedOut = validDate(input.checkOutDate || input.returnDate);
  const checkOutDate = requestedOut > checkInDate ? requestedOut : plus(checkInDate, 7);
  const bounded = (value, fallback, min, max) => Math.max(min, Math.min(max, Math.trunc(num(value, fallback))));
  const adults = bounded(input.adults ?? 2, 2, 1, 9);
  const children = bounded(input.children ?? 0, 0, 0, 8);
  const infants = bounded(input.infants ?? 0, 0, 0, adults);
  if (adults + children + infants > 9 || arr(input.childAges).length !== children || arr(input.infantAges).length !== infants) {
    throw new Error("Invalid Home price guest counts.");
  }
  const childAges = [...arr(input.childAges), ...arr(input.infantAges)];
  if (childAges.some(age => !Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 17)) {
    throw new Error("Invalid Home price guest ages.");
  }
  return { checkInDate, checkOutDate, adults, children:childAges.length, childAges:childAges.map(Number), rooms:bounded(input.rooms ?? 1, 1, 1, adults) };
}
function noLivePrice(card, status = "UNAVAILABLE") {
  return { ...card, fromPrice:null, currency:"", livePriceFound:false, livePriceStatus:status };
}
function validStayPrice(item) {
  const amount = Number(item?.total ?? item?.cheapestRateTotalAmount);
  return Number.isFinite(amount) && amount > 0 && /^[A-Z]{3}$/.test(upper(item?.currency || item?.cheapestRateTotalCurrency, 3));
}
function nameKey(value) {
  return clean(value, 500).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

// Resolve the record on the server; callers cannot supply a fabricated card or
// hotel/provider mapping. This is a read-only live quote, never a booking action.
export async function getHomeLivePricesCore(input = {}) {
  const content = await getHomeContentCore({ language:input.language });
  const id = clean(input.recordId, 120);
  const card = [...content.destinations, ...content.hotels].find(row => row.id === id);
  if (!card) throw new Error("That Home record is not available.");
  if (card.homePriceConfigured === true) {
    const cached = card.livePriceFound === true && Date.parse(card.priceExpiresAt || "") > Date.now();
    return { card:cached ? card : noLivePrice(card, card.livePriceStatus || "PENDING") };
  }
  const search = priceSearch(obj(input.priceSearch));
  try {
    const exactId = clean(card.duffelAccommodationId, 180);
    const isHotel = card.entityType === "HOTEL";
    const result = await searchLiveStaysCore({
      ...search,
      ...(isHotel && exactId
        ? { accommodationId:exactId, fetchRates:true }
        : { location:card.priceLookup, radiusKm:isHotel ? 4 : 25, fetchRates:false })
    });
    let candidates = arr(result?.items).filter(validStayPrice);
    if (isHotel) {
      candidates = candidates.filter(row => exactId
        ? clean(row.accommodationId, 180) === exactId
        : nameKey(row.name || row.title) === nameKey(card.name));
    }
    // Never compare numeric amounts in different currencies without an FX quote.
    if (new Set(candidates.map(row => upper(row.currency || row.cheapestRateTotalCurrency, 3))).size > 1) {
      return { card:noLivePrice(card, "CURRENCY_REVIEW") };
    }
    const match = candidates.sort((a,b) => Number(a.total ?? a.cheapestRateTotalAmount) - Number(b.total ?? b.cheapestRateTotalAmount))[0];
    if (!match) return { card:noLivePrice(card, "NO_AVAILABILITY") };
    return { card:{
      ...card,
      fromPrice:Number(match.total ?? match.cheapestRateTotalAmount),
      currency:upper(match.currency || match.cheapestRateTotalCurrency, 3),
      livePriceFound:true,
      livePriceStatus:"AVAILABLE",
      livePriceType:isHotel ? "DUFFEL_EXACT_HOTEL" : "DUFFEL_DESTINATION_STAY",
      resolvedDuffelAccommodationId:clean(match.accommodationId, 180),
      liveAccommodationName:clean(match.title || match.name, 500),
      pricePeriod:{ checkInDate:search.checkInDate, checkOutDate:search.checkOutDate, adults:search.adults, children:search.children, rooms:search.rooms },
      priceCheckedAt:new Date().toISOString(),
      priceExpiresAt:match.expiresAt || null
    }};
  } catch (_) {
    return { card:noLivePrice(card) };
  }
}
