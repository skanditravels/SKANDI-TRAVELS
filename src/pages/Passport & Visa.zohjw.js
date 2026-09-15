// /src/pages/Passport & Visa.js
// B-011.1 install candidate for /travel-info/passport-visa.zohjw.js
// Destination-specific SKANDI guidance is a planning aid; it does not replace official border/visa authority decisions.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicPassportVisaPayload } from "backend/SKANDI_CORE/publicContent.web";
import { APP_ROUTES, isSafeInternalRoute } from "public/siteMap.js";

const SOURCE = "SKANDI_PASSPORT_VISA_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.1";
const EMBED_IDS = ["#passportVisaEmbed", "#passportVisaHtml", "#html1"];

function html() { for (const id of EMBED_IDS) { try { const e = $w(id); if (e && typeof e.onMessage === "function" && typeof e.postMessage === "function") return { id, e }; } catch (_) {} } return null; }
function parse(v) { if (typeof v === "string") { try { return JSON.parse(v); } catch (_) { return null; } } return v && typeof v === "object" ? v : null; }
function send(e, type, payload = {}) { e.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() }); }
function nav(path) { const p = String(path || "").trim(); if (p && isSafeInternalRoute(p)) wixLocationFrontend.to(p); }
async function load(e, p = {}) { try { send(e, "PASSPORT_VISA_LOADING", {}); send(e, "PASSPORT_VISA_DATA", await getPublicPassportVisaPayload({ language: p.language || "EN" })); } catch (x) { send(e, "PASSPORT_VISA_ERROR", { message: x?.publicMessage || x?.message || "Passport and visa guidance is unavailable." }); } }

$w.onReady(() => {
  const r = html(); if (!r) { console.error(`[Passport/Visa B-011.1] Missing embed: ${EMBED_IDS.join(", ")}`); return; }
  r.e.onMessage(async ev => { const m = parse(ev?.data); if (!m || (m.source && m.source !== SOURCE)) return; const p = m.payload || {}; if (["PASSPORT_VISA_READY", "PASSPORT_VISA_REFRESH"].includes(m.type)) await load(r.e, p); else if (m.type === "PASSPORT_VISA_NAVIGATE") nav(p.path || m.path); });
  send(r.e, "PASSPORT_VISA_HOST_READY", { version: VERSION, embedId: r.id, route: APP_ROUTES.passportVisa });
});
