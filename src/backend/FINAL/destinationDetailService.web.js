import { webMethod, Permissions } from "wix-web-module";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

const LANGUAGES = [
  "EN","SV","NO","DA","ES","FI","DE","FR-FR","FR-CA","TH"
];

const FALLBACK_ROUTES = new Set([
  "thailand/phuket",
  "thailand/krabi",
  "thailand/bangkok",
  "thailand/chiang-mai",
  "greece/crete",
  "greece/santorini",
  "greece/rhodes",
  "greece/athens",
  "spain/mallorca",
  "spain/costa-del-sol",
  "spain/canary-islands",
  "spain/barcelona"
]);

function cleanSlug(value, fallback) {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "") || fallback;
}

function cleanLocale(value) {
  const locale = String(value || "EN").trim().toUpperCase();
  return LANGUAGES.includes(locale) ? locale : "EN";
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function isTranslationObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(key => LANGUAGES.includes(key));
}

function localize(value, locale) {
  if (Array.isArray(value)) {
    return value.map(item => localize(item, locale));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (isTranslationObject(value)) {
    return (
      value[locale] ??
      value.EN ??
      value.SV ??
      Object.values(value)[0] ??
      ""
    );
  }

  return Object.fromEntries(
    Object.entries(value).map(
      ([key, item]) => [key, localize(item, locale)]
    )
  );
}

async function supabaseConfig() {
  const [url, key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);

  return {
    url:String(url || "").replace(/\/$/, ""),
    key:String(key || "")
  };
}

async function supabaseGet(path) {
  const config = await supabaseConfig();

  if (!config.url || !config.key) {
    throw new Error(
      "Supabase destination content is not configured."
    );
  }

  const response = await fetch(
    `${config.url}/rest/v1/${path}`,
    {
      method:"get",
      headers:{
        apikey:config.key,
        Authorization:`Bearer ${config.key}`,
        Accept:"application/json"
      }
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Supabase destination request failed (${response.status}): ${detail.slice(0, 280)}`
    );
  }

  return response.json();
}

async function loadPage(countrySlug, destinationSlug) {
  const rows = await supabaseGet([
    "destination_detail_pages",
    `?country_slug=eq.${encodeURIComponent(countrySlug)}`,
    `&destination_slug=eq.${encodeURIComponent(destinationSlug)}`,
    "&is_published=eq.true",
    "&select=country_slug,destination_slug,country_code,country_names,destination_names,payload,updated_at",
    "&limit=1"
  ].join(""));

  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadDirectory() {
  const rows = await supabaseGet(
    "destination_detail_pages?is_published=eq.true&select=country_slug,destination_slug,country_code,country_names,destination_names,sort_order&order=country_slug.asc,sort_order.asc,destination_slug.asc"
  );

  return Array.isArray(rows) ? rows : [];
}

export const getDestinationDetailPage = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    const countrySlug = cleanSlug(
      input.countrySlug,
      "thailand"
    );

    const destinationSlug = cleanSlug(
      input.destinationSlug,
      "phuket"
    );

    const locale = cleanLocale(
      input.language ||
      input.locale
    );

    const routeKey = `${countrySlug}/${destinationSlug}`;

    try {
      const [row, directoryRows] = await Promise.all([
        loadPage(countrySlug, destinationSlug),
        loadDirectory()
      ]);

      if (!row) {
        return {
          clientFallback:true,
          countrySlug:FALLBACK_ROUTES.has(routeKey)
            ? countrySlug
            : "thailand",
          destinationSlug:FALLBACK_ROUTES.has(routeKey)
            ? destinationSlug
            : "phuket"
        };
      }

      const payload = localize(
        asObject(row.payload),
        locale
      );

      const directory = directoryRows.map(item => ({
        countrySlug:item.country_slug,
        destinationSlug:item.destination_slug,
        countryCode:item.country_code,
        countryName:
          localize(asObject(item.country_names), locale) ||
          item.country_slug,
        name:
          localize(asObject(item.destination_names), locale) ||
          item.destination_slug
      }));

      return {
        page:{
          ...payload,
          countrySlug:row.country_slug,
          destinationSlug:row.destination_slug,
          slug:row.destination_slug,
          countryCode:row.country_code,
          countryName:
            payload.countryName ||
            localize(asObject(row.country_names), locale) ||
            row.country_slug,
          name:
            payload.name ||
            localize(asObject(row.destination_names), locale) ||
            row.destination_slug,
          directory,
          updatedAt:row.updated_at
        }
      };
    } catch (error) {
      console.warn(
        `[DestinationDetailService] Falling back to embedded ${routeKey} content.`,
        error
      );

      return {
        clientFallback:true,
        countrySlug:FALLBACK_ROUTES.has(routeKey)
          ? countrySlug
          : "thailand",
        destinationSlug:FALLBACK_ROUTES.has(routeKey)
          ? destinationSlug
          : "phuket"
      };
    }
  }
);
