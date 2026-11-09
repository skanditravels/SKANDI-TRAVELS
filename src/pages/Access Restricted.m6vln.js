// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import wixLocationFrontend from "wix-location-frontend";
import { SITE_MAP } from "public/siteMap";

const HTML_ID = "#html1";
const CHILD_SOURCE = "SKANDI_ACCESS_RESTRICTED";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
  let html;
  try { html = $w(HTML_ID); } catch (_) { return; }
  if (!html || typeof html.onMessage !== "function") return;

  html.onMessage(async event => {
    const message = event?.data || {};
    if (message.source !== CHILD_SOURCE || message.type !== "ACCESS_RESTRICTED_NAVIGATE") return;
    const destination = message.payload?.destination;
    if (destination !== "home" && destination !== "support") return;
    try {
      await wixLocationFrontend.to(SITE_MAP[destination], { disableScrollToTop:false });
    } catch (error) {
      console.warn("[Access Restricted] Navigation could not be opened.", error);
      html.postMessage({ source:PARENT_SOURCE, type:"ACCESS_RESTRICTED_NAVIGATION_ERROR", payload:{} });
    }
  });
});
