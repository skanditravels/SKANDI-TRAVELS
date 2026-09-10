import { webMethod, Permissions } from "wix-web-module";
import { getSecretValue } from "wix-secrets-backend.v2";
import { fetch } from "wix-fetch";

const PUBLIC_VIEW = "inventory_public_entities_v";
const MAX_ROWS = 5000;
const PROTOCOL_VERSION = "2026.09.10.destination-v9";

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

async function secret(name) {
  try {
    return clean(await getSecretValue(name), 10000);
  } catch (_) {
    return "";
  }
}

async function config() {
  const url = (await secret("SUPABASE_URL")).replace(/\/+$/, "");
  const key =
    (await secret("SUPABASE_SECRET_KEY")) ||
    (await secret("SUPABASE_SERVICE_ROLE_KEY"));

  if (!url || !key) {
    throw new Error("Public destination data connection is not configured.");
  }

  return { url, key };
}

function headers(key) {
  const out = {
    apikey: key,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  // Legacy service-role JWTs require Authorization.
  if (String(key).split(".").length === 3) {
    out.Authorization = `Bearer ${key}`;
  }

  return out;
}

function publicRecord(row = {}) {
  return {
    id: row.id || "",
    publicId: row.public_id || "",
    entityType: clean(row.entity_type, 60).toUpperCase(),
    code: clean(row.code, 80),
    name: clean(row.name, 500),
    slug: clean(row.slug, 240),
    featured: Boolean(row.featured),
    homepageFeatured: Boolean(row.homepage_featured),
    sortPriority: Number(row.sort_priority || 0),
    parentEntityId: row.parent_entity_id || "",
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
  const { url, key } = await config();

  const select = [
    "id",
    "public_id",
    "entity_type",
    "code",
    "name",
    "slug",
    "featured",
    "homepage_featured",
    "sort_priority",
    "parent_entity_id",
    "details",
    "commercial",
    "seo",
    "localized",
    "media",
    "relations",
    "updated_at"
  ].join(",");

  const endpoint =
    `${url}/rest/v1/${PUBLIC_VIEW}` +
    `?select=${encodeURIComponent(select)}` +
    `&order=sort_priority.asc,name.asc` +
    `&limit=${MAX_ROWS}`;

  const response = await fetch(endpoint, {
    method: "get",
    headers: headers(key)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Public destination data could not be loaded (${response.status}).`
    );
  }

  let rows = [];
  try {
    rows = JSON.parse(text || "[]");
  } catch (_) {
    throw new Error("Public destination data returned an invalid response.");
  }

  return arr(rows).map(publicRecord);
}

export const getDestinationFlowCatalog =
  webMethod(Permissions.Anyone, async function () {
    const records = await readCatalog();

    return {
      ok: true,
      source: "SUPABASE_PUBLIC_INVENTORY_V9",
      protocolVersion: PROTOCOL_VERSION,
      records,
      counts: records.reduce((acc, row) => {
        acc[row.entityType] = (acc[row.entityType] || 0) + 1;
        return acc;
      }, {}),
      generatedAt: new Date().toISOString()
    };
  });
