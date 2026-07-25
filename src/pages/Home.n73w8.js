import wixLocation from "wix-location";
import {
  getHomeBootstrap,
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";
import {
  getOldStyleHomeContent
} from "backend/homeContent.web";

/**
 * SKANDI /home passenger search page
 *
 * This page remains its own Wix page.
 * It is NOT inside the /booking multi-state flow.
 *
 * Wix setup:
 * - Page URL: /home
 * - HTML embed ID: #home
 * - HTML file: html/home_booking_search.html
 *
 * On offer selection it creates the BookingCart and sends the passenger into:
 * /booking?step=offer&cartId=...
 */

const EMBED_ID = "#home";
const CHILD_SOURCE = "SKANDI_HOME_OLD_STYLE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE) return;

    try {
      if (msg.type === "HOME_READY") {
        const [booking, content] = await Promise.all([
          getHomeBootstrap({}),
          getOldStyleHomeContent({})
        ]);

        html.postMessage({
          source: PARENT_SOURCE,
          type: "HOME_BOOTSTRAP_RESULT",
          payload: { booking, content }
        });
        return;
      }

      if (msg.type === "HOME_SEARCH") {
        const result = await searchUnifiedOffers({ search: msg.search || {} });

        html.postMessage({
          source: PARENT_SOURCE,
          type: "HOME_SEARCH_RESULT",
          payload: result || { items: [] }
        });
        return;
      }

      if (msg.type === "HOME_SELECT_OFFER") {
        const result = await createBookingCartFromOffer({
          offer: msg.offer || {},
          search: msg.search || msg.offer?.searchContext || {}
        });

        html.postMessage({
          source: PARENT_SOURCE,
          type: "HOME_NAVIGATE_TO_OFFER",
          payload: result
        });

        wixLocation.to(`/booking?step=offer&cartId=${encodeURIComponent(result.cartId)}`);
        return;
      }

      if (msg.type === "HOME_NAVIGATE" && msg.path) {
        wixLocation.to(msg.path);
      }
    } catch (error) {
      html.postMessage({
        source: PARENT_SOURCE,
        type: "HOME_ERROR",
        message: error.message || "Search failed."
      });
    }
  });
});