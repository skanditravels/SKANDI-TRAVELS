// Wix page: Search
// URL: /search
// HTML Embed ID: #searchResultsEmbed

import wixLocationFrontend from "wix-location-frontend";

const EMBED_ID = "#searchResultsEmbed";
const CHILD_SOURCE = "SKANDI_SEARCH_RESULTS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const EXCLUDED_PREFIXES = ["/riaintra", "/my-profile"];

let html;

$w.onReady(function () {
  html = $w(EMBED_ID);
  html.onMessage(handleMessage);
  pushQuery();
});

function currentQuery() {
  try {
    const query = wixLocationFrontend.query || {};
    if (typeof query.q === "string") {
      return query.q.trim().slice(0, 100);
    }
  } catch (_) {}

  try {
    const url = String(wixLocationFrontend.url || "");
    if (url) {
      return String(new URL(url).searchParams.get("q") || "")
        .trim()
        .slice(0, 100);
    }
  } catch (_) {}

  return "";
}

function push(type, payload = {}) {
  if (!html) return;

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function pushQuery() {
  push("SEARCH_PAGE_QUERY", {
    query: currentQuery()
  });
}

function cleanPath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  if (/^(javascript|data|vbscript):/i.test(path)) return "";
  return path;
}

function isExcluded(path) {
  const pathname = String(path || "")
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function searchUrl(query) {
  const q = String(query || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);

  return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
}

function handleMessage(event) {
  const message = event?.data || {};
  if (message.source !== CHILD_SOURCE) return;

  const payload = message.payload || {};

  switch (message.type) {
    case "SEARCH_READY":
      pushQuery();
      return;

    case "SEARCH_QUERY_UPDATE":
      wixLocationFrontend.to(searchUrl(payload.query));
      return;

    case "SEARCH_RESULT_NAVIGATE": {
      const path = cleanPath(payload.path);
      if (!path || isExcluded(path)) return;
      wixLocationFrontend.to(path);
      return;
    }

    case "SEARCH_RESIZE": {
      const requested = Number(payload.height || 0);
      if (!Number.isFinite(requested) || requested <= 0) return;
      html.height = Math.max(520, Math.min(4200, Math.round(requested)));
      return;
    }
  }
}
