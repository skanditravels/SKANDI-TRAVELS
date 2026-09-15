// /src/pages/SKANDI Collection.lo9p5.js
// B-011.1 canonical SKANDI Collection page bridge.
// Inventory comes from SKANDI_CORE/publicContent; live search stays on the single customer booking facade.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicSkandiCollection } from "backend/SKANDI_CORE/publicContent.web";
import { searchUnifiedOffers } from "backend/SKANDI_CORE/customerBooking.web";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap.js";

const SOURCE = "SKANDI_SIGNATURE_COLLECTION";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.1";
const EMBED_IDS = [ "#skandiCollectionEmbed", "#skandiCollectionHtml"];

const text = value => String(value ?? "").trim();
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function getHtml() {
  for (const id of EMBED_IDS) {
    try {
      const element = $w(id);
      if (element && typeof element.onMessage === "function" && typeof element.postMessage === "function") return { id, element };
    } catch (_) {}
  }
  return null;
}

function parseMessage(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function send(html, type, payload = {}) {
  html.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() });
}

function language(value) {
  const normalized = text(value || "EN").toUpperCase();
  return ["EN", "SV", "NO", "DA"].includes(normalized) ? normalized : "EN";
}

function routeFor(item = {}) {
  const base = SITE_MAP[item.routeKey] || "";
  if (!base) return "";
  const slug = text(item.slug || item.publicId || item.code);
  if (!slug) return base;
  const entityType = text(item.entityType).toUpperCase();
  if (item.routeKey === "travelInfo") {
    const library = entityType === "AIRLINE" ? "airlines" : entityType === "AIRPORT" ? "airports" : "all";
    return `${base}?library=${encodeURIComponent(library)}&code=${encodeURIComponent(text(item.code))}`;
  }
  return `${base}?slug=${encodeURIComponent(slug)}`;
}

function normalizeCollectionPayload(result = {}) {
  const items = Array.isArray(result.items) ? result.items.map(item => ({ ...item, path: routeFor(item) })) : [];
  return {
    ...result,
    items,
    collectionItems: items.filter(item => item.catalogType === "SKANDI_COLLECTION"),
    partners: items.filter(item => item.catalogType === "SKANDI_PARTNER")
  };
}

function normalizeSearch(payload = {}) {
  return {
    tripType: "package",
    origin: text(payload.origin).toUpperCase(),
    destination: text(payload.destination).toUpperCase(),
    departureDate: text(payload.departureDate),
    returnDate: text(payload.returnDate),
    adults: Math.max(1, number(payload.adults, 2)),
    children: Array.isArray(payload.children) ? payload.children : [],
    currency: text(payload.currency || "USD").toUpperCase()
  };
}

function offerPrice(item = {}) {
  const candidate = item.total ?? item.totalPrice ?? item.price?.total ?? item.price?.amount ?? item.amount ?? item.totalAmount ?? "";
  if (candidate && typeof candidate === "object") return candidate.amount ?? candidate.total ?? "";
  return candidate;
}

function offerCurrency(item = {}, fallback = "USD") {
  return text(item.currency || item.totalPrice?.currency || item.price?.currency || fallback).toUpperCase();
}

function mapOffer(item = {}, fallbackCurrency = "USD") {
  const flight = item.flight || {};
  const stay = item.stay || {};
  return {
    id: item.id || item.offerId || "",
    title: item.title || item.packageName || stay.hotelName || stay.title || "SKANDI Collection option",
    route: item.routeSummary || flight.routeSummary || [flight.origin, flight.destination].filter(Boolean).join(" → "),
    carriers: item.airlineName || flight.airlineName || flight.sourceLabel || flight.marketingCarrier || "",
    duration: item.durationLabel || flight.durationLabel || flight.duration || "",
    segmentsLabel: item.segmentsLabel || flight.segmentsLabel || "",
    currency: offerCurrency(item, fallbackCurrency),
    total: offerPrice(item)
  };
}

async function loadCollection(html, payload = {}) {
  try {
    send(html, "SIGNATURE_COLLECTION_LOADING", { live: true, version: VERSION });
    const result = await getPublicSkandiCollection({ language: language(payload.language || payload.locale) });
    send(html, "SIGNATURE_COLLECTION_DATA", normalizeCollectionPayload(result || {}));
  } catch (error) {
    console.error("[SKANDI Collection B-011.1] Inventory load failed.", error);
    send(html, "SIGNATURE_COLLECTION_ERROR", { message: error?.publicMessage || error?.message || "SKANDI Collection inventory could not be loaded." });
  }
}

async function searchPackages(html, payload = {}) {
  const search = normalizeSearch(payload);
  try {
    const result = await searchUnifiedOffers({ search, context: { source: "SKANDI_COLLECTION" } });
    const items = Array.isArray(result?.items) ? result.items.map(item => mapOffer(item, search.currency)) : [];
    send(html, "SIGNATURE_PACKAGE_RESULTS", {
      items,
      meta: {
        ...(result?.meta || {}),
        message: items.length
          ? `${items.length} live package option${items.length === 1 ? "" : "s"} loaded.`
          : "No live package options matched this search."
      }
    });
  } catch (error) {
    console.error("[SKANDI Collection B-011.1] Search failed.", error);
    send(html, "SIGNATURE_PACKAGE_RESULTS", { items: [], meta: { message: error?.publicMessage || error?.message || "Live package search is unavailable." } });
  }
}

function navigate(path) {
  const target = text(path);
  if (!target || !isSafeInternalRoute(target)) return;
  wixLocationFrontend.to(target);
}

$w.onReady(() => {
  const resolved = getHtml();
  if (!resolved) {
    console.error(`[SKANDI Collection B-011.1] No HTML component found. Tried ${EMBED_IDS.join(", ")}`);
    return;
  }
  const html = resolved.element;
  html.onMessage(async event => {
    const message = parseMessage(event?.data);
    if (!message?.type || (message.source && message.source !== SOURCE)) return;
    const payload = message.payload && typeof message.payload === "object" ? message.payload : {};
    switch (message.type) {
      case "SIGNATURE_COLLECTION_READY":
      case "SKANDI_COLLECTION_READY":
      case "SIGNATURE_COLLECTION_REFRESH":
        await loadCollection(html, payload);
        break;
      case "SIGNATURE_PACKAGE_SEARCH":
        await searchPackages(html, payload);
        break;
      case "COLLECTION_NAVIGATE":
        navigate(payload.path || message.path);
        break;
      default:
        break;
    }
  });
  send(html, "SIGNATURE_COLLECTION_HOST_READY", { protocolVersion: VERSION, embedId: resolved.id, route: SITE_MAP.skandiCollection });
});
