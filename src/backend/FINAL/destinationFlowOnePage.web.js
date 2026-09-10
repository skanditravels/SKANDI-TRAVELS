// backend/FINAL/destinationFlowOnePage.web.js
// SKANDI Destination Flow V9 — server-side public inventory service.
// Uses the same Wix Secrets + Supabase REST configuration pattern as Home V9.

import { webMethod, Permissions } from "wix-web-module";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import { fetch } from "wix-fetch";

const PUBLIC_VIEW = "inventory_public_entities_v";
const MAX_ROWS = 5000;
const PROTOCOL_VERSION = "2026.09.10.destination-v9.1";

const elevatedGetSecretValue = elevate(secrets.getSecretValue);
let configurationPromise = null;

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

function secretString(response) {
  if (typeof response === "string") return response.trim();
  return String(
    response?.value ??
    response?.secretValue ??
    response?.secret?.value ??
    ""
  ).trim();
}

async function getSecret(name) {
  const response = await elevatedGetSecretValue(name);
  const value = secretString(response);
  if (!value) throw new Error(`WIX_SECRET_EMPTY_${name}`);
  return value;
}

async function getConfiguration() {
  if (configurationPromise) return configurationPromise;

  configurationPromise = (async () => {
    const baseUrl = await getSecret("SUPABASE_URL");
    let apiKey = "";

    try {
      apiKey = await getSecret("SUPABASE_SECRET_KEY");
    } catch (_) {
      try {
        apiKey = await getSecret("SUPABASE_SERVICE_ROLE_KEY");
      } catch (_) {
        throw new Error("SUPABASE_SERVER_KEY_MISSING");
      }
    }

    if (!/^https:\/\/[^/]+\.supabase\.co\/?$/i.test(baseUrl)) {
      throw new Error("SUPABASE_URL_INVALID");
    }

    if (!apiKey) {
      throw new Error("SUPABASE_SERVER_KEY_MISSING");
    }

    const keyType =
      apiKey.startsWith("sb_secret_")
        ? "modern-secret"
        : apiKey.startsWith("eyJ")
          ? "legacy-jwt"
          : "api-key";

    return {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      apiKey,
      keyType
    };
  })();

  try {
    return await configurationPromise;
  } catch (error) {
    configurationPromise = null;
    throw error;
  }
}

function buildHeaders({ apiKey, keyType }) {
  const headers = {
    apikey: apiKey,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  // Legacy service-role JWTs require Authorization. Modern sb_secret_ keys do not.
  if (keyType === "legacy-jwt") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
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
  const { baseUrl, apiKey, keyType } = await getConfiguration();

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
    `${baseUrl}/rest/v1/${PUBLIC_VIEW}` +
    `?select=${encodeURIComponent(select)}` +
    `&order=sort_priority.asc,name.asc` +
    `&limit=${MAX_ROWS}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: buildHeaders({ apiKey, keyType })
  });

  const text = await response.text();

  if (!response.ok) {
    let code = "";
    try {
      const payload = JSON.parse(text || "{}");
      code = clean(payload?.code, 80);
    } catch (_) {}

    throw new Error(
      `SUPABASE_PUBLIC_VIEW_HTTP_${response.status}${code ? `_${code}` : ""}`
    );
  }

  let rows = [];
  try {
    rows = JSON.parse(text || "[]");
  } catch (_) {
    throw new Error("SUPABASE_PUBLIC_VIEW_INVALID_RESPONSE");
  }

  if (!Array.isArray(rows)) {
    throw new Error("SUPABASE_PUBLIC_VIEW_NOT_ARRAY");
  }

  return rows.map(publicRecord);
}

function publicErrorCode(error) {
  const message = clean(error?.message, 160);

  if (message.startsWith("WIX_SECRET_EMPTY_SUPABASE_URL")) {
    return "DESTINATION_SUPABASE_URL_MISSING";
  }
  if (
    message.startsWith("WIX_SECRET_EMPTY_SUPABASE_SECRET_KEY") ||
    message.startsWith("WIX_SECRET_EMPTY_SUPABASE_SERVICE_ROLE_KEY") ||
    message === "SUPABASE_SERVER_KEY_MISSING"
  ) {
    return "DESTINATION_SUPABASE_KEY_MISSING";
  }
  if (message === "SUPABASE_URL_INVALID") {
    return "DESTINATION_SUPABASE_URL_INVALID";
  }
  if (message.startsWith("SUPABASE_PUBLIC_VIEW_HTTP_")) {
    return message;
  }
  if (message.startsWith("SUPABASE_PUBLIC_VIEW_")) {
    return message;
  }

  return "DESTINATION_BACKEND_REQUEST_FAILED";
}

export const getDestinationFlowCatalog =
  webMethod(Permissions.Anyone, async function () {
    try {
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
    } catch (error) {
      console.error(
        "[Destination Flow V9] Catalog load failed:",
        error?.message || error
      );

      return {
        ok: false,
        source: "SUPABASE_PUBLIC_INVENTORY_V9",
        protocolVersion: PROTOCOL_VERSION,
        code: publicErrorCode(error),
        publicMessage: "Destination information is temporarily unavailable.",
        records: [],
        counts: {},
        generatedAt: new Date().toISOString()
      };
    }
  });
