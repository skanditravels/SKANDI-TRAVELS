/* Drop into any HTML embed that needs master-controlled assets/navigation. */
const SKANDI_MASTER_PARENT = "SKANDI_WIX_PARENT";
const SKANDI_MASTER_CLIENT = "SKANDI_MASTER_BRIDGE";
let masterConfig = null;

function requestMasterConfig(context = "") {
  window.parent.postMessage({ source: SKANDI_MASTER_CLIENT, type: "MASTER_CONFIG_REQUEST", payload: { context }, timestamp: new Date().toISOString() }, "*");
}

function masterNavigate(path) {
  window.parent.postMessage({ source: SKANDI_MASTER_CLIENT, type: "MASTER_NAVIGATE", payload: { path }, timestamp: new Date().toISOString() }, "*");
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

window.addEventListener("message", event => {
  const message = event.data || {};
  if (message.source !== SKANDI_MASTER_PARENT) return;
  if (message.type === "SKANDI_MASTER_CONFIG") {
    masterConfig = message.payload || {};
    applyMasterAssets();
    window.dispatchEvent(new CustomEvent("skandi:master-config", { detail: masterConfig }));
  }
  if (message.type === "SKANDI_MASTER_ASSETS") {
    masterConfig = { ...(masterConfig || {}), brand: { ...(masterConfig?.brand || {}), assets: message.payload || {} } };
    applyMasterAssets();
  }
});

requestMasterConfig();
