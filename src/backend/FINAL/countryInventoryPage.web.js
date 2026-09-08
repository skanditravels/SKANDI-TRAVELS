import { webMethod, Permissions } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const PUBLIC_VIEW = "inventory_public_entities_v";
const SUPPORTED_LANGUAGES = new Set([
  "EN", "SV", "NO", "DA", "ES", "FI", "DE", "FR-FR", "FR-CA", "TH"
]);
const SUPPORTED_CURRENCIES = new Set(["USD", "SEK", "NOK", "DKK", "EUR"]);
const elevatedGetSecretValue = elevate(secrets.getSecretValue);

let configurationPromise = null;
let directoryCache = null;
let directoryCacheAt = 0;
const DIRECTORY_TTL_MS = 5 * 60 * 1000;

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function slugify(value) {
  return clean(value, 180)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstText(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const joined = value.map((item) => clean(item, 1000)).filter(Boolean).join(" · ");
      if (joined) return joined;
      continue;
    }
    const text = clean(value, 5000);
    if (text) return text;
  }
  return "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function languageCode(value) {
  const raw = clean(value, 20).toUpperCase();
  return SUPPORTED_LANGUAGES.has(raw) ? raw : "EN";
}

function currencyCode(value) {
  const raw = clean(value, 10).toUpperCase();
  return SUPPORTED_CURRENCIES.has(raw) ? raw : "USD";
}

function pickLocalized(row, language = "EN") {
  const list = arr(row?.localized);
  const wanted = languageCode(language);
  return (
    list.find((item) => clean(item?.language, 20).toUpperCase() === wanted) ||
    list.find((item) => clean(item?.language, 20).toUpperCase() === "EN") ||
    list[0] ||
    {}
  );
}

function normalizeMedia(row) {
  return arr(row?.media)
    .filter((item) => clean(item?.url, 4000))
    .sort((a, b) => {
      const heroA = a?.isHero === true || clean(a?.role, 40).toUpperCase() === "HERO" ? 0 : 1;
      const heroB = b?.isHero === true || clean(b?.role, 40).toUpperCase() === "HERO" ? 0 : 1;
      if (heroA !== heroB) return heroA - heroB;
      return (Number(a?.sortOrder) || 9999) - (Number(b?.sortOrder) || 9999);
    });
}

function firstImage(row, fallback = "") {
  return clean(normalizeMedia(row)[0]?.url, 4000) || fallback;
}

function contentOf(localized) {
  return obj(localized?.content);
}

function contentSection(content, ...keys) {
  for (const key of keys) {
    const value = content?.[key];
    if (value && typeof value === "object") return value;
  }
  return {};
}

function textArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item, 5000)).filter(Boolean);
  }
  const text = clean(value, 5000);
  return text ? [text] : [];
}

function normalizeFaq(item) {
  const source = obj(item);
  const q = firstText(source.q, source.question, source.title, source.label);
  const a = firstText(
    source.a,
    source.answer,
    source.body,
    source.description,
    Array.isArray(source.details) ? source.details.join(" ") : ""
  );
  return q && a ? { q, a } : null;
}

function normalizeStory(item) {
  const source = obj(item);
  const title = firstText(source.title, source.heading, source.label, source.name);
  const body = firstText(
    source.body,
    source.description,
    source.summary,
    Array.isArray(source.details) ? source.details.join(" ") : ""
  );
  return title && body ? { title, body } : null;
}

function normalizeClimate(item) {
  const source = obj(item);
  const month = firstText(source.month, source.label, source.name);
  if (!month) return null;

  const high = numberOrNull(
    source.temperature ?? source.temp ?? source.avgHighC ?? source.avg_high_c ?? source.highC ?? source.high_c
  );
  const low = numberOrNull(source.avgLowC ?? source.avg_low_c ?? source.lowC ?? source.low_c);
  const temperature = high !== null ? high : low;
  const rain = numberOrNull(
    source.rain ?? source.rainfall ?? source.precipitation ?? source.precipitationMm ?? source.precipitation_mm
  );

  return {
    month,
    temperature: temperature ?? 0,
    rain: rain ?? 0,
    lowTemperature: low,
    highTemperature: high
  };
}

