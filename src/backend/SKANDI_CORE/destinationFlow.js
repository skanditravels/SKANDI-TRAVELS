// /src/backend/SKANDI_CORE/destinationFlow.js
// SKANDI Backend Base 1.0 — B-009 Destination Flow public-content core.
//
// Canonical responsibilities:
// - Read the published/public Inventory projection used by the customer Destination Flow.
// - Return only the public-safe DTO contract already consumed by the V9.2 page controller.
// - Reuse the canonical SKANDI Supabase transport.
//
// This file must NOT own booking/cart/payment logic, Wix page routing, HTML state,
// Duffel transport, Inventory authoring, or a second Supabase client.

import { restRequest } from "backend/SKANDI_CORE/supabaseServer.js";

const PUBLIC_VIEW = "inventory_public_entities_v";
const MAX_ROWS = 5000;
const CACHE_TTL_MS = 60_000;
const PROTOCOL_VERSION = "BACKEND-BASE-1.0-B009";

let cache = null;
let cacheExpiresAt = 0;
let inFlight = null;

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function publicRecord(row = {}) {
  return {
    id: clean(row.id, 120),
    publicId: clean(row.public_id, 160),
    entityType: clean(row.entity_type, 60).toUpperCase(),
    code: clean(row.code, 80),
    name: clean(row.name, 500),
    slug: clean(row.slug, 240),
    featured: row.featured === true,
    homepageFeatured: row.homepage_featured === true,
    sortPriority: Number(row.sort_priority || 0),
    parentEntityId: clean(row.parent_entity_id, 120),
    details: objectValue(row.details),
    commercial: objectValue(row.commercial),
    seo: objectValue(row.seo),
    localized: arrayValue(row.localized),
    media: arrayValue(row.media),
    relations: arrayValue(row.relations),
    updatedAt: row.updated_at || null
  };
}

function countsFor(records = []) {
  return records.reduce((acc, record) => {
    const type = clean(record?.entityType, 60).toUpperCase() || "UNKNOWN";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

async function readCatalogFromSource() {
  const rows = await restRequest({
    table: PUBLIC_VIEW,
    query: {
      select: [
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
      ].join(","),
      order: "sort_priority.asc,name.asc",
      limit: MAX_ROWS
    }
  });

  if (!Array.isArray(rows)) {
    const error = new Error("DESTINATION_PUBLIC_VIEW_NOT_ARRAY");
    error.code = "DESTINATION_PUBLIC_VIEW_NOT_ARRAY";
    throw error;
  }

  return rows.map(publicRecord);
}

async function loadCatalog({ force = false } = {}) {
  const now = Date.now();

  if (!force && cache && now < cacheExpiresAt) {
    return cache;
  }

  if (!inFlight) {
    inFlight = readCatalogFromSource()
      .then((records) => {
        cache = records;
        cacheExpiresAt = Date.now() + CACHE_TTL_MS;
        return records;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

function publicError(error) {
  const raw = clean(error?.code || error?.message || "", 160).toUpperCase();

  if (raw.includes("SUPABASE_OBJECT_NOT_ALLOWED")) {
    return "DESTINATION_SOURCE_NOT_REGISTERED";
  }
  if (raw.includes("SUPABASE_HTTP_")) {
    return raw;
  }
  if (raw.includes("DESTINATION_PUBLIC_VIEW_")) {
    return raw;
  }

  return "DESTINATION_BACKEND_REQUEST_FAILED";
}

export async function getDestinationFlowCatalogCore(input = {}) {
  try {
    const records = await loadCatalog({ force: input?.force === true });

    return {
      ok: true,
      source: "SUPABASE_PUBLIC_INVENTORY",
      protocolVersion: PROTOCOL_VERSION,
      records,
      counts: countsFor(records),
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(
      "[SKANDI Destination Flow] Public catalog load failed.",
      error?.code || error?.message || error
    );

    return {
      ok: false,
      source: "SUPABASE_PUBLIC_INVENTORY",
      protocolVersion: PROTOCOL_VERSION,
      code: publicError(error),
      publicMessage: "Destination information is temporarily unavailable.",
      records: [],
      counts: {},
      generatedAt: new Date().toISOString()
    };
  }
}
