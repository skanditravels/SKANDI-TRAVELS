// Hotel List and hotel details at /destinations/explore/hotel-list.
import wixSeoFrontend from "wix-seo-frontend";
import { applyInventorySeo } from "public/inventorySeo";
import { bindDestinationFlow } from "public/destinationFlowBridge";

$w.onReady(() =>
  bindDestinationFlow($w, "hotels", {
    embedId:"#hotelsEmbed",
    sources:["SKANDI_AREA_HOTEL_SEARCH", "SKANDI_HOTEL_DETAIL"],
    setPageSeo:seo=>applyInventorySeo(wixSeoFrontend,seo)
  })
);
