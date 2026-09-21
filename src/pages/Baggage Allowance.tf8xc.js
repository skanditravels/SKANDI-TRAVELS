// /src/pages/Baggage Allowance.js
// B-011.1 install candidate for /travel-info/baggage-allowance.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicBaggagePayload } from "backend/SKANDI_CORE/publicContent.web";
import { APP_ROUTES, isSafeInternalRoute } from "public/siteMap";

const SOURCE = "SKANDI_BAGGAGE_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.1";
const EMBED_IDS = ["#baggageInfoEmbed", "#baggageHtml"];

function html() { for (const id of EMBED_IDS) { try { const e = $w(id); if (e && typeof e.onMessage === "function" && typeof e.postMessage === "function") return { id, e }; } catch (_) {} } return null; }
function parse(v) { if (typeof v === "string") { try { return JSON.parse(v); } catch (_) { return null; } } return v && typeof v === "object" ? v : null; }
function send(e, type, payload = {}) { e.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() }); }
function nav(path) { const p = String(path || "").trim(); if (p && isSafeInternalRoute(p)) wixLocationFrontend.to(p); }
async function load(e, p = {}) { try { send(e, "BAGGAGE_LOADING", {}); send(e, "BAGGAGE_DATA", await getPublicBaggagePayload({ language: p.language || "EN" })); } catch (x) { send(e, "BAGGAGE_ERROR", { message: x?.publicMessage || x?.message || "Baggage guidance is unavailable." }); } }

$w.onReady(() => {
  const r = html(); if (!r) { console.error(`[Baggage B-011.1] Missing embed: ${EMBED_IDS.join(", ")}`); return; }
  r.e.onMessage(async ev => { const m = parse(ev?.data); if (!m || (m.source && m.source !== SOURCE)) return; const p = m.payload || {}; if (["BAGGAGE_READY", "BAGGAGE_REFRESH"].includes(m.type)) await load(r.e, p); else if (m.type === "BAGGAGE_NAVIGATE") nav(p.path || m.path); });
  send(r.e, "BAGGAGE_HOST_READY", { version: VERSION, embedId: r.id, route: APP_ROUTES.baggageAllowance });
});