function infoIcon(cardId, category, title) {
  const key = `${clean(cardId, 100)} ${clean(category, 100)} ${clean(title, 100)}`.toLowerCase();
  if (/passport|visa|entry/.test(key)) return "🛂";
  if (/health|medical|safety|vacc/.test(key)) return "✚";
  if (/money|currency|payment|bank|tax/.test(key)) return "¤";
  if (/transport|getting around|transfer|rail|ferr/.test(key)) return "↔";
  if (/electric|adapter|plug|voltage/.test(key)) return "⚡";
  if (/emergency|police|consulate/.test(key)) return "☎";
  if (/custom|culture|etiquette|language/.test(key)) return "◎";
  return "i";
}

function normalizePracticalInfo(details) {
  const items = [];

  for (const raw of arr(details?.practicalInfo)) {
    const source = obj(raw);
    const title = firstText(source.title, source.category, source.label);
    const detailText = firstText(
      source.summary,
      source.description,
      source.body,
      Array.isArray(source.details) ? source.details.join(" ") : ""
    );
    if (!title || !detailText) continue;
    items.push({
      icon: infoIcon(source.card_id || source.cardId, source.category, title),
      title,
      summary: detailText,
      path: clean(source.path || source.url, 1000)
    });
  }

  const supplements = [
    ["Passport & entry", details?.passportSummary, "🛂"],
    ["Visa information", details?.visaSummary, "🛂"],
    ["Local taxes", details?.touristTaxInfo, "¤"],
    ["Electricity & adapters", details?.electricalPlug, "⚡"],
    ["Emergency number", details?.emergencyNumber, "☎"],
    ["Driving", details?.drivingSide ? `Driving side: ${details.drivingSide}` : "", "↔"]
  ];

  for (const [title, summary, icon] of supplements) {
    const text = clean(summary, 5000);
    if (!text) continue;
    if (items.some((item) => item.title.toLowerCase() === title.toLowerCase())) continue;
    items.push({ icon, title, summary: text, path: "" });
  }

  return items.slice(0, 12);
}

