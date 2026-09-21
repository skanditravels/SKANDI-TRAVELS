// /src/pages/About.js
// B-011.1 install candidate for the Wix /about page code.
// This page owns only the About embed bridge. Global header/footer/session behavior stays in masterPage.js.

import wixLocationFrontend from "wix-location-frontend";
import { getPublicAboutPayload } from "backend/SKANDI_CORE/publicContent.web";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const SOURCE = "SKANDI_ABOUT_PAGE";
const PARENT = "SKANDI_WIX_PARENT";
const VERSION = "BACKEND-BASE-1.0-B011.2";
const EMBED_IDS = ["#aboutEmbed", "#aboutHtml", "#html1"];

function getHtml() {
  for (const id of EMBED_IDS) {
    try {
      const element = $w(id);
      if (element && typeof element.onMessage === "function" && typeof element.postMessage === "function") return { id, element };
    } catch (_) {}
  }
  return null;
}
function parse(value) { if (typeof value === "string") { try { return JSON.parse(value); } catch (_) { return null; } } return value && typeof value === "object" ? value : null; }
function post(html, type, payload = {}) { html.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() }); }
async function load(html, payload = {}) {
  try {
    post(html, "ABOUT_PAGE_LOADING", { version: VERSION });
    post(html, "ABOUT_PAGE_DATA", await getPublicAboutPayload({ language: payload.language || "EN" }));
  } catch (error) {
    post(html, "ABOUT_PAGE_ERROR", { message: error?.publicMessage || error?.message || "About SKANDI is temporarily unavailable." });
  }
}
function navigate(path) {
  const target = String(path || "").trim();
  if (target && isSafeInternalRoute(target)) wixLocationFrontend.to(target);
}

$w.onReady(() => {
  const resolved = getHtml();
  if (!resolved) { console.error(`[About B-011.1] No compatible HTML component found. Tried ${EMBED_IDS.join(", ")}`); return; }
  const html = resolved.element;
  html.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || (message.source && message.source !== SOURCE)) return;
    const payload = message.payload && typeof message.payload === "object" ? message.payload : {};
    if (["ABOUT_PAGE_READY", "ABOUT_PAGE_REFRESH"].includes(message.type)) await load(html, payload);
    else if (message.type === "ABOUT_NAVIGATE") navigate(payload.path || message.path);
  });
  post(html, "ABOUT_HOST_READY", { version: VERSION, embedId: resolved.id, route: SITE_MAP.about });
});
