// SKANDI V12 — one Wix HTML component owns the complete passenger booking flow.
import wixLocationFrontend from "wix-location-frontend";
import { createBookingFlowHost } from "public/bookingFlowHost";
import { SITE_MAP } from "public/siteMap";

const BOOKING_EMBED_ID = "#bookingFlowEmbed";
const BOOKING_SOURCE = "SKANDI_BOOKING_OFFER";

function bookingEmbed() {
  try {
    const html = $w(BOOKING_EMBED_ID);
    if (html && typeof html.onMessage === "function" && typeof html.postMessage === "function") return html;
  } catch (_) {}
  console.error("[Booking] #bookingFlowEmbed is missing or is not an HTML component.");
  return null;
}

function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch (_) { return null; }
  }
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
}

$w.onReady(function () {
  const html = bookingEmbed();
  if (!html) return;

  const host = createBookingFlowHost({
    html,
    location:wixLocationFrontend,
    onReturnHome:() => wixLocationFrontend.to(SITE_MAP.home)
  });

  html.onMessage(event => {
    const message = parseMessage(event?.data);
    if (message?.source !== BOOKING_SOURCE) return;
    void host.handleMessage(message);
  });

  host.announceReady();
  host.startFromLocation().catch(error => host.reportError(error));
});
