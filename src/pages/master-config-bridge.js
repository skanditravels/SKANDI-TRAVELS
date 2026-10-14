/* Drop into any HTML embed that needs master-controlled assets/navigation. */
const SKANDI_MASTER_PARENT = "SKANDI_WIX_PARENT";
const SKANDI_MASTER_CLIENT = "SKANDI_MASTER_BRIDGE";
let masterConfig = null;

const SKANDI_MOBILE_TEXT_CONTROL_SELECTOR = [
  'input[type="text"]',
  'input[type="search"]',
  'input[type="email"]',
  'input[type="password"]',
  'input[type="tel"]',
  'input[type="url"]',
  'input[type="number"]',
  'input[type="date"]',
  'input[type="time"]',
  'input[type="datetime-local"]',
  'input[type="month"]',
  'input[type="week"]',
  'input:not([type])',
  'select',
  'textarea'
].join(',');

function requestMasterConfig(context = "") {
  window.parent.postMessage({ source: SKANDI_MASTER_CLIENT, type: "MASTER_CONFIG_REQUEST", payload: { context }, timestamp: new Date().toISOString() }, "*");
}

function masterNavigate(path) {
  window.parent.postMessage({ source: SKANDI_MASTER_CLIENT, type: "MASTER_NAVIGATE", payload: { path }, timestamp: new Date().toISOString() }, "*");
}

function masterScrollTop(reason = "embed-view-opened") {
  window.parent.postMessage({ source: SKANDI_MASTER_CLIENT, type: "MASTER_SCROLL_TOP", payload: { reason }, timestamp: new Date().toISOString() }, "*");
}

function masterAsset(key) {
  return masterConfig?.brand?.assets?.logos?.[key] || masterConfig?.brand?.assets?.icons?.[key] || "";
}

function applyMasterAssets(root = document) {
  root.querySelectorAll("[data-master-asset]").forEach(element => {
    const key = element.getAttribute("data-master-asset");
    const url = masterAsset(key);
    if (!url) return;
    if (element instanceof HTMLImageElement || element instanceof HTMLSourceElement) element.src = url;
    else element.style.backgroundImage = `url("${url}")`;
  });
}

function installMobileFocusZoomGuard(root = document) {
  if (!root?.head || root.getElementById("skandi-mobile-focus-zoom-guard")) return;
  const style = root.createElement("style");
  style.id = "skandi-mobile-focus-zoom-guard";
  style.textContent = `@media (max-width: 767px){${SKANDI_MOBILE_TEXT_CONTROL_SELECTOR}{font-size:16px!important;}}`;
  root.head.append(style);
}

function scrollEmbedToTop() {
  try {
    const scroller = document.scrollingElement || document.documentElement || document.body;
    if (scroller && typeof scroller.scrollTo === "function") scroller.scrollTo({ top:0, left:0, behavior:"auto" });
    else window.scrollTo(0, 0);
  } catch (_) {}
}

window.SKANDIMaster = Object.freeze({
  requestConfig:requestMasterConfig,
  navigate:masterNavigate,
  scrollTop:masterScrollTop,
  asset:masterAsset,
  applyAssets:applyMasterAssets,
  installMobileFocusZoomGuard
});

window.addEventListener("message", event => {
  const message = event.data || {};
  if (message.source !== SKANDI_MASTER_PARENT) return;
  if (message.type === "SKANDI_MASTER_CONFIG") {
    masterConfig = message.payload || {};
    applyMasterAssets();
    installMobileFocusZoomGuard();
    window.dispatchEvent(new CustomEvent("skandi:master-config", { detail: masterConfig }));
  }
  if (message.type === "SKANDI_MASTER_ASSETS") {
    masterConfig = { ...(masterConfig || {}), brand: { ...(masterConfig?.brand || {}), assets: message.payload || {} } };
    applyMasterAssets();
  }
  if (message.type === "SKANDI_SCROLL_TOP") scrollEmbedToTop();
});

installMobileFocusZoomGuard();
requestMasterConfig();
