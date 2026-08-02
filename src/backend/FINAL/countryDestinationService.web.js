import { webMethod, Permissions } from "wix-web-module";
import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

const LANGUAGES = ["EN","SV","NO","DA","ES","FI","DE","FR-FR","FR-CA","TH"];
const FALLBACK_SLUGS = new Set(["thailand","greece","spain"]);

function cleanSlug(value){
  return String(value || "thailand")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "") || "thailand";
}

function cleanLocale(value){
  const locale = String(value || "EN").trim().toUpperCase();
  return LANGUAGES.includes(locale) ? locale : "EN";
}

function asObject(value){
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function isTranslationObject(value){
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(key => LANGUAGES.includes(key));
}

function localize(value, locale){
  if (Array.isArray(value)) return value.map(item => localize(item, locale));
  if (!value || typeof value !== "object") return value;
  if (isTranslationObject(value)) {
    return value[locale] ?? value.EN ?? value.SV ?? Object.values(value)[0] ?? "";
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, localize(item, locale)])
  );
}

async function supabaseConfig(){
  const [url, key] = await Promise.all([
    getSecret("SUPABASE_URL"),
    getSecret("SUPABASE_SERVICE_ROLE_KEY")
  ]);
  return {
    url: String(url || "").replace(/\/$/, ""),
    key: String(key || "")
  };
}

async function supabaseGet(path){
  const config = await supabaseConfig();
  if (!config.url || !config.key) throw new Error("Supabase country content is not configured.");
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method: "get",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase country request failed (${response.status}): ${detail.slice(0, 280)}`);
  }
  return response.json();
}

async function loadPublishedCountry(slug){
  const query = [
    "country_destination_pages",
    `?slug=eq.${encodeURIComponent(slug)}`,
    "&is_published=eq.true",
    "&select=slug,country_code,names,payload,updated_at",
    "&limit=1"
  ].join("");
  const rows = await supabaseGet(query);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadDirectory(){
  const rows = await supabaseGet(
    "country_destination_pages?is_published=eq.true&select=slug,country_code,names,sort_order&order=sort_order.asc,slug.asc"
  );
  return Array.isArray(rows) ? rows : [];
}

export const getCountryDestinationPage = webMethod(
  Permissions.Anyone,
  async (input = {}) => {
    const slug = cleanSlug(input.slug);
    const locale = cleanLocale(input.language || input.locale);

    try {
      const [row, directoryRows] = await Promise.all([
        loadPublishedCountry(slug),
        loadDirectory()
      ]);

      if (!row) {
        return {
          clientFallback: true,
          slug: FALLBACK_SLUGS.has(slug) ? slug : "thailand"
        };
      }

      const payload = localize(asObject(row.payload), locale);
      const directory = directoryRows.map(item => ({
        slug: item.slug,
        code: item.country_code,
        name: localize(asObject(item.names), locale) || item.slug
      }));

      return {
        page: {
          ...payload,
          slug: row.slug,
          code: row.country_code,
          name:
            payload.name ||
            localize(asObject(row.names), locale) ||
            row.slug,
          directory,
          updatedAt: row.updated_at
        }
      };
    } catch (error) {
      console.warn(
        `[CountryDestinationService] Falling back to embedded ${slug} content.`,
        error
      );

      return {
        clientFallback: true,
        slug: FALLBACK_SLUGS.has(slug) ? slug : "thailand"
      };
    }
  }
);