function normalizeInspiration(value, fallbackImage = "") {
  return arr(value)
    .map((raw) => {
      const source = obj(raw);
      const title = firstText(source.title, source.heading, source.name, source.label);
      if (!title) return null;
      return {
        title,
        image: clean(source.image || source.imageUrl || source.url, 4000) || fallbackImage,
        path: clean(source.path || source.link || source.href, 1000)
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeCountryFacts(details, commercial, content) {
  const customFacts = arr(details?.pageFacts)
    .map((item) => ({
      label: firstText(item?.label, item?.title, item?.key),
      value: firstText(item?.value, item?.text, item?.description)
    }))
    .filter((item) => item.label && item.value);

  const known = [
    { key: "currency", value: firstText(details?.currency, commercial?.currency) },
    { key: "language", value: arr(details?.languages).map((x) => clean(x, 120)).filter(Boolean).join(" · ") },
    { key: "timezone", value: firstText(details?.timezone) },
    {
      key: "flight",
      value: firstText(
        content?.typicalJourney,
        content?.typicalFlightTime,
        details?.typicalJourney,
        details?.typicalFlightTime,
        details?.flightTime
      )
    },
    { key: "season", value: firstText(details?.highSeason, details?.bestTimeToVisit) },
    { key: "best", value: arr(details?.goodFor).map((x) => clean(x, 120)).filter(Boolean).join(" · ") }
  ].filter((item) => item.value);

  const fixedKeys = new Set(known.map((item) => item.key));
  for (const fact of customFacts) {
    if (known.length >= 6) break;
    const key = slugify(fact.label) || `fact-${known.length + 1}`;
    if (fixedKeys.has(key)) continue;
    known.push({ key, label: fact.label, value: fact.value });
    fixedKeys.add(key);
  }

  return known.slice(0, 6);
}

function normalizeCountryStories(details, content) {
  const fromContent = arr(content?.stories).map(normalizeStory).filter(Boolean);
  if (fromContent.length) return fromContent.slice(0, 8);

  const fromGuides = arr(details?.guideSections).map(normalizeStory).filter(Boolean);
  if (fromGuides.length) return fromGuides.slice(0, 8);

  return arr(details?.signature).map(normalizeStory).filter(Boolean).slice(0, 8);
}

function normalizeCountryFaqs(details, content) {
  const contentFaqs = arr(content?.faqs).map(normalizeFaq).filter(Boolean);
  if (contentFaqs.length) return contentFaqs.slice(0, 20);
  return arr(details?.faqs).map(normalizeFaq).filter(Boolean).slice(0, 20);
}

async function getConfiguration() {
  if (!configurationPromise) {
    configurationPromise = (async () => {
      const rawUrl = await elevatedGetSecretValue("SUPABASE_URL");
      let apiKey = "";

      try {
        apiKey = await elevatedGetSecretValue("SUPABASE_SECRET_KEY");
      } catch (_) {
        apiKey = "";
      }

      if (!apiKey) {
        apiKey = await elevatedGetSecretValue("SUPABASE_SERVICE_ROLE_KEY");
      }

      const baseUrl = clean(rawUrl, 1000).replace(/\/+$/, "");
      const key = clean(apiKey, 10000);

      if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(baseUrl)) {
        throw new Error("SUPABASE_URL_INVALID");
      }
      if (!key) {
        throw new Error("SUPABASE_SERVER_KEY_MISSING");
      }

      return { baseUrl, apiKey: key };
    })();
  }

  return configurationPromise;
}

async function restSelect(params = {}) {
  const { baseUrl, apiKey } = await getConfiguration();
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const url = `${baseUrl}/rest/v1/${PUBLIC_VIEW}?${query.toString()}`;
  const response = await fetch(url, {
    method: "get",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "X-Client-Info": "skandi-country-inventory-page/2026.09"
    }
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : [];
  } catch (_) {
    body = text;
  }

  if (!response.ok) {
    const message =
      clean(body?.message || body?.error || body?.hint || body, 1000) ||
      `SUPABASE_${response.status}`;
    throw new Error(message);
  }

  return Array.isArray(body) ? body : [];
}

async function getCountryRow(countrySlug) {
  const normalized = slugify(countrySlug);
  if (!normalized) throw new Error("COUNTRY_SLUG_REQUIRED");

  const rows = await restSelect({
    select: "id,public_id,entity_type,code,name,slug,featured,homepage_featured,sort_priority,parent_entity_id,details,commercial,seo,localized,media,relations,updated_at",
    entity_type: "eq.COUNTRY",
    slug: `eq.${normalized}`,
    limit: "1"
  });

  const row = rows[0] || null;
  if (!row) throw new Error("COUNTRY_NOT_FOUND_OR_NOT_PUBLIC");
  return row;
}

async function getCountryDirectoryRows() {
  const now = Date.now();
  if (directoryCache && now - directoryCacheAt < DIRECTORY_TTL_MS) {
    return directoryCache;
  }

  const rows = await restSelect({
    select: "id,code,name,slug,sort_priority,localized,media,details,updated_at",
    entity_type: "eq.COUNTRY",
    order: "sort_priority.desc,name.asc",
    limit: "500"
  });

  directoryCache = rows;
  directoryCacheAt = now;
  return rows;
}

async function getDestinationRowsForCountry(country) {
  const rows = await restSelect({
    select: "id,public_id,entity_type,code,name,slug,sort_priority,parent_entity_id,details,commercial,seo,localized,media,relations,updated_at",
    entity_type: "eq.DESTINATION",
    order: "sort_priority.desc,name.asc",
    limit: "1000"
  });

  return rows.filter((row) => {
    if (clean(row?.parent_entity_id, 100) === clean(country?.id, 100)) return true;

    return arr(row?.relations).some((rel) => {
      const targetId = clean(rel?.targetEntityId, 100);
      const targetSlug = slugify(rel?.targetSlug);
      const targetType = clean(rel?.targetType, 40).toUpperCase();
      const relationType = clean(rel?.relationType, 40).toUpperCase();
      return (
        (targetType === "COUNTRY" || relationType === "PARENT" || relationType === "COUNTRY") &&
        (targetId === clean(country?.id, 100) || targetSlug === slugify(country?.slug))
      );
    });
  });
}

function normalizeDirectory(rows, language) {
  return rows.map((row) => {
    const localized = pickLocalized(row, language);
    return {
      slug: slugify(row?.slug),
      code: clean(row?.code, 40).toUpperCase(),
      name: firstText(localized?.title, row?.name),
      image: firstImage(row),
      region: firstText(row?.details?.region),
      sortPriority: Number(row?.sort_priority) || 0
    };
  });
}

function normalizeDestinationCard(row, country, language, fallbackImage = "") {
  const localized = pickLocalized(row, language);
  const details = obj(row?.details);
  const destinationSlug = slugify(row?.slug);
  const countrySlug = slugify(country?.slug);

  return {
    id: clean(row?.id, 100),
    publicId: clean(row?.public_id, 120),
    code: clean(row?.code, 40).toUpperCase(),
    slug: destinationSlug,
    name: firstText(localized?.title, row?.name),
    image: firstImage(row, fallbackImage),
    description: firstText(localized?.shortDescription, localized?.fullDescription, details?.summary),
    path: `/our-destinations/country/destination?country=${encodeURIComponent(countrySlug)}&destination=${encodeURIComponent(destinationSlug)}`,
    hotelsPath: `/our-destinations/country/destination/area/hotel-list?country=${encodeURIComponent(countrySlug)}&destination=${encodeURIComponent(destinationSlug)}`,
    region: firstText(details?.region),
    airportIata: clean(details?.searchAirportIata, 20).toUpperCase(),
    bestTimeToVisit: firstText(details?.bestTimeToVisit),
    tags: arr(details?.tags).map((tag) => clean(tag, 120)).filter(Boolean)
  };
}

function normalizeCountryPage(country, directoryRows, destinationRows, language, currency) {
  const localized = pickLocalized(country, language);
  const content = contentOf(localized);
  const details = obj(country?.details);
  const commercial = obj(country?.commercial);
  const seo = obj(country?.seo);
  const media = normalizeMedia(country);
  const heroSection = contentSection(content, "hero", "heroSection");
  const introSection = contentSection(content, "intro", "guide", "overview");
  const weatherSection = contentSection(content, "weather", "climate");
  const countryName = firstText(localized?.title, country?.name);
  const countrySlug = slugify(country?.slug);
  const heroImages = unique([
    ...arr(heroSection?.images).map((item) => typeof item === "string" ? clean(item, 4000) : clean(item?.url, 4000)),
    ...media.map((item) => clean(item?.url, 4000))
  ]).slice(0, 12);
  const fallbackImage = heroImages[0] || "";

  const regions = destinationRows.map((row) =>
    normalizeDestinationCard(row, country, language, fallbackImage)
  );

  const introParagraphs = unique([
    ...textArray(introSection?.paragraphs),
    ...textArray(introSection?.body),
    ...textArray(localized?.fullDescription)
  ]).slice(0, 8);

  const structuredInspiration =
    arr(content?.inspiration).length ? content.inspiration : details?.inspiration;

  const page = {
    id: clean(country?.id, 100),
    publicId: clean(country?.public_id, 120),
    entityType: "COUNTRY",
    code: clean(country?.code, 40).toUpperCase(),
    slug: countrySlug,
    name: countryName,
    directory: normalizeDirectory(directoryRows, language),
    hero: {
      kicker: firstText(heroSection?.kicker, localized?.eyebrow, "SKANDI DESTINATIONS"),
      title: firstText(heroSection?.title, countryName),
      summary: firstText(heroSection?.summary, localized?.shortDescription, seo?.description),
      images: heroImages
    },
    facts: normalizeCountryFacts(details, commercial, content),
    intro: {
      title: firstText(introSection?.title, content?.introTitle, countryName),
      paragraphs: introParagraphs,
      signature: firstText(
        introSection?.signature,
        content?.signatureCopy,
        localized?.importantInformation,
        arr(details?.signature)[0]?.description
      )
    },
    stories: normalizeCountryStories(details, content),
    regions,
    climate: arr(details?.climate).map(normalizeClimate).filter(Boolean),
    weather: firstText(
      weatherSection?.summary,
      weatherSection?.body,
      content?.weatherCopy,
      details?.bestTimeToVisit
    ),
    info: normalizePracticalInfo(details),
    inspiration: normalizeInspiration(structuredInspiration, fallbackImage),
    airlines: [],
    faqs: normalizeCountryFaqs(details, content),
    commercial: {
      currency: currencyCode(currency || commercial?.currency),
      publicPrice: numberOrNull(commercial?.publicPrice),
      priceBasis: clean(commercial?.priceBasis, 120)
    },
    seo: {
      title: firstText(localized?.seoTitle, seo?.title),
      description: firstText(localized?.seoDescription, seo?.description),
      canonicalSlug: clean(seo?.canonicalSlug, 1000),
      ogTitle: firstText(seo?.ogTitle, localized?.title, countryName),
      ogDescription: firstText(seo?.ogDescription, localized?.shortDescription),
      ogImage: firstText(seo?.ogImage, fallbackImage),
      indexable: seo?.indexable === true
    },
    meta: {
      source: PUBLIC_VIEW,
      updatedAt: clean(country?.updated_at, 100),
      language: languageCode(language),
      destinationCount: regions.length
    }
  };

  return page;
}

function descendantOf(row, ancestorId, byId) {
  const seen = new Set();
  let current = row;

  while (current) {
    const parentId = clean(current?.parent_entity_id, 100);
    if (!parentId) return false;
    if (parentId === ancestorId) return true;
    if (seen.has(parentId)) return false;
    seen.add(parentId);
    current = byId.get(parentId);
  }

  return false;
}

function offerFromInventory(row, country, language, search) {
  const localized = pickLocalized(row, language);
  const details = obj(row?.details);
  const commercial = obj(row?.commercial);
  const price = numberOrNull(commercial?.publicPrice);
  if (price === null || price <= 0) return null;

  const entityType = clean(row?.entity_type, 40).toUpperCase();
  const itemSlug = slugify(row?.slug);
  const countrySlug = slugify(country?.slug);
  const destinationSlug = slugify(details?.destinationSlug || details?.city || "");
  let path = "";

  if (entityType === "HOTEL") {
    path = `/hotel-detail?country=${encodeURIComponent(countrySlug)}&hotel=${encodeURIComponent(itemSlug)}&hotelId=${encodeURIComponent(clean(row?.id, 100))}`;
    if (destinationSlug) {
      path += `&destination=${encodeURIComponent(destinationSlug)}`;
    }
  }

  return {
    id: clean(row?.id, 100),
    type: entityType,
    title: firstText(localized?.title, row?.name),
    hotelName: entityType === "HOTEL" ? firstText(localized?.title, row?.name) : "",
    location: firstText(details?.city, details?.countryName, country?.name),
    destinationName: firstText(details?.city, country?.name),
    image: firstImage(row),
    tags: unique([
      ...arr(localized?.highlights).map((item) => clean(item, 180)),
      ...arr(details?.tags).map((item) => clean(item, 180))
    ]).slice(0, 8),
    price,
    amount: price,
    fromPrice: price,
    currency: currencyCode(search?.currency || commercial?.currency),
    path,
    searchContext: {
      ...obj(search),
      countrySlug,
      destinationCountry: clean(country?.code, 40).toUpperCase()
    }
  };
}

export const getCountryPage = webMethod(Permissions.Anyone, async (input = {}) => {
  const requestedSlug = slugify(input?.slug || input?.countrySlug || input?.country);
  const language = languageCode(input?.language || input?.locale);
  const currency = currencyCode(input?.currency);

  const country = await getCountryRow(requestedSlug);
  const [directoryRows, destinationRows] = await Promise.all([
    getCountryDirectoryRows(),
    getDestinationRowsForCountry(country)
  ]);

  return {
    ok: true,
    page: normalizeCountryPage(country, directoryRows, destinationRows, language, currency)
  };
});

export const searchCountryOffers = webMethod(Permissions.Anyone, async (input = {}) => {
  const countrySlug = slugify(input?.countrySlug || input?.slug || input?.country);
  const search = obj(input?.search);
  const language = languageCode(search?.language || search?.locale || input?.language);
  const country = await getCountryRow(countrySlug);

  const rows = await restSelect({
    select: "id,public_id,entity_type,code,name,slug,sort_priority,parent_entity_id,details,commercial,localized,media,relations,updated_at",
    order: "sort_priority.desc,name.asc",
    limit: "2000"
  });

  const byId = new Map(rows.map((row) => [clean(row?.id, 100), row]));
  const allowedTypes = new Set(["HOTEL", "PACKAGE"]);

  const items = rows
    .filter((row) => allowedTypes.has(clean(row?.entity_type, 40).toUpperCase()))
    .filter((row) => descendantOf(row, clean(country?.id, 100), byId))
    .map((row) => offerFromInventory(row, country, language, search))
    .filter(Boolean)
    .slice(0, 24);

  return {
    ok: true,
    items,
    meta: {
      source: PUBLIC_VIEW,
      countrySlug,
      count: items.length
    }
  };
});
