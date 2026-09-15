// /src/pages/Insurance.ojo62js
// B-011.1 install candidate for /travel-info/insurance.
// No insurer, premium, coverage, eligibility or regulatory claim is invented client-side.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicInsurancePayload } from "backend/SKANDI_CORE/publicContent.web";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap.js";

const SOURCE = "SKANDI_INSURANCE_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.1";
const EMBED_IDS = ["#travelInsuranceEmbed", "#insuranceHtml", "#html1"];

function html() { for (const id of EMBED_IDS) { try { const e = $w(id); if (e && typeof e.onMessage === "function" && typeof e.postMessage === "function") return { id, e }; } catch (_) {} } return null; }
function parse(v) { if (typeof v === "string") { try { return JSON.parse(v); } catch (_) { return null; } } return v && typeof v === "object" ? v : null; }
function send(e, type, payload = {}) { e.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() }); }
function nav(path) { const p = String(path || "").trim(); if (p && isSafeInternalRoute(p)) wixLocationFrontend.to(p); }
async function load(e, p = {}) { try { send(e, "INSURANCE_LOADING", {}); send(e, "INSURANCE_DATA", await getPublicInsurancePayload({ language: p.language || "EN" })); } catch (x) { send(e, "INSURANCE_ERROR", { message: x?.publicMessage || x?.message || "Travel insurance information is unavailable." }); } }

$w.onReady(() => {
  const r = html(); if (!r) { console.error(`[Insurance B-011.1] Missing embed: ${EMBED_IDS.join(", ")}`); return; }
  r.e.onMessage(async ev => {
    const m = parse(ev?.data); if (!m || (m.source && m.source !== SOURCE)) return; const p = m.payload || {};
    if (["INSURANCE_READY", "INSURANCE_REFRESH"].includes(m.type)) await load(r.e, p);
    else if (m.type === "INSURANCE_NAVIGATE") nav(p.path || m.path);
    else if (m.type === "INSURANCE_SEARCH_TRIPS") wixLocationFrontend.to(SITE_MAP.search);
    else if (m.type === "INSURANCE_SUPPORT") wixLocationFrontend.to(SITE_MAP.support);
  });
  send(r.e, "INSURANCE_HOST_READY", { version: VERSION, embedId: r.id, route: APP_ROUTES.travelInsurance });
});
