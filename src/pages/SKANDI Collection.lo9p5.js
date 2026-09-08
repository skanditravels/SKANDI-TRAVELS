import wixLocationFrontend from "wix-location-frontend";
import { getSignatureCollectionPayload } from "backend/skandiAboutSignature.web";
import { searchUnifiedOffers } from "backend/bookingOrchestratorCollection.web";

const SOURCE = "SKANDI_SIGNATURE_COLLECTION";
const PARENT = "SKANDI_WIX_PARENT";

// The first ID is the preferred new name. The fallbacks make this page code
// compatible with older SKANDI Collection HTML-component IDs during rollout.
const EMBED_IDS = [
  "#skandiCollectionEmbed",
  "#signatureCollectionEmbed",
  "#skandiCollectionHtml",
  "#signatureCollectionHtml",
  "#html1"
];

function getHtml() {
  for (const id of EMBED_IDS) {
    try {
      const el = $w(id);
      if (el && typeof el.onMessage === "function" && typeof el.postMessage === "function") {
        console.info(`[SKANDI Collection] Using HTML component ${id}`);
        return el;
      }
    } catch (_) {}
  }
  console.error(`[SKANDI Collection] No compatible HTML component found. Tried: ${EMBED_IDS.join(", ")}`);
  return null;
}

function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); }
    catch (_) { return null; }
  }
  return data && typeof data === "object" ? data : null;
}

function send(html, type, payload = {}) {
  html.postMessage({
    source: PARENT,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function language(value) {
  const v = String(value || "EN").trim().toUpperCase();
  return ["EN", "SV", "NO", "DA", "FI"].includes(v) ? v : "EN";
}

function text(v) {
  return String(v ?? "").trim();
}

function number(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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
  const candidate =
    item.total ??
    item.totalPrice ??
    item.price?.total ??
    item.price?.amount ??
    item.amount ??
    item.totalAmount ??
    "";
  if (candidate && typeof candidate === "object") {
    return candidate.amount ?? candidate.total ?? "";
  }
  return candidate;
}

function offerCurrency(item = {}, fallback = "USD") {
  return text(
    item.currency ||
    item.totalPrice?.currency ||
    item.price?.currency ||
    fallback
  ).toUpperCase();
}

function mapOffer(item = {}, fallbackCurrency = "USD") {
  const flight = item.flight || {};
  const stay = item.stay || {};
  return {
    id: item.id || item.offerId || "",
    title:
      item.title ||
      item.packageName ||
      stay.hotelName ||
      stay.title ||
      "SKANDI Collection option",
    route:
      item.routeSummary ||
      flight.routeSummary ||
      [flight.origin, flight.destination].filter(Boolean).join(" → "),
    carriers:
      item.airlineName ||
      flight.airlineName ||
      flight.sourceLabel ||
      flight.marketingCarrier ||
      "",
    duration:
      item.durationLabel ||
      flight.durationLabel ||
      flight.duration ||
      "",
    segmentsLabel:
      item.segmentsLabel ||
      flight.segmentsLabel ||
      "",
    currency: offerCurrency(item, fallbackCurrency),
    total: offerPrice(item)
  };
}

async function loadCollection(html, payload = {}) {
  try {
    send(html, "SIGNATURE_COLLECTION_LOADING", { live: true });
    const data = await getSignatureCollectionPayload({
      language: language(payload.language || payload.locale)
    });
    send(html, "SIGNATURE_COLLECTION_DATA", data || {});
  } catch (error) {
    console.error("[SKANDI Collection] Inventory load failed.", error);
    send(html, "SIGNATURE_COLLECTION_ERROR", {
      message: error?.message || "SKANDI Collection inventory could not be loaded."
    });
  }
}

async function searchPackages(html, payload = {}) {
  const search = normalizeSearch(payload);
  try {
    const result = await searchUnifiedOffers({ search });
    const items = Array.isArray(result?.items)
      ? result.items.map(item => mapOffer(item, search.currency))
      : [];

    send(html, "SIGNATURE_PACKAGE_RESULTS", {
      items,
      meta: {
        ...(result?.meta || {}),
        message: items.length
          ? `${items.length} SKANDI Collection package option${items.length === 1 ? "" : "s"} loaded.`
          : "No currently searchable SKANDI Collection package options matched this search."
      }
    });
  } catch (error) {
    console.error("[SKANDI Collection] Live package search failed.", error);
    send(html, "SIGNATURE_PACKAGE_RESULTS", {
      items: [],
      meta: {
        message: error?.publicMessage || error?.message || "Live package search is unavailable."
      }
    });
  }
}

function navigate(path) {
  const target = text(path);
  if (!target) return;
  if (!(target.startsWith("/") || /^https?:\/\//i.test(target))) return;
  wixLocationFrontend.to(target);
}

$w.onReady(function () {
  const html = getHtml();
  if (!html) return;

  html.onMessage(async event => {
    const message = parseMessage(event.data);
    if (!message?.type || (message.source && message.source !== SOURCE)) return;
    const payload = message.payload || {};

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
});
